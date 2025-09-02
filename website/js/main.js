/**
 * KAMIKAZE Token - Clean Main JavaScript
 * Modern implementation without authentication systems
 * MetaMask-only integration for dApp launch
 */

// ================================
// UTILITIES & HELPERS
// ================================

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// ================================
// KAMIKAZE WALLET INTEGRATION
// ================================

class KamikazeWallet {
    constructor() {
        this.connected = false;
        this.account = null;
        this.balance = 0;
        this.init();
    }

    init() {
        // Check for existing connection
        this.checkConnection();
        
        // Listen for account changes
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    this.disconnect();
                } else {
                    this.account = accounts[0];
                    this.updateUI();
                }
            });

            window.ethereum.on('chainChanged', () => {
                window.location.reload();
            });
        }
    }

    async checkConnection() {
        if (window.ethereum && window.ethereum.selectedAddress) {
            this.account = window.ethereum.selectedAddress;
            this.connected = true;
            this.updateUI();
        }
    }

    async connect() {
        if (typeof window.ethereum === 'undefined') {
            return this.showInstallPrompt();
        }

        try {
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (accounts.length > 0) {
                this.account = accounts[0];
                this.connected = true;
                
                // Initialize with KAMIKAZE tokens
                if (window.agentBlockchain) {
                    window.agentBlockchain.createAccount(this.account);
                    this.balance = window.agentBlockchain.getBalance(this.account);
                }
                
                this.updateUI();
                this.showSuccessNotification();
                return true;
            }
        } catch (error) {
            console.error('Wallet connection failed:', error);
            this.showErrorNotification('Connection failed. Please try again.');
            return false;
        }
    }

    disconnect() {
        this.connected = false;
        this.account = null;
        this.balance = 0;
        this.updateUI();
    }

    updateUI() {
        // Update any wallet status indicators
        const walletButtons = $$('.wallet-status, .connect-wallet');
        walletButtons.forEach(btn => {
            if (this.connected) {
                btn.textContent = `✅ ${this.formatAddress(this.account)}`;
                btn.classList.add('connected');
            } else {
                btn.textContent = 'Connect Wallet';
                btn.classList.remove('connected');
            }
        });
    }

    formatAddress(address) {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    showInstallPrompt() {
        const shouldInstall = confirm(
            '🦊 MetaMask Required!\n\n' +
            'MetaMask wallet is required to access the KAMIKAZE dApp.\n\n' +
            'Would you like to install MetaMask now?'
        );
        
        if (shouldInstall) {
            window.open('https://metamask.io/download/', '_blank');
        }
        return false;
    }

    showSuccessNotification() {
        this.showNotification(
            `🎉 Welcome! You received ${this.balance.toLocaleString()} KAMIKAZE tokens!`,
            'success'
        );
    }

    showErrorNotification(message) {
        this.showNotification(`❌ ${message}`, 'error');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const colors = {
            success: 'linear-gradient(135deg, #00ff88, #00d4ff)',
            error: 'linear-gradient(135deg, #ff0080, #ff6b35)',
            info: 'linear-gradient(135deg, #8b5cf6, #00d4ff)'
        };

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type]};
            color: white;
            padding: 16px 24px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3), 0 0 50px rgba(139, 92, 246, 0.2);
            z-index: 10001;
            transform: translateX(100%);
            transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            font-weight: 600;
            max-width: 400px;
        `;

        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 1.2em;">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: none; border: none; color: white; cursor: pointer; margin-left: auto; font-size: 1.2em;">×</button>
            </div>
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Auto remove
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }
}

// ================================
// MODERN LOADING SCREEN
// ================================

class ModernLoader {
    constructor() {
        this.element = $('#loading');
        this.progressBar = $('.progress-bar');
        this.loadingText = $('.loading-text');
        
        this.messages = [
            '🔥 Igniting KAMIKAZE Engine...',
            '🚀 Launching AI Protocols...',
            '🌟 Connecting to Blockchain...',
            '⚡ Powering Up Interface...',
            '✨ Almost Ready...'
        ];
        
        this.init();
    }

    init() {
        let progress = 0;
        let messageIndex = 0;
        
        const interval = setInterval(() => {
            progress += Math.random() * 20 + 15;
            
            if (progress >= 100) {
                progress = 100;
                this.complete();
                clearInterval(interval);
            }
            
            if (this.progressBar) {
                this.progressBar.style.width = progress + '%';
            }
            
            const newIndex = Math.floor((progress / 100) * this.messages.length);
            if (newIndex !== messageIndex && newIndex < this.messages.length) {
                messageIndex = newIndex;
                if (this.loadingText) {
                    this.loadingText.textContent = this.messages[messageIndex];
                }
            }
        }, 150);
    }

    complete() {
        setTimeout(() => {
            if (this.element) {
                this.element.classList.add('hide');
                document.body.classList.add('loaded');
            }
            this.initPageAnimations();
        }, 600);
    }

    initPageAnimations() {
        // Smooth reveal animations
        const elementsToAnimate = [
            { selector: '.hero-content', delay: 100 },
            { selector: '.hero-visual', delay: 300 },
            { selector: '.navbar', delay: 50 }
        ];

        elementsToAnimate.forEach(({ selector, delay }) => {
            const element = $(selector);
            if (element) {
                element.style.opacity = '0';
                element.style.transform = 'translateY(30px)';
                element.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
                
                setTimeout(() => {
                    element.style.opacity = '1';
                    element.style.transform = 'translateY(0)';
                }, delay);
            }
        });
    }
}

// ================================
// SCROLL EFFECTS & UI ENHANCEMENTS
// ================================

class ScrollEffects {
    constructor() {
        this.navbar = $('#navbar');
        this.init();
    }

    init() {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            
            // Navbar backdrop blur
            if (this.navbar) {
                if (scrolled > 50) {
                    this.navbar.classList.add('scrolled');
                } else {
                    this.navbar.classList.remove('scrolled');
                }
            }

            // Parallax effect for hero
            const hero = $('.hero');
            if (hero) {
                const offset = scrolled * 0.5;
                hero.style.transform = `translateY(${offset}px)`;
            }
        });
    }
}

// ================================
// LAUNCH DAPP HANDLER
// ================================

async function handleLaunchDApp(event) {
    event.preventDefault();
    
    if (!window.kamikazeWallet) {
        window.kamikazeWallet = new KamikazeWallet();
    }
    
    const connected = await window.kamikazeWallet.connect();
    
    if (connected) {
        // Show launch animation
        showLaunchAnimation();
        
        // Redirect after animation
        setTimeout(() => {
            window.location.href = './dapp/dashboard.html';
        }, 2500);
    }
}

function showLaunchAnimation() {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, rgba(255, 107, 53, 0.95), rgba(255, 0, 128, 0.95), rgba(139, 92, 246, 0.95));
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(20px);
    `;
    
    overlay.innerHTML = `
        <div style="text-align: center; color: white;">
            <div style="font-size: 4rem; margin-bottom: 20px; animation: pulse 2s infinite;">🚀</div>
            <h2 style="font-size: 2rem; margin-bottom: 15px; font-weight: 700;">Launching KAMIKAZE dApp</h2>
            <p style="font-size: 1.2rem; opacity: 0.9;">Welcome to the future of AI-powered finance</p>
            <div style="margin-top: 30px;">
                <div style="width: 200px; height: 4px; background: rgba(255,255,255,0.3); border-radius: 2px; margin: 0 auto;">
                    <div style="width: 0%; height: 100%; background: linear-gradient(90deg, #ffd700, #00ff88); border-radius: 2px; animation: loadBar 2s ease-out forwards;"></div>
                </div>
            </div>
        </div>
    `;
    
    // Add animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }
        @keyframes loadBar {
            0% { width: 0%; }
            100% { width: 100%; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(overlay);
    
    // Remove after delay
    setTimeout(() => {
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.5s ease';
        setTimeout(() => overlay.remove(), 500);
    }, 2000);
}

// ================================
// SMOOTH SCROLLING
// ================================

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// ================================
// MOBILE MENU
// ================================

class MobileMenu {
    constructor() {
        this.hamburger = $('#hamburger');
        this.navMenu = $('#nav-menu');
        this.init();
    }

    init() {
        if (this.hamburger && this.navMenu) {
            this.hamburger.addEventListener('click', () => {
                this.hamburger.classList.toggle('active');
                this.navMenu.classList.toggle('active');
            });

            // Close menu when clicking links
            this.navMenu.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    this.hamburger.classList.remove('active');
                    this.navMenu.classList.remove('active');
                });
            });
        }
    }
}

// ================================
// INITIALIZATION
// ================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🔥 KAMIKAZE Platform initializing...');
    
    // Initialize components
    const loader = new ModernLoader();
    const scrollEffects = new ScrollEffects();
    const mobileMenu = new MobileMenu();
    
    // Initialize wallet system
    window.kamikazeWallet = new KamikazeWallet();
    
    // Make functions globally available
    window.handleLaunchDApp = handleLaunchDApp;
    window.scrollToSection = scrollToSection;
    
    console.log('🚀 KAMIKAZE Platform ready!');
});