/**
 * AgentChains Testnet Configuration and Test Token System
 * Provides test MIND tokens on various testnets
 */

class TestnetConfig {
    constructor() {
        this.networks = {
            // Polygon Mumbai Testnet
            mumbai: {
                chainId: '0x13881',
                chainName: 'Polygon Mumbai',
                nativeCurrency: {
                    name: 'MATIC',
                    symbol: 'MATIC',
                    decimals: 18
                },
                rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
                blockExplorerUrls: ['https://mumbai.polygonscan.com/'],
                faucet: 'https://faucet.polygon.technology/',
                mindTokenAddress: '0x1234567890123456789012345678901234567890' // Placeholder
            },
            // Sepolia Testnet
            sepolia: {
                chainId: '0xaa36a7',
                chainName: 'Sepolia Testnet',
                nativeCurrency: {
                    name: 'ETH',
                    symbol: 'ETH',
                    decimals: 18
                },
                rpcUrls: ['https://rpc.sepolia.org/'],
                blockExplorerUrls: ['https://sepolia.etherscan.io/'],
                faucet: 'https://sepoliafaucet.com/',
                mindTokenAddress: '0x1234567890123456789012345678901234567890' // Placeholder
            },
            // BSC Testnet
            bscTestnet: {
                chainId: '0x61',
                chainName: 'BSC Testnet',
                nativeCurrency: {
                    name: 'BNB',
                    symbol: 'tBNB',
                    decimals: 18
                },
                rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
                blockExplorerUrls: ['https://testnet.bscscan.com/'],
                faucet: 'https://testnet.binance.org/faucet-smart',
                mindTokenAddress: '0x1234567890123456789012345678901234567890' // Placeholder
            }
        };
        
        this.currentNetwork = null;
        this.web3 = null;
        this.mindTokenContract = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkCurrentNetwork();
    }

    setupEventListeners() {
        // Add testnet switch button to UI
        this.addTestnetUI();
    }

    addTestnetUI() {
        const testnetUI = document.createElement('div');
        testnetUI.id = 'testnet-ui';
        testnetUI.className = 'testnet-ui';
        testnetUI.innerHTML = `
            <div class="testnet-container">
                <div class="testnet-header">
                    <h3>🧪 Testnet Mode</h3>
                    <button class="testnet-close">&times;</button>
                </div>
                
                <div class="testnet-status">
                    <div class="status-indicator" id="networkStatus">
                        <span class="status-dot"></span>
                        <span class="status-text">Not Connected</span>
                    </div>
                </div>
                
                <div class="testnet-networks">
                    <h4>Select Test Network:</h4>
                    <div class="network-options">
                        <button class="network-btn" data-network="mumbai">
                            <img src="https://cryptologos.cc/logos/polygon-matic-logo.png" alt="Polygon" width="20">
                            Polygon Mumbai
                        </button>
                        <button class="network-btn" data-network="sepolia">
                            <img src="https://cryptologos.cc/logos/ethereum-eth-logo.png" alt="Ethereum" width="20">
                            Sepolia
                        </button>
                        <button class="network-btn" data-network="bscTestnet">
                            <img src="https://cryptologos.cc/logos/bnb-bnb-logo.png" alt="BSC" width="20">
                            BSC Testnet
                        </button>
                    </div>
                </div>
                
                <div class="testnet-balance">
                    <h4>Test Token Balance:</h4>
                    <div class="balance-display">
                        <span class="balance-amount" id="mindBalance">0</span>
                        <span class="balance-symbol">MIND</span>
                    </div>
                    <button class="btn btn-primary" id="claimTestTokens">
                        Claim 1000 Test MIND Tokens
                    </button>
                </div>
                
                <div class="testnet-faucets">
                    <h4>Get Test Network Tokens:</h4>
                    <div class="faucet-links" id="faucetLinks">
                        <p>Select a network to see faucet links</p>
                    </div>
                </div>
                
                <div class="testnet-actions">
                    <button class="btn btn-outline" id="testSendTokens">
                        Test Send 10 MIND
                    </button>
                    <button class="btn btn-outline" id="testStakeTokens">
                        Test Stake 100 MIND
                    </button>
                </div>
            </div>
        `;

        // Add styles
        const styles = `
            <style>
                .testnet-ui {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background: rgba(26, 27, 35, 0.95);
                    border: 2px solid #00D4FF;
                    border-radius: 12px;
                    padding: 20px;
                    max-width: 350px;
                    z-index: 9999;
                    backdrop-filter: blur(10px);
                    font-family: 'Inter', sans-serif;
                    color: white;
                    box-shadow: 0 10px 40px rgba(0, 212, 255, 0.3);
                }
                
                .testnet-ui.hidden {
                    display: none;
                }
                
                .testnet-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                }
                
                .testnet-header h3 {
                    margin: 0;
                    font-size: 18px;
                    color: #00D4FF;
                }
                
                .testnet-close {
                    background: none;
                    border: none;
                    color: #B4BCD0;
                    font-size: 24px;
                    cursor: pointer;
                    padding: 0;
                    width: 30px;
                    height: 30px;
                }
                
                .testnet-status {
                    background: rgba(255, 255, 255, 0.05);
                    padding: 10px;
                    border-radius: 8px;
                    margin-bottom: 15px;
                }
                
                .status-indicator {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .status-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #6B7280;
                    transition: background 0.3s ease;
                }
                
                .status-dot.connected {
                    background: #10B981;
                    box-shadow: 0 0 10px #10B981;
                }
                
                .network-options {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    margin: 10px 0;
                }
                
                .network-btn {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    color: white;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .network-btn:hover {
                    background: rgba(0, 212, 255, 0.1);
                    border-color: #00D4FF;
                }
                
                .network-btn.active {
                    background: rgba(0, 212, 255, 0.2);
                    border-color: #00D4FF;
                }
                
                .balance-display {
                    font-size: 24px;
                    font-weight: 700;
                    margin: 10px 0;
                    color: #00D4FF;
                }
                
                .testnet-actions {
                    display: flex;
                    gap: 10px;
                    margin-top: 15px;
                }
                
                .testnet-actions button {
                    flex: 1;
                    padding: 8px;
                    font-size: 12px;
                }
                
                .faucet-links {
                    background: rgba(255, 255, 255, 0.05);
                    padding: 10px;
                    border-radius: 8px;
                    font-size: 12px;
                }
                
                .faucet-links a {
                    color: #00D4FF;
                    text-decoration: none;
                }
                
                .faucet-links a:hover {
                    text-decoration: underline;
                }
                
                .testnet-toggle {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background: #00D4FF;
                    color: #0A0B0F;
                    border: none;
                    border-radius: 50%;
                    width: 60px;
                    height: 60px;
                    font-size: 24px;
                    cursor: pointer;
                    box-shadow: 0 5px 20px rgba(0, 212, 255, 0.4);
                    z-index: 9998;
                    transition: all 0.3s ease;
                }
                
                .testnet-toggle:hover {
                    transform: scale(1.1);
                    box-shadow: 0 8px 30px rgba(0, 212, 255, 0.6);
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
        document.body.appendChild(testnetUI);
        
        // Add toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'testnet-toggle';
        toggleBtn.innerHTML = '🧪';
        toggleBtn.title = 'Toggle Testnet Mode';
        toggleBtn.onclick = () => this.toggleTestnetUI();
        document.body.appendChild(toggleBtn);
        
        // Bind events
        this.bindTestnetEvents();
    }

    bindTestnetEvents() {
        // Close button
        document.querySelector('.testnet-close').addEventListener('click', () => {
            document.getElementById('testnet-ui').classList.add('hidden');
        });
        
        // Network buttons
        document.querySelectorAll('.network-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const network = e.currentTarget.dataset.network;
                this.switchNetwork(network);
            });
        });
        
        // Claim tokens button
        document.getElementById('claimTestTokens').addEventListener('click', () => {
            this.claimTestTokens();
        });
        
        // Test actions
        document.getElementById('testSendTokens').addEventListener('click', () => {
            this.testSendTokens();
        });
        
        document.getElementById('testStakeTokens').addEventListener('click', () => {
            this.testStakeTokens();
        });
    }

    toggleTestnetUI() {
        const ui = document.getElementById('testnet-ui');
        ui.classList.toggle('hidden');
    }

    async checkCurrentNetwork() {
        if (!window.ethereum) {
            this.updateStatus('MetaMask not installed', false);
            return;
        }
        
        try {
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            const networkKey = Object.keys(this.networks).find(key => 
                this.networks[key].chainId === chainId
            );
            
            if (networkKey) {
                this.currentNetwork = networkKey;
                this.updateStatus(`Connected to ${this.networks[networkKey].chainName}`, true);
                this.updateFaucetLinks(networkKey);
                this.updateBalance();
            } else {
                this.updateStatus('Connected to unsupported network', false);
            }
        } catch (error) {
            console.error('Error checking network:', error);
            this.updateStatus('Error checking network', false);
        }
    }

    async switchNetwork(networkKey) {
        const network = this.networks[networkKey];
        if (!network) return;
        
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: network.chainId }],
            });
            
            this.currentNetwork = networkKey;
            this.updateStatus(`Connected to ${network.chainName}`, true);
            this.updateFaucetLinks(networkKey);
            this.updateBalance();
            
            // Update active button
            document.querySelectorAll('.network-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.network === networkKey);
            });
            
        } catch (switchError) {
            // This error code indicates that the chain has not been added to MetaMask
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: network.chainId,
                            chainName: network.chainName,
                            nativeCurrency: network.nativeCurrency,
                            rpcUrls: network.rpcUrls,
                            blockExplorerUrls: network.blockExplorerUrls
                        }],
                    });
                    
                    this.currentNetwork = networkKey;
                    this.updateStatus(`Added and connected to ${network.chainName}`, true);
                    this.updateFaucetLinks(networkKey);
                    this.updateBalance();
                    
                } catch (addError) {
                    console.error('Error adding network:', addError);
                    this.showNotification('Failed to add network', 'error');
                }
            } else {
                console.error('Error switching network:', switchError);
                this.showNotification('Failed to switch network', 'error');
            }
        }
    }

    updateStatus(text, connected) {
        const statusText = document.querySelector('.status-text');
        const statusDot = document.querySelector('.status-dot');
        
        if (statusText) statusText.textContent = text;
        if (statusDot) statusDot.classList.toggle('connected', connected);
    }

    updateFaucetLinks(networkKey) {
        const network = this.networks[networkKey];
        const faucetLinks = document.getElementById('faucetLinks');
        
        if (faucetLinks && network) {
            faucetLinks.innerHTML = `
                <p>Get free ${network.nativeCurrency.symbol} tokens:</p>
                <a href="${network.faucet}" target="_blank" rel="noopener noreferrer">
                    ${network.chainName} Faucet →
                </a>
            `;
        }
    }

    async updateBalance() {
        // In a real implementation, this would query the actual token contract
        // For demo purposes, we'll use localStorage to simulate balance
        const balance = localStorage.getItem('testnet-mind-balance') || '0';
        document.getElementById('mindBalance').textContent = balance;
    }

    async claimTestTokens() {
        if (!this.currentNetwork) {
            this.showNotification('Please connect to a testnet first', 'warning');
            return;
        }
        
        // Simulate claiming tokens
        const button = document.getElementById('claimTestTokens');
        const originalText = button.textContent;
        button.disabled = true;
        button.textContent = 'Claiming...';
        
        try {
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Update balance
            const currentBalance = parseInt(localStorage.getItem('testnet-mind-balance') || '0');
            const newBalance = currentBalance + 1000;
            localStorage.setItem('testnet-mind-balance', newBalance);
            
            await this.updateBalance();
            this.showNotification('Successfully claimed 1000 test MIND tokens!', 'success');
            
        } catch (error) {
            console.error('Error claiming tokens:', error);
            this.showNotification('Failed to claim tokens', 'error');
        } finally {
            button.disabled = false;
            button.textContent = originalText;
        }
    }

    async testSendTokens() {
        if (!this.currentNetwork) {
            this.showNotification('Please connect to a testnet first', 'warning');
            return;
        }
        
        const currentBalance = parseInt(localStorage.getItem('testnet-mind-balance') || '0');
        if (currentBalance < 10) {
            this.showNotification('Insufficient balance. Claim test tokens first!', 'error');
            return;
        }
        
        // Simulate sending tokens
        try {
            this.showNotification('Sending 10 MIND tokens...', 'info');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const newBalance = currentBalance - 10;
            localStorage.setItem('testnet-mind-balance', newBalance);
            await this.updateBalance();
            
            this.showNotification('Successfully sent 10 MIND tokens! (Test transaction)', 'success');
            
        } catch (error) {
            console.error('Error sending tokens:', error);
            this.showNotification('Failed to send tokens', 'error');
        }
    }

    async testStakeTokens() {
        if (!this.currentNetwork) {
            this.showNotification('Please connect to a testnet first', 'warning');
            return;
        }
        
        const currentBalance = parseInt(localStorage.getItem('testnet-mind-balance') || '0');
        if (currentBalance < 100) {
            this.showNotification('Insufficient balance. Need at least 100 MIND to stake!', 'error');
            return;
        }
        
        // Simulate staking tokens
        try {
            this.showNotification('Staking 100 MIND tokens...', 'info');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const newBalance = currentBalance - 100;
            localStorage.setItem('testnet-mind-balance', newBalance);
            await this.updateBalance();
            
            this.showNotification('Successfully staked 100 MIND tokens! APY: 12%', 'success');
            
        } catch (error) {
            console.error('Error staking tokens:', error);
            this.showNotification('Failed to stake tokens', 'error');
        }
    }

    showNotification(message, type) {
        // Use the existing notification system from AuthSystem
        if (window.authSystem && window.authSystem.showNotification) {
            window.authSystem.showNotification(message, type);
        } else {
            // Fallback notification
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6'};
                color: white;
                border-radius: 8px;
                z-index: 10001;
                animation: slideIn 0.3s ease;
            `;
            notification.textContent = message;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 3000);
        }
    }
}

// Initialize testnet configuration when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.testnetConfig = new TestnetConfig();
    });
} else {
    window.testnetConfig = new TestnetConfig();
}