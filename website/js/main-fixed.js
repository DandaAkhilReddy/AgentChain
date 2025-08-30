/**
 * AgentChains.ai - Main JavaScript (Fixed Version)
 * Fixed loading screen and authentication issues
 */

// ================================
// UTILITIES & HELPERS
// ================================

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

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
                
                this.showNotification(`Connected to ${this.formatAddress(this.wallet)} on ${network}`, 'success');
                this.updateUIAfterAuth('wallet');
                
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
            this.showNotification('Successfully logged in with Google! (Demo Mode)', 'success');
            this.updateUIAfterAuth('google');
            
        } catch (error) {
            console.error('Error with Google login:', error);
            this.showNotification('Google login failed: ' + error.message, 'error');
        }
    }

    launchPlatform() {
        // Check if authenticated
        if (!this.isAuthenticated) {
            this.showAuthModal();
            return;
        }
        
        // Redirect to app
        this.showNotification('Launching AgentChains Platform...', 'success');
        
        setTimeout(() => {
            window.location.href = '/app';
        }, 1500);
    }

    showAuthModal() {
        const modal = document.createElement('div');
        modal.className = 'auth-modal';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Connect to AgentChains</h2>
                    <p>Choose your preferred authentication method</p>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="auth-options">
                    <button class="auth-option google-auth" data-method="google">
                        <svg class="auth-icon" viewBox="0 0 24 24" width="24" height="24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        <div class="auth-text">
                            <span class="auth-title">Continue with Google</span>
                            <span class="auth-subtitle">Quick and secure</span>
                        </div>
                    </button>
                    <button class="auth-option wallet-auth" data-method="wallet">
                        <svg class="auth-icon metamask-icon" viewBox="0 0 24 24" width="24" height="24">
                            <path fill="#E17726" d="M22.32 1.5L13.5 8.08l1.63-3.8 7.19-2.78z"/>
                            <path fill="#E27625" d="M1.68 1.5l8.74 6.64-1.55-3.86L1.68 1.5z"/>
                            <path fill="#E27625" d="M19.07 16.5l-2.35 3.58 5.02 1.38 1.44-4.87-4.11-.09z"/>
                            <path fill="#E27625" d="M1.02 16.59l1.44 4.87 5.02-1.38-2.35-3.58-4.11.09z"/>
                            <path fill="#F5841F" d="M7.14 10.42l-1.39 2.1 4.99.22-.17-5.37-3.43 3.05z"/>
                            <path fill="#F5841F" d="M16.86 10.42l-3.51-3.13-.11 5.45 4.99-.22-1.37-2.1z"/>
                        </svg>
                        <div class="auth-text">
                            <span class="auth-title">Connect MetaMask</span>
                            <span class="auth-subtitle">Web3 wallet connection</span>
                        </div>
                    </button>
                    <button class="auth-option guest-auth" data-method="guest">
                        <div class="guest-icon">👤</div>
                        <div class="auth-text">
                            <span class="auth-title">Continue as Guest</span>
                            <span class="auth-subtitle">Limited features</span>
                        </div>
                    </button>
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
        
        modal.querySelectorAll('.auth-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const method = e.currentTarget.getAttribute('data-method');
                document.body.removeChild(modal);
                
                if (method === 'google') {
                    this.loginWithGoogle();
                } else if (method === 'wallet') {
                    this.connectWallet();
                } else if (method === 'guest') {
                    this.continueAsGuest();
                }
            });
        });
    }

    continueAsGuest() {
        this.isAuthenticated = true;
        this.user = { name: 'Guest User', type: 'guest' };
        this.showNotification('Continuing as guest with limited features', 'info');
        this.updateUIAfterAuth('guest');
        this.launchPlatform();
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
}

// ================================
// INITIALIZATION
// ================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🔗 AgentChains.ai initializing...');
    
    // Initialize loading screen first
    const loadingScreen = new LoadingScreen();
    
    // Initialize authentication system
    const authSystem = new AuthSystem();
    
    // Initialize whitepaper handler
    const whitepaperHandler = new WhitepaperGenerator();
    
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

// Global access
window.scrollToSection = scrollToSection;