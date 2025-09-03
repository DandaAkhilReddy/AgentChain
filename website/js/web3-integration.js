/**
 * AgentChains Web3 Integration
 * Complete blockchain functionality for KAMIKAZE token
 */

class Web3Manager {
    constructor() {
        this.web3 = null;
        this.account = null;
        this.contract = null;
        this.contractAddress = '0x742D35CC6635C0532925A3B8D31F3C4E58AD0F89'; // Replace with deployed address
        this.contractABI = [
            {
                "inputs": [],
                "name": "claimFreeTokens",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [{"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}],
                "name": "sendTokens",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
                "name": "getUserInfo",
                "outputs": [{"internalType": "uint256", "name": "balance", "type": "uint256"}, {"internalType": "bool", "name": "hasClaimed", "type": "bool"}, {"internalType": "uint256", "name": "lastTransfer", "type": "uint256"}, {"internalType": "bool", "name": "canClaim", "type": "bool"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "getTokenStats",
                "outputs": [{"internalType": "uint256", "name": "_totalSupply", "type": "uint256"}, {"internalType": "uint256", "name": "_totalBurned", "type": "uint256"}, {"internalType": "uint256", "name": "_circulatingSupply", "type": "uint256"}, {"internalType": "uint256", "name": "_contractBalance", "type": "uint256"}, {"internalType": "uint256", "name": "_totalClaimed", "type": "uint256"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
                "name": "balanceOf",
                "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "anonymous": false,
                "inputs": [{"indexed": true, "internalType": "address", "name": "user", "type": "address"}, {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}],
                "name": "FreeTokensClaimed",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [{"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}],
                "name": "TokensBurned",
                "type": "event"
            }
        ];
    }

    /**
     * Initialize Web3 connection
     */
    async init() {
        try {
            if (typeof window.ethereum !== 'undefined') {
                this.web3 = new Web3(window.ethereum);
                
                // Request account access
                const accounts = await window.ethereum.request({
                    method: 'eth_requestAccounts'
                });
                
                this.account = accounts[0];
                
                // Initialize contract
                this.contract = new this.web3.eth.Contract(this.contractABI, this.contractAddress);
                
                // Listen for account changes
                window.ethereum.on('accountsChanged', (accounts) => {
                    this.account = accounts[0];
                    this.updateUI();
                });
                
                this.updateUI();
                return true;
            } else {
                throw new Error('MetaMask not installed');
            }
        } catch (error) {
            console.error('Web3 initialization failed:', error);
            throw error;
        }
    }

    /**
     * Claim free tokens (1000 KAMIKAZE)
     */
    async claimFreeTokens() {
        try {
            if (!this.contract || !this.account) {
                throw new Error('Web3 not initialized');
            }

            const gasEstimate = await this.contract.methods.claimFreeTokens().estimateGas({
                from: this.account
            });

            const result = await this.contract.methods.claimFreeTokens().send({
                from: this.account,
                gas: gasEstimate
            });

            this.showNotification('Free tokens claimed successfully!', 'success');
            this.updateUI();
            return result;
        } catch (error) {
            console.error('Claim tokens failed:', error);
            this.showNotification('Failed to claim tokens: ' + error.message, 'error');
            throw error;
        }
    }

    /**
     * Send tokens to another address
     */
    async sendTokens(toAddress, amount) {
        try {
            if (!this.contract || !this.account) {
                throw new Error('Web3 not initialized');
            }

            const amountWei = this.web3.utils.toWei(amount.toString(), 'ether');
            
            const gasEstimate = await this.contract.methods.sendTokens(toAddress, amountWei).estimateGas({
                from: this.account
            });

            const result = await this.contract.methods.sendTokens(toAddress, amountWei).send({
                from: this.account,
                gas: gasEstimate
            });

            this.showNotification('Tokens sent successfully!', 'success');
            this.updateUI();
            return result;
        } catch (error) {
            console.error('Send tokens failed:', error);
            this.showNotification('Failed to send tokens: ' + error.message, 'error');
            throw error;
        }
    }

    /**
     * Get user information
     */
    async getUserInfo(address = null) {
        try {
            if (!this.contract) {
                throw new Error('Contract not initialized');
            }

            const userAddress = address || this.account;
            const result = await this.contract.methods.getUserInfo(userAddress).call();
            
            return {
                balance: this.web3.utils.fromWei(result.balance, 'ether'),
                hasClaimed: result.hasClaimed,
                lastTransfer: result.lastTransfer,
                canClaim: result.canClaim
            };
        } catch (error) {
            console.error('Get user info failed:', error);
            return null;
        }
    }

    /**
     * Get token statistics
     */
    async getTokenStats() {
        try {
            if (!this.contract) {
                throw new Error('Contract not initialized');
            }

            const result = await this.contract.methods.getTokenStats().call();
            
            return {
                totalSupply: this.web3.utils.fromWei(result._totalSupply, 'ether'),
                totalBurned: this.web3.utils.fromWei(result._totalBurned, 'ether'),
                circulatingSupply: this.web3.utils.fromWei(result._circulatingSupply, 'ether'),
                contractBalance: this.web3.utils.fromWei(result._contractBalance, 'ether'),
                totalClaimed: this.web3.utils.fromWei(result._totalClaimed, 'ether')
            };
        } catch (error) {
            console.error('Get token stats failed:', error);
            return null;
        }
    }

    /**
     * Update UI with latest data
     */
    async updateUI() {
        if (!this.account) return;

        try {
            // Update wallet status
            const walletStatusEl = document.getElementById('walletStatus');
            if (walletStatusEl) {
                walletStatusEl.className = 'status status-connected';
                walletStatusEl.innerHTML = '<span>●</span> Connected';
            }

            // Update wallet address
            const walletAddressEl = document.getElementById('walletAddress');
            if (walletAddressEl) {
                walletAddressEl.value = this.account.substring(0, 6) + '...' + this.account.substring(38);
            }

            // Get user info
            const userInfo = await this.getUserInfo();
            if (userInfo) {
                // Update balance
                const balanceEl = document.getElementById('tokenBalance');
                if (balanceEl) {
                    balanceEl.value = parseFloat(userInfo.balance).toFixed(2) + ' KAMIKAZE';
                }

                // Update total balance
                const totalBalanceEl = document.getElementById('totalBalance');
                if (totalBalanceEl) {
                    totalBalanceEl.textContent = parseFloat(userInfo.balance).toFixed(2);
                }

                // Update claim button
                const claimBtn = document.getElementById('claimTokensBtn');
                if (claimBtn) {
                    if (userInfo.canClaim) {
                        claimBtn.textContent = '🎁 Claim 1000 Free Tokens';
                        claimBtn.disabled = false;
                        claimBtn.className = 'btn btn-success';
                    } else {
                        claimBtn.textContent = '✅ Tokens Already Claimed';
                        claimBtn.disabled = true;
                        claimBtn.className = 'btn btn-secondary';
                    }
                }
            }

            // Update token stats
            const tokenStats = await this.getTokenStats();
            if (tokenStats) {
                const elements = {
                    'totalSupplyEl': tokenStats.totalSupply,
                    'totalBurnedEl': tokenStats.totalBurned,
                    'circulatingSupplyEl': tokenStats.circulatingSupply
                };

                Object.entries(elements).forEach(([id, value]) => {
                    const el = document.getElementById(id);
                    if (el) {
                        el.textContent = parseFloat(value).toLocaleString();
                    }
                });
            }

        } catch (error) {
            console.error('Update UI failed:', error);
        }
    }

    /**
     * Show notification to user
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
                <span>${message}</span>
            </div>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    /**
     * Disconnect wallet
     */
    disconnect() {
        this.account = null;
        this.contract = null;
        
        // Update UI
        const walletStatusEl = document.getElementById('walletStatus');
        if (walletStatusEl) {
            walletStatusEl.className = 'status status-disconnected';
            walletStatusEl.innerHTML = '<span>●</span> Disconnected';
        }

        const walletAddressEl = document.getElementById('walletAddress');
        if (walletAddressEl) {
            walletAddressEl.value = '';
        }

        const balanceEl = document.getElementById('tokenBalance');
        if (balanceEl) {
            balanceEl.value = '0.00 KAMIKAZE';
        }
    }
}

// Global instance
window.web3Manager = new Web3Manager();

// Auto-initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Web3 Manager loaded');
    
    // Add notification styles
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 10000;
            transform: translateX(400px);
            animation: slideIn 0.3s ease forwards;
        }
        
        .notification-success {
            background: #10b981;
        }
        
        .notification-error {
            background: #ef4444;
        }
        
        .notification-info {
            background: #6366f1;
        }
        
        .notification-content {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        @keyframes slideIn {
            to {
                transform: translateX(0);
            }
        }
    `;
    document.head.appendChild(style);
});