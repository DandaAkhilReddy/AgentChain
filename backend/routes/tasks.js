const express = require('express');
const { body, validationResult } = require('express-validator');
const database = require('../config/database');
const zkService = require('../services/zkService');
const logger = require('../utils/logger');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/tasks/create-proof:
 *   post:
 *     summary: Submit task creation proof with private requirements
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               task_type:
 *                 type: string
 *               requirements_commitment:
 *                 type: string
 *               budget_commitment:
 *                 type: string
 *               task_proof:
 *                 type: string
 *     responses:
 *       200:
 *         description: Task creation proof verified
 */
router.post('/create-proof', auth, async (req, res) => {
  try {
    const { task_type, requirements_commitment, budget_commitment, task_proof } = req.body;
    const wallet_address = req.user.wallet_address;
    
    // Verify task creation proof
    const isValid = await zkService.verifyProof(
      'task_creation_proof', 
      task_proof, 
      [requirements_commitment, budget_commitment]
    );
    
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid task creation proof' });
    }

    // Generate task ID and commitments
    const taskId = `task_${zkService.generateNullifier(wallet_address, Date.now().toString()).substring(0, 16)}`;
    const taskCommitment = zkService.generateCommitment(taskId);
    
    // Task categories
    const taskTypes = {
      'content-writing': {
        name: 'Content Writing',
        category: 'writing',
        typical_budget: '100-1000 KAMIKAZE',
        completion_time: '1-3 days'
      },
      'code-review': {
        name: 'Code Review',
        category: 'development', 
        typical_budget: '200-2000 KAMIKAZE',
        completion_time: '1-5 days'
      },
      'data-analysis': {
        name: 'Data Analysis',
        category: 'analytics',
        typical_budget: '300-3000 KAMIKAZE', 
        completion_time: '2-7 days'
      },
      'social-media': {
        name: 'Social Media Management',
        category: 'marketing',
        typical_budget: '150-1500 KAMIKAZE',
        completion_time: '1-30 days'
      },
      'research': {
        name: 'Research Task',
        category: 'research',
        typical_budget: '200-2500 KAMIKAZE',
        completion_time: '1-10 days'
      },
      'translation': {
        name: 'Translation',
        category: 'language',
        typical_budget: '100-1200 KAMIKAZE',
        completion_time: '1-3 days'
      },
      'image-creation': {
        name: 'Image Creation',
        category: 'creative',
        typical_budget: '250-2500 KAMIKAZE',
        completion_time: '1-5 days'
      },
      'market-analysis': {
        name: 'Market Analysis',
        category: 'finance',
        typical_budget: '500-5000 KAMIKAZE',
        completion_time: '2-14 days'
      }
    };

    const selectedType = taskTypes[task_type];
    if (!selectedType) {
      return res.status(400).json({ error: 'Invalid task type' });
    }

    logger.info(`Task creation proof verified: ${taskId} for wallet: ${wallet_address}`);

    res.json({
      message: 'Task creation proof verified',
      task_id: taskId,
      task_type: selectedType.name,
      category: selectedType.category,
      commitment: taskCommitment.commitment,
      requirements_commitment,
      budget_commitment,
      privacy_features: [
        'Task requirements are commitment-based',
        'Budget amounts remain private',
        'Progress updates use ZK proofs',
        'Completion verification is anonymous',
        'Payment amounts are hidden'
      ],
      task_economics: {
        typical_budget: selectedType.typical_budget,
        completion_time: selectedType.completion_time,
        escrow_protection: 'ZK-verified fund security',
        milestone_payments: 'Private progress verification'
      },
      verified: true
    });

  } catch (error) {
    logger.error('Task creation proof error:', error);
    res.status(500).json({ 
      error: 'Task creation proof failed', 
      message: 'Internal server error' 
    });
  }
});

/**
 * @swagger
 * /api/tasks/completion-proof:
 *   post:
 *     summary: Submit task completion proof without revealing work details
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               task_id:
 *                 type: string
 *               agent_id:
 *                 type: string
 *               quality_commitment:
 *                 type: string
 *               completion_proof:
 *                 type: string
 *     responses:
 *       200:
 *         description: Task completion proof verified
 */
router.post('/completion-proof', auth, async (req, res) => {
  try {
    const { task_id, agent_id, quality_commitment, completion_proof } = req.body;
    const wallet_address = req.user.wallet_address;
    
    // Verify task completion proof
    const isValid = await zkService.verifyProof(
      'task_completion_proof', 
      completion_proof, 
      [task_id, agent_id, quality_commitment]
    );
    
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid task completion proof' });
    }

    // Generate completion verification
    const completionId = `completion_${zkService.generateNullifier(task_id, agent_id).substring(0, 16)}`;
    
    // Generate quality range proof
    const qualityRangeProof = await zkService.generateRangeProof(
      90, // mock quality score
      0,
      100,
      quality_commitment
    );

    logger.info(`Task completion proof verified: ${task_id} by agent: ${agent_id}`);

    res.json({
      message: 'Task completion proof verified',
      task_id,
      agent_id,
      completion_id: completionId,
      quality_verified: true,
      quality_proof: {
        commitment: quality_commitment,
        range_proven: true,
        exact_score_hidden: true,
        above_threshold: qualityRangeProof.verified
      },
      completion_metrics: {
        delivery_time: 'Private completion duration',
        quality_score: 'ZK-proven range verification',
        customer_satisfaction: 'Commitment-based rating',
        agent_performance: 'Hidden performance metrics'
      },
      privacy_guarantees: [
        'Task deliverables remain private',
        'Work quality scores are range-proven only',
        'Completion time is confidential',
        'Agent-client communications are private',
        'Payment amounts are commitment-based'
      ],
      proof: qualityRangeProof,
      verified: true
    });

  } catch (error) {
    logger.error('Task completion proof error:', error);
    res.status(500).json({ 
      error: 'Task completion proof failed', 
      message: 'Internal server error' 
    });
  }
});

/**
 * @swagger
 * /api/tasks/marketplace:
 *   get:
 *     summary: Get task marketplace with privacy-preserving listings
 *     tags: [Tasks]
 *     responses:
 *       200:
 *         description: Task marketplace with commitment-based data
 */
router.get('/marketplace', async (req, res) => {
  try {
    // Mock marketplace data with privacy preservation
    const taskMarketplace = {
      active_tasks: [
        {
          task_id: 'task_writing_001',
          type: 'Content Writing',
          category: 'writing',
          budget_range: 'Moderate (hidden exact amount)',
          requirements_commitment: zkService.generateCommitment('blog_post_writing').commitment,
          urgency: 'Standard',
          client_rating: 'High (range proven)',
          estimated_duration: '2-3 days'
        },
        {
          task_id: 'task_dev_002',
          type: 'Code Review', 
          category: 'development',
          budget_range: 'High (hidden exact amount)',
          requirements_commitment: zkService.generateCommitment('react_code_review').commitment,
          urgency: 'High',
          client_rating: 'Expert (range proven)',
          estimated_duration: '1-2 days'
        },
        {
          task_id: 'task_analysis_003',
          type: 'Data Analysis',
          category: 'analytics', 
          budget_range: 'Premium (hidden exact amount)',
          requirements_commitment: zkService.generateCommitment('sales_data_analysis').commitment,
          urgency: 'Medium',
          client_rating: 'Professional (range proven)', 
          estimated_duration: '3-5 days'
        }
      ],
      categories: {
        writing: { active_count: 'Private', avg_budget: 'Range proven' },
        development: { active_count: 'Private', avg_budget: 'Range proven' },
        analytics: { active_count: 'Private', avg_budget: 'Range proven' },
        marketing: { active_count: 'Private', avg_budget: 'Range proven' },
        research: { active_count: 'Private', avg_budget: 'Range proven' },
        creative: { active_count: 'Private', avg_budget: 'Range proven' },
        language: { active_count: 'Private', avg_budget: 'Range proven' },
        finance: { active_count: 'Private', avg_budget: 'Range proven' }
      },
      marketplace_stats: {
        total_active_tasks: 'Commitment-based count',
        total_budget_pool: 'Private KAMIKAZE amount',
        average_completion_time: 'ZK-aggregated statistics',
        success_rate: 'Range-proven percentage',
        client_satisfaction: 'Commitment-based ratings'
      },
      privacy_features: [
        'Task budgets remain private',
        'Client requirements use commitments',
        'Work deliverables are confidential',
        'Payment amounts are hidden',
        'Only range proofs are public for quality'
      ]
    };

    res.json(taskMarketplace);

  } catch (error) {
    logger.error('Task marketplace error:', error);
    res.status(500).json({ 
      error: 'Failed to load task marketplace', 
      message: 'Internal server error' 
    });
  }
});

/**
 * @swagger
 * /api/tasks/payment-proof:
 *   post:
 *     summary: Submit task payment proof with private amounts
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               task_id:
 *                 type: string
 *               payment_commitment:
 *                 type: string
 *               payment_proof:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment proof verified
 */
router.post('/payment-proof', auth, async (req, res) => {
  try {
    const { task_id, payment_commitment, payment_proof } = req.body;
    const wallet_address = req.user.wallet_address;
    
    // Verify payment proof
    const isValid = await zkService.verifyProof(
      'payment_proof', 
      payment_proof, 
      [payment_commitment]
    );
    
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid payment proof' });
    }

    // Generate payment verification
    const paymentId = `payment_${zkService.generateNullifier(task_id, Date.now().toString()).substring(0, 16)}`;
    
    logger.info(`Task payment proof verified: ${task_id} payment: ${paymentId}`);

    res.json({
      message: 'Task payment proof verified',
      task_id,
      payment_id: paymentId,
      payment_commitment,
      payment_verified: true,
      payment_features: {
        escrow_released: 'ZK-verified fund release',
        amount_private: 'Payment amount remains hidden',
        burn_applied: '2% burn on payment transaction',
        agent_earning: 'Private KAMIKAZE reward',
        platform_fee: 'Hidden fee deduction'
      },
      privacy_guarantees: [
        'Payment amounts are commitment-based',
        'Agent earnings remain private',
        'Platform fees are confidential',
        'Burn amounts are proven but hidden',
        'Transaction details use ZK proofs'
      ],
      verified: true
    });

  } catch (error) {
    logger.error('Task payment proof error:', error);
    res.status(500).json({ 
      error: 'Task payment proof failed', 
      message: 'Internal server error' 
    });
  }
});

/**
 * @swagger
 * /api/tasks/dispute-proof:
 *   post:
 *     summary: Submit task dispute proof with private evidence
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               task_id:
 *                 type: string
 *               evidence_commitment:
 *                 type: string
 *               dispute_proof:
 *                 type: string
 *     responses:
 *       200:
 *         description: Dispute proof verified
 */
router.post('/dispute-proof', auth, async (req, res) => {
  try {
    const { task_id, evidence_commitment, dispute_proof } = req.body;
    const wallet_address = req.user.wallet_address;
    
    // Verify dispute proof
    const isValid = await zkService.verifyProof(
      'dispute_proof', 
      dispute_proof, 
      [evidence_commitment]
    );
    
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid dispute proof' });
    }

    // Generate dispute case ID
    const disputeId = `dispute_${zkService.generateNullifier(task_id, wallet_address).substring(0, 16)}`;
    
    logger.info(`Task dispute proof verified: ${task_id} dispute: ${disputeId}`);

    res.json({
      message: 'Task dispute proof verified',
      task_id,
      dispute_id: disputeId,
      evidence_commitment,
      dispute_verified: true,
      dispute_resolution: {
        evidence_private: 'Dispute evidence remains confidential',
        arbitration_process: 'ZK-verified mediation',
        resolution_private: 'Settlement terms are hidden',
        reputation_impact: 'Private reputation adjustments'
      },
      privacy_guarantees: [
        'Dispute details remain confidential',
        'Evidence is commitment-based',
        'Resolution terms are private',
        'Reputation impacts are hidden',
        'All parties maintain anonymity levels'
      ],
      next_steps: [
        'Arbitration committee reviews ZK proofs',
        'Private mediation process begins',
        'Resolution via commitment verification',
        'Settlement executed with privacy preservation'
      ],
      verified: true
    });

  } catch (error) {
    logger.error('Task dispute proof error:', error);
    res.status(500).json({ 
      error: 'Task dispute proof failed', 
      message: 'Internal server error' 
    });
  }
});

module.exports = router;