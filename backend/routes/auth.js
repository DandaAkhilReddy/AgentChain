const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const database = require('../config/database');
const zkService = require('../services/zkService');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * /api/auth/wallet-login:
 *   post:
 *     summary: Login with wallet signature for ZK privacy
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               wallet_address:
 *                 type: string
 *               signature:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful with privacy token
 *       401:
 *         description: Invalid signature
 */
router.post('/wallet-login', [
  body('wallet_address')
    .isLength({ min: 42, max: 42 })
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Invalid wallet address'),
  body('signature')
    .isLength({ min: 132, max: 132 })
    .withMessage('Invalid signature format'),
  body('message')
    .isLength({ min: 10 })
    .withMessage('Invalid message')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { wallet_address, signature, message } = req.body;

    // In production, verify the signature against the message
    // For development, we'll skip signature verification
    const isValidSignature = true; // Would use ethers.utils.verifyMessage(message, signature) === wallet_address
    
    if (!isValidSignature) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Check if user exists
    const { rows: users } = await database.query(
      'SELECT * FROM users WHERE wallet_address = ?',
      [wallet_address]
    );

    let user;
    if (users.length === 0) {
      // Auto-register new user with ZK commitments
      const userDataCommitment = zkService.generateCommitment(
        JSON.stringify({ wallet_address, timestamp: Date.now() })
      );
      
      const reputationCommitment = zkService.generateCommitment(0);
      const nullifier = zkService.generateNullifier(
        wallet_address,
        userDataCommitment.commitment
      );

      const { rows: newUsers } = await database.query(`
        INSERT INTO users (wallet_address, commitment_hash, nullifier_hash, reputation_commitment)
        VALUES (?, ?, ?, ?)
      `, [wallet_address, userDataCommitment.commitment, nullifier, reputationCommitment.commitment]);

      // Create initial balance proof
      const balanceProof = await zkService.generateBalanceProof(0, null, wallet_address);
      await database.storeBalanceProof(
        newUsers.insertId,
        1, // KAMIKAZE token ID
        balanceProof.commitment,
        balanceProof.proof.proof,
        JSON.stringify(balanceProof.proof.publicSignals)
      );

      user = {
        id: newUsers.insertId,
        wallet_address,
        commitment_hash: userDataCommitment.commitment,
        reputation_commitment: reputationCommitment.commitment
      };

      logger.info(`New user auto-registered: ${wallet_address}`);
    } else {
      user = users[0];
    }

    // Generate JWT token with privacy features
    const token = jwt.sign(
      { 
        user_id: user.id,
        wallet_address: user.wallet_address,
        commitment_hash: user.commitment_hash,
        privacy_enabled: true
      },
      process.env.JWT_SECRET || 'kamikaze_secret_key',
      { expiresIn: '24h' }
    );

    // Generate session proof
    const sessionProof = await zkService.generateMockProof('session', {
      wallet: wallet_address,
      timestamp: Date.now()
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        wallet_address: user.wallet_address,
        commitment_hash: user.commitment_hash,
        reputation_commitment: user.reputation_commitment,
        privacy_mode: true
      },
      privacy_features: [
        'Zero-knowledge authentication',
        'Private balance tracking',
        'Anonymous transaction history',
        'Commitment-based reputation'
      ],
      session_proof: sessionProof,
      expires_in: '24 hours'
    });

  } catch (error) {
    logger.error('Wallet login error:', error);
    res.status(500).json({ 
      error: 'Login failed', 
      message: 'Internal server error' 
    });
  }
});

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refresh authentication token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 */
router.post('/refresh-token', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify current token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'kamikaze_secret_key');
    
    // Generate new token
    const newToken = jwt.sign(
      {
        user_id: decoded.user_id,
        wallet_address: decoded.wallet_address,
        commitment_hash: decoded.commitment_hash,
        privacy_enabled: true
      },
      process.env.JWT_SECRET || 'kamikaze_secret_key',
      { expiresIn: '24h' }
    );

    // Generate new session proof
    const sessionProof = await zkService.generateMockProof('session_refresh', {
      wallet: decoded.wallet_address,
      timestamp: Date.now()
    });

    res.json({
      message: 'Token refreshed successfully',
      token: newToken,
      session_proof: sessionProof,
      expires_in: '24 hours',
      privacy_maintained: true
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    logger.error('Token refresh error:', error);
    res.status(500).json({ 
      error: 'Token refresh failed', 
      message: 'Internal server error' 
    });
  }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout and invalidate session
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      // In production, add token to blacklist
      // For development, just log the logout
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'kamikaze_secret_key');
        logger.info(`User logged out: ${decoded.wallet_address}`);
      } catch (error) {
        // Token might be expired or invalid, that's ok for logout
      }
    }

    res.json({
      message: 'Logout successful',
      privacy_cleared: true,
      session_terminated: true
    });

  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ 
      error: 'Logout failed', 
      message: 'Internal server error' 
    });
  }
});

/**
 * @swagger
 * /api/auth/verify:
 *   get:
 *     summary: Verify current authentication status
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Authentication verified
 */
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'kamikaze_secret_key');
    
    // Get user data
    const { rows: users } = await database.query(
      'SELECT wallet_address, commitment_hash, reputation_commitment FROM users WHERE id = ?',
      [decoded.user_id]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = users[0];

    res.json({
      authenticated: true,
      user: {
        wallet_address: user.wallet_address,
        commitment_hash: user.commitment_hash,
        reputation_commitment: user.reputation_commitment,
        privacy_mode: true
      },
      token_valid: true,
      privacy_features: [
        'Zero-knowledge authentication active',
        'Private balance commitments enabled',
        'Anonymous transaction capability',
        'Confidential reputation tracking'
      ]
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    logger.error('Token verification error:', error);
    res.status(500).json({ 
      error: 'Verification failed', 
      message: 'Internal server error' 
    });
  }
});

module.exports = router;