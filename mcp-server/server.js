#!/usr/bin/env node

/**
 * AgentChains MCP Server
 * Model Context Protocol server for AI agent infrastructure
 */

const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const { v4: uuidv4 } = require('uuid');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const winston = require('winston');
const cron = require('node-cron');
require('dotenv').config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logger setup
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});

// Database setup
const db = new sqlite3.Database('./agentchains.db', (err) => {
    if (err) {
        logger.error('Error opening database:', err);
    } else {
        logger.info('Connected to SQLite database');
    }
});

// Initialize database tables
const initDatabase = () => {
    const tables = [
        `CREATE TABLE IF NOT EXISTS agents (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            owner_id TEXT NOT NULL,
            config TEXT NOT NULL,
            memory TEXT DEFAULT '{}',
            status TEXT DEFAULT 'inactive',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS agent_sessions (
            id TEXT PRIMARY KEY,
            agent_id TEXT NOT NULL,
            session_data TEXT DEFAULT '{}',
            expires_at DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (agent_id) REFERENCES agents (id)
        )`,
        `CREATE TABLE IF NOT EXISTS agent_memory (
            id TEXT PRIMARY KEY,
            agent_id TEXT NOT NULL,
            memory_type TEXT NOT NULL,
            content TEXT NOT NULL,
            metadata TEXT DEFAULT '{}',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (agent_id) REFERENCES agents (id)
        )`,
        `CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            agent_id TEXT NOT NULL,
            task_type TEXT NOT NULL,
            prompt TEXT NOT NULL,
            result TEXT,
            status TEXT DEFAULT 'pending',
            priority INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            completed_at DATETIME,
            FOREIGN KEY (agent_id) REFERENCES agents (id)
        )`,
        `CREATE TABLE IF NOT EXISTS agent_templates (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            category TEXT NOT NULL,
            template_config TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
    ];

    tables.forEach(query => {
        db.run(query, (err) => {
            if (err) logger.error('Error creating table:', err);
        });
    });
};

initDatabase();

// Agent Architecture Classes
class AgentMemory {
    constructor(agentId) {
        this.agentId = agentId;
        this.shortTerm = new Map(); // In-memory for current session
        this.longTerm = []; // Persistent storage
        this.workingMemory = new Map(); // Current task context
    }

    async store(type, content, metadata = {}) {
        const memoryId = uuidv4();
        const memoryItem = {
            id: memoryId,
            type,
            content,
            metadata,
            timestamp: new Date().toISOString()
        };

        // Store in appropriate memory type
        if (type === 'short_term') {
            this.shortTerm.set(memoryId, memoryItem);
        } else if (type === 'working') {
            this.workingMemory.set(memoryId, memoryItem);
        } else {
            // Long-term memory goes to database
            await this.storeLongTermMemory(memoryItem);
        }

        return memoryId;
    }

    async storeLongTermMemory(memoryItem) {
        return new Promise((resolve, reject) => {
            const query = `INSERT INTO agent_memory (id, agent_id, memory_type, content, metadata) VALUES (?, ?, ?, ?, ?)`;
            db.run(query, [
                memoryItem.id,
                this.agentId,
                memoryItem.type,
                JSON.stringify(memoryItem.content),
                JSON.stringify(memoryItem.metadata)
            ], (err) => {
                if (err) reject(err);
                else resolve(memoryItem.id);
            });
        });
    }

    async recall(type, query) {
        if (type === 'short_term') {
            return Array.from(this.shortTerm.values()).filter(item => 
                JSON.stringify(item).toLowerCase().includes(query.toLowerCase())
            );
        } else if (type === 'working') {
            return Array.from(this.workingMemory.values()).filter(item =>
                JSON.stringify(item).toLowerCase().includes(query.toLowerCase())
            );
        } else {
            // Query long-term memory from database
            return await this.recallLongTermMemory(query);
        }
    }

    async recallLongTermMemory(query) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM agent_memory WHERE agent_id = ? AND (content LIKE ? OR metadata LIKE ?) ORDER BY created_at DESC LIMIT 10`;
            db.all(sql, [this.agentId, `%${query}%`, `%${query}%`], (err, rows) => {
                if (err) reject(err);
                else resolve(rows.map(row => ({
                    ...row,
                    content: JSON.parse(row.content),
                    metadata: JSON.parse(row.metadata)
                })));
            });
        });
    }

    clearWorking() {
        this.workingMemory.clear();
    }

    clearShortTerm() {
        this.shortTerm.clear();
    }
}

class AgentPromptSystem {
    constructor(agentConfig) {
        this.systemPrompt = agentConfig.systemPrompt || "You are a helpful AI assistant.";
        this.taskPrompts = agentConfig.taskPrompts || {};
        this.contextWindow = agentConfig.contextWindow || 4000;
        this.temperature = agentConfig.temperature || 0.7;
        this.maxTokens = agentConfig.maxTokens || 1000;
    }

    buildPrompt(task, memory, context = {}) {
        let prompt = this.systemPrompt + "\n\n";

        // Add relevant memories
        if (memory.length > 0) {
            prompt += "RELEVANT MEMORIES:\n";
            memory.forEach(mem => {
                prompt += `- ${JSON.stringify(mem.content)}\n`;
            });
            prompt += "\n";
        }

        // Add context if provided
        if (Object.keys(context).length > 0) {
            prompt += "CONTEXT:\n";
            Object.entries(context).forEach(([key, value]) => {
                prompt += `${key}: ${value}\n`;
            });
            prompt += "\n";
        }

        // Add task-specific prompt
        const taskType = task.task_type || 'general';
        if (this.taskPrompts[taskType]) {
            prompt += this.taskPrompts[taskType] + "\n\n";
        }

        // Add the main task
        prompt += "TASK:\n" + task.prompt;

        return prompt;
    }

    updateSystemPrompt(newPrompt) {
        this.systemPrompt = newPrompt;
    }

    addTaskPrompt(taskType, prompt) {
        this.taskPrompts[taskType] = prompt;
    }
}

class AIAgent {
    constructor(id, config) {
        this.id = id;
        this.name = config.name;
        this.type = config.type;
        this.config = config;
        this.memory = new AgentMemory(id);
        this.promptSystem = new AgentPromptSystem(config);
        this.status = 'inactive';
        this.currentTask = null;
        this.performance = {
            tasksCompleted: 0,
            successRate: 0,
            averageResponseTime: 0
        };
    }

    async executeTask(task) {
        try {
            this.status = 'active';
            this.currentTask = task;

            // Store task in working memory
            await this.memory.store('working', {
                taskId: task.id,
                prompt: task.prompt,
                startTime: new Date().toISOString()
            });

            // Recall relevant memories
            const relevantMemories = await this.memory.recall('long_term', task.prompt);

            // Build prompt
            const fullPrompt = this.promptSystem.buildPrompt(task, relevantMemories);

            // Simulate AI processing (in real implementation, this would call an LLM)
            const result = await this.processTask(fullPrompt, task);

            // Store result in memory
            await this.memory.store('long_term', {
                taskId: task.id,
                prompt: task.prompt,
                result: result,
                completedAt: new Date().toISOString()
            }, { taskType: task.task_type });

            // Update performance metrics
            this.performance.tasksCompleted++;
            this.updateTaskStatus(task.id, 'completed', result);

            this.status = 'idle';
            this.currentTask = null;

            return result;

        } catch (error) {
            logger.error(`Agent ${this.id} task execution failed:`, error);
            this.updateTaskStatus(task.id, 'failed', error.message);
            this.status = 'idle';
            this.currentTask = null;
            throw error;
        }
    }

    async processTask(prompt, task) {
        // This is a placeholder for actual LLM integration
        // In production, this would call OpenAI, Claude, or other LLM APIs
        
        const taskType = task.task_type;
        let result = "";

        switch (taskType) {
            case 'text_generation':
                result = `Generated text response for: ${task.prompt}`;
                break;
            case 'data_analysis':
                result = `Analysis complete for: ${task.prompt}`;
                break;
            case 'code_generation':
                result = `// Generated code for: ${task.prompt}\nfunction generatedFunction() {\n    return "Hello World";\n}`;
                break;
            case 'translation':
                result = `Translated text: ${task.prompt}`;
                break;
            default:
                result = `Task completed: ${task.prompt}`;
        }

        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));

        return result;
    }

    updateTaskStatus(taskId, status, result = null) {
        const query = `UPDATE tasks SET status = ?, result = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?`;
        db.run(query, [status, result, taskId], (err) => {
            if (err) logger.error('Error updating task status:', err);
        });
    }

    getStatus() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            status: this.status,
            currentTask: this.currentTask,
            performance: this.performance,
            memoryStats: {
                shortTerm: this.memory.shortTerm.size,
                working: this.memory.workingMemory.size
            }
        };
    }
}

// Agent Manager
class AgentManager {
    constructor() {
        this.agents = new Map();
        this.taskQueue = [];
        this.isProcessing = false;
    }

    async createAgent(config) {
        const agentId = uuidv4();
        const agent = new AIAgent(agentId, config);

        // Store agent in database
        const query = `INSERT INTO agents (id, name, type, owner_id, config) VALUES (?, ?, ?, ?, ?)`;
        await new Promise((resolve, reject) => {
            db.run(query, [agentId, config.name, config.type, config.ownerId, JSON.stringify(config)], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        this.agents.set(agentId, agent);
        logger.info(`Agent created: ${agentId} (${config.name})`);

        return agentId;
    }

    getAgent(agentId) {
        return this.agents.get(agentId);
    }

    async loadAgent(agentId) {
        if (this.agents.has(agentId)) {
            return this.agents.get(agentId);
        }

        // Load from database
        const query = `SELECT * FROM agents WHERE id = ?`;
        const row = await new Promise((resolve, reject) => {
            db.get(query, [agentId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (row) {
            const config = JSON.parse(row.config);
            const agent = new AIAgent(agentId, config);
            this.agents.set(agentId, agent);
            return agent;
        }

        return null;
    }

    async submitTask(agentId, task) {
        const taskId = uuidv4();
        const taskData = {
            id: taskId,
            agent_id: agentId,
            task_type: task.type || 'general',
            prompt: task.prompt,
            priority: task.priority || 1
        };

        // Store task in database
        const query = `INSERT INTO tasks (id, agent_id, task_type, prompt, priority) VALUES (?, ?, ?, ?, ?)`;
        await new Promise((resolve, reject) => {
            db.run(query, [taskData.id, taskData.agent_id, taskData.task_type, taskData.prompt, taskData.priority], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // Add to processing queue
        this.taskQueue.push(taskData);
        this.taskQueue.sort((a, b) => b.priority - a.priority); // Higher priority first

        if (!this.isProcessing) {
            this.processTaskQueue();
        }

        return taskId;
    }

    async processTaskQueue() {
        if (this.taskQueue.length === 0) {
            this.isProcessing = false;
            return;
        }

        this.isProcessing = true;
        const task = this.taskQueue.shift();

        try {
            const agent = await this.loadAgent(task.agent_id);
            if (agent) {
                await agent.executeTask(task);
            } else {
                logger.error(`Agent not found: ${task.agent_id}`);
            }
        } catch (error) {
            logger.error('Task processing error:', error);
        }

        // Process next task
        setTimeout(() => this.processTaskQueue(), 100);
    }

    getAllAgents() {
        return Array.from(this.agents.values()).map(agent => agent.getStatus());
    }

    async deleteAgent(agentId) {
        this.agents.delete(agentId);
        
        // Delete from database
        const query = `DELETE FROM agents WHERE id = ?`;
        await new Promise((resolve, reject) => {
            db.run(query, [agentId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
}

const agentManager = new AgentManager();

// Create default agent templates
const createDefaultTemplates = () => {
    const templates = [
        {
            id: uuidv4(),
            name: "General Assistant",
            description: "A versatile AI assistant for general tasks",
            category: "general",
            template_config: JSON.stringify({
                systemPrompt: "You are a helpful AI assistant. Provide accurate and concise responses.",
                taskPrompts: {
                    "question_answer": "Answer the following question accurately and concisely:",
                    "text_generation": "Generate text based on the following prompt:",
                    "summarization": "Summarize the following content:"
                },
                temperature: 0.7,
                maxTokens: 1000
            })
        },
        {
            id: uuidv4(),
            name: "Data Analyst",
            description: "Specialized in data analysis and insights",
            category: "analytics",
            template_config: JSON.stringify({
                systemPrompt: "You are a data analyst AI. Provide detailed analysis and insights from data.",
                taskPrompts: {
                    "data_analysis": "Analyze the following data and provide insights:",
                    "trend_analysis": "Identify trends in the following data:",
                    "statistical_summary": "Provide a statistical summary of:"
                },
                temperature: 0.3,
                maxTokens: 1500
            })
        },
        {
            id: uuidv4(),
            name: "Code Assistant",
            description: "Helps with programming and code generation",
            category: "development",
            template_config: JSON.stringify({
                systemPrompt: "You are a programming assistant. Write clean, efficient, and well-commented code.",
                taskPrompts: {
                    "code_generation": "Generate code for the following requirement:",
                    "code_review": "Review and improve the following code:",
                    "debugging": "Help debug the following code:"
                },
                temperature: 0.2,
                maxTokens: 2000
            })
        },
        {
            id: uuidv4(),
            name: "Creative Writer",
            description: "Specializes in creative writing and content creation",
            category: "creative",
            template_config: JSON.stringify({
                systemPrompt: "You are a creative writer. Produce engaging, original, and well-structured content.",
                taskPrompts: {
                    "story_writing": "Write a creative story based on:",
                    "copywriting": "Create compelling copy for:",
                    "content_creation": "Generate creative content for:"
                },
                temperature: 0.9,
                maxTokens: 2000
            })
        }
    ];

    templates.forEach(template => {
        const query = `INSERT OR IGNORE INTO agent_templates (id, name, description, category, template_config) VALUES (?, ?, ?, ?, ?)`;
        db.run(query, [template.id, template.name, template.description, template.category, template.template_config], (err) => {
            if (err) logger.error('Error creating template:', err);
        });
    });
};

// Initialize templates
setTimeout(createDefaultTemplates, 1000);

// MCP Protocol Implementation
class MCPServer {
    constructor(agentManager) {
        this.agentManager = agentManager;
        this.clients = new Set();
    }

    async handleRequest(request, client) {
        const { method, params, id } = request;

        try {
            let result;

            switch (method) {
                case 'initialize':
                    result = await this.initialize(params);
                    break;
                case 'tools/list':
                    result = await this.listTools();
                    break;
                case 'tools/call':
                    result = await this.callTool(params);
                    break;
                case 'resources/list':
                    result = await this.listResources();
                    break;
                case 'resources/read':
                    result = await this.readResource(params);
                    break;
                case 'prompts/list':
                    result = await this.listPrompts();
                    break;
                case 'prompts/get':
                    result = await this.getPrompt(params);
                    break;
                default:
                    throw new Error(`Unknown method: ${method}`);
            }

            return {
                jsonrpc: "2.0",
                id,
                result
            };

        } catch (error) {
            return {
                jsonrpc: "2.0",
                id,
                error: {
                    code: -32603,
                    message: error.message
                }
            };
        }
    }

    async initialize(params) {
        return {
            protocolVersion: "2024-11-05",
            capabilities: {
                tools: {},
                resources: {},
                prompts: {}
            },
            serverInfo: {
                name: "AgentChains MCP Server",
                version: "1.0.0"
            }
        };
    }

    async listTools() {
        return {
            tools: [
                {
                    name: "create_agent",
                    description: "Create a new AI agent",
                    inputSchema: {
                        type: "object",
                        properties: {
                            name: { type: "string" },
                            type: { type: "string" },
                            systemPrompt: { type: "string" },
                            ownerId: { type: "string" }
                        },
                        required: ["name", "type", "ownerId"]
                    }
                },
                {
                    name: "submit_task",
                    description: "Submit a task to an AI agent",
                    inputSchema: {
                        type: "object",
                        properties: {
                            agentId: { type: "string" },
                            prompt: { type: "string" },
                            type: { type: "string" },
                            priority: { type: "number" }
                        },
                        required: ["agentId", "prompt"]
                    }
                },
                {
                    name: "get_agent_status",
                    description: "Get the status of an AI agent",
                    inputSchema: {
                        type: "object",
                        properties: {
                            agentId: { type: "string" }
                        },
                        required: ["agentId"]
                    }
                },
                {
                    name: "list_agents",
                    description: "List all available AI agents",
                    inputSchema: {
                        type: "object",
                        properties: {}
                    }
                }
            ]
        };
    }

    async callTool(params) {
        const { name, arguments: args } = params;

        switch (name) {
            case 'create_agent':
                const agentId = await this.agentManager.createAgent(args);
                return { agentId, message: "Agent created successfully" };

            case 'submit_task':
                const taskId = await this.agentManager.submitTask(args.agentId, args);
                return { taskId, message: "Task submitted successfully" };

            case 'get_agent_status':
                const agent = await this.agentManager.loadAgent(args.agentId);
                if (!agent) throw new Error("Agent not found");
                return agent.getStatus();

            case 'list_agents':
                return { agents: this.agentManager.getAllAgents() };

            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }

    async listResources() {
        return {
            resources: [
                {
                    uri: "agentchains://templates",
                    name: "Agent Templates",
                    description: "Available agent templates"
                },
                {
                    uri: "agentchains://agents",
                    name: "Active Agents",
                    description: "Currently active agents"
                },
                {
                    uri: "agentchains://tasks",
                    name: "Task Queue",
                    description: "Current task queue status"
                }
            ]
        };
    }

    async readResource(params) {
        const { uri } = params;

        if (uri === "agentchains://templates") {
            const templates = await new Promise((resolve, reject) => {
                db.all("SELECT * FROM agent_templates", (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
            return { contents: templates };
        }

        if (uri === "agentchains://agents") {
            return { contents: this.agentManager.getAllAgents() };
        }

        if (uri === "agentchains://tasks") {
            const tasks = await new Promise((resolve, reject) => {
                db.all("SELECT * FROM tasks WHERE status = 'pending' ORDER BY priority DESC LIMIT 10", (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
            return { contents: tasks };
        }

        throw new Error(`Unknown resource: ${uri}`);
    }

    async listPrompts() {
        return {
            prompts: [
                {
                    name: "create_agent_prompt",
                    description: "Prompt for creating a new AI agent"
                },
                {
                    name: "task_execution_prompt", 
                    description: "Prompt for executing tasks"
                }
            ]
        };
    }

    async getPrompt(params) {
        const { name } = params;

        if (name === "create_agent_prompt") {
            return {
                messages: [
                    {
                        role: "user",
                        content: {
                            type: "text",
                            text: "Create a new AI agent with the following specifications: name, type, and system prompt."
                        }
                    }
                ]
            };
        }

        throw new Error(`Unknown prompt: ${name}`);
    }
}

const mcpServer = new MCPServer(agentManager);

// REST API Endpoints
app.get('/api/agents', async (req, res) => {
    try {
        const agents = agentManager.getAllAgents();
        res.json({ success: true, agents });
    } catch (error) {
        logger.error('Error listing agents:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/agents', async (req, res) => {
    try {
        const { name, type, systemPrompt, ownerId } = req.body;
        const agentId = await agentManager.createAgent({
            name,
            type,
            systemPrompt: systemPrompt || "You are a helpful AI assistant.",
            ownerId: ownerId || 'anonymous'
        });
        res.json({ success: true, agentId });
    } catch (error) {
        logger.error('Error creating agent:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/agents/:id', async (req, res) => {
    try {
        const agent = await agentManager.loadAgent(req.params.id);
        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }
        res.json({ success: true, agent: agent.getStatus() });
    } catch (error) {
        logger.error('Error getting agent:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/agents/:id/tasks', async (req, res) => {
    try {
        const { prompt, type, priority } = req.body;
        const taskId = await agentManager.submitTask(req.params.id, {
            prompt,
            type: type || 'general',
            priority: priority || 1
        });
        res.json({ success: true, taskId });
    } catch (error) {
        logger.error('Error submitting task:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/templates', async (req, res) => {
    try {
        const templates = await new Promise((resolve, reject) => {
            db.all("SELECT * FROM agent_templates", (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        res.json({ success: true, templates });
    } catch (error) {
        logger.error('Error listing templates:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/tasks/:agentId', async (req, res) => {
    try {
        const tasks = await new Promise((resolve, reject) => {
            const query = "SELECT * FROM tasks WHERE agent_id = ? ORDER BY created_at DESC LIMIT 20";
            db.all(query, [req.params.agentId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        res.json({ success: true, tasks });
    } catch (error) {
        logger.error('Error getting tasks:', error);
        res.status(500).json({ error: error.message });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        agents: agentManager.agents.size,
        uptime: process.uptime()
    });
});

// WebSocket server for MCP
const server = app.listen(port, () => {
    logger.info(`AgentChains MCP Server running on port ${port}`);
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    logger.info('New MCP client connected');
    mcpServer.clients.add(ws);

    ws.on('message', async (data) => {
        try {
            const request = JSON.parse(data.toString());
            const response = await mcpServer.handleRequest(request, ws);
            ws.send(JSON.stringify(response));
        } catch (error) {
            logger.error('WebSocket message error:', error);
            ws.send(JSON.stringify({
                jsonrpc: "2.0",
                id: null,
                error: { code: -32700, message: "Parse error" }
            }));
        }
    });

    ws.on('close', () => {
        logger.info('MCP client disconnected');
        mcpServer.clients.delete(ws);
    });
});

// Cleanup functions
process.on('SIGINT', () => {
    logger.info('Shutting down gracefully...');
    wss.close();
    db.close();
    process.exit(0);
});

// Periodic cleanup task
cron.schedule('0 */6 * * *', () => {
    // Clean up old sessions and memory
    db.run('DELETE FROM agent_sessions WHERE expires_at < datetime("now")', (err) => {
        if (err) logger.error('Cleanup error:', err);
        else logger.info('Cleaned up expired sessions');
    });
});

module.exports = { app, agentManager, mcpServer };