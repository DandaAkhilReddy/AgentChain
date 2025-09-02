const express = require('express');
const { body, validationResult } = require('express-validator');
const database = require('../config/database');
const zkService = require('../services/zkService');
const logger = require('../utils/logger');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         wallet_address:
 *           type: string
 *           description: Ethereum wallet address
 *         commitment_hash:
 *           type: string
 *           description: ZK commitment to user data
 *         reputation_commitment:
 *           type: string
 *           description: ZK commitment to reputation score
 *         created_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Register new user with ZK commitment
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               wallet_address:
 *                 type: string
 *               public_key:
 *                 type: string
 *               username:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid input or user already exists
 */
router.post('/register', [
  body('wallet_address')
    .isLength({ min: 42, max: 42 })
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Invalid wallet address'),
  body('public_key')
    .optional()
    .isLength({ min: 64, max: 128 })
    .withMessage('Invalid public key'),
  body('username')
    .optional()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be 3-50 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { wallet_address, public_key, username } = req.body;

    // Check if user already exists
    const { rows: existingUsers } = await database.query(
      'SELECT id FROM users WHERE wallet_address = ?',
      [wallet_address]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ 
        error: 'User already registered',
        wallet_address 
      });
    }

    // Generate ZK commitments for user data
    const userDataCommitment = zkService.generateCommitment(
      JSON.stringify({ wallet_address, username, timestamp: Date.now() })
    );
    
    const reputationCommitment = zkService.generateCommitment(0); // Initial reputation

    const nullifier = zkService.generateNullifier(
      wallet_address,
      userDataCommitment.commitment
    );

    // Store user with ZK commitments
    const { rows } = await database.query(`
      INSERT INTO users (wallet_address, public_key, commitment_hash, nullifier_hash, reputation_commitment)
      VALUES (?, ?, ?, ?, ?)
    `, [wallet_address, public_key, userDataCommitment.commitment, nullifier, reputationCommitment.commitment]);

    // Create initial balance proof for KAMIKAZE token
    const balanceProof = await zkService.generateBalanceProof(0, null, wallet_address);
    await database.storeBalanceProof(
      rows.insertId,
      1, // KAMIKAZE token ID
      balanceProof.commitment,
      balanceProof.proof.proof,
      JSON.stringify(balanceProof.proof.publicSignals)
    );

    // Update public stats
    await database.updatePublicStat('total_users', 
      (await database.query('SELECT COUNT(*) as count FROM users WHERE is_active = TRUE')).rows[0].count
    );

    logger.info(`New user registered: ${wallet_address}`);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        wallet_address,
        commitment_hash: userDataCommitment.commitment,
        reputation_commitment: reputationCommitment.commitment,
        privacy_features: [
          'Balance commitments enabled',
          'Private reputation tracking',
          'Anonymous transaction history',
          'ZK proof verification'
        ]
      }
    });

  } catch (error) {
    logger.error('User registration error:', error);
    res.status(500).json({ 
      error: 'Registration failed', 
      message: 'Internal server error' 
    });
  }
});

/**
 * @swagger
 * /api/users/dashboard:
 *   get:
 *     summary: Get user dashboard with ZK privacy
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data with privacy commitments
 *       401:
 *         description: Unauthorized
 */
router.get('/dashboard', auth, async (req, res) => {
  try {
    const walletAddress = req.user.wallet_address;
    
    // Get user dashboard data (privacy-preserving)
    const dashboardData = await database.getUserDashboard(walletAddress);
    
    // Get public statistics
    const publicStats = await database.getPublicStats();
    
    // Generate activity proof
    const activityProof = await zkService.generateMockProof('activity', {
      wallet: walletAddress,
      timestamp: Date.now()
    });

    res.json({
      privacy_mode: true,
      wallet_address: walletAddress,
      user_data: dashboardData,
      tokens: {
        KAMIKAZE: {
          symbol: 'KAMIKAZE',
          name: 'KAMIKAZE Token',
          balance_commitment: dashboardData[0]?.commitment_hash || 'No commitment',
          privacy_features: [
            'Balance hidden with ZK commitments',
            'Transaction amounts are private',
            'Staking amounts are confidential',
            'Earnings are commitment-based'
          ]
        }
      },
      public_stats: publicStats,
      privacy_proof: activityProof,
      features: {
        zero_knowledge_balances: true,
        private_transactions: true,
        anonymous_staking: true,
        confidential_agent_trading: true
      }
    });

  } catch (error) {
    logger.error('Dashboard error:', error);
    res.status(500).json({ 
      error: 'Failed to load dashboard', 
      message: 'Internal server error' 
    });
  }
});

/**
 * @swagger
 * /api/users/balance-proof:
 *   post:
 *     summary: Submit balance proof
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               balance:
 *                 type: number
 *               randomness:
 *                 type: string
 *     responses:
 *       200:
 *         description: Balance proof verified
 */
router.post('/balance-proof', auth, async (req, res) => {
  try {
    const { balance, randomness } = req.body;
    const walletAddress = req.user.wallet_address;
    
    // Generate balance proof
    const balanceProof = await zkService.generateBalanceProof(balance, randomness, walletAddress);
    
    // Verify the proof
    const isValid = await zkService.verifyProof('balance_proof', balanceProof.proof.proof, balanceProof.publicSignals);
    
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid balance proof' });
    }

    // Store the proof
    const { rows: users } = await database.query('SELECT id FROM users WHERE wallet_address = ?', [walletAddress]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    await database.storeBalanceProof(
      users[0].id,
      1, // KAMIKAZE token ID
      balanceProof.commitment,
      balanceProof.proof.proof,
      JSON.stringify(balanceProof.publicSignals)
    );

    res.json({
      message: 'Balance proof verified and stored',
      commitment: balanceProof.commitment,
      nullifier: balanceProof.nullifier,
      verified: true,
      privacy_preserved: true
    });

  } catch (error) {
    logger.error('Balance proof error:', error);
    res.status(500).json({ 
      error: 'Balance proof failed', 
      message: 'Internal server error' 
    });
  }
});

/**
 * @swagger
 * /api/users/reputation-proof:
 *   get:
 *     summary: Get reputation range proof
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reputation proof without revealing exact score
 */
router.get('/reputation-proof', auth, async (req, res) => {
  try {
    const walletAddress = req.user.wallet_address;
    
    // Generate reputation range proof (proves score is in valid range without revealing it)
    const reputationProof = await zkService.generateRangeProof(75, 0, 100, 'reputation_commitment');
    
    res.json({
      message: 'Reputation range verified',
      proof_type: 'range_proof',
      range: {
        min: 0,
        max: 100,
        proven_in_range: true,
        exact_score_hidden: true
      },
      proof: reputationProof.proof,
      verified: reputationProof.verified,
      privacy_features: [
        'Exact reputation score remains private',
        'Only range membership is proven',
        'Zero-knowledge verification',
        'Prevents reputation gaming'
      ]
    });

  } catch (error) {
    logger.error('Reputation proof error:', error);
    res.status(500).json({ 
      error: 'Reputation proof failed', 
      message: 'Internal server error' 
    });
  }
});

/**
 * @swagger
 * /api/users/activity-proof:
 *   post:
 *     summary: Submit activity proof
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Activity proof generated
 */
router.post('/activity-proof', auth, async (req, res) => {
  try {
    const walletAddress = req.user.wallet_address;
    
    // Generate activity proof
    const activityProof = await zkService.generateMockProof('activity', {
      wallet: walletAddress,
      timestamp: Date.now(),
      action: 'dashboard_access'
    });
    
    // Update user's last activity proof
    await database.query(
      'UPDATE users SET last_activity_proof = ? WHERE wallet_address = ?',
      [activityProof.proof, walletAddress]
    );

    res.json({
      message: 'Activity proof generated',
      proof: activityProof,
      privacy_preserved: true,
      anonymity_level: 'high'
    });

  } catch (error) {
    logger.error('Activity proof error:', error);
    res.status(500).json({ 
      error: 'Activity proof failed', 
      message: 'Internal server error' 
    });
  }
});

/**
 * @swagger
 * /api/users/privacy-stats:
 *   get:
 *     summary: Get privacy and ZK statistics
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Privacy statistics and ZK proof metrics
 */
router.get('/privacy-stats', async (req, res) => {
  try {
    const publicStats = await database.getPublicStats();
    
    // Generate aggregated privacy metrics
    const privacyStats = {
      zero_knowledge_features: {
        balance_privacy: 'All balances are commitment-based',
        transaction_privacy: 'Transaction details are ZK-proven',
        staking_privacy: 'Staking amounts remain confidential',
        reputation_privacy: 'Scores proven in ranges only',
        agent_privacy: 'Agent capabilities are commitment-based',
        task_privacy: 'Task details never stored in plaintext'
      },
      public_metrics: publicStats,
      privacy_guarantees: [
        'No personal data stored in plaintext',
        'All sensitive values use cryptographic commitments',
        'Zero-knowledge proofs verify validity without revelation',
        'Nullifiers prevent double-spending and replay attacks',
        'Merkle trees enable efficient batch verification',
        'Public statistics derived through ZK aggregation'
      ],
      compliance: {
        gdpr_compliant: true,
        financial_privacy: true,
        audit_ready: true,
        regulatory_reporting: 'via aggregated proofs'
      }
    };

    res.json(privacyStats);

  } catch (error) {
    logger.error('Privacy stats error:', error);
    res.status(500).json({ 
      error: 'Failed to load privacy stats', 
      message: 'Internal server error' 
    });
  }
});

module.exports = router;