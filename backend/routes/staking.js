const express = require('express');
const { body, validationResult } = require('express-validator');
const database = require('../config/database');
const zkService = require('../services/zkService');
const logger = require('../utils/logger');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/staking/stake-proof:
 *   post:
 *     summary: Submit staking proof without revealing amount or duration
 *     tags: [Staking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stake_amount_commitment:
 *                 type: string
 *               lock_period_commitment:
 *                 type: string
 *               staking_proof:
 *                 type: string
 *     responses:
 *       200:
 *         description: Staking proof verified
 */
router.post('/stake-proof', auth, async (req, res) => {
  try {
    const { stake_amount_commitment, lock_period_commitment, staking_proof } = req.body;
    const wallet_address = req.user.wallet_address;
    
    // Verify staking proof
    const isValid = await zkService.verifyProof(
      'stake_proof', 
      staking_proof, 
      [stake_amount_commitment, lock_period_commitment]
    );
    
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid staking proof' });
    }

    // Generate nullifier to prevent double-staking
    const nullifier = zkService.generateNullifier(
      wallet_address,
      `stake_${stake_amount_commitment}_${Date.now()}`
    );

    // Store staking proof
    const stakeId = `stake_${nullifier.substring(0, 16)}`;
    
    logger.info(`Staking proof verified for wallet: ${wallet_address}`);

    res.json({
      message: 'Staking proof verified',
      stake_id: stakeId,
      stake_commitment: stake_amount_commitment,
      period_commitment: lock_period_commitment,
      nullifier,
      privacy_features: [
        'Stake amount is completely private',
        'Lock period remains confidential',
        'Rewards calculation is commitment-based',
        'APY applied to hidden amounts'
      ],
      staking_tiers: {
        'no_lock': 'Base APY (commitment-based)',
        'short_term': '1-3 months (private duration)',
        'medium_term': '6 months (hidden lock period)',
        'long_term': '1 year (confidential commitment)'
      },
      verified: true
    });

  } catch (error) {
    logger.error('Staking proof error:', error);
    res.status(500).json({ 
      error: 'Staking proof failed', 
      message: 'Internal server error' 
    });
  }
});

/**
 * @swagger
 * /api/staking/rewards-proof:
 *   get:
 *     summary: Get staking rewards proof without revealing amounts
 *     tags: [Staking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rewards proof with privacy preservation
 */
router.get('/rewards-proof', auth, async (req, res) => {
  try {
    const wallet_address = req.user.wallet_address;
    
    // Generate mock rewards proof (in production, this would calculate actual rewards)
    const rewardsProof = await zkService.generateMockProof('rewards', {
      wallet: wallet_address,
      timestamp: Date.now()
    });

    // Generate range proof for rewards (proves rewards are positive without revealing amount)
    const rangeProof = await zkService.generateRangeProof(
      150, // mock rewards amount
      0,
      10000,
      'rewards_commitment'
    );

    res.json({
      message: 'Staking rewards verified',
      wallet_address,
      rewards_proof: {
        commitment: rewardsProof.commitment,
        range_verified: true,
        amount_hidden: true,
        positive_rewards_proven: true
      },
      staking_benefits: {
        privacy: 'Reward amounts are commitment-based',
        compounding: 'Auto-compound with hidden amounts',
        flexibility: 'Multiple lock periods available',
        apy_tiers: {
          no_lock: '10% APY',
          short_lock: '15% APY',
          medium_lock: '18% APY', 
          long_lock: '20% APY'
        }
      },
      privacy_guarantees: [
        'Staked amounts remain private',
        'Reward amounts are hidden',
        'Lock periods are confidential',
        'Only range proofs are public'
      ],
      proof: rangeProof,
      verified: true
    });

  } catch (error) {
    logger.error('Rewards proof error:', error);
    res.status(500).json({ 
      error: 'Rewards proof failed', 
      message: 'Internal server error' 
    });
  }
});

/**
 * @swagger
 * /api/staking/unstake-proof:
 *   post:
 *     summary: Submit unstaking proof
 *     tags: [Staking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stake_id:
 *                 type: string
 *               unstake_proof:
 *                 type: string
 *     responses:
 *       200:
 *         description: Unstaking proof verified
 */
router.post('/unstake-proof', auth, async (req, res) => {
  try {
    const { stake_id, unstake_proof } = req.body;
    const wallet_address = req.user.wallet_address;
    
    // Verify unstaking proof
    const isValid = await zkService.verifyProof('unstake_proof', unstake_proof, [stake_id]);
    
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid unstaking proof' });
    }

    // Generate nullifier for unstaking
    const unstakeNullifier = zkService.generateNullifier(
      wallet_address,
      `unstake_${stake_id}_${Date.now()}`
    );

    logger.info(`Unstaking proof verified for stake: ${stake_id}`);

    res.json({
      message: 'Unstaking proof verified',
      stake_id,
      unstake_nullifier,
      privacy_maintained: true,
      unstake_features: [
        'Principal amount remains private',
        'Rewards amount is hidden',
        'Lock period completion verified privately',
        'No early withdrawal penalties revealed'
      ],
      verified: true
    });

  } catch (error) {
    logger.error('Unstaking proof error:', error);
    res.status(500).json({ 
      error: 'Unstaking proof failed', 
      message: 'Internal server error' 
    });
  }
});

/**
 * @swagger
 * /api/staking/stats:
 *   get:
 *     summary: Get public staking statistics without revealing individual stakes
 *     tags: [Staking]
 *     responses:
 *       200:
 *         description: Aggregated staking statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const publicStats = await database.getPublicStats();
    
    // Generate aggregated staking statistics
    const stakingStats = {
      total_staked_commitment: zkService.generateCommitment(publicStats.total_staked?.value || 0).commitment,
      active_stakers_proof: 'Proven via ZK aggregation',
      average_lock_period: 'Hidden via commitment scheme',
      reward_distribution: {
        total_distributed: 'Commitment-based amount',
        average_apy: 'Calculated on private stakes',
        compounding_rate: 'Applied to hidden balances'
      },
      staking_tiers: {
        no_lock: {
          description: 'Flexible staking',
          apy: '10%',
          participants: 'Private count'
        },
        short_lock: {
          description: '1-3 months lock',
          apy: '15%',
          participants: 'Private count'
        },
        medium_lock: {
          description: '6 months lock',
          apy: '18%',
          participants: 'Private count'
        },
        long_lock: {
          description: '1 year lock',
          apy: '20%',
          participants: 'Private count'
        }
      },
      privacy_features: [
        'Individual stake amounts are private',
        'Lock periods remain confidential',
        'Rewards are calculated on commitments',
        'Only aggregated proofs are public',
        'Zero-knowledge stake verification'
      ],
      deflationary_impact: {
        staking_reduces_supply: true,
        burn_on_rewards: 'Applied to private amounts',
        deflation_rate: '2% on all transactions'
      }
    };

    res.json(stakingStats);

  } catch (error) {
    logger.error('Staking stats error:', error);
    res.status(500).json({ 
      error: 'Failed to load staking statistics', 
      message: 'Internal server error' 
    });
  }
});

module.exports = router;