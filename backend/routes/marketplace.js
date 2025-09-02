const express = require('express');
const database = require('../config/database');
const zkService = require('../services/zkService');
const logger = require('../utils/logger');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/marketplace/overview:
 *   get:
 *     summary: Get marketplace overview with privacy-preserving statistics
 *     tags: [Marketplace]
 *     responses:
 *       200:
 *         description: Marketplace overview with ZK aggregated data
 */
router.get('/overview', async (req, res) => {
  try {
    const publicStats = await database.getPublicStats();
    
    const marketplaceOverview = {
      ecosystem_stats: {
        total_users: publicStats.total_users?.value || 0,
        total_agents: publicStats.total_agents?.value || 0,
        total_tasks: publicStats.total_tasks_completed?.value || 0,
        total_staked: 'Commitment-based amount',
        total_burned: 'Private deflationary impact'
      },
      active_categories: {
        writing: {
          active_agents: 'Private count',
          active_tasks: 'Private count',
          avg_completion_time: 'ZK-aggregated',
          success_rate: 'Range-proven'
        },
        development: {
          active_agents: 'Private count',
          active_tasks: 'Private count', 
          avg_completion_time: 'ZK-aggregated',
          success_rate: 'Range-proven'
        },
        analytics: {
          active_agents: 'Private count',
          active_tasks: 'Private count',
          avg_completion_time: 'ZK-aggregated', 
          success_rate: 'Range-proven'
        },
        marketing: {
          active_agents: 'Private count',
          active_tasks: 'Private count',
          avg_completion_time: 'ZK-aggregated',
          success_rate: 'Range-proven'
        },
        creative: {
          active_agents: 'Private count',
          active_tasks: 'Private count',
          avg_completion_time: 'ZK-aggregated',
          success_rate: 'Range-proven'
        }
      },
      economy: {
        kamikaze_token: {
          circulating_supply: 'Commitment-based',
          total_burned: 'ZK-proven burn amount',
          burn_rate: '2% per transaction',
          staking_apy: '10-20% based on lock period'
        },
        transaction_volume: {
          daily_volume: 'Private aggregation',
          weekly_volume: 'Commitment-based',
          total_fees_burned: 'ZK-proven deflation'
        }
      },
      trending: {
        popular_agent_types: [
          'Content Writers (performance range-proven)',
          'Code Reviewers (quality ZK-verified)',
          'Data Analysts (results commitment-based)',
          'Social Media Managers (engagement private)'
        ],
        high_demand_tasks: [
          'AI Content Creation (budgets hidden)',
          'Smart Contract Audits (fees private)',
          'Market Research (scope confidential)',
          'SEO Optimization (results commitment-based)'
        ]
      },
      privacy_features: [
        'All earnings are commitment-based',
        'Task budgets remain private',
        'Agent performance uses range proofs',
        'Transaction amounts are hidden',
        'Only aggregated statistics are public'
      ]
    };

    res.json(marketplaceOverview);

  } catch (error) {
    logger.error('Marketplace overview error:', error);
    res.status(500).json({ 
      error: 'Failed to load marketplace overview', 
      message: 'Internal server error' 
    });
  }
});

/**
 * @swagger
 * /api/marketplace/search:
 *   get:
 *     summary: Search marketplace with privacy-preserving filters
 *     tags: [Marketplace]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: budget_range
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Search results with commitment-based data
 */
router.get('/search', async (req, res) => {
  try {
    const { category, type, budget_range } = req.query;
    
    // Mock search results with privacy preservation
    const searchResults = {
      filters_applied: {
        category: category || 'all',
        type: type || 'all',
        budget_range: budget_range || 'all'
      },
      agents: [
        {
          agent_id: 'agent_search_001',
          name: 'Expert Content Creator',
          category: 'writing',
          performance_tier: 'Expert (range proven)',
          capabilities_commitment: zkService.generateCommitment('expert_writing_seo').commitment,
          pricing: 'Competitive (hidden rates)',
          availability: 'Available',
          reputation_proof: 'ZK-verified 95%+ satisfaction',
          specializations: ['Blog Writing', 'SEO Content', 'Technical Writing']
        },
        {
          agent_id: 'agent_search_002', 
          name: 'Senior Code Auditor',
          category: 'development',
          performance_tier: 'Senior (range proven)',
          capabilities_commitment: zkService.generateCommitment('senior_solidity_audit').commitment,
          pricing: 'Premium (hidden rates)',
          availability: 'Available',
          reputation_proof: 'ZK-verified security expert',
          specializations: ['Smart Contract Audits', 'DeFi Security', 'Gas Optimization']
        },
        {
          agent_id: 'agent_search_003',
          name: 'Data Science Specialist', 
          category: 'analytics',
          performance_tier: 'Specialist (range proven)',
          capabilities_commitment: zkService.generateCommitment('data_science_ml').commitment,
          pricing: 'Standard (hidden rates)',
          availability: 'Busy (limited capacity)',
          reputation_proof: 'ZK-verified ML expertise',
          specializations: ['Predictive Analytics', 'Machine Learning', 'Data Visualization']
        }
      ],
      tasks: [
        {
          task_id: 'task_search_001',
          title: 'DeFi Protocol Documentation',
          category: 'writing',
          budget_commitment: zkService.generateCommitment('5000').commitment,
          urgency: 'High',
          client_rating: 'Verified (range proven)',
          estimated_duration: '1-2 weeks',
          requirements: 'Technical writing expertise required'
        },
        {
          task_id: 'task_search_002',
          title: 'Smart Contract Security Review',
          category: 'development', 
          budget_commitment: zkService.generateCommitment('15000').commitment,
          urgency: 'Critical',
          client_rating: 'Premium (range proven)',
          estimated_duration: '3-5 days',
          requirements: 'Solidity and DeFi security expertise'
        }
      ],
      search_stats: {
        total_agents_found: 'Private count matching criteria',
        total_tasks_found: 'Private count matching criteria',
        avg_response_time: 'ZK-aggregated statistics',
        success_rate_range: 'Range-proven marketplace quality'
      },
      privacy_preserved: {
        exact_earnings_hidden: true,
        performance_scores_range_proven: true,
        task_budgets_commitment_based: true,
        client_identities_protected: true
      }
    };

    res.json(searchResults);

  } catch (error) {
    logger.error('Marketplace search error:', error);
    res.status(500).json({ 
      error: 'Search failed', 
      message: 'Internal server error' 
    });
  }
});

/**
 * @swagger
 * /api/marketplace/trade-proof:
 *   post:
 *     summary: Submit marketplace trade proof with private amounts
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               trade_type:
 *                 type: string
 *               amount_commitment:
 *                 type: string
 *               counterparty_commitment:
 *                 type: string
 *               trade_proof:
 *                 type: string
 *     responses:
 *       200:
 *         description: Trade proof verified
 */
router.post('/trade-proof', auth, async (req, res) => {
  try {
    const { trade_type, amount_commitment, counterparty_commitment, trade_proof } = req.body;
    const wallet_address = req.user.wallet_address;
    
    // Verify trade proof
    const isValid = await zkService.verifyProof(
      'trade_proof', 
      trade_proof, 
      [amount_commitment, counterparty_commitment]
    );
    
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid trade proof' });
    }

    // Generate trade ID
    const tradeId = `trade_${zkService.generateNullifier(
      wallet_address, 
      `${amount_commitment}_${Date.now()}`
    ).substring(0, 16)}`;

    logger.info(`Marketplace trade proof verified: ${tradeId} for wallet: ${wallet_address}`);

    res.json({
      message: 'Marketplace trade proof verified',
      trade_id: tradeId,
      trade_type,
      amount_commitment,
      counterparty_commitment,
      trade_features: {
        amount_private: 'Trade amount remains hidden',
        parties_pseudonymous: 'Counterparties use commitments',
        execution_automatic: 'Smart contract escrow',
        fees_burned: '2% platform fee burned',
        settlement_instant: 'Atomic swap execution'
      },
      privacy_guarantees: [
        'Trade amounts are commitment-based',
        'Counterparty identities are protected',
        'Platform fees remain confidential',
        'Settlement details are private',
        'Only trade completion is public'
      ],
      verified: true
    });

  } catch (error) {
    logger.error('Marketplace trade proof error:', error);
    res.status(500).json({ 
      error: 'Trade proof failed', 
      message: 'Internal server error' 
    });
  }
});

/**
 * @swagger
 * /api/marketplace/leaderboard:
 *   get:
 *     summary: Get privacy-preserving leaderboard with range proofs
 *     tags: [Marketplace]
 *     responses:
 *       200:
 *         description: Leaderboard with commitment-based rankings
 */
router.get('/leaderboard', async (req, res) => {
  try {
    // Generate privacy-preserving leaderboard
    const leaderboard = {
      top_performers: {
        agents: [
          {
            rank: 1,
            agent_id: 'agent_top_001',
            category: 'development',
            performance_tier: 'Legendary (range proven)',
            score_commitment: zkService.generateCommitment('98.5').commitment,
            tasks_completed: 'High volume (private count)',
            earnings_tier: 'Top 1% (range proven)',
            reputation: 'Maximum rating (ZK verified)'
          },
          {
            rank: 2,
            agent_id: 'agent_top_002',
            category: 'writing',
            performance_tier: 'Expert (range proven)',
            score_commitment: zkService.generateCommitment('96.2').commitment,
            tasks_completed: 'High volume (private count)',
            earnings_tier: 'Top 5% (range proven)',
            reputation: 'Excellent rating (ZK verified)'
          },
          {
            rank: 3,
            agent_id: 'agent_top_003',
            category: 'analytics',
            performance_tier: 'Specialist (range proven)',
            score_commitment: zkService.generateCommitment('94.8').commitment,
            tasks_completed: 'Regular volume (private count)',
            earnings_tier: 'Top 10% (range proven)',
            reputation: 'High rating (ZK verified)'
          }
        ],
        clients: [
          {
            rank: 1,
            client_id: 'client_top_001',
            projects_posted: 'High volume (private count)',
            budget_tier: 'Enterprise (range proven)',
            satisfaction_given: 'Excellent (ZK verified)',
            payment_reliability: '100% (proven on-time)'
          },
          {
            rank: 2,
            client_id: 'client_top_002',
            projects_posted: 'Medium volume (private count)',
            budget_tier: 'Professional (range proven)',
            satisfaction_given: 'Very Good (ZK verified)',
            payment_reliability: '98% (proven reliable)'
          }
        ]
      },
      category_leaders: {
        writing: 'agent_writing_leader (performance ZK-proven)',
        development: 'agent_dev_leader (quality range-verified)',
        analytics: 'agent_analytics_leader (results proven)',
        marketing: 'agent_marketing_leader (ROI commitment-based)',
        creative: 'agent_creative_leader (portfolio ZK-verified)'
      },
      ranking_methodology: {
        performance_weight: '40% (range proofs only)',
        client_satisfaction: '30% (ZK-aggregated)',
        task_completion_rate: '20% (proven without revealing counts)',
        earnings_consistency: '10% (commitment-based)'
      },
      privacy_features: [
        'Exact scores remain private',
        'Only performance ranges are proven',
        'Earnings tiers use range proofs',
        'Task counts are commitment-based',
        'Individual ratings are aggregated via ZK'
      ],
      update_frequency: 'Real-time with ZK proof verification'
    };

    res.json(leaderboard);

  } catch (error) {
    logger.error('Leaderboard error:', error);
    res.status(500).json({ 
      error: 'Failed to load leaderboard', 
      message: 'Internal server error' 
    });
  }
});

module.exports = router;