/**
 * AI Agent Tracker Service
 * Tracks AI agents created through AgentChains platform
 * Compares AI population vs Human population
 */

const fs = require('fs');
const path = require('path');

class AIAgentTracker {
    constructor() {
        this.dataFile = path.join(__dirname, '../data/agent-stats.json');
        this.initializeData();
    }

    /**
     * Initialize agent tracking data
     */
    initializeData() {
        try {
            // Create data directory if it doesn't exist
            const dataDir = path.dirname(this.dataFile);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }

            // Initialize data file if it doesn't exist
            if (!fs.existsSync(this.dataFile)) {
                const initialData = {
                    totalAgentsCreated: 0,
                    activeAgents: 0,
                    agentTypes: {
                        'chatbot': 0,
                        'task-automation': 0,
                        'data-analysis': 0,
                        'content-generation': 0,
                        'code-assistant': 0,
                        'customer-service': 0,
                        'other': 0
                    },
                    dailyStats: {},
                    createdToday: 0,
                    lastReset: new Date().toISOString().split('T')[0]
                };
                fs.writeFileSync(this.dataFile, JSON.stringify(initialData, null, 2));
            }
        } catch (error) {
            console.error('Failed to initialize AI agent data:', error);
        }
    }

    /**
     * Load agent statistics from file
     */
    loadStats() {
        try {
            const data = fs.readFileSync(this.dataFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Failed to load agent stats:', error);
            return null;
        }
    }

    /**
     * Save agent statistics to file
     */
    saveStats(data) {
        try {
            fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error('Failed to save agent stats:', error);
            return false;
        }
    }

    /**
     * Register a new AI agent creation
     */
    registerNewAgent(agentType = 'other', metadata = {}) {
        const stats = this.loadStats();
        if (!stats) return false;

        const today = new Date().toISOString().split('T')[0];
        
        // Reset daily count if it's a new day
        if (stats.lastReset !== today) {
            stats.createdToday = 0;
            stats.lastReset = today;
        }

        // Update counters
        stats.totalAgentsCreated++;
        stats.activeAgents++;
        stats.createdToday++;
        
        // Update agent type counter
        if (stats.agentTypes[agentType] !== undefined) {
            stats.agentTypes[agentType]++;
        } else {
            stats.agentTypes.other++;
        }

        // Store daily statistics
        if (!stats.dailyStats[today]) {
            stats.dailyStats[today] = {
                created: 0,
                types: { ...stats.agentTypes }
            };
        }
        stats.dailyStats[today].created++;

        // Add creation metadata
        const agentRecord = {
            id: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: agentType,
            createdAt: new Date().toISOString(),
            metadata: metadata
        };

        // Save to file
        this.saveStats(stats);
        
        console.log(`🤖 New AI Agent Registered: ${agentType} (Total: ${stats.totalAgentsCreated})`);
        
        return agentRecord;
    }

    /**
     * Deactivate an AI agent
     */
    deactivateAgent(agentId) {
        const stats = this.loadStats();
        if (!stats) return false;

        if (stats.activeAgents > 0) {
            stats.activeAgents--;
            this.saveStats(stats);
            console.log(`🔌 AI Agent Deactivated: ${agentId}`);
        }
        
        return true;
    }

    /**
     * Get current AI agent statistics
     */
    async getAgentStats() {
        const stats = this.loadStats();
        if (!stats) return null;

        const today = new Date().toISOString().split('T')[0];
        
        // Reset daily count if it's a new day
        if (stats.lastReset !== today) {
            stats.createdToday = 0;
            stats.lastReset = today;
            this.saveStats(stats);
        }

        return {
            total: stats.totalAgentsCreated,
            active: stats.activeAgents,
            createdToday: stats.createdToday,
            agentTypes: stats.agentTypes,
            formatted: {
                total: stats.totalAgentsCreated.toLocaleString(),
                active: stats.activeAgents.toLocaleString(),
                createdToday: stats.createdToday.toLocaleString()
            }
        };
    }

    /**
     * Get AI vs Human comparison
     */
    async getAIvsHumanComparison() {
        // Import our population API
        const WorldPopulationAPI = require('./population-api.js');
        const populationAPI = new WorldPopulationAPI();
        
        const [agentStats, populationData] = await Promise.all([
            this.getAgentStats(),
            populationAPI.getCurrentPopulation()
        ]);

        const humanPopulation = populationData.population;
        const aiPopulation = agentStats.total;
        
        const ratio = humanPopulation > 0 ? (aiPopulation / humanPopulation) : 0;
        const percentage = (ratio * 100).toFixed(8);
        
        // Calculate growth rates
        const humanGrowthRate = 0.0087; // 0.87% annually
        const dailyHumanGrowth = Math.floor((humanPopulation * humanGrowthRate) / 365.25);
        
        return {
            humans: {
                population: humanPopulation,
                formatted: populationData.formatted,
                dailyGrowth: dailyHumanGrowth,
                source: populationData.source
            },
            ai: {
                population: aiPopulation,
                formatted: agentStats.formatted.total,
                active: agentStats.active,
                createdToday: agentStats.createdToday,
                types: agentStats.agentTypes
            },
            comparison: {
                aiToHumanRatio: ratio,
                aiPercentage: percentage,
                humansPerAI: Math.floor(humanPopulation / (aiPopulation || 1)),
                message: this.getComparisonMessage(ratio, aiPopulation, humanPopulation)
            },
            milestone: this.checkMilestones(aiPopulation, humanPopulation)
        };
    }

    /**
     * Generate comparison message
     */
    getComparisonMessage(ratio, aiCount, humanCount) {
        if (aiCount === 0) {
            return "No AI agents created yet. Start building the AI revolution!";
        } else if (ratio < 0.000001) { // Less than 1 in a million
            return `We have ${aiCount.toLocaleString()} AI agents serving ${humanCount.toLocaleString()} humans. Every AI agent serves ${Math.floor(humanCount / aiCount).toLocaleString()} people!`;
        } else if (ratio < 0.0001) { // Less than 1 in 10,000
            return `AI agents are growing! ${aiCount.toLocaleString()} agents for ${humanCount.toLocaleString()} humans.`;
        } else if (ratio < 0.01) { // Less than 1%
            return `Significant AI adoption! ${(ratio * 100).toFixed(4)}% AI-to-human ratio.`;
        } else if (ratio < 0.1) { // Less than 10%
            return `🚀 AI Revolution accelerating! ${(ratio * 100).toFixed(2)}% AI-to-human ratio.`;
        } else if (ratio < 1) { // Less than 100%
            return `🔥 AI Singularity approaching! ${(ratio * 100).toFixed(1)}% AI-to-human ratio.`;
        } else {
            return `🤖 AI SINGULARITY ACHIEVED! More AI agents than humans!`;
        }
    }

    /**
     * Check for important milestones
     */
    checkMilestones(aiCount, humanCount) {
        const milestones = [
            { threshold: 1000, message: "First 1,000 AI agents created!" },
            { threshold: 10000, message: "10,000 AI agents milestone!" },
            { threshold: 100000, message: "100,000 AI agents - AI revolution begins!" },
            { threshold: 1000000, message: "1 Million AI agents - Significant AI adoption!" },
            { threshold: 10000000, message: "10 Million AI agents - AI transformation!" },
            { threshold: humanCount * 0.001, message: "0.1% of human population in AI agents!" },
            { threshold: humanCount * 0.01, message: "1% AI-to-human ratio achieved!" },
            { threshold: humanCount * 0.1, message: "10% AI-to-human ratio - AI Revolution!" },
            { threshold: humanCount, message: "🤖 AI SINGULARITY - More AIs than humans!" }
        ];

        const achievedMilestones = milestones.filter(m => aiCount >= m.threshold);
        const nextMilestone = milestones.find(m => aiCount < m.threshold);

        return {
            latest: achievedMilestones[achievedMilestones.length - 1],
            next: nextMilestone,
            progress: nextMilestone ? (aiCount / nextMilestone.threshold) * 100 : 100
        };
    }

    /**
     * Get weekly statistics
     */
    getWeeklyStats() {
        const stats = this.loadStats();
        if (!stats) return null;

        const today = new Date();
        const weekAgo = new Date(today - 7 * 24 * 60 * 60 * 1000);
        
        let weeklyCreated = 0;
        for (let d = new Date(weekAgo); d <= today; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            if (stats.dailyStats[dateStr]) {
                weeklyCreated += stats.dailyStats[dateStr].created;
            }
        }

        return {
            weeklyCreated,
            averagePerDay: Math.round(weeklyCreated / 7),
            trend: this.calculateTrend(stats.dailyStats)
        };
    }

    /**
     * Calculate growth trend
     */
    calculateTrend(dailyStats) {
        const dates = Object.keys(dailyStats).sort().slice(-14); // Last 14 days
        if (dates.length < 2) return 'insufficient_data';

        const recent = dates.slice(-7);
        const previous = dates.slice(-14, -7);

        const recentAvg = recent.reduce((sum, date) => sum + (dailyStats[date]?.created || 0), 0) / recent.length;
        const previousAvg = previous.reduce((sum, date) => sum + (dailyStats[date]?.created || 0), 0) / previous.length;

        if (recentAvg > previousAvg * 1.1) return 'growing';
        else if (recentAvg < previousAvg * 0.9) return 'declining';
        else return 'stable';
    }
}

// Export for use in other modules
module.exports = AIAgentTracker;

// CLI usage example
if (require.main === module) {
    const tracker = new AIAgentTracker();
    
    (async () => {
        console.log('🤖 AgentChains AI Agent Tracker\n');
        
        // Register some sample agents for testing
        if (process.argv.includes('--test')) {
            console.log('📝 Registering test agents...');
            tracker.registerNewAgent('chatbot', { name: 'Customer Support Bot' });
            tracker.registerNewAgent('task-automation', { name: 'Email Assistant' });
            tracker.registerNewAgent('code-assistant', { name: 'Development Helper' });
        }
        
        const comparison = await tracker.getAIvsHumanComparison();
        
        console.log('🌍 Human Population:', comparison.humans.formatted);
        console.log('🤖 AI Agent Population:', comparison.ai.formatted);
        console.log('📊 AI to Human Ratio:', comparison.comparison.aiPercentage + '%');
        console.log('💬 Status:', comparison.comparison.message);
        
        if (comparison.milestone.latest) {
            console.log('🏆 Latest Milestone:', comparison.milestone.latest.message);
        }
        
        if (comparison.milestone.next) {
            console.log('🎯 Next Milestone:', comparison.milestone.next.message);
            console.log('📈 Progress:', comparison.milestone.progress.toFixed(2) + '%');
        }
    })();
}