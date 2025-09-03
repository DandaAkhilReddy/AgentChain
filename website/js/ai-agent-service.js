/**
 * Frontend AI Agent Service
 * Tracks AI agents and compares with human population
 */

class AIAgentService {
    constructor() {
        this.storageKey = 'agentchains_ai_stats';
        this.initializeLocalStorage();
    }

    /**
     * Initialize local storage for AI agent tracking
     */
    initializeLocalStorage() {
        const existing = localStorage.getItem(this.storageKey);
        if (!existing) {
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
                    'blockchain': 0,
                    'trading': 0,
                    'other': 0
                },
                createdToday: 0,
                lastReset: new Date().toISOString().split('T')[0],
                history: []
            };
            localStorage.setItem(this.storageKey, JSON.stringify(initialData));
        }
    }

    /**
     * Load AI agent statistics from local storage
     */
    loadStats() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Failed to load AI agent stats:', error);
            return null;
        }
    }

    /**
     * Save AI agent statistics to local storage
     */
    saveStats(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Failed to save AI agent stats:', error);
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

        // Add to history
        const agentRecord = {
            id: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: agentType,
            createdAt: new Date().toISOString(),
            metadata: metadata
        };
        
        stats.history.push(agentRecord);
        
        // Keep only last 1000 records
        if (stats.history.length > 1000) {
            stats.history = stats.history.slice(-1000);
        }

        // Save to localStorage
        this.saveStats(stats);
        
        // Trigger custom event for UI updates
        window.dispatchEvent(new CustomEvent('aiAgentCreated', {
            detail: { agentRecord, totalCount: stats.totalAgentsCreated }
        }));
        
        console.log(`🤖 New AI Agent Created: ${agentType} (Total: ${stats.totalAgentsCreated})`);
        
        return agentRecord;
    }

    /**
     * Simulate AI agent creation for demo purposes
     */
    simulateAgentCreation() {
        const agentTypes = ['chatbot', 'task-automation', 'data-analysis', 'content-generation', 'code-assistant'];
        const randomType = agentTypes[Math.floor(Math.random() * agentTypes.length)];
        
        const metadata = {
            simulated: true,
            userAgent: navigator.userAgent,
            timestamp: Date.now()
        };
        
        return this.registerNewAgent(randomType, metadata);
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
            history: stats.history.slice(-10), // Last 10 agents
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
        // Get population data using the PopulationService
        const populationService = new PopulationService();
        const [agentStats, populationData] = await Promise.all([
            this.getAgentStats(),
            populationService.getCurrentPopulation()
        ]);

        const humanPopulation = populationData.population;
        const aiPopulation = agentStats.total;
        
        const ratio = humanPopulation > 0 ? (aiPopulation / humanPopulation) : 0;
        const percentage = (ratio * 100).toFixed(8);
        
        return {
            humans: {
                population: humanPopulation,
                formatted: populationData.formatted,
                source: populationData.source,
                confidence: populationData.confidence
            },
            ai: {
                population: aiPopulation,
                formatted: agentStats.formatted.total,
                active: agentStats.active,
                createdToday: agentStats.createdToday,
                types: agentStats.agentTypes,
                recentAgents: agentStats.history
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
            return "🌟 Start the AI revolution! Create your first AI agent.";
        } else if (ratio < 0.000001) { // Less than 1 in a million
            return `🤖 ${aiCount.toLocaleString()} AI agents serving ${humanCount.toLocaleString()} humans. Each AI helps ${Math.floor(humanCount / aiCount).toLocaleString()} people!`;
        } else if (ratio < 0.0001) { // Less than 1 in 10,000
            return `📈 AI adoption growing! ${aiCount.toLocaleString()} agents supporting humanity.`;
        } else if (ratio < 0.01) { // Less than 1%
            return `🚀 Significant AI progress! ${(ratio * 100).toFixed(4)}% AI-to-human ratio.`;
        } else if (ratio < 0.1) { // Less than 10%
            return `🔥 AI Revolution accelerating! ${(ratio * 100).toFixed(2)}% AI-to-human ratio.`;
        } else if (ratio < 1) { // Less than 100%
            return `⚡ AI Singularity approaching! ${(ratio * 100).toFixed(1)}% AI-to-human ratio.`;
        } else {
            return `🤖 AI SINGULARITY ACHIEVED! More AI agents than humans!`;
        }
    }

    /**
     * Check for important milestones
     */
    checkMilestones(aiCount, humanCount) {
        const milestones = [
            { threshold: 1, message: "🎉 First AI agent created!" },
            { threshold: 10, message: "🚀 10 AI agents milestone!" },
            { threshold: 100, message: "💯 100 AI agents created!" },
            { threshold: 1000, message: "🏆 1,000 AI agents - Serious adoption!" },
            { threshold: 10000, message: "🌟 10,000 AI agents - AI transformation!" },
            { threshold: 100000, message: "🔥 100,000 AI agents - AI revolution!" },
            { threshold: 1000000, message: "💎 1 Million AI agents - Major milestone!" },
            { threshold: Math.floor(humanCount * 0.000001), message: "📊 1 in a million humans has an AI!" },
            { threshold: Math.floor(humanCount * 0.00001), message: "📈 1 in 100,000 humans has an AI!" },
            { threshold: Math.floor(humanCount * 0.0001), message: "🎯 1 in 10,000 humans has an AI!" },
            { threshold: Math.floor(humanCount * 0.001), message: "⚡ 0.1% AI-to-human ratio!" },
            { threshold: Math.floor(humanCount * 0.01), message: "🚨 1% AI-to-human ratio achieved!" },
            { threshold: Math.floor(humanCount * 0.1), message: "🔴 10% AI-to-human ratio - Revolution!" },
            { threshold: humanCount, message: "🤖 AI SINGULARITY - More AIs than humans!" }
        ];

        const achievedMilestones = milestones.filter(m => aiCount >= m.threshold && m.threshold > 0);
        const nextMilestone = milestones.find(m => aiCount < m.threshold && m.threshold > 0);

        return {
            latest: achievedMilestones[achievedMilestones.length - 1],
            next: nextMilestone,
            progress: nextMilestone ? Math.min((aiCount / nextMilestone.threshold) * 100, 100) : 100,
            total: achievedMilestones.length,
            remaining: milestones.length - achievedMilestones.length
        };
    }

    /**
     * Get agent type distribution for charts
     */
    async getAgentTypeDistribution() {
        const stats = await this.getAgentStats();
        if (!stats) return [];

        return Object.entries(stats.agentTypes)
            .map(([type, count]) => ({
                type: type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                count,
                percentage: stats.total > 0 ? ((count / stats.total) * 100).toFixed(1) : 0
            }))
            .sort((a, b) => b.count - a.count);
    }

    /**
     * Auto-increment agent count for demo (simulates real usage)
     */
    startAutoIncrement(intervalMs = 30000) { // Every 30 seconds
        const interval = setInterval(() => {
            // Small chance to create an agent automatically (simulates real users)
            if (Math.random() < 0.3) { // 30% chance
                this.simulateAgentCreation();
            }
        }, intervalMs);

        // Stop after 1 hour to avoid cluttering
        setTimeout(() => {
            clearInterval(interval);
            console.log('🛑 Auto-increment stopped');
        }, 60 * 60 * 1000);

        return interval;
    }
}

// Export for use in other scripts
window.AIAgentService = AIAgentService;