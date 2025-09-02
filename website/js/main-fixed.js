/**
 * AgentChains.ai - Main JavaScript (Fixed Version)
 * Fixed loading screen and authentication issues
 * Added button functionality and authentication system
 */

// ================================
// UTILITIES & HELPERS
// ================================

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// ================================
// AUTHENTICATION SYSTEM
// ================================

const authSystem = {
    isAuthenticated: false,
    user: null,
    
    // Google OAuth initialization
    initGoogleAuth() {
        if (typeof google !== 'undefined') {
            google.accounts.id.initialize({
                client_id: 'your-google-client-id',
                callback: this.handleGoogleLogin.bind(this)
            });
        }
    },
    
    // Handle Google login
    handleGoogleLogin(response) {
        console.log('Google login successful:', response);
        this.isAuthenticated = true;
        this.user = {
            type: 'google',
            credential: response.credential
        };
        this.updateAuthUI();
        this.launchPlatform();
    },
    
    // Handle MetaMask connection
    async connectMetaMask() {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const accounts = await window.ethereum.request({
                    method: 'eth_requestAccounts'
                });
                
                this.isAuthenticated = true;
                this.user = {
                    type: 'metamask',
                    address: accounts[0]
                };
                
                // Initialize blockchain account and give 1000 KAMIKAZE tokens
                if (window.agentBlockchain) {
                    window.agentBlockchain.createAccount(accounts[0]);
                    const balance = window.agentBlockchain.getBalance(accounts[0]);
                    console.log('Account initialized with balance:', balance);
                    
                    // Show floating balance
                    this.showFloatingBalance(balance);
                }
                
                console.log('MetaMask connected:', accounts[0]);
                this.updateAuthUI();
                this.showNotification(`Welcome! You received 1,000,000,000 KAMIKAZE tokens!`, 'success');
                
                // Don't auto-launch platform, show balance instead
                // this.launchPlatform();
                
            } catch (error) {
                console.error('MetaMask connection failed:', error);
                alert('Failed to connect MetaMask');
            }
        } else {
            alert('MetaMask not found. Please install MetaMask.');
        }
    },
    
    // Show floating balance
    showFloatingBalance(balance) {
        const floatingBalance = document.getElementById('floatingBalance');
        const tokenBalance = document.getElementById('tokenBalance');
        
        if (floatingBalance && tokenBalance) {
            tokenBalance.textContent = balance.toLocaleString();
            floatingBalance.classList.add('show');
        }
    },
    
    // Update authentication UI
    updateAuthUI() {
        const navButtons = $('.login-buttons');
        const heroButtons = $('.hero-actions');
        
        if (this.isAuthenticated && navButtons) {
            navButtons.innerHTML = `
                <span class="user-info">
                    ✅ Connected${this.user.type === 'metamask' ? ' (Wallet)' : ' (Google)'}
                </span>
            `;
        }
    },
    
    // Launch main platform
    launchPlatform() {
        console.log('Launching platform...');
        
        // Check if we're already on a platform page
        if (window.location.pathname.includes('dapp') || 
            window.location.pathname.includes('agent-creator') ||
            window.location.pathname.includes('app')) {
            return;
        }
        
        // Redirect to main dApp
        window.location.href = './dapp/index.html';
    },
    
    // Logout function
    logout() {
        this.isAuthenticated = false;
        this.user = null;
        console.log('User logged out');
        window.location.href = '../index.html';
    }
};

// ================================
// LOADING ANIMATION
// ================================

class LoadingScreen {
    constructor() {
        this.loadingElement = $('#loading');
        this.progressBar = $('.progress-bar');
        this.loadingText = $('.loading-text');
        this.isLoaded = false;
        
        this.messages = [
            'Initializing AI Agents...',
            'Connecting to Blockchain...',
            'Loading Neural Networks...',
            'Preparing Interface...',
            'Almost Ready...'
        ];
        
        this.init();
    }
    
    init() {
        let progress = 0;
        let messageIndex = 0;
        
        const loadingInterval = setInterval(() => {
            progress += Math.random() * 15 + 10;
            
            if (progress >= 100) {
                progress = 100;
                this.complete();
                clearInterval(loadingInterval);
            }
            
            // Update progress bar
            if (this.progressBar) {
                this.progressBar.style.width = progress + '%';
            }
            
            // Update message every 25% progress
            const newMessageIndex = Math.floor((progress / 100) * this.messages.length);
            if (newMessageIndex !== messageIndex && newMessageIndex < this.messages.length) {
                messageIndex = newMessageIndex;
                if (this.loadingText) {
                    this.loadingText.textContent = this.messages[messageIndex];
                }
            }
        }, 200);
    }
    
    complete() {
        setTimeout(() => {
            if (this.loadingElement) {
                this.loadingElement.classList.add('hide');
                this.isLoaded = true;
                document.body.classList.add('loaded');
            }
            
            // Trigger page animations
            this.initPageAnimations();
        }, 500);
    }
    
    initPageAnimations() {
        // Animate hero section without GSAP
        const heroContent = document.querySelector('.hero-content');
        const heroVisual = document.querySelector('.hero-visual');
        
        if (heroContent) {
            heroContent.style.opacity = '0';
            heroContent.style.transform = 'translateY(50px)';
            heroContent.style.transition = 'opacity 1s ease-out, transform 1s ease-out';
            
            setTimeout(() => {
                heroContent.style.opacity = '1';
                heroContent.style.transform = 'translateY(0)';
            }, 100);
        }
        
        if (heroVisual) {
            heroVisual.style.opacity = '0';
            heroVisual.style.transform = 'scale(0.8)';
            heroVisual.style.transition = 'opacity 1.2s ease-out, transform 1.2s ease-out';
            
            setTimeout(() => {
                heroVisual.style.opacity = '1';
                heroVisual.style.transform = 'scale(1)';
            }, 400);
        }
    }
}

// ================================
// AUTHENTICATION SYSTEM
// ================================

class AuthSystem {
    constructor() {
        this.user = null;
        this.wallet = null;
        this.web3 = null;
        this.isAuthenticated = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkExistingAuth();
    }

    setupEventListeners() {
        // Main hero buttons
        const mainLaunchBtn = $('#mainLaunchBtn');
        const connectWalletBtn = $('#connectWalletBtn');
        const googleLoginBtn = $('#googleLoginBtn');
        
        // Navigation buttons
        const googleLoginNav = $('#googleLoginNav');
        const metamaskConnectNav = $('#metamaskConnectNav');

        if (mainLaunchBtn) {
            mainLaunchBtn.addEventListener('click', () => this.launchPlatform());
        }
        
        if (connectWalletBtn) {
            connectWalletBtn.addEventListener('click', () => this.connectWallet());
        }
        
        if (googleLoginBtn) {
            googleLoginBtn.addEventListener('click', () => this.loginWithGoogle());
        }
        
        if (googleLoginNav) {
            googleLoginNav.addEventListener('click', () => this.loginWithGoogle());
        }
        
        if (metamaskConnectNav) {
            metamaskConnectNav.addEventListener('click', () => this.connectWallet());
        }
    }

    async connectWallet() {
        try {
            if (typeof window.ethereum === 'undefined') {
                this.showNotification('MetaMask is not installed! Please install MetaMask to continue.', 'error');
                window.open('https://metamask.io/download.html', '_blank');
                return;
            }

            // Request account access
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (accounts.length > 0) {
                this.wallet = accounts[0];
                this.isAuthenticated = true;
                
                // Initialize Web3
                if (typeof Web3 !== 'undefined') {
                    this.web3 = new Web3(window.ethereum);
                }
                
                // Get network info
                const chainId = await window.ethereum.request({ method: 'eth_chainId' });
                const network = this.getNetworkName(chainId);
                
                localStorage.setItem('agentchains-auth', 'wallet');
                localStorage.setItem('agentchains-wallet', this.wallet);
                // Initialize blockchain account and give 1,000,000,000 KAMIKAZE tokens
                if (window.agentBlockchain) {
                    window.agentBlockchain.createAccount(this.wallet);
                    const balance = window.agentBlockchain.getBalance(this.wallet);
                    console.log('Account initialized with balance:', balance);
                    
                    // Show floating balance
                    this.showFloatingBalance(balance);
                }
                this.showNotification(`Connected! You received 1,000,000,000 KAMIKAZE tokens!`, 'success');
                this.updateUIAfterAuth('wallet');
                
                // Don't auto-redirect, show balance instead
                // setTimeout(() => {
                //     this.launchPlatform();
                // }, 1000);
                
                // Listen for account changes
                window.ethereum.on('accountsChanged', (accounts) => {
                    if (accounts.length === 0) {
                        this.logout();
                    } else {
                        this.wallet = accounts[0];
                        this.updateUIAfterAuth('wallet');
                    }
                });
                
                // Listen for chain changes
                window.ethereum.on('chainChanged', (chainId) => {
                    window.location.reload();
                });
            }
        } catch (error) {
            console.error('Error connecting wallet:', error);
            this.showNotification('Failed to connect wallet: ' + error.message, 'error');
        }
    }

    async loginWithGoogle() {
        try {
            // For demo purposes, simulate successful login
            this.user = {
                name: 'Demo User',
                email: 'demo@agentchains.ai',
                picture: 'https://ui-avatars.com/api/?name=Demo+User&background=4285F4&color=fff'
            };
            this.isAuthenticated = true;
            localStorage.setItem('agentchains-auth', 'google');
            localStorage.setItem('agentchains-user', JSON.stringify(this.user));
            // Initialize blockchain account for Google users too
            if (window.agentBlockchain) {
                // Create a demo address for Google users
                const demoAddress = 'google_' + this.user.email.replace('@', '_');
                window.agentBlockchain.createAccount(demoAddress);
                const balance = window.agentBlockchain.getBalance(demoAddress);
                console.log('Google account initialized with balance:', balance);
                
                // Show floating balance
                this.showFloatingBalance(balance);
            }
            this.showNotification('Welcome! You received 1,000,000,000 KAMIKAZE tokens!', 'success');
            this.updateUIAfterAuth('google');
            
            // Don't auto-redirect
            // setTimeout(() => {
            //     this.launchPlatform();
            // }, 1000);
            
        } catch (error) {
            console.error('Error with Google login:', error);
            this.showNotification('Google login failed: ' + error.message, 'error');
        }
    }

    launchPlatform() {
        if (this.isAuthenticated) {
            // Set initial balance if not already set
            if (!localStorage.getItem('testnet-mind-balance')) {
                localStorage.setItem('testnet-mind-balance', '1000');
                this.showNotification('Welcome! You\'ve received 1000 free MIND tokens!', 'success');
            }
            // Redirect to platform dashboard
            window.location.href = './app/index.html';
        } else {
            // Show authentication modal if not logged in
            this.showAuthModal();
        }
    }

    showComingSoonModal() {
        const modal = document.createElement('div');
        modal.className = 'coming-soon-modal';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content coming-soon-content">
                <div class="modal-header">
                    <div class="coming-soon-icon">🚀</div>
                    <h2>AgentChains Platform</h2>
                    <p>Coming Soon - Q3 2025</p>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="coming-soon-body">
                    <div class="feature-preview">
                        <div class="preview-item">
                            <div class="preview-icon">🤖</div>
                            <div class="preview-text">
                                <h3>AI Agent Builder</h3>
                                <p>Create intelligent agents with visual interface</p>
                            </div>
                        </div>
                        <div class="preview-item">
                            <div class="preview-icon">💰</div>
                            <div class="preview-text">
                                <h3>MIND Token Economy</h3>
                                <p>Earn real cryptocurrency with your agents</p>
                            </div>
                        </div>
                        <div class="preview-item">
                            <div class="preview-icon">🏪</div>
                            <div class="preview-text">
                                <h3>Agent Marketplace</h3>
                                <p>Buy, sell and trade AI agents as NFTs</p>
                            </div>
                        </div>
                    </div>
                    <div class="notify-section">
                        <h3>Get Notified When We Launch</h3>
                        <div class="email-signup">
                            <input type="email" placeholder="Enter your email" class="email-input">
                            <button class="notify-btn">Notify Me</button>
                        </div>
                    </div>
                    <div class="social-links">
                        <a href="#" class="social-link">📱 Join Telegram</a>
                        <a href="#" class="social-link">🐦 Follow Twitter</a>
                        <a href="#" class="social-link">💬 Join Discord</a>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        modal.querySelector('.modal-close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.querySelector('.modal-overlay').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.querySelector('.notify-btn').addEventListener('click', () => {
            const email = modal.querySelector('.email-input').value;
            if (email && email.includes('@')) {
                this.showNotification('Thank you! We\'ll notify you when we launch.', 'success');
                document.body.removeChild(modal);
            } else {
                this.showNotification('Please enter a valid email address', 'warning');
            }
        });
    }

    showAuthModal() {
        const authInstance = this; // Capture auth instance
        const modal = document.createElement('div');
        modal.className = 'auth-modal clean-auth';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <div class="auth-logo">🤖</div>
                    <h2>Welcome to AgentChains</h2>
                    <p>Connect your account to get started</p>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="auth-step-container">
                    <div class="auth-step" id="authStep1">
                        <div class="step-header">
                            <h3>Choose Authentication Method</h3>
                            <p>Select how you'd like to connect</p>
                        </div>
                        <div class="auth-options-clean">
                            <button class="auth-option-clean google-option" data-method="google">
                                <div class="option-icon">
                                    <svg viewBox="0 0 24 24" width="32" height="32">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                    </svg>
                                </div>
                                <div class="option-content">
                                    <div class="option-title">Google Account</div>
                                    <div class="option-subtitle">Sign in with your Google account</div>
                                </div>
                                <div class="option-arrow">→</div>
                            </button>
                            
                            <button class="auth-option-clean crypto-option" data-method="wallet">
                                <div class="option-icon">
                                    <svg viewBox="0 0 24 24" width="32" height="32">
                                        <path fill="#F6851B" d="M22.32 1.5L13.5 8.08l1.63-3.8 7.19-2.78z"/>
                                        <path fill="#E27625" d="M1.68 1.5l8.74 6.64-1.55-3.86L1.68 1.5z"/>
                                        <path fill="#E27625" d="M19.07 16.5l-2.35 3.58 5.02 1.38 1.44-4.87-4.11-.09z"/>
                                        <path fill="#E27625" d="M1.02 16.59l1.44 4.87 5.02-1.38-2.35-3.58-4.11.09z"/>
                                        <path fill="#F5841F" d="M7.14 10.42l-1.39 2.1 4.99.22-.17-5.37-3.43 3.05z"/>
                                        <path fill="#F5841F" d="M16.86 10.42l-3.51-3.13-.11 5.45 4.99-.22-1.37-2.1z"/>
                                    </svg>
                                </div>
                                <div class="option-content">
                                    <div class="option-title">Crypto Wallet</div>
                                    <div class="option-subtitle">Connect with MetaMask or other wallets</div>
                                </div>
                                <div class="option-arrow">→</div>
                            </button>
                        </div>
                        <div class="auth-divider">
                            <span>or</span>
                        </div>
                        <button class="guest-button" data-method="guest">
                            Continue as Guest
                            <span class="guest-note">Limited features available</span>
                        </button>
                    </div>
                    
                    <div class="auth-step hidden" id="authStep2">
                        <div class="step-header">
                            <button class="back-btn">← Back</button>
                            <h3 id="step2Title">Connect Account</h3>
                            <p id="step2Subtitle">Follow the prompts to connect</p>
                        </div>
                        <div class="connection-status">
                            <div class="status-animation">
                                <div class="spinner"></div>
                            </div>
                            <div class="status-text" id="connectionStatus">Connecting...</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add modal methods
        modal.showStep1 = function() {
            this.querySelector('#authStep1').classList.remove('hidden');
            this.querySelector('#authStep2').classList.add('hidden');
        };
        
        modal.showStep2 = function(method) {
            this.querySelector('#authStep1').classList.add('hidden');
            this.querySelector('#authStep2').classList.remove('hidden');
            
            const title = this.querySelector('#step2Title');
            const subtitle = this.querySelector('#step2Subtitle');
            const status = this.querySelector('#connectionStatus');
            
            if (method === 'google') {
                title.textContent = 'Connecting Google Account';
                subtitle.textContent = 'Redirecting to Google OAuth...';
                status.textContent = 'Connecting to Google...';
                
                // Simulate connection then authenticate
                setTimeout(() => {
                    status.textContent = 'Success! Logging you in...';
                    setTimeout(() => {
                        document.body.removeChild(modal);
                        authInstance.loginWithGoogle();
                    }, 1000);
                }, 2000);
            } else if (method === 'wallet') {
                title.textContent = 'Connecting Wallet';
                subtitle.textContent = 'Please approve in MetaMask...';
                status.textContent = 'Waiting for wallet approval...';
                
                // Simulate connection then authenticate
                setTimeout(() => {
                    status.textContent = 'Connecting to blockchain...';
                    setTimeout(() => {
                        document.body.removeChild(modal);
                        authInstance.connectWallet();
                    }, 1000);
                }, 1500);
            }
        };
        
        // Add event listeners
        modal.querySelector('.modal-close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.querySelector('.modal-overlay').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        // Add event listeners for auth options
        modal.querySelectorAll('.auth-option-clean').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const method = e.currentTarget.getAttribute('data-method');
                modal.showStep2(method);
            });
        });
        
        // Guest button listener
        modal.querySelector('.guest-button').addEventListener('click', () => {
            document.body.removeChild(modal);
            authInstance.continueAsGuest();
        });
        
        // Back button listener
        modal.querySelector('.back-btn').addEventListener('click', () => {
            modal.showStep1();
        });
    }

    continueAsGuest() {
        this.isAuthenticated = true;
        this.user = { name: 'Guest User', type: 'guest' };
        localStorage.setItem('agentchains-auth', 'guest');
        localStorage.setItem('agentchains-user', JSON.stringify(this.user));
        // Give guest users 1000 free tokens too
        if (!localStorage.getItem('testnet-mind-balance')) {
            localStorage.setItem('testnet-mind-balance', '1000');
        }
        this.showNotification('Continuing as guest - You\'ve received 1000 free MIND tokens!', 'info');
        this.updateUIAfterAuth('guest');
        // Redirect to platform
        setTimeout(() => {
            window.location.href = './app/index.html';
        }, 1000);
    }

    updateUIAfterAuth(method) {
        // Update button states
        const buttons = $$('.login-btn, .wallet-btn');
        buttons.forEach(btn => {
            if (method === 'google' && btn.classList.contains('login-btn')) {
                btn.innerHTML = `<span class="btn-icon">✅</span><span class="btn-text">Connected</span>`;
            } else if (method === 'wallet' && btn.classList.contains('wallet-btn')) {
                btn.innerHTML = `<span class="btn-icon">✅</span><span class="btn-text">Connected</span>`;
            }
        });
    }

    getNetworkName(chainId) {
        const networks = {
            '0x1': 'Ethereum Mainnet',
            '0x89': 'Polygon',
            '0xa': 'Optimism',
            '0xa4b1': 'Arbitrum',
            '0x38': 'BSC',
        };
        return networks[chainId] || 'Unknown Network';
    }

    formatAddress(address) {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${this.getNotificationIcon(type)}</span>
                <span class="notification-text">${message}</span>
            </div>
            <button class="notification-close">&times;</button>
        `;
        
        // Style the notification
        const colors = {
            success: '#10B981',
            error: '#EF4444',
            warning: '#F59E0B',
            info: '#3B82F6'
        };
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type] || colors.info};
            color: white;
            padding: 16px 20px;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            z-index: 10001;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 400px;
            font-weight: 500;
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Add close functionality
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        });
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, 5000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }

    checkExistingAuth() {
        // Check for existing wallet connection
        if (window.ethereum && window.ethereum.selectedAddress) {
            this.wallet = window.ethereum.selectedAddress;
            this.isAuthenticated = true;
            this.updateUIAfterAuth('wallet');
        }
    }

    logout() {
        this.user = null;
        this.wallet = null;
        this.isAuthenticated = false;
        this.showNotification('Logged out successfully', 'info');
        // Reset UI
        location.reload();
    }
    
    showFloatingBalance(balance) {
        const floatingBalance = document.getElementById('floatingBalance');
        const tokenBalance = document.getElementById('tokenBalance');
        
        if (floatingBalance && tokenBalance) {
            tokenBalance.textContent = balance.toLocaleString();
            floatingBalance.classList.add('show');
        }
    }
}

// ================================
// INITIALIZATION
// ================================

// Global variables
let authSystem = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('🔗 AgentChains.ai initializing...');
    
    // Initialize loading screen first
    const loadingScreen = new LoadingScreen();
    
    // Initialize authentication system and make it global
    authSystem = new AuthSystem();
    window.authSystem = authSystem; // Make it accessible from HTML onclick
    
    // Initialize whitepaper handler if it exists
    if (typeof WhitepaperGenerator !== 'undefined') {
        const whitepaperHandler = new WhitepaperGenerator();
    }
    
    console.log('🔗 AgentChains.ai initialized successfully');
});

// ================================
// SCROLL TO SECTION
// ================================

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

// Global access to functions
window.scrollToSection = scrollToSection;

// Handle Launch dApp button click
async function handleLaunchDApp(event) {
    event.preventDefault();
    
    // Check if MetaMask is available
    if (typeof window.ethereum === 'undefined') {
        const shouldInstall = confirm(
            '🦊 MetaMask Required!\n\n' +
            'MetaMask wallet is required to access the KAMIKAZE dApp.\n\n' +
            'Would you like to install MetaMask now?'
        );
        
        if (shouldInstall) {
            window.open('https://metamask.io/download/', '_blank');
        }
        return;
    }
    
    try {
        // Request MetaMask connection
        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });
        
        if (accounts.length > 0) {
            // Initialize blockchain account and give tokens
            if (window.agentBlockchain) {
                window.agentBlockchain.createAccount(accounts[0]);
                const balance = window.agentBlockchain.getBalance(accounts[0]);
                
                // Show success message
                showLaunchNotification(balance);
            }
            
            // Redirect to dashboard after short delay
            setTimeout(() => {
                window.location.href = './dapp/dashboard.html';
            }, 2000);
        }
    } catch (error) {
        console.error('MetaMask connection failed:', error);
        alert('❌ Connection failed. Please try again.');
    }
}

// Show launch notification
function showLaunchNotification(balance) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #ff6b35, #ff0080, #8b5cf6);
        color: white;
        padding: 30px 40px;
        border-radius: 20px;
        text-align: center;
        z-index: 10000;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 100px rgba(255, 107, 53, 0.3);
        border: 2px solid rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(20px);
        animation: popIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    `;
    
    notification.innerHTML = `
        <div style="font-size: 3rem; margin-bottom: 10px;">🚀</div>
        <h2 style="margin-bottom: 15px; font-size: 1.5rem;">Welcome to KAMIKAZE!</h2>
        <p style="margin-bottom: 10px; font-size: 1.1rem;">You've received:</p>
        <div style="font-size: 2rem; font-weight: bold; color: #ffd700; margin-bottom: 15px;">
            ${balance.toLocaleString()} KAMIKAZE
        </div>
        <p style="font-size: 0.9rem; opacity: 0.9;">Launching dApp in 2 seconds...</p>
    `;
    
    // Add animation style
    const style = document.createElement('style');
    style.textContent = `
        @keyframes popIn {
            0% { transform: translate(-50%, -50%) scale(0) rotate(180deg); opacity: 0; }
            100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'popIn 0.3s reverse';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }, 2500);
}

// Make function available globally
window.handleLaunchDApp = handleLaunchDApp;

// ================================
// BUTTON EVENT HANDLERS
// ================================

document.addEventListener('DOMContentLoaded', () => {
    // Main launch buttons
    const mainLaunchBtn = $('#mainLaunchBtn');
    const connectWalletBtn = $('#connectWalletBtn');
    const googleLoginBtn = $('#googleLoginBtn');
    
    // Navigation buttons
    const googleLoginNav = $('#googleLoginNav');
    const metamaskConnectNav = $('#metamaskConnectNav');
    
    // Whitepaper buttons
    const downloadWhitepaper = $('#downloadWhitepaper');
    const viewOnline = $('#viewOnline');
    
    // Add event listeners if buttons exist
    if (mainLaunchBtn) {
        mainLaunchBtn.addEventListener('click', () => {
            console.log('Main launch button clicked');
            authSystem.launchPlatform();
        });
    }
    
    if (connectWalletBtn) {
        connectWalletBtn.addEventListener('click', () => {
            console.log('Connect wallet button clicked');
            authSystem.connectMetaMask();
        });
    }
    
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', () => {
            console.log('Google login button clicked');
            authSystem.showAuthModal();
        });
    }
    
    if (googleLoginNav) {
        googleLoginNav.addEventListener('click', () => {
            console.log('Google login nav clicked');
            authSystem.showAuthModal();
        });
    }
    
    if (metamaskConnectNav) {
        metamaskConnectNav.addEventListener('click', () => {
            console.log('MetaMask nav clicked');
            authSystem.connectMetaMask();
        });
    }
    
    if (downloadWhitepaper) {
        downloadWhitepaper.addEventListener('click', () => {
            console.log('Download whitepaper clicked');
            // Trigger whitepaper download if available
            if (window.whitepaperHandler) {
                window.whitepaperHandler.generateAndDownload();
            } else {
                alert('Downloading AgentChains Whitepaper...');
            }
        });
    }
    
    if (viewOnline) {
        viewOnline.addEventListener('click', () => {
            console.log('View online clicked');
            window.open('https://agentchains.ai/whitepaper', '_blank');
        });
    }
    
    console.log('Button event listeners attached');
});