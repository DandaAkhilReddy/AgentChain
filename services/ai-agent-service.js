const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { ethers } = require('ethers');

const app = express();
app.use(cors());
app.use(express.json());

class AIAgentService {
    constructor() {
        this.agents = new Map();
        this.taskQueue = [];
        this.completedTasks = [];
        
        // Free API configurations
        this.apiConfigs = {
            deepseek: {
                baseURL: 'https://api.deepseek.com/v1',
                model: 'deepseek-chat',
                free: true
            },
            groq: {
                baseURL: 'https://api.groq.com/openai/v1',
                model: 'mixtral-8x7b-32768',
                free: true
            },
            huggingface: {
                baseURL: 'https://api-inference.huggingface.co/models',
                model: 'microsoft/DialoGPT-medium',
                free: true
            },
            openai: {
                baseURL: 'https://api.openai.com/v1',
                model: 'gpt-3.5-turbo',
                free: false
            }
        };
    }

    // Register a new AI agent
    async registerAgent(agentConfig) {
        const agentId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const agent = {
            id: agentId,
            name: agentConfig.name,
            type: agentConfig.template,
            owner: agentConfig.owner,
            apiProvider: agentConfig.apiProvider,
            apiKey: agentConfig.apiKey,
            stake: agentConfig.stake,
            status: 'active',
            tasksCompleted: 0,
            totalEarned: 0,
            created: new Date(),
            lastActive: new Date()
        };

        this.agents.set(agentId, agent);
        
        // Start the agent's work loop
        this.startAgentWorkLoop(agentId);
        
        return agentId;
    }

    // Start an agent's work loop
    startAgentWorkLoop(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent) return;

        // Check for tasks every 30 seconds
        const workInterval = setInterval(async () => {
            if (agent.status !== 'active') {
                clearInterval(workInterval);
                return;
            }

            const availableTask = this.findTaskForAgent(agent);
            if (availableTask) {
                await this.executeTask(agent, availableTask);
            }
        }, 30000);

        agent.workInterval = workInterval;
    }

    // Find a suitable task for an agent
    findTaskForAgent(agent) {
        return this.taskQueue.find(task => {
            return task.category === this.getAgentCategory(agent.type) && 
                   task.status === 'pending';
        });
    }

    // Execute a task using AI API
    async executeTask(agent, task) {
        try {
            console.log(`Agent ${agent.name} starting task: ${task.title}`);
            
            task.status = 'in_progress';
            task.assignedTo = agent.id;
            task.startTime = new Date();

            let result;
            
            switch (agent.type) {
                case 'content-writer':
                    result = await this.handleContentWriting(agent, task);
                    break;
                case 'code-reviewer':
                    result = await this.handleCodeReview(agent, task);
                    break;
                case 'social-media':
                    result = await this.handleSocialMedia(agent, task);
                    break;
                case 'data-analyzer':
                    result = await this.handleDataAnalysis(agent, task);
                    break;
                case 'translator':
                    result = await this.handleTranslation(agent, task);
                    break;
                case 'chatbot':
                    result = await this.handleCustomerSupport(agent, task);
                    break;
                default:
                    result = await this.handleGenericTask(agent, task);
            }

            // Complete the task
            task.status = 'completed';
            task.result = result;
            task.completedTime = new Date();
            task.reward = this.calculateReward(task);

            // Update agent stats
            agent.tasksCompleted++;
            agent.totalEarned += task.reward;
            agent.lastActive = new Date();

            // Move to completed tasks
            this.completedTasks.push(task);
            this.taskQueue = this.taskQueue.filter(t => t.id !== task.id);

            console.log(`Task completed by ${agent.name}. Reward: ${task.reward} KAMIKAZE`);

            return result;

        } catch (error) {
            console.error(`Error executing task:`, error);
            task.status = 'failed';
            task.error = error.message;
        }
    }

    // Content writing handler
    async handleContentWriting(agent, task) {
        const prompt = `Write a ${task.requirements.type || 'blog post'} about "${task.title}". 
        Requirements: ${task.description}
        Word count: ${task.requirements.wordCount || 500} words
        Tone: ${task.requirements.tone || 'professional'}`;

        return await this.callAI(agent, prompt, {
            maxTokens: 2000,
            temperature: 0.7
        });
    }

    // Code review handler
    async handleCodeReview(agent, task) {
        const prompt = `Review the following code and provide feedback:

        Code:
        ${task.code}

        Please analyze:
        1. Code quality and best practices
        2. Potential bugs or issues
        3. Performance improvements
        4. Security considerations
        5. Suggestions for improvement

        Provide a detailed review with specific recommendations.`;

        return await this.callAI(agent, prompt, {
            maxTokens: 1500,
            temperature: 0.3
        });
    }

    // Social media handler
    async handleSocialMedia(agent, task) {
        const prompt = `Create ${task.requirements.postCount || 5} social media posts for ${task.requirements.platform || 'general platforms'}.
        
        Topic: ${task.title}
        Brand voice: ${task.requirements.tone || 'friendly and engaging'}
        Target audience: ${task.requirements.audience || 'general audience'}
        
        Include relevant hashtags and make them engaging.`;

        return await this.callAI(agent, prompt, {
            maxTokens: 1000,
            temperature: 0.8
        });
    }

    // Data analysis handler
    async handleDataAnalysis(agent, task) {
        const prompt = `Analyze the following data and provide insights:

        Data: ${JSON.stringify(task.data, null, 2)}
        
        Please provide:
        1. Key patterns and trends
        2. Statistical summary
        3. Actionable insights
        4. Recommendations based on the analysis
        5. Visual representation suggestions

        Make the analysis comprehensive and business-focused.`;

        return await this.callAI(agent, prompt, {
            maxTokens: 1500,
            temperature: 0.4
        });
    }

    // Translation handler
    async handleTranslation(agent, task) {
        const prompt = `Translate the following text from ${task.fromLanguage} to ${task.toLanguage}:

        "${task.text}"

        Ensure the translation is:
        1. Accurate and contextually appropriate
        2. Natural sounding in the target language
        3. Maintains the original tone and style
        4. Culturally sensitive`;

        return await this.callAI(agent, prompt, {
            maxTokens: 1000,
            temperature: 0.3
        });
    }

    // Customer support handler
    async handleCustomerSupport(agent, task) {
        const prompt = `You are a helpful customer support agent. Respond to this customer inquiry:

        Customer Message: "${task.customerMessage}"
        Product/Service: ${task.product || 'General'}
        Customer Type: ${task.customerType || 'Regular'}

        Provide a helpful, professional, and empathetic response that:
        1. Addresses their concern directly
        2. Offers practical solutions
        3. Maintains a friendly tone
        4. Includes next steps if needed`;

        return await this.callAI(agent, prompt, {
            maxTokens: 800,
            temperature: 0.5
        });
    }

    // Generic task handler
    async handleGenericTask(agent, task) {
        const prompt = `Complete the following task: ${task.title}
        
        Description: ${task.description}
        Requirements: ${JSON.stringify(task.requirements || {}, null, 2)}
        
        Provide a comprehensive response that addresses all requirements.`;

        return await this.callAI(agent, prompt, {
            maxTokens: 1200,
            temperature: 0.6
        });
    }

    // Call AI API
    async callAI(agent, prompt, options = {}) {
        const config = this.apiConfigs[agent.apiProvider];
        if (!config) {
            throw new Error(`Unsupported API provider: ${agent.apiProvider}`);
        }

        try {
            let response;

            if (agent.apiProvider === 'deepseek') {
                response = await this.callDeepSeek(agent.apiKey, prompt, options);
            } else if (agent.apiProvider === 'groq') {
                response = await this.callGroq(agent.apiKey, prompt, options);
            } else if (agent.apiProvider === 'huggingface') {
                response = await this.callHuggingFace(agent.apiKey, prompt, options);
            } else if (agent.apiProvider === 'openai') {
                response = await this.callOpenAI(agent.apiKey, prompt, options);
            } else {
                throw new Error(`API provider ${agent.apiProvider} not implemented`);
            }

            return response;

        } catch (error) {
            console.error(`AI API call failed:`, error);
            throw new Error(`AI processing failed: ${error.message}`);
        }
    }

    // DeepSeek API call (Free)
    async callDeepSeek(apiKey, prompt, options) {
        const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
            model: 'deepseek-chat',
            messages: [
                { role: 'user', content: prompt }
            ],
            max_tokens: options.maxTokens || 1000,
            temperature: options.temperature || 0.7
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data.choices[0].message.content;
    }

    // Groq API call (Free)
    async callGroq(apiKey, prompt, options) {
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: 'mixtral-8x7b-32768',
            messages: [
                { role: 'user', content: prompt }
            ],
            max_tokens: options.maxTokens || 1000,
            temperature: options.temperature || 0.7
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data.choices[0].message.content;
    }

    // Hugging Face API call (Free)
    async callHuggingFace(apiKey, prompt, options) {
        const response = await axios.post(
            'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium',
            {
                inputs: prompt,
                options: {
                    max_length: options.maxTokens || 1000,
                    temperature: options.temperature || 0.7
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data[0].generated_text || response.data.generated_text;
    }

    // OpenAI API call
    async callOpenAI(apiKey, prompt, options) {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'user', content: prompt }
            ],
            max_tokens: options.maxTokens || 1000,
            temperature: options.temperature || 0.7
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data.choices[0].message.content;
    }

    // Calculate reward based on task complexity
    calculateReward(task) {
        const baseReward = 50; // Base reward in KAMIKAZE tokens
        let multiplier = 1;

        // Complexity multiplier
        if (task.complexity === 'high') multiplier *= 2;
        else if (task.complexity === 'medium') multiplier *= 1.5;

        // Category multiplier
        const categoryMultipliers = {
            'development': 2.0,
            'analytics': 1.8,
            'writing': 1.5,
            'marketing': 1.3,
            'support': 1.2,
            'translation': 1.1
        };

        multiplier *= categoryMultipliers[task.category] || 1;

        return Math.floor(baseReward * multiplier);
    }

    // Get agent category based on type
    getAgentCategory(agentType) {
        const categoryMap = {
            'content-writer': 'writing',
            'code-reviewer': 'development',
            'social-media': 'marketing',
            'data-analyzer': 'analytics',
            'translator': 'translation',
            'chatbot': 'support'
        };

        return categoryMap[agentType] || 'general';
    }

    // Add a new task to the queue
    addTask(task) {
        const taskWithId = {
            id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            status: 'pending',
            created: new Date(),
            ...task
        };

        this.taskQueue.push(taskWithId);
        return taskWithId.id;
    }

    // Get agent status
    getAgent(agentId) {
        return this.agents.get(agentId);
    }

    // Get all agents
    getAllAgents() {
        return Array.from(this.agents.values());
    }

    // Get completed tasks
    getCompletedTasks(limit = 50) {
        return this.completedTasks.slice(-limit);
    }

    // Get pending tasks
    getPendingTasks() {
        return this.taskQueue.filter(task => task.status === 'pending');
    }
}

const aiService = new AIAgentService();

// API Routes
app.post('/api/agents/register', async (req, res) => {
    try {
        const agentId = await aiService.registerAgent(req.body);
        res.json({ success: true, agentId });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/agents', (req, res) => {
    const agents = aiService.getAllAgents();
    res.json({ success: true, agents });
});

app.get('/api/agents/:id', (req, res) => {
    const agent = aiService.getAgent(req.params.id);
    if (agent) {
        res.json({ success: true, agent });
    } else {
        res.status(404).json({ success: false, error: 'Agent not found' });
    }
});

app.post('/api/tasks', (req, res) => {
    try {
        const taskId = aiService.addTask(req.body);
        res.json({ success: true, taskId });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/tasks/pending', (req, res) => {
    const tasks = aiService.getPendingTasks();
    res.json({ success: true, tasks });
});

app.get('/api/tasks/completed', (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    const tasks = aiService.getCompletedTasks(limit);
    res.json({ success: true, tasks });
});

// Demo tasks endpoint
app.post('/api/tasks/demo', (req, res) => {
    const demoTasks = [
        {
            title: "Write a blog post about AI in healthcare",
            description: "Create an informative blog post about AI applications in healthcare",
            category: "writing",
            complexity: "medium",
            requirements: {
                type: "blog post",
                wordCount: 800,
                tone: "professional"
            }
        },
        {
            title: "Review JavaScript code for bugs",
            description: "Review a React component for potential issues",
            category: "development",
            complexity: "high",
            code: `
                import React, { useState } from 'react';
                
                function Counter() {
                    const [count, setCount] = useState(0);
                    
                    const increment = () => {
                        setCount(count + 1);
                    };
                    
                    return (
                        <div>
                            <p>Count: {count}</p>
                            <button onClick={increment}>Increment</button>
                        </div>
                    );
                }
                
                export default Counter;
            `
        },
        {
            title: "Create social media posts for product launch",
            description: "Generate engaging social media content for a new product",
            category: "marketing",
            complexity: "medium",
            requirements: {
                platform: "Twitter and LinkedIn",
                postCount: 3,
                tone: "exciting and professional",
                audience: "tech professionals"
            }
        }
    ];

    demoTasks.forEach(task => aiService.addTask(task));
    res.json({ success: true, message: 'Demo tasks added', count: demoTasks.length });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🤖 AI Agent Service running on port ${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}`);
});

module.exports = { AIAgentService, aiService };