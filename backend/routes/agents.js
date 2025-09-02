const express = require('express');
const { body, validationResult } = require('express-validator');
const database = require('../config/database');
const zkService = require('../services/zkService');
const logger = require('../utils/logger');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/agents/create-proof:
 *   post:
 *     summary: Submit agent creation proof with private capabilities
 *     tags: [Agents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               agent_type:
 *                 type: string
 *               capabilities_commitment:
 *                 type: string
 *               stake_commitment:
 *                 type: string
 *               creation_proof:
 *                 type: string
 *     responses:
 *       200:
 *         description: Agent creation proof verified
 */
router.post('/create-proof', auth, async (req, res) => {
  try {
    const { agent_type, capabilities_commitment, stake_commitment, creation_proof } = req.body;
    const wallet_address = req.user.wallet_address;
    
    // Verify agent creation proof
    const isValid = await zkService.verifyProof(
      'agent_creation_proof', 
      creation_proof, 
      [capabilities_commitment, stake_commitment]
    );
    
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid agent creation proof' });
    }

    // Generate agent ID and commitments
    const agentId = `agent_${zkService.generateNullifier(wallet_address, Date.now().toString()).substring(0, 16)}`;
    const agentCommitment = zkService.generateCommitment(agentId);
    
    // Available agent types
    const agentTypes = {
      'content-writer': {
        name: 'Content Writer',
        category: 'writing',
        base_cost: 1000,
        stake_requirement: 500
      },
      'code-reviewer': {
        name: 'Code Reviewer', 
        category: 'development',
        base_cost: 1500,
        stake_requirement: 750
      },
      'data-analyst': {
        name: 'Data Analyst',
        category: 'analytics', 
        base_cost: 2000,
        stake_requirement: 1000
      },
      'social-media': {
        name: 'Social Media Manager',
        category: 'marketing',
        base_cost: 1200,
        stake_requirement: 600
      },
      'research-assistant': {
        name: 'Research Assistant',
        category: 'research',
        base_cost: 1800,
        stake_requirement: 900
      },
      'translator': {
        name: 'Language Translator',
        category: 'language',
        base_cost: 1300,
        stake_requirement: 650
      },
      'image-generator': {
        name: 'Image Generator',
        category: 'creative',
        base_cost: 2500,
        stake_requirement: 1250
      },
      'market-analyzer': {
        name: 'Market Analyzer', 
        category: 'finance',
        base_cost: 3000,
        stake_requirement: 1500
      },
      'legal-assistant': {
        name: 'Legal Assistant',
        category: 'legal',
        base_cost: 2200,
        stake_requirement: 1100
      },
      'customer-support': {
        name: 'Customer Support',
        category: 'support',
        base_cost: 800,
        stake_requirement: 400
      },
      'seo-optimizer': {
        name: 'SEO Optimizer',
        category: 'marketing',
        base_cost: 1600,
        stake_requirement: 800
      },
      'video-editor': {
        name: 'Video Editor',
        category: 'creative',
        base_cost: 2800,
        stake_requirement: 1400
      }
    };

    const selectedType = agentTypes[agent_type];
    if (!selectedType) {
      return res.status(400).json({ error: 'Invalid agent type' });
    }

    logger.info(`Agent creation proof verified: ${agentId} for wallet: ${wallet_address}`);

    res.json({
      message: 'Agent creation proof verified',
      agent_id: agentId,
      agent_type: selectedType.name,
      category: selectedType.category,
      commitment: agentCommitment.commitment,
      capabilities_commitment,
      stake_commitment,
      privacy_features: [
        'Agent capabilities are commitment-based',
        'Performance metrics remain private',
        'Earnings are hidden with ZK proofs',
        'Task completion rates use commitments',
        'Agent quality scores are confidential'
      ],
      agent_economics: {
        base_cost: selectedType.base_cost,
        stake_requirement: selectedType.stake_requirement,
        revenue_sharing: 'Private percentage splits',
        performance_bonuses: 'Commitment-based rewards'
      },
      verified: true
    });

  } catch (error) {
    logger.error('Agent creation proof error:', error);
    res.status(500).json({ 
      error: 'Agent creation proof failed', 
      message: 'Internal server error' 
    });
  }
});

/**
 * @swagger
 * /api/agents/performance-proof:
 *   post:
 *     summary: Submit agent performance proof without revealing metrics
 *     tags: [Agents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               agent_id:
 *                 type: string
 *               performance_commitment:
 *                 type: string
 *               quality_proof:
 *                 type: string
 *     responses:
 *       200:
 *         description: Performance proof verified
 */
router.post('/performance-proof', auth, async (req, res) => {
  try {
    const { agent_id, performance_commitment, quality_proof } = req.body;
    const wallet_address = req.user.wallet_address;
    
    // Verify performance proof
    const isValid = await zkService.verifyProof(
      'performance_proof', 
      quality_proof, 
      [performance_commitment]
    );
    
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid performance proof' });
    }

    // Generate performance metrics commitment
    const performanceMetrics = {
      tasks_completed: 'Hidden count',
      success_rate: 'Private percentage', 
      average_rating: 'Commitment-based score',
      earnings: 'Private KAMIKAZE amount',
      reputation_score: 'ZK-proven range'
    };

    // Generate range proof for performance (proves it's above threshold without revealing exact score)
    const rangeProof = await zkService.generateRangeProof(
      85, // mock performance score
      0,
      100,
      performance_commitment
    );

    logger.info(`Performance proof verified for agent: ${agent_id}`);

    res.json({
      message: 'Agent performance proof verified',
      agent_id,
      performance_commitment,
      quality_verified: true,
      performance_tier: {
        tier_proven: true,
        exact_score_hidden: true,
        above_threshold: rangeProof.verified,
        range_verified: 'Score is within valid performance range'
      },
      metrics: performanceMetrics,
      privacy_guarantees: [
        'Exact performance scores remain private',
        'Task completion counts are hidden',
        'Earnings amounts use commitments', 
        'Only range membership is proven',
        'Reputation scores are ZK-verified'
      ],
      proof: rangeProof,
      verified: true
    });

  } catch (error) {
    logger.error('Agent performance proof error:', error);
    res.status(500).json({ 
      error: 'Performance proof failed', 
      message: 'Internal server error' 
    });
  }
});

/**
 * @swagger
 * /api/agents/marketplace:
 *   get:
 *     summary: Get agent marketplace with privacy-preserving listings
 *     tags: [Agents]
 *     responses:
 *       200:
 *         description: Agent marketplace with commitment-based data
 */
router.get('/marketplace', async (req, res) => {
  try {
    // Mock marketplace data with privacy preservation
    const marketplaceAgents = {
      featured_agents: [
        {
          agent_id: 'agent_content_001',
          type: 'Content Writer',
          category: 'writing',
          performance_tier: 'High (range proven)',
          capabilities_commitment: zkService.generateCommitment('advanced_writing').commitment,
          price_range: 'Competitive (hidden exact rate)',
          availability: 'Active',
          reputation_proof: 'ZK-verified high rating'
        },
        {
          agent_id: 'agent_code_002', 
          type: 'Code Reviewer',
          category: 'development',
          performance_tier: 'Expert (range proven)', 
          capabilities_commitment: zkService.generateCommitment('code_review_expert').commitment,
          price_range: 'Premium (hidden exact rate)',
          availability: 'Active',
          reputation_proof: 'ZK-verified expert level'
        },
        {
          agent_id: 'agent_data_003',
          type: 'Data Analyst',
          category: 'analytics',
          performance_tier: 'Professional (range proven)',
          capabilities_commitment: zkService.generateCommitment('data_analysis_pro').commitment,
          price_range: 'Standard (hidden exact rate)',
          availability: 'Active', 
          reputation_proof: 'ZK-verified professional'
        }
      ],
      categories: {
        writing: { count: 'Private', avg_performance: 'Range proven' },
        development: { count: 'Private', avg_performance: 'Range proven' },
        analytics: { count: 'Private', avg_performance: 'Range proven' },
        marketing: { count: 'Private', avg_performance: 'Range proven' },
        research: { count: 'Private', avg_performance: 'Range proven' },
        creative: { count: 'Private', avg_performance: 'Range proven' },
        finance: { count: 'Private', avg_performance: 'Range proven' },
        legal: { count: 'Private', avg_performance: 'Range proven' },
        support: { count: 'Private', avg_performance: 'Range proven' }
      },
      marketplace_stats: {
        total_agents: 'Commitment-based count',
        active_agents: 'ZK-proven availability',
        total_tasks_completed: 'Private aggregation',
        average_satisfaction: 'Range-proven rating',
        total_volume: 'Commitment-based KAMIKAZE'
      },
      privacy_features: [
        'Agent earnings remain private',
        'Performance metrics use commitments',
        'Task completion rates are hidden',
        'Only range proofs are public',
        'Anonymous quality verification'
      ]
    };

    res.json(marketplaceAgents);

  } catch (error) {
    logger.error('Marketplace error:', error);
    res.status(500).json({ 
      error: 'Failed to load marketplace', 
      message: 'Internal server error' 
    });
  }
});

/**
 * @swagger
 * /api/agents/earnings-proof:
 *   get:
 *     summary: Get agent earnings proof without revealing amounts
 *     tags: [Agents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Earnings proof with privacy preservation
 */
router.get('/earnings-proof', auth, async (req, res) => {
  try {
    const wallet_address = req.user.wallet_address;
    
    // Generate earnings proof
    const earningsProof = await zkService.generateMockProof('earnings', {
      wallet: wallet_address,
      timestamp: Date.now()
    });

    // Generate range proof for earnings (proves positive earnings without revealing amount)
    const earningsRangeProof = await zkService.generateRangeProof(
      2500, // mock earnings
      0,
      100000,
      'earnings_commitment'
    );

    res.json({
      message: 'Agent earnings verified',
      wallet_address,
      earnings_proof: {
        commitment: earningsProof.commitment,
        range_verified: true,
        amount_hidden: true,
        positive_earnings_proven: true
      },
      revenue_streams: {
        task_completion: 'Private KAMIKAZE rewards',
        performance_bonuses: 'Commitment-based bonuses',
        staking_rewards: 'Hidden staking earnings',
        referral_rewards: 'Private referral commissions'
      },
      privacy_guarantees: [
        'Exact earnings amounts are private',
        'Revenue breakdown is hidden',
        'Only positive earnings are proven',
        'Tax reporting via ZK proofs',
        'Anonymous income verification'
      ],
      proof: earningsRangeProof,
      verified: true
    });

  } catch (error) {
    logger.error('Earnings proof error:', error);
    res.status(500).json({ 
      error: 'Earnings proof failed', 
      message: 'Internal server error' 
    });
  }
});

module.exports = router;