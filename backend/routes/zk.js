const express = require('express');
const zkService = require('../services/zkService');
const database = require('../config/database');
const logger = require('../utils/logger');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/zk/generate-commitment:
 *   post:
 *     summary: Generate ZK commitment for any value
 *     tags: [Zero-Knowledge]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               value:
 *                 type: string
 *               randomness:
 *                 type: string
 *                 description: Optional randomness for commitment
 *     responses:
 *       200:
 *         description: Commitment generated successfully
 */
router.post('/generate-commitment', auth, async (req, res) => {
  try {
    const { value, randomness } = req.body;
    
    if (!value) {
      return res.status(400).json({ error: 'Value is required' });
    }

    const commitment = zkService.generateCommitment(value, randomness);
    
    res.json({
      message: 'Commitment generated successfully',
      commitment: commitment.commitment,
      randomness: commitment.randomness,
      privacy_level: 'maximum',
      usage: [
        'Use commitment for private values',
        'Share commitment publicly without revealing value',
        'Generate proofs using this commitment',
        'Verify commitments without revealing contents'
      ]
    });

  } catch (error) {
    logger.error('Commitment generation error:', error);
    res.status(500).json({ 
      error: 'Commitment generation failed', 
      message: 'Internal server error' 
    });
  }
});

/**
 * @swagger
 * /api/zk/verify-proof:
 *   post:
 *     summary: Verify any zero-knowledge proof
 *     tags: [Zero-Knowledge]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               proof_type:
 *                 type: string
 *               proof:
 *                 type: string
 *               public_signals:
 *                 type: array
 *     responses:
 *       200:
 *         description: Proof verification result
 */
router.post('/verify-proof', async (req, res) => {
  try {
    const { proof_type, proof, public_signals } = req.body;
    
    if (!proof_type || !proof) {
      return res.status(400).json({ error: 'Proof type and proof are required' });
    }

    const isValid = await zkService.verifyProof(proof_type, proof, public_signals || []);
    
    res.json({
      message: 'Proof verification completed',
      proof_type,
      verified: isValid,
      verification_time: Date.now(),
      privacy_preserved: true,
      proof_properties: {
        zero_knowledge: 'No sensitive data revealed during verification',
        soundness: 'Invalid proofs are rejected',
        completeness: 'Valid proofs are accepted',
        efficiency: 'Fast verification without revealing secrets'
      }
    });

  } catch (error) {
    logger.error('Proof verification error:', error);
    res.status(500).json({ 
      error: 'Proof verification failed', 
      message: 'Internal server error',
      verified: false
    });
  }
});

/**
 * @swagger
 * /api/zk/range-proof:
 *   post:
 *     summary: Generate range proof (proves value is in range without revealing it)
 *     tags: [Zero-Knowledge]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               value:
 *                 type: number
 *               min_range:
 *                 type: number
 *               max_range:
 *                 type: number
 *               commitment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Range proof generated
 */
router.post('/range-proof', auth, async (req, res) => {
  try {
    const { value, min_range, max_range, commitment } = req.body;
    
    if (value === undefined || min_range === undefined || max_range === undefined) {
      return res.status(400).json({ error: 'Value, min_range, and max_range are required' });
    }

    if (value < min_range || value > max_range) {
      return res.status(400).json({ error: 'Value is not within the specified range' });
    }

    const rangeProof = await zkService.generateRangeProof(
      value, 
      min_range, 
      max_range, 
      commitment || zkService.generateCommitment(value.toString()).commitment
    );
    
    res.json({
      message: 'Range proof generated successfully',
      proof: rangeProof.proof,
      public_signals: rangeProof.publicSignals,
      verified: rangeProof.verified,
      range: {
        min: min_range,
        max: max_range,
        proven_in_range: true,
        exact_value_hidden: true
      },
      applications: [
        'Prove income is above threshold without revealing amount',
        'Verify age range without revealing exact age',
        'Confirm balance sufficiency without showing balance',
        'Demonstrate performance level without exact metrics'
      ]
    });

  } catch (error) {
    logger.error('Range proof error:', error);
    res.status(500).json({ 
      error: 'Range proof generation failed', 
      message: 'Internal server error' 
    });
  }
});

/**
 * @swagger
 * /api/zk/membership-proof:
 *   post:
 *     summary: Generate membership proof (proves membership in set without revealing which member)
 *     tags: [Zero-Knowledge]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               secret:
 *                 type: string
 *               membership_set:
 *                 type: array
 *     responses:
 *       200:
 *         description: Membership proof generated
 */
router.post('/membership-proof', auth, async (req, res) => {
  try {
    const { secret, membership_set } = req.body;
    
    if (!secret || !membership_set || !Array.isArray(membership_set)) {
      return res.status(400).json({ error: 'Secret and membership_set array are required' });
    }

    if (!membership_set.includes(secret)) {
      return res.status(400).json({ error: 'Secret is not a member of the provided set' });
    }

    const membershipProof = zkService.generateMembershipProof(secret, membership_set);
    
    res.json({
      message: 'Membership proof generated successfully',
      commitment: membershipProof.commitment,
      merkle_root: membershipProof.merkleRoot,
      merkle_proof: membershipProof.merkleProof,
      verified: membershipProof.verified,
      set_size: membership_set.length,
      privacy_properties: {
        membership_proven: true,
        exact_member_hidden: true,
        set_structure_preserved: true,
        zero_knowledge_verification: true
      },
      use_cases: [
        'Prove whitelist membership without revealing identity',
        'Verify access rights without exposing credentials',
        'Confirm group membership while maintaining anonymity',
        'Validate eligibility without revealing personal details'
      ]
    });

  } catch (error) {
    logger.error('Membership proof error:', error);
    res.status(500).json({ 
      error: 'Membership proof generation failed', 
      message: 'Internal server error' 
    });
  }
});

/**
 * @swagger
 * /api/zk/aggregate-proofs:
 *   post:
 *     summary: Aggregate multiple ZK proofs for efficiency
 *     tags: [Zero-Knowledge]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               proofs:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Proofs aggregated successfully
 */
router.post('/aggregate-proofs', auth, async (req, res) => {
  try {
    const { proofs } = req.body;
    
    if (!proofs || !Array.isArray(proofs) || proofs.length === 0) {
      return res.status(400).json({ error: 'Array of proofs is required' });
    }

    const aggregatedProof = await zkService.aggregateProofs(proofs);
    
    res.json({
      message: 'Proofs aggregated successfully',
      aggregated_proof: aggregatedProof.aggregatedProof,
      original_count: proofs.length,
      aggregated_count: 1,
      compression_ratio: `${proofs.length}:1`,
      timestamp: aggregatedProof.timestamp,
      benefits: [
        'Reduced verification time',
        'Lower storage requirements', 
        'Batch verification efficiency',
        'Scalable proof systems',
        'Privacy preservation maintained'
      ],
      applications: [
        'Public statistics from private data',
        'Batch transaction verification',
        'Anonymous voting aggregation',
        'Private audit trail compression'
      ]
    });

  } catch (error) {
    logger.error('Proof aggregation error:', error);
    res.status(500).json({ 
      error: 'Proof aggregation failed', 
      message: 'Internal server error' 
    });
  }
});

/**
 * @swagger
 * /api/zk/system-status:
 *   get:
 *     summary: Get zero-knowledge system status and capabilities
 *     tags: [Zero-Knowledge]
 *     responses:
 *       200:
 *         description: ZK system status and information
 */
router.get('/system-status', async (req, res) => {
  try {
    const systemStatus = {
      zk_system: {
        initialized: zkService.isInitialized(),
        status: zkService.isInitialized() ? 'active' : 'initializing',
        mode: process.env.ENABLE_MOCK_ZK === 'true' ? 'development' : 'production'
      },
      supported_proofs: [
        'balance_proof',
        'stake_proof', 
        'transaction_proof',
        'task_completion_proof',
        'range_proof',
        'membership_proof',
        'aggregated_proof'
      ],
      cryptographic_primitives: {
        hash_function: 'Poseidon (ZK-friendly)',
        commitment_scheme: 'Pedersen commitments',
        proof_system: 'Groth16 zk-SNARKs',
        curve: 'BN128/BN254',
        field: 'Prime field for circuit compatibility'
      },
      privacy_guarantees: {
        zero_knowledge: 'No sensitive information revealed',
        soundness: 'Invalid statements cannot be proven',
        completeness: 'Valid statements can always be proven',
        efficiency: 'Fast generation and verification',
        non_interactive: 'Proofs can be verified without prover interaction'
      },
      performance_metrics: {
        commitment_generation: 'Sub-millisecond',
        proof_generation: 'Seconds (depends on circuit complexity)',
        proof_verification: 'Milliseconds',
        aggregation_efficiency: 'Linear scaling'
      },
      ecosystem_integration: {
        kamikaze_token: 'Private balance tracking',
        staking_system: 'Confidential stake amounts',
        ai_agents: 'Anonymous performance metrics',
        marketplace: 'Private transaction amounts',
        reputation: 'Range-proven scores'
      }
    };

    res.json(systemStatus);

  } catch (error) {
    logger.error('ZK system status error:', error);
    res.status(500).json({ 
      error: 'Failed to get system status', 
      message: 'Internal server error' 
    });
  }
});

module.exports = router;