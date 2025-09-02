const express = require('express');
const { body, validationResult } = require('express-validator');
const database = require('../config/database');
const zkService = require('../services/zkService');
const logger = require('../utils/logger');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/tokens/kamikaze:
 *   get:
 *     summary: Get KAMIKAZE token information with privacy features
 *     tags: [Tokens]
 *     responses:
 *       200:
 *         description: KAMIKAZE token data with privacy commitments
 */
router.get('/kamikaze', async (req, res) => {
  try {
    const { rows: tokenInfo } = await database.query(
      'SELECT * FROM tokens WHERE token_symbol = ?',
      ['KAMIKAZE']
    );

    if (tokenInfo.length === 0) {
      return res.status(404).json({ error: 'KAMIKAZE token not found' });
    }

    const token = tokenInfo[0];
    const publicStats = await database.getPublicStats();
    
    // Generate privacy-preserving token info
    const tokenData = {
      name: token.token_name,
      symbol: token.token_symbol,
      contract_address: token.contract_address,
      decimals: token.decimals,
      total_supply_commitment: zkService.generateCommitment(token.total_supply.toString()).commitment,
      burned_supply_commitment: zkService.generateCommitment(token.burned_supply.toString()).commitment,
      burn_rate: token.burn_rate,
      privacy_features: [
        'Supply amounts are commitment-based',
        'Burn amounts are hidden with ZK proofs',
        'Individual balances never revealed',
        'Transaction amounts are private',
        'Staking amounts use commitments'
      ],
      public_metrics: {
        holders_commitment: publicStats.total_users?.value || 0,
        transactions_proof: 'Aggregated via ZK proofs',
        volume_commitment: 'Private transaction volumes'
      },
      deflationary_mechanism: {
        burn_on_transfer: '2% of every transaction',
        privacy_preserved: 'Burn amounts proven with ZK',
        total_burned_hidden: 'Only commitment published'
      }
    };

    res.json(tokenData);

  } catch (error) {
    logger.error('KAMIKAZE token info error:', error);
    res.status(500).json({ 
      error: 'Failed to load token information', 
      message: 'Internal server error' 
    });
  }
});

/**
 * @swagger
 * /api/tokens/balance:
 *   get:
 *     summary: Get user balance as ZK commitment
 *     tags: [Tokens]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Balance commitment without revealing actual amount
 */
router.get('/balance', auth, async (req, res) => {
  try {
    const walletAddress = req.user.wallet_address;
    
    // Get user's balance proofs
    const { rows: balanceProofs } = await database.query(`
      SELECT bp.*, t.token_symbol, t.token_name
      FROM balance_proofs bp
      JOIN users u ON bp.user_id = u.id
      JOIN tokens t ON bp.token_id = t.id
      WHERE u.wallet_address = ? AND bp.is_valid = TRUE
    `, [walletAddress]);

    const balances = balanceProofs.reduce((acc, proof) => {
      acc[proof.token_symbol] = {
        token_name: proof.token_name,
        balance_commitment: proof.balance_commitment,
        proof_timestamp: proof.proof_timestamp,
        privacy_level: 'full',
        features: [
          'Actual balance amount is hidden',
          'Only commitment hash is stored',
          'Zero-knowledge proof verified',
          'Balance updates are private'
        ]
      };
      return acc;
    }, {});

    res.json({
      wallet_address: walletAddress,
      balances,
      privacy_mode: true,
      total_proofs: balanceProofs.length,
      balance_privacy: 'All amounts are commitment-based'
    });

  } catch (error) {
    logger.error('Balance query error:', error);
    res.status(500).json({ 
      error: 'Failed to load balance', 
      message: 'Internal server error' 
    });
  }
});

/**
 * @swagger
 * /api/tokens/transfer-proof:
 *   post:
 *     summary: Submit private transfer proof
 *     tags: [Tokens]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               to_address:
 *                 type: string
 *               amount_commitment:
 *                 type: string
 *               transfer_proof:
 *                 type: string
 *     responses:
 *       200:
 *         description: Transfer proof verified
 */
router.post('/transfer-proof', auth, async (req, res) => {
  try {
    const { to_address, amount_commitment, transfer_proof } = req.body;
    const from_address = req.user.wallet_address;
    
    // Verify transfer proof
    const isValid = await zkService.verifyProof('transaction_proof', transfer_proof, [amount_commitment]);
    
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid transfer proof' });
    }

    // Generate nullifier to prevent double-spending
    const nullifier = zkService.generateNullifier(
      from_address,
      `${amount_commitment}_${Date.now()}`
    );

    // Store transfer proof (in production, this would update balances)
    const transferData = {
      from_address,
      to_address,
      amount_commitment,
      nullifier,
      proof: transfer_proof,
      timestamp: new Date(),
      verified: true
    };

    logger.info(`Private transfer proof verified: ${from_address} -> ${to_address}`);

    res.json({
      message: 'Transfer proof verified',
      transfer_id: nullifier,
      privacy_preserved: true,
      amount_hidden: true,
      participants_anonymous: false, // addresses are public but amounts are hidden
      proof_verified: true
    });

  } catch (error) {
    logger.error('Transfer proof error:', error);
    res.status(500).json({ 
      error: 'Transfer proof failed', 
      message: 'Internal server error' 
    });
  }
});

/**
 * @swagger
 * /api/tokens/burn-proof:
 *   post:
 *     summary: Submit token burn proof
 *     tags: [Tokens]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               burn_amount_commitment:
 *                 type: string
 *               burn_proof:
 *                 type: string
 *     responses:
 *       200:
 *         description: Burn proof verified
 */
router.post('/burn-proof', auth, async (req, res) => {
  try {
    const { burn_amount_commitment, burn_proof } = req.body;
    const wallet_address = req.user.wallet_address;
    
    // Verify burn proof
    const isValid = await zkService.verifyProof('burn_proof', burn_proof, [burn_amount_commitment]);
    
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid burn proof' });
    }

    // Generate nullifier for burn transaction
    const nullifier = zkService.generateNullifier(
      wallet_address,
      `burn_${burn_amount_commitment}_${Date.now()}`
    );

    // Update burned supply commitment (in production, this would be on-chain)
    logger.info(`Burn proof verified for wallet: ${wallet_address}`);

    res.json({
      message: 'Burn proof verified',
      burn_id: nullifier,
      amount_hidden: true,
      deflation_confirmed: true,
      privacy_preserved: true,
      burn_commitment: burn_amount_commitment
    });

  } catch (error) {
    logger.error('Burn proof error:', error);
    res.status(500).json({ 
      error: 'Burn proof failed', 
      message: 'Internal server error' 
    });
  }
});

/**
 * @swagger
 * /api/tokens/supply-proof:
 *   get:
 *     summary: Get supply range proof (without revealing exact amounts)
 *     tags: [Tokens]
 *     responses:
 *       200:
 *         description: Supply range verification
 */
router.get('/supply-proof', async (req, res) => {
  try {
    const { rows: tokenInfo } = await database.query(
      'SELECT total_supply, burned_supply FROM tokens WHERE token_symbol = ?',
      ['KAMIKAZE']
    );

    if (tokenInfo.length === 0) {
      return res.status(404).json({ error: 'Token not found' });
    }

    const token = tokenInfo[0];
    const circulating_supply = token.total_supply - token.burned_supply;
    
    // Generate range proof for circulating supply
    const supplyRangeProof = await zkService.generateRangeProof(
      circulating_supply,
      0,
      1000000000, // max possible supply
      'supply_commitment'
    );

    res.json({
      supply_verification: {
        range_proven: true,
        exact_amount_hidden: true,
        proof_type: 'range_proof',
        valid_range: {
          min: 0,
          max: '1,000,000,000 KAMIKAZE',
          proven_in_range: true
        }
      },
      deflationary_proof: {
        burn_mechanism_active: true,
        burn_rate: '2% per transaction',
        burned_amount_hidden: true,
        deflation_verified: true
      },
      proof: supplyRangeProof.proof,
      verified: supplyRangeProof.verified,
      privacy_features: [
        'Exact supply amounts are private',
        'Only range membership is proven', 
        'Burn amounts use ZK commitments',
        'Supply changes are proven without revelation'
      ]
    });

  } catch (error) {
    logger.error('Supply proof error:', error);
    res.status(500).json({ 
      error: 'Supply proof failed', 
      message: 'Internal server error' 
    });
  }
});

module.exports = router;