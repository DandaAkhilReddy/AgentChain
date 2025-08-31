/**
 * AgentChains Blockchain System
 * Handles mining, transactions, and token management
 */

// Simple SHA256 implementation for demo (in production, use crypto library)
const CryptoJS = {
    SHA256: function(message) {
        // Simple hash function for demo
        let hash = 0;
        for (let i = 0; i < message.length; i++) {
            const char = message.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return {
            toString: function() {
                return Math.abs(hash).toString(16).padStart(64, '0');
            }
        };
    }
};

class Block {
    constructor(index, timestamp, data, previousHash = '') {
        this.index = index;
        this.timestamp = timestamp;
        this.data = data;
        this.previousHash = previousHash;
        this.hash = this.calculateHash();
        this.nonce = 0;
    }

    calculateHash() {
        return CryptoJS.SHA256(
            this.index + 
            this.previousHash + 
            this.timestamp + 
            JSON.stringify(this.data) + 
            this.nonce
        ).toString();
    }

    mineBlock(difficulty) {
        while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
            this.nonce++;
            this.hash = this.calculateHash();
        }
        console.log(`Block mined: ${this.hash}`);
    }
}

class Transaction {
    constructor(fromAddress, toAddress, amount, type = 'transfer') {
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amount = amount;
        this.timestamp = Date.now();
        this.type = type; // transfer, reward, stake, game
        this.id = this.calculateHash();
    }

    calculateHash() {
        return CryptoJS.SHA256(
            this.fromAddress + 
            this.toAddress + 
            this.amount + 
            this.timestamp
        ).toString();
    }
}

class AgentChainsBlockchain {
    constructor() {
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 2; // Low difficulty for demo
        this.pendingTransactions = [];
        this.miningReward = 10;
        this.accounts = new Map();
        this.totalSupply = 1000000000; // 1 billion
        this.burnRate = 0.02; // 2% burn rate
        
        // Initialize system account
        this.systemAddress = 'system';
        this.accounts.set(this.systemAddress, this.totalSupply);
        
        // Mining status
        this.isMining = false;
        this.miningProgress = 0;
        
        // Event emitter for UI updates
        this.eventListeners = {};
    }

    createGenesisBlock() {
        return new Block(0, Date.now(), { type: 'genesis' }, "0");
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    createAccount(address) {
        if (!this.accounts.has(address)) {
            this.accounts.set(address, 0);
            
            // Give new accounts 1000 free tokens
            const welcomeTransaction = new Transaction(
                this.systemAddress,
                address,
                1000,
                'welcome_bonus'
            );
            this.pendingTransactions.push(welcomeTransaction);
            
            // Auto-mine the welcome transaction
            this.minePendingTransactions(address);
            
            return true;
        }
        return false;
    }

    getBalance(address) {
        return this.accounts.get(address) || 0;
    }

    createTransaction(transaction) {
        // Validate transaction
        if (!transaction.fromAddress || !transaction.toAddress) {
            throw new Error('Transaction must include from and to address');
        }

        // Skip balance check for system transactions
        if (transaction.fromAddress !== this.systemAddress) {
            const balance = this.getBalance(transaction.fromAddress);
            if (balance < transaction.amount) {
                throw new Error('Insufficient balance');
            }
        }

        // Apply burn for regular transfers
        if (transaction.type === 'transfer') {
            const burnAmount = Math.floor(transaction.amount * this.burnRate);
            transaction.burnAmount = burnAmount;
            transaction.netAmount = transaction.amount - burnAmount;
        } else {
            transaction.netAmount = transaction.amount;
        }

        this.pendingTransactions.push(transaction);
        this.emit('transactionCreated', transaction);
        
        return transaction;
    }

    async minePendingTransactions(miningRewardAddress) {
        if (this.isMining) {
            console.log('Already mining...');
            return;
        }

        this.isMining = true;
        this.miningProgress = 0;
        this.emit('miningStarted');

        // Create mining reward transaction
        const rewardTransaction = new Transaction(
            this.systemAddress,
            miningRewardAddress,
            this.miningReward,
            'mining_reward'
        );

        const transactions = [rewardTransaction, ...this.pendingTransactions];
        
        const block = new Block(
            this.chain.length,
            Date.now(),
            transactions,
            this.getLatestBlock().hash
        );

        // Simulate mining with progress updates
        const miningSteps = 10;
        for (let i = 0; i < miningSteps; i++) {
            await new Promise(resolve => setTimeout(resolve, 200));
            this.miningProgress = ((i + 1) / miningSteps) * 100;
            this.emit('miningProgress', this.miningProgress);
        }

        block.mineBlock(this.difficulty);

        // Process all transactions in the block
        for (const tx of transactions) {
            if (tx.fromAddress !== this.systemAddress) {
                const fromBalance = this.getBalance(tx.fromAddress);
                this.accounts.set(tx.fromAddress, fromBalance - tx.amount);
            }
            
            const toBalance = this.getBalance(tx.toAddress);
            this.accounts.set(tx.toAddress, toBalance + tx.netAmount);
            
            // Burn tokens if applicable
            if (tx.burnAmount) {
                this.totalSupply -= tx.burnAmount;
                this.emit('tokensBurned', tx.burnAmount);
            }
        }

        this.chain.push(block);
        this.pendingTransactions = [];
        this.isMining = false;
        
        this.emit('blockMined', block);
        this.emit('miningCompleted');
        
        return block;
    }

    getTransactionHistory(address) {
        const transactions = [];
        
        for (const block of this.chain) {
            if (block.data && Array.isArray(block.data)) {
                for (const tx of block.data) {
                    if (tx.fromAddress === address || tx.toAddress === address) {
                        transactions.push({
                            ...tx,
                            blockIndex: block.index,
                            blockHash: block.hash
                        });
                    }
                }
            }
        }
        
        return transactions.reverse(); // Most recent first
    }

    isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            if (currentBlock.hash !== currentBlock.calculateHash()) {
                return false;
            }

            if (currentBlock.previousHash !== previousBlock.hash) {
                return false;
            }
        }
        return true;
    }

    // Event system
    on(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }

    emit(event, data) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => callback(data));
        }
    }

    // Game integration methods for future use
    async processGameReward(playerAddress, amount, gameId) {
        const gameTransaction = new Transaction(
            this.systemAddress,
            playerAddress,
            amount,
            'game_reward'
        );
        gameTransaction.gameId = gameId;
        
        this.createTransaction(gameTransaction);
        await this.minePendingTransactions(playerAddress);
        
        return gameTransaction;
    }

    async processGamePurchase(playerAddress, amount, itemId) {
        const purchaseTransaction = new Transaction(
            playerAddress,
            this.systemAddress,
            amount,
            'game_purchase'
        );
        purchaseTransaction.itemId = itemId;
        
        this.createTransaction(purchaseTransaction);
        await this.minePendingTransactions(this.systemAddress);
        
        return purchaseTransaction;
    }

    // Staking functionality
    stake(address, amount) {
        const stakeTransaction = new Transaction(
            address,
            'staking_pool',
            amount,
            'stake'
        );
        
        this.createTransaction(stakeTransaction);
        return stakeTransaction;
    }

    // Get blockchain statistics
    getStats() {
        return {
            blockHeight: this.chain.length,
            totalTransactions: this.chain.reduce((total, block) => {
                return total + (Array.isArray(block.data) ? block.data.length : 0);
            }, 0),
            totalSupply: this.totalSupply,
            difficulty: this.difficulty,
            pendingTransactions: this.pendingTransactions.length,
            isMining: this.isMining,
            miningProgress: this.miningProgress
        };
    }
}

// Initialize blockchain instance
const agentBlockchain = new AgentChainsBlockchain();

// Export for use in other scripts
window.AgentChainsBlockchain = AgentChainsBlockchain;
window.agentBlockchain = agentBlockchain;