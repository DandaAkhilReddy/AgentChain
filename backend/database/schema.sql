-- KAMIKAZE Token Ecosystem Database Schema
-- Created for AgentChains.ai platform

CREATE DATABASE kamikaze_ecosystem;
USE kamikaze_ecosystem;

-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    username VARCHAR(50),
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    profile_image_url VARCHAR(255),
    bio TEXT,
    total_staked DECIMAL(20, 8) DEFAULT 0,
    total_earned DECIMAL(20, 8) DEFAULT 0,
    reputation_score INT DEFAULT 0,
    INDEX idx_wallet (wallet_address),
    INDEX idx_created_at (created_at)
);

-- Tokens table (for tracking different tokens)
CREATE TABLE tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    contract_address VARCHAR(42) UNIQUE NOT NULL,
    token_name VARCHAR(50) NOT NULL,
    token_symbol VARCHAR(10) NOT NULL,
    decimals INT DEFAULT 18,
    total_supply DECIMAL(30, 8) DEFAULT 0,
    circulating_supply DECIMAL(30, 8) DEFAULT 0,
    burned_supply DECIMAL(30, 8) DEFAULT 0,
    burn_rate DECIMAL(5, 4) DEFAULT 0.02, -- 2% default
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_contract (contract_address),
    INDEX idx_symbol (token_symbol)
);

-- User balances for each token
CREATE TABLE user_balances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_id INT NOT NULL,
    balance DECIMAL(20, 8) DEFAULT 0,
    staked_balance DECIMAL(20, 8) DEFAULT 0,
    pending_rewards DECIMAL(20, 8) DEFAULT 0,
    total_earned DECIMAL(20, 8) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (token_id) REFERENCES tokens(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_token (user_id, token_id),
    INDEX idx_user_balance (user_id, token_id)
);

-- Staking pools
CREATE TABLE staking_pools (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token_id INT NOT NULL,
    pool_name VARCHAR(100) NOT NULL,
    lock_period INT NOT NULL, -- in days (0 = no lock)
    base_apy DECIMAL(5, 4) NOT NULL, -- e.g., 0.1000 for 10%
    multiplier DECIMAL(3, 2) NOT NULL, -- e.g., 1.20 for 1.2x
    min_stake DECIMAL(20, 8) DEFAULT 0,
    max_stake DECIMAL(20, 8) DEFAULT 0, -- 0 = unlimited
    total_staked DECIMAL(30, 8) DEFAULT 0,
    total_rewards_paid DECIMAL(30, 8) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (token_id) REFERENCES tokens(id) ON DELETE CASCADE,
    INDEX idx_token_pool (token_id, lock_period)
);

-- User stakes
CREATE TABLE user_stakes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    pool_id INT NOT NULL,
    amount DECIMAL(20, 8) NOT NULL,
    stake_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unlock_date TIMESTAMP NULL,
    rewards_claimed DECIMAL(20, 8) DEFAULT 0,
    last_reward_claim TIMESTAMP NULL,
    status ENUM('active', 'unstaked', 'withdrawn') DEFAULT 'active',
    transaction_hash VARCHAR(66),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (pool_id) REFERENCES staking_pools(id) ON DELETE CASCADE,
    INDEX idx_user_stakes (user_id, status),
    INDEX idx_pool_stakes (pool_id, status)
);

-- AI Agent templates
CREATE TABLE agent_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    template_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    creation_cost DECIMAL(20, 8) NOT NULL,
    staking_requirement DECIMAL(20, 8) NOT NULL,
    capabilities JSON,
    supported_apis JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_template_id (template_id),
    INDEX idx_category (category)
);

-- AI Agents (NFTs)
CREATE TABLE ai_agents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token_id INT UNIQUE NOT NULL,
    owner_id INT NOT NULL,
    template_id INT NOT NULL,
    agent_name VARCHAR(100) NOT NULL,
    contract_address VARCHAR(42),
    api_provider VARCHAR(50),
    api_endpoint VARCHAR(255),
    api_key_hash VARCHAR(64), -- hashed for security
    staked_amount DECIMAL(20, 8) DEFAULT 0,
    performance_score INT DEFAULT 50,
    tasks_completed INT DEFAULT 0,
    total_earned DECIMAL(20, 8) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES agent_templates(id) ON DELETE RESTRICT,
    INDEX idx_owner (owner_id),
    INDEX idx_template (template_id),
    INDEX idx_performance (performance_score),
    INDEX idx_active (is_active, last_active)
);

-- Task categories
CREATE TABLE task_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    base_reward DECIMAL(20, 8) DEFAULT 0,
    complexity_multiplier DECIMAL(3, 2) DEFAULT 1.0,
    is_active BOOLEAN DEFAULT TRUE
);

-- Tasks
CREATE TABLE tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id VARCHAR(100) UNIQUE NOT NULL,
    creator_id INT,
    category_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    requirements JSON,
    reward_amount DECIMAL(20, 8) NOT NULL,
    complexity ENUM('low', 'medium', 'high') DEFAULT 'medium',
    deadline TIMESTAMP NULL,
    status ENUM('pending', 'assigned', 'in_progress', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    assigned_agent_id INT NULL,
    result TEXT,
    completion_time TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES task_categories(id) ON DELETE RESTRICT,
    FOREIGN KEY (assigned_agent_id) REFERENCES ai_agents(id) ON DELETE SET NULL,
    INDEX idx_task_id (task_id),
    INDEX idx_status (status),
    INDEX idx_category (category_id),
    INDEX idx_assigned_agent (assigned_agent_id),
    INDEX idx_created_at (created_at)
);

-- Task execution logs
CREATE TABLE task_executions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL,
    agent_id INT NOT NULL,
    execution_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    execution_end TIMESTAMP NULL,
    status ENUM('started', 'processing', 'completed', 'failed') DEFAULT 'started',
    result TEXT,
    error_message TEXT,
    gas_used BIGINT,
    transaction_hash VARCHAR(66),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (agent_id) REFERENCES ai_agents(id) ON DELETE CASCADE,
    INDEX idx_task_execution (task_id, agent_id),
    INDEX idx_execution_time (execution_start)
);

-- Token transactions (burns, transfers, etc.)
CREATE TABLE token_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_hash VARCHAR(66) UNIQUE NOT NULL,
    block_number BIGINT,
    transaction_type ENUM('transfer', 'burn', 'mint', 'stake', 'unstake', 'reward') NOT NULL,
    token_id INT NOT NULL,
    from_user_id INT,
    to_user_id INT,
    amount DECIMAL(20, 8) NOT NULL,
    burn_amount DECIMAL(20, 8) DEFAULT 0,
    gas_used BIGINT,
    gas_price BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (token_id) REFERENCES tokens(id) ON DELETE RESTRICT,
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_transaction_hash (transaction_hash),
    INDEX idx_transaction_type (transaction_type),
    INDEX idx_block_number (block_number),
    INDEX idx_users (from_user_id, to_user_id),
    INDEX idx_created_at (created_at)
);

-- System statistics and metrics
CREATE TABLE system_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    stat_name VARCHAR(100) UNIQUE NOT NULL,
    stat_value DECIMAL(30, 8) DEFAULT 0,
    stat_type ENUM('counter', 'gauge', 'percentage') DEFAULT 'gauge',
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_stat_name (stat_name),
    INDEX idx_updated_at (updated_at)
);

-- API usage tracking
CREATE TABLE api_usage (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agent_id INT NOT NULL,
    api_provider VARCHAR(50) NOT NULL,
    endpoint VARCHAR(255),
    requests_count INT DEFAULT 0,
    tokens_used INT DEFAULT 0,
    cost DECIMAL(10, 4) DEFAULT 0,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES ai_agents(id) ON DELETE CASCADE,
    UNIQUE KEY unique_agent_api_date (agent_id, api_provider, date),
    INDEX idx_agent_api (agent_id, api_provider),
    INDEX idx_date (date)
);

-- Marketplace listings (for trading AI agents)
CREATE TABLE marketplace_listings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agent_id INT NOT NULL,
    seller_id INT NOT NULL,
    price DECIMAL(20, 8) NOT NULL,
    currency_token_id INT NOT NULL,
    listing_type ENUM('fixed_price', 'auction') DEFAULT 'fixed_price',
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    status ENUM('active', 'sold', 'cancelled', 'expired') DEFAULT 'active',
    buyer_id INT NULL,
    sale_price DECIMAL(20, 8) NULL,
    transaction_hash VARCHAR(66) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES ai_agents(id) ON DELETE CASCADE,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (currency_token_id) REFERENCES tokens(id) ON DELETE RESTRICT,
    INDEX idx_agent_listing (agent_id),
    INDEX idx_seller (seller_id),
    INDEX idx_status (status),
    INDEX idx_price (price),
    INDEX idx_created_at (created_at)
);

-- Insert initial data

-- Insert KAMIKAZE token
INSERT INTO tokens (contract_address, token_name, token_symbol, decimals, total_supply, circulating_supply, burn_rate) 
VALUES ('0x0000000000000000000000000000000000000000', 'KAMIKAZE Token', 'KAMIKAZE', 18, 1000000000, 1000000000, 0.02);

-- Insert staking pools
INSERT INTO staking_pools (token_id, pool_name, lock_period, base_apy, multiplier, min_stake) VALUES
(1, 'No Lock Pool', 0, 0.1000, 1.00, 100),
(1, '30 Day Lock Pool', 30, 0.1000, 1.20, 100),
(1, '90 Day Lock Pool', 90, 0.1000, 1.50, 100),
(1, '1 Year Lock Pool', 365, 0.1000, 2.00, 100);

-- Insert task categories
INSERT INTO task_categories (category_name, description, base_reward, complexity_multiplier) VALUES
('writing', 'Content creation and writing tasks', 50, 1.5),
('development', 'Code review and programming tasks', 100, 2.0),
('analytics', 'Data analysis and reporting tasks', 75, 1.8),
('marketing', 'Social media and marketing tasks', 60, 1.3),
('support', 'Customer support and communication tasks', 40, 1.2),
('translation', 'Language translation tasks', 45, 1.1);

-- Insert AI agent templates
INSERT INTO agent_templates (template_id, name, category, description, creation_cost, staking_requirement, capabilities, supported_apis) VALUES
('content-writer', 'Content Writer', 'writing', 'Creates blog posts, articles, and web content', 1000, 500, '["writing", "research", "seo"]', '["deepseek", "groq", "openai"]'),
('code-reviewer', 'Code Reviewer', 'development', 'Reviews code for bugs and improvements', 3000, 2000, '["code-review", "security", "optimization"]', '["deepseek", "groq", "openai"]'),
('social-media', 'Social Media Manager', 'marketing', 'Manages social media posts and engagement', 1000, 500, '["social-media", "content", "engagement"]', '["deepseek", "groq", "openai"]'),
('data-analyzer', 'Data Analyst', 'analytics', 'Analyzes data and generates insights', 2000, 1000, '["data-analysis", "statistics", "visualization"]', '["deepseek", "groq", "openai"]'),
('chatbot', 'Customer Support Bot', 'support', 'Handles customer inquiries and support', 1000, 500, '["customer-service", "communication", "problem-solving"]', '["deepseek", "groq", "openai"]'),
('translator', 'Language Translator', 'translation', 'Translates text between languages', 1000, 500, '["translation", "localization", "linguistics"]', '["deepseek", "groq", "openai"]'),
('copywriter', 'Copywriter', 'writing', 'Creates persuasive marketing copy', 2000, 1000, '["copywriting", "marketing", "persuasion"]', '["deepseek", "groq", "openai"]'),
('bug-finder', 'Bug Detector', 'development', 'Finds and reports software bugs', 2000, 1000, '["bug-detection", "testing", "quality-assurance"]', '["deepseek", "groq", "openai"]'),
('api-tester', 'API Tester', 'development', 'Tests API endpoints and functionality', 1000, 500, '["api-testing", "automation", "documentation"]', '["deepseek", "groq", "openai"]'),
('report-generator', 'Report Generator', 'analytics', 'Generates comprehensive reports', 1000, 500, '["reporting", "analysis", "documentation"]', '["deepseek", "groq", "openai"]'),
('trend-spotter', 'Trend Analyst', 'analytics', 'Identifies market trends and patterns', 3000, 2000, '["trend-analysis", "market-research", "prediction"]', '["deepseek", "groq", "openai"]'),
('scheduler', 'Meeting Scheduler', 'support', 'Manages calendars and schedules meetings', 500, 250, '["scheduling", "calendar-management", "coordination"]', '["deepseek", "groq", "openai"]');

-- Insert initial system stats
INSERT INTO system_stats (stat_name, stat_value, stat_type, description) VALUES
('total_users', 0, 'counter', 'Total number of registered users'),
('total_agents', 0, 'counter', 'Total number of AI agents created'),
('total_tasks', 0, 'counter', 'Total number of tasks completed'),
('total_tokens_staked', 0, 'gauge', 'Total KAMIKAZE tokens currently staked'),
('total_tokens_burned', 0, 'gauge', 'Total KAMIKAZE tokens burned'),
('total_rewards_distributed', 0, 'gauge', 'Total rewards distributed to users'),
('average_apy', 15.0, 'percentage', 'Average APY across all staking pools'),
('active_agents', 0, 'gauge', 'Number of currently active agents'),
('pending_tasks', 0, 'gauge', 'Number of pending tasks');

-- Create indexes for better performance
CREATE INDEX idx_user_balances_composite ON user_balances(user_id, token_id, balance);
CREATE INDEX idx_stakes_composite ON user_stakes(user_id, pool_id, status);
CREATE INDEX idx_agents_composite ON ai_agents(owner_id, is_active, performance_score);
CREATE INDEX idx_tasks_composite ON tasks(status, category_id, created_at);
CREATE INDEX idx_transactions_composite ON token_transactions(token_id, transaction_type, created_at);

-- Create views for common queries
CREATE VIEW user_portfolio AS
SELECT 
    u.id as user_id,
    u.wallet_address,
    u.username,
    ub.token_id,
    t.token_symbol,
    ub.balance,
    ub.staked_balance,
    ub.pending_rewards,
    ub.total_earned,
    u.reputation_score
FROM users u
JOIN user_balances ub ON u.id = ub.user_id
JOIN tokens t ON ub.token_id = t.id
WHERE u.is_active = TRUE;

CREATE VIEW agent_performance AS
SELECT 
    a.id as agent_id,
    a.agent_name,
    a.token_id,
    u.wallet_address as owner_address,
    at.name as template_name,
    a.performance_score,
    a.tasks_completed,
    a.total_earned,
    a.staked_amount,
    a.is_active,
    a.last_active
FROM ai_agents a
JOIN users u ON a.owner_id = u.id
JOIN agent_templates at ON a.template_id = at.id;

CREATE VIEW staking_overview AS
SELECT 
    sp.id as pool_id,
    sp.pool_name,
    sp.lock_period,
    sp.base_apy,
    sp.multiplier,
    sp.total_staked,
    COUNT(us.id) as active_stakes,
    AVG(us.amount) as average_stake_amount
FROM staking_pools sp
LEFT JOIN user_stakes us ON sp.id = us.pool_id AND us.status = 'active'
WHERE sp.is_active = TRUE
GROUP BY sp.id;

-- Create stored procedures for common operations
DELIMITER //

CREATE PROCEDURE GetUserDashboard(IN user_wallet VARCHAR(42))
BEGIN
    SELECT 
        u.id,
        u.wallet_address,
        u.username,
        u.total_staked,
        u.total_earned,
        u.reputation_score,
        COUNT(DISTINCT a.id) as agents_count,
        COUNT(DISTINCT us.id) as active_stakes,
        SUM(ub.balance) as total_balance,
        SUM(ub.pending_rewards) as pending_rewards
    FROM users u
    LEFT JOIN ai_agents a ON u.id = a.owner_id AND a.is_active = TRUE
    LEFT JOIN user_stakes us ON u.id = us.user_id AND us.status = 'active'
    LEFT JOIN user_balances ub ON u.id = ub.user_id
    WHERE u.wallet_address = user_wallet
    GROUP BY u.id;
END //

CREATE PROCEDURE UpdateSystemStats()
BEGIN
    UPDATE system_stats SET stat_value = (SELECT COUNT(*) FROM users WHERE is_active = TRUE) WHERE stat_name = 'total_users';
    UPDATE system_stats SET stat_value = (SELECT COUNT(*) FROM ai_agents WHERE is_active = TRUE) WHERE stat_name = 'total_agents';
    UPDATE system_stats SET stat_value = (SELECT COUNT(*) FROM tasks WHERE status = 'completed') WHERE stat_name = 'total_tasks';
    UPDATE system_stats SET stat_value = (SELECT COALESCE(SUM(total_staked), 0) FROM staking_pools) WHERE stat_name = 'total_tokens_staked';
    UPDATE system_stats SET stat_value = (SELECT COALESCE(SUM(burned_supply), 0) FROM tokens) WHERE stat_name = 'total_tokens_burned';
    UPDATE system_stats SET stat_value = (SELECT COUNT(*) FROM ai_agents WHERE is_active = TRUE) WHERE stat_name = 'active_agents';
    UPDATE system_stats SET stat_value = (SELECT COUNT(*) FROM tasks WHERE status = 'pending') WHERE stat_name = 'pending_tasks';
END //

DELIMITER ;

-- Grant permissions (adjust as needed for your environment)
-- CREATE USER 'kamikaze_app'@'localhost' IDENTIFIED BY 'your_secure_password';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON kamikaze_ecosystem.* TO 'kamikaze_app'@'localhost';
-- FLUSH PRIVILEGES;