/**
 * AgentChains Agent Builder
 * Interactive AI agent creation and management interface
 */

class AgentBuilder {
    constructor() {
        this.currentAgent = null;
        this.currentStep = 1;
        this.mcpServerUrl = 'ws://localhost:3001';
        this.mcpConnection = null;
        this.systemPromptEditor = null;
        
        this.templates = {
            general: {
                name: "General Assistant",
                systemPrompt: "You are a helpful AI assistant. Provide accurate, helpful, and concise responses to user queries. Always be polite and professional.",
                taskPrompts: {
                    "question_answer": "Please answer the following question accurately and thoroughly:",
                    "text_generation": "Generate text based on the following prompt:",
                    "summarization": "Summarize the following content concisely:"
                },
                capabilities: ["text_generation", "summarization"],
                temperature: 0.7
            },
            analyst: {
                name: "Data Analyst",
                systemPrompt: "You are a specialized data analyst AI. Analyze data, identify patterns, trends, and provide actionable insights. Use statistical methods and clear visualizations when appropriate.",
                taskPrompts: {
                    "data_analysis": "Analyze the following data and provide detailed insights:",
                    "trend_analysis": "Identify and explain trends in the following data:",
                    "statistical_summary": "Provide a comprehensive statistical summary of:"
                },
                capabilities: ["data_analysis", "text_generation"],
                temperature: 0.3
            },
            developer: {
                name: "Code Assistant",
                systemPrompt: "You are a programming assistant. Write clean, efficient, well-documented code. Follow best practices and provide explanations for complex logic. Always consider security and performance.",
                taskPrompts: {
                    "code_generation": "Generate code for the following requirement:",
                    "code_review": "Review and improve the following code:",
                    "debugging": "Help debug and fix the following code:"
                },
                capabilities: ["code_generation", "text_generation"],
                temperature: 0.2
            },
            creative: {
                name: "Creative Writer",
                systemPrompt: "You are a creative writing specialist. Produce engaging, original content with strong narrative elements. Adapt your style to match the requested tone and genre.",
                taskPrompts: {
                    "story_writing": "Write a creative story based on the following prompt:",
                    "copywriting": "Create compelling marketing copy for:",
                    "content_creation": "Generate creative content for:"
                },
                capabilities: ["creative_writing", "text_generation"],
                temperature: 0.9
            }
        };
        
        this.init();
    }
    
    async init() {
        this.setupEventListeners();
        this.setupMonacoEditor();
        this.loadDefaultTemplate();
        await this.connectMCP();
        this.updateUI();
    }
    
    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabId = e.target.getAttribute('data-tab');
                this.switchTab(tabId);
            });
        });
        
        // Template selection
        document.querySelectorAll('.template-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const template = e.currentTarget.getAttribute('data-template');
                this.loadTemplate(template);
            });
        });
        
        // Form inputs
        document.getElementById('agentName').addEventListener('input', this.updateAgentConfig.bind(this));
        document.getElementById('agentType').addEventListener('change', this.updateAgentConfig.bind(this));
        document.getElementById('agentDescription').addEventListener('input', this.updateAgentConfig.bind(this));
        document.getElementById('temperature').addEventListener('input', this.updateTemperature.bind(this));
        document.getElementById('maxTokens').addEventListener('input', this.updateAgentConfig.bind(this));
        document.getElementById('contextWindow').addEventListener('input', this.updateAgentConfig.bind(this));
        document.getElementById('priority').addEventListener('change', this.updateAgentConfig.bind(this));
        
        // Memory settings
        document.getElementById('enableShortTerm').addEventListener('change', this.updateMemoryConfig.bind(this));
        document.getElementById('enableLongTerm').addEventListener('change', this.updateMemoryConfig.bind(this));
        document.getElementById('enableWorking').addEventListener('change', this.updateMemoryConfig.bind(this));
        document.getElementById('memoryCapacity').addEventListener('change', this.updateMemoryConfig.bind(this));
        document.getElementById('memoryRetention').addEventListener('change', this.updateMemoryConfig.bind(this));
        
        // Capabilities
        document.querySelectorAll('input[name="capabilities"]').forEach(checkbox => {
            checkbox.addEventListener('change', this.updateCapabilities.bind(this));
        });
        
        // Task prompts
        document.getElementById('addPrompt').addEventListener('click', this.addTaskPrompt.bind(this));
        
        // Actions
        document.getElementById('saveAgent').addEventListener('click', this.saveAgent.bind(this));
        document.getElementById('deployAgent').addEventListener('click', this.showDeployModal.bind(this));
        document.getElementById('sendTest').addEventListener('click', this.testAgent.bind(this));
        document.getElementById('clearTest').addEventListener('click', this.clearTest.bind(this));
        
        // Modal
        document.querySelector('.modal-close').addEventListener('click', this.closeModal.bind(this));
        document.getElementById('prevStep').addEventListener('click', this.prevDeployStep.bind(this));
        document.getElementById('nextStep').addEventListener('click', this.nextDeployStep.bind(this));
        
        // Deployment options
        document.querySelectorAll('.deploy-option').forEach(option => {
            option.addEventListener('click', (e) => {
                document.querySelectorAll('.deploy-option').forEach(o => o.classList.remove('selected'));
                e.currentTarget.classList.add('selected');
            });
        });
    }
    
    async setupMonacoEditor() {
        require.config({ paths: { 'vs': 'https://unpkg.com/monaco-editor@0.44.0/min/vs' }});
        
        require(['vs/editor/editor.main'], () => {
            this.systemPromptEditor = monaco.editor.create(
                document.getElementById('systemPromptEditor'),
                {
                    value: this.templates.general.systemPrompt,
                    language: 'markdown',
                    theme: 'vs-dark',
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    lineNumbers: 'off',
                    glyphMargin: false,
                    folding: false,
                    lineDecorationsWidth: 0,
                    lineNumbersMinChars: 0
                }
            );
            
            this.systemPromptEditor.onDidChangeModelContent(() => {
                this.updateAgentConfig();
            });
        });
    }
    
    async connectMCP() {
        try {
            this.mcpConnection = new WebSocket(this.mcpServerUrl);
            
            this.mcpConnection.onopen = () => {
                console.log('Connected to MCP server');
                this.sendMCPRequest('initialize', {
                    protocolVersion: "2024-11-05",
                    clientInfo: {
                        name: "AgentChains Builder",
                        version: "1.0.0"
                    }
                });
            };
            
            this.mcpConnection.onmessage = (event) => {
                const response = JSON.parse(event.data);
                console.log('MCP Response:', response);
                this.handleMCPResponse(response);
            };
            
            this.mcpConnection.onerror = (error) => {
                console.error('MCP connection error:', error);
                this.showNotification('MCP server connection failed. Running in offline mode.', 'warning');
            };
            
            this.mcpConnection.onclose = () => {
                console.log('MCP connection closed');
                // Attempt reconnection after 5 seconds
                setTimeout(() => this.connectMCP(), 5000);
            };
            
        } catch (error) {
            console.error('Failed to connect to MCP server:', error);
            this.showNotification('MCP server unavailable. Running in offline mode.', 'warning');
        }
    }
    
    sendMCPRequest(method, params, id = null) {
        if (!this.mcpConnection || this.mcpConnection.readyState !== WebSocket.OPEN) {
            console.warn('MCP connection not available');
            return;
        }
        
        const request = {
            jsonrpc: "2.0",
            method: method,
            params: params,
            id: id || Date.now()
        };
        
        this.mcpConnection.send(JSON.stringify(request));
        return request.id;
    }
    
    handleMCPResponse(response) {
        if (response.method === 'initialize') {
            console.log('MCP server initialized');
        } else if (response.result && response.result.agentId) {
            this.currentAgent = { id: response.result.agentId };
            this.updateAgentStatus();
            this.showNotification('Agent deployed successfully!', 'success');
        }
    }
    
    switchTab(tabId) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
        });
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === tabId + 'Tab');
        });
    }
    
    loadTemplate(templateId) {
        const template = this.templates[templateId];
        if (!template) return;
        
        // Update active template
        document.querySelectorAll('.template-item').forEach(item => {
            item.classList.toggle('active', item.getAttribute('data-template') === templateId);
        });
        
        // Update form fields
        document.getElementById('agentName').value = template.name;
        document.getElementById('agentType').value = templateId;
        document.getElementById('temperature').value = template.temperature;
        document.getElementById('temperatureValue').textContent = template.temperature;
        
        // Update system prompt in editor
        if (this.systemPromptEditor) {
            this.systemPromptEditor.setValue(template.systemPrompt);
        }
        
        // Update capabilities
        document.querySelectorAll('input[name="capabilities"]').forEach(checkbox => {
            checkbox.checked = template.capabilities.includes(checkbox.value);
        });
        
        // Update task prompts
        this.loadTaskPrompts(template.taskPrompts);
        
        this.updateAgentConfig();
    }
    
    loadDefaultTemplate() {
        this.loadTemplate('general');
    }
    
    loadTaskPrompts(taskPrompts) {
        const container = document.getElementById('taskPrompts');
        container.innerHTML = '';
        
        Object.entries(taskPrompts).forEach(([taskType, prompt]) => {
            this.addTaskPromptItem(taskType, prompt);
        });
        
        if (Object.keys(taskPrompts).length === 0) {
            this.addTaskPromptItem('', '');
        }
    }
    
    addTaskPrompt() {
        this.addTaskPromptItem('', '');
    }
    
    addTaskPromptItem(taskType = '', prompt = '') {
        const container = document.getElementById('taskPrompts');
        const item = document.createElement('div');
        item.className = 'task-prompt-item fade-in';
        
        item.innerHTML = `
            <div class="prompt-header">
                <input type="text" placeholder="Task type (e.g., question_answer)" class="task-type" value="${taskType}">
                <button class="btn btn-small btn-danger remove-prompt" type="button">×</button>
            </div>
            <textarea placeholder="Prompt template for this task type..." class="prompt-template" rows="2">${prompt}</textarea>
        `;
        
        // Add event listeners
        item.querySelector('.remove-prompt').addEventListener('click', () => {
            item.remove();
            this.updateAgentConfig();
        });
        
        item.querySelector('.task-type').addEventListener('input', this.updateAgentConfig.bind(this));
        item.querySelector('.prompt-template').addEventListener('input', this.updateAgentConfig.bind(this));
        
        container.appendChild(item);
    }
    
    updateAgentConfig() {
        // Get current configuration
        const config = this.getCurrentConfig();
        
        // Update memory preview (placeholder)
        this.updateMemoryPreview(config);
    }
    
    getCurrentConfig() {
        const taskPrompts = {};
        document.querySelectorAll('.task-prompt-item').forEach(item => {
            const taskType = item.querySelector('.task-type').value.trim();
            const prompt = item.querySelector('.prompt-template').value.trim();
            if (taskType && prompt) {
                taskPrompts[taskType] = prompt;
            }
        });
        
        const capabilities = [];
        document.querySelectorAll('input[name="capabilities"]:checked').forEach(checkbox => {
            capabilities.push(checkbox.value);
        });
        
        return {
            name: document.getElementById('agentName').value,
            type: document.getElementById('agentType').value,
            description: document.getElementById('agentDescription').value,
            systemPrompt: this.systemPromptEditor ? this.systemPromptEditor.getValue() : '',
            taskPrompts: taskPrompts,
            temperature: parseFloat(document.getElementById('temperature').value),
            maxTokens: parseInt(document.getElementById('maxTokens').value),
            contextWindow: parseInt(document.getElementById('contextWindow').value),
            priority: parseInt(document.getElementById('priority').value),
            capabilities: capabilities,
            memory: {
                enableShortTerm: document.getElementById('enableShortTerm').checked,
                enableLongTerm: document.getElementById('enableLongTerm').checked,
                enableWorking: document.getElementById('enableWorking').checked,
                capacity: document.getElementById('memoryCapacity').value,
                retention: document.getElementById('memoryRetention').value
            }
        };
    }
    
    updateTemperature() {
        const value = document.getElementById('temperature').value;
        document.getElementById('temperatureValue').textContent = value;
        this.updateAgentConfig();
    }
    
    updateMemoryConfig() {
        this.updateAgentConfig();
    }
    
    updateCapabilities() {
        this.updateAgentConfig();
    }
    
    updateMemoryPreview(config) {
        // This would show actual memory items in a real implementation
        const container = document.getElementById('memoryItems');
        
        if (!this.currentAgent) {
            container.innerHTML = `
                <div class="memory-item">
                    <div class="memory-type-badge short-term">Short Term</div>
                    <div class="memory-content">No memories yet - deploy agent to see memory in action</div>
                    <div class="memory-timestamp">--</div>
                </div>
            `;
        }
    }
    
    updateAgentStatus() {
        const statusValue = document.getElementById('agentStatusValue');
        const tasksValue = document.getElementById('agentTasks');
        const memoryValue = document.getElementById('agentMemory');
        
        if (this.currentAgent) {
            statusValue.textContent = 'Deployed';
            statusValue.style.color = 'var(--accent-color)';
            // These would be updated from real agent status
            tasksValue.textContent = '0';
            memoryValue.textContent = '0 items';
        } else {
            statusValue.textContent = 'Not Deployed';
            statusValue.style.color = 'var(--text-muted)';
            tasksValue.textContent = '0';
            memoryValue.textContent = '0 items';
        }
    }
    
    async saveAgent() {
        const config = this.getCurrentConfig();
        
        try {
            // Save to localStorage as backup
            localStorage.setItem('agentchains-agent-config', JSON.stringify(config));
            
            this.showNotification('Agent configuration saved locally', 'success');
            
        } catch (error) {
            console.error('Error saving agent:', error);
            this.showNotification('Error saving agent configuration', 'error');
        }
    }
    
    showDeployModal() {
        const modal = document.getElementById('deployModal');
        modal.classList.add('show');
        
        this.currentStep = 1;
        this.updateDeployStep();
        this.updateConfigSummary();
    }
    
    closeModal() {
        document.getElementById('deployModal').classList.remove('show');
    }
    
    prevDeployStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateDeployStep();
        }
    }
    
    nextDeployStep() {
        if (this.currentStep < 3) {
            this.currentStep++;
            this.updateDeployStep();
        } else {
            // Deploy agent
            this.deployAgent();
        }
    }
    
    updateDeployStep() {
        // Update step visibility
        document.querySelectorAll('.deploy-step').forEach(step => {
            step.classList.toggle('active', 
                parseInt(step.getAttribute('data-step')) === this.currentStep
            );
        });
        
        // Update button text
        const nextBtn = document.getElementById('nextStep');
        const prevBtn = document.getElementById('prevStep');
        
        prevBtn.style.display = this.currentStep === 1 ? 'none' : 'block';
        nextBtn.textContent = this.currentStep === 3 ? 'Deploy' : 'Next';
    }
    
    updateConfigSummary() {
        const config = this.getCurrentConfig();
        const summary = document.getElementById('configSummary');
        
        summary.textContent = JSON.stringify({
            name: config.name,
            type: config.type,
            capabilities: config.capabilities,
            temperature: config.temperature,
            maxTokens: config.maxTokens,
            memory: config.memory
        }, null, 2);
    }
    
    async deployAgent() {
        const config = this.getCurrentConfig();
        const selectedOption = document.querySelector('.deploy-option.selected');
        const deploymentType = selectedOption ? selectedOption.getAttribute('data-option') : 'local';
        
        try {
            document.getElementById('deployStatus').textContent = 'Deploying agent...';
            
            // Animate progress
            this.animateProgress();
            
            if (deploymentType === 'local' && this.mcpConnection) {
                // Deploy to local MCP server
                const requestId = this.sendMCPRequest('tools/call', {
                    name: 'create_agent',
                    arguments: {
                        name: config.name,
                        type: config.type,
                        systemPrompt: config.systemPrompt,
                        ownerId: 'builder-user'
                    }
                });
                
                // Wait for response (in real implementation, this would be handled by the response handler)
                setTimeout(() => {
                    this.currentAgent = { id: 'agent-' + Date.now() };
                    this.updateAgentStatus();
                    this.closeModal();
                    this.showNotification('Agent deployed successfully to local server!', 'success');
                }, 3000);
                
            } else {
                // Simulate cloud deployment
                setTimeout(() => {
                    this.currentAgent = { id: 'agent-' + Date.now() };
                    this.updateAgentStatus();
                    this.closeModal();
                    this.showNotification('Agent deployed successfully to cloud!', 'success');
                }, 3000);
            }
            
        } catch (error) {
            console.error('Deployment error:', error);
            document.getElementById('deployStatus').textContent = 'Deployment failed';
            this.showNotification('Deployment failed: ' + error.message, 'error');
        }
    }
    
    animateProgress() {
        const progressBar = document.getElementById('deployProgress');
        let progress = 0;
        
        const interval = setInterval(() => {
            progress += Math.random() * 20;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                document.getElementById('deployStatus').textContent = 'Deployment complete!';
            } else {
                document.getElementById('deployStatus').textContent = `Deploying... ${Math.round(progress)}%`;
            }
            progressBar.style.width = progress + '%';
        }, 200);
    }
    
    async testAgent() {
        const prompt = document.getElementById('testPrompt').value.trim();
        if (!prompt) {
            this.showNotification('Please enter a test prompt', 'warning');
            return;
        }
        
        const output = document.getElementById('testOutput');
        const responseTime = document.getElementById('responseTime');
        const sendBtn = document.getElementById('sendTest');
        
        try {
            sendBtn.disabled = true;
            sendBtn.textContent = 'Sending...';
            output.innerHTML = '<div class="loading">Processing...</div>';
            
            const startTime = Date.now();
            
            if (this.currentAgent && this.mcpConnection) {
                // Send to actual agent via MCP
                this.sendMCPRequest('tools/call', {
                    name: 'submit_task',
                    arguments: {
                        agentId: this.currentAgent.id,
                        prompt: prompt,
                        type: 'test',
                        priority: 1
                    }
                });
                
                // Simulate response (in real implementation, this would come from MCP response)
                setTimeout(() => {
                    const endTime = Date.now();
                    const duration = endTime - startTime;
                    
                    responseTime.textContent = `${duration}ms`;
                    output.innerHTML = this.generateTestResponse(prompt);
                    
                    sendBtn.disabled = false;
                    sendBtn.textContent = 'Send';
                }, 2000);
                
            } else {
                // Simulate local response
                setTimeout(() => {
                    const endTime = Date.now();
                    const duration = endTime - startTime;
                    
                    responseTime.textContent = `${duration}ms`;
                    output.innerHTML = this.generateTestResponse(prompt);
                    
                    sendBtn.disabled = false;
                    sendBtn.textContent = 'Send';
                }, 1500);
            }
            
        } catch (error) {
            console.error('Test error:', error);
            output.innerHTML = `<div style="color: var(--danger-color);">Error: ${error.message}</div>`;
            sendBtn.disabled = false;
            sendBtn.textContent = 'Send';
        }
    }
    
    generateTestResponse(prompt) {
        const config = this.getCurrentConfig();
        
        // Generate a response based on agent type and capabilities
        let response = "";
        
        switch (config.type) {
            case 'analyst':
                response = `Based on the query "${prompt}", here's my analysis:\n\n• Key insights identified\n• Data patterns observed\n• Recommendations for action\n\nThis is a simulated response from your Data Analyst agent.`;
                break;
            case 'developer':
                response = `Here's a code solution for "${prompt}":\n\n\`\`\`javascript\n// Generated code example\nfunction solutionFor${prompt.replace(/\s+/g, '')}() {\n    return "Implementation here";\n}\n\`\`\`\n\nThis is a simulated response from your Code Assistant agent.`;
                break;
            case 'creative':
                response = `Creative response to "${prompt}":\n\n🎨 Imagine a world where...\n\nThis is a simulated response from your Creative Writer agent with enhanced storytelling capabilities.`;
                break;
            default:
                response = `Thank you for your query: "${prompt}"\n\nI understand you're looking for assistance with this topic. Here's how I would help:\n\n1. Analyze your request\n2. Provide relevant information\n3. Offer actionable suggestions\n\nThis is a simulated response from your General Assistant agent.`;
        }
        
        return `<div style="color: var(--text-primary); line-height: 1.6;">${response.replace(/\n/g, '<br>')}</div>`;
    }
    
    clearTest() {
        document.getElementById('testPrompt').value = '';
        document.getElementById('testOutput').innerHTML = '<div class="placeholder">Agent response will appear here...</div>';
        document.getElementById('responseTime').textContent = '';
    }
    
    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Style the notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: var(--border-radius);
            color: white;
            font-weight: 500;
            z-index: 10000;
            transition: var(--transition);
            transform: translateX(100%);
        `;
        
        // Set background color based on type
        switch (type) {
            case 'success':
                notification.style.background = 'var(--accent-color)';
                break;
            case 'error':
                notification.style.background = 'var(--danger-color)';
                break;
            case 'warning':
                notification.style.background = 'var(--warning-color)';
                break;
            default:
                notification.style.background = 'var(--primary-color)';
        }
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 4 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }
    
    updateUI() {
        this.updateAgentStatus();
        
        // Load saved configuration if exists
        const savedConfig = localStorage.getItem('agentchains-agent-config');
        if (savedConfig) {
            try {
                const config = JSON.parse(savedConfig);
                this.loadConfiguration(config);
            } catch (error) {
                console.error('Error loading saved configuration:', error);
            }
        }
    }
    
    loadConfiguration(config) {
        // Load basic settings
        if (config.name) document.getElementById('agentName').value = config.name;
        if (config.type) document.getElementById('agentType').value = config.type;
        if (config.description) document.getElementById('agentDescription').value = config.description;
        if (config.temperature) {
            document.getElementById('temperature').value = config.temperature;
            document.getElementById('temperatureValue').textContent = config.temperature;
        }
        if (config.maxTokens) document.getElementById('maxTokens').value = config.maxTokens;
        if (config.contextWindow) document.getElementById('contextWindow').value = config.contextWindow;
        if (config.priority) document.getElementById('priority').value = config.priority;
        
        // Load system prompt
        if (config.systemPrompt && this.systemPromptEditor) {
            this.systemPromptEditor.setValue(config.systemPrompt);
        }
        
        // Load task prompts
        if (config.taskPrompts) {
            this.loadTaskPrompts(config.taskPrompts);
        }
        
        // Load capabilities
        if (config.capabilities) {
            document.querySelectorAll('input[name="capabilities"]').forEach(checkbox => {
                checkbox.checked = config.capabilities.includes(checkbox.value);
            });
        }
        
        // Load memory settings
        if (config.memory) {
            if (config.memory.enableShortTerm !== undefined) {
                document.getElementById('enableShortTerm').checked = config.memory.enableShortTerm;
            }
            if (config.memory.enableLongTerm !== undefined) {
                document.getElementById('enableLongTerm').checked = config.memory.enableLongTerm;
            }
            if (config.memory.enableWorking !== undefined) {
                document.getElementById('enableWorking').checked = config.memory.enableWorking;
            }
            if (config.memory.capacity) {
                document.getElementById('memoryCapacity').value = config.memory.capacity;
            }
            if (config.memory.retention) {
                document.getElementById('memoryRetention').value = config.memory.retention;
            }
        }
    }
}

// Initialize the agent builder when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const builder = new AgentBuilder();
    
    // Make it globally available for debugging
    window.agentBuilder = builder;
    
    console.log('🤖 AgentChains Agent Builder initialized');
});