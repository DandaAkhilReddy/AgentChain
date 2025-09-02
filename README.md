# 🔗 AgentChains - AI Agent Cryptocurrency Platform

> **Revolutionary deflationary KAMIKAZE token with AI agent integration, automated staking, and real blockchain transactions**

[![Live Demo](https://img.shields.io/badge/🚀_LIVE_DEMO-Try_Now-ff6b35?style=for-the-badge)](https://icy-mushroom-029b4900f.1.azurestaticapps.net)
[![Blockchain](https://img.shields.io/badge/⛓️_BLOCKCHAIN-ERC20_Compatible-00d4ff?style=for-the-badge)](#blockchain)
[![License](https://img.shields.io/badge/📜_LICENSE-MIT-00ff88?style=for-the-badge)](LICENSE)

---

## 🎯 **What is KAMIKAZE?**

KAMIKAZE is a **deflationary ERC20 token** with integrated AI agent marketplace, featuring:
- **2% Burn Rate** on every transaction
- **1 Billion Token Supply** with automatic supply reduction
- **AI Agent Integration** for task automation
- **Staking Rewards** up to 25% APY
- **Real Blockchain Transactions** with MetaMask integration

---

## 🚀 **Quick Start for Developers**

### **Prerequisites**
```bash
# Required Software
- Node.js 16+ 
- MetaMask Browser Extension
- Git
- Python 3.x (for local server)
```

### **1. Clone & Setup**
```bash
# Clone the repository
git clone https://github.com/DandaAkhilReddy/AgentChain.git
cd AgentChain

# Navigate to website
cd website
```

### **2. Run Locally**
```bash
# Method 1: Python HTTP Server (Recommended)
python -m http.server 8000
# Visit: http://localhost:8000

# Method 2: Node.js Live Server
npm install -g live-server
live-server --port=8000

# Method 3: Direct file opening (limited functionality)
# Double-click website/index.html
```

### **3. Test with MetaMask**
1. **Visit Homepage** - No login required
2. **Click "Launch dApp"** - MetaMask prompt appears
3. **Connect Wallet** - Get 1,000,000,000 KAMIKAZE tokens instantly
4. **Test Transactions** - Send tokens with 2% burn rate
5. **View Dashboard** - Real-time balance and transaction history

---

## 📁 **Project Structure**

```
AgentChain/
├── 📄 README.md                    # This file
├── 📄 LICENSE                      # MIT License
│
├── 📂 contracts/                   # Smart Contracts
│   ├── 🔥 KamikazeToken.sol       # Main ERC20 token contract
│   └── 📂 core/                   # Additional contract modules
│
├── 📂 backend/                     # Node.js API Server
│   ├── 🚀 server.js              # Express server entry point
│   ├── 📂 routes/                 # API route handlers
│   ├── 📂 middleware/             # Authentication & error handling
│   └── 🐳 Dockerfile             # Docker container config
│
└── 📂 website/                     # Frontend Application
    ├── 🏠 index.html              # Landing page (no login required)
    ├── 📂 css/                    # Stylesheets
    │   ├── style.css              # Base styles
    │   ├── modern-theme.css       # Dark theme
    │   └── colorful-theme.css     # Neon colorful theme
    ├── 📂 js/                     # JavaScript modules
    │   ├── blockchain.js          # Core blockchain functionality
    │   └── main-fixed.js          # UI interactions & MetaMask
    ├── 📂 dapp/                   # Web3 Dashboard
    │   └── dashboard.html         # Token management interface
    └── 🥩 staking.html           # Staking interface with APY calculator
```

---

## 🎨 **Frontend Architecture**

### **Landing Page (`index.html`)**
- **No Login Required** - Clean marketing interface
- **Colorful Neon Theme** - Modern glassmorphism design
- **MetaMask Integration** - Only prompts on "Launch dApp" click
- **Responsive Design** - Works on all devices

### **Dashboard (`dapp/dashboard.html`)**
- **Real-time Balance** - Shows KAMIKAZE token count
- **Send Functionality** - Transfer tokens with 2% burn
- **Transaction History** - View all sent/received transactions
- **Wallet Integration** - Full MetaMask Web3 support

### **Staking Interface (`staking.html`)**
- **4 Staking Periods** - Flexible (5%), 30d (12%), 90d (18%), 365d (25% APY)
- **APY Calculator** - Real-time reward calculations
- **Auto-compounding** - Rewards automatically reinvested

---

## ⛓️ **Blockchain Implementation**

### **KAMIKAZE Token Contract**
```solidity
// contracts/KamikazeToken.sol
contract KamikazeToken is ERC20 {
    uint256 public burnRate = 2; // 2% burn on transfers
    uint256 private _totalSupply = 1000000000 * 10**18; // 1B tokens
    
    function transfer(address recipient, uint256 amount) 
        public override returns (bool) {
        _transferWithBurn(msg.sender, recipient, amount);
        return true;
    }
}
```

### **Blockchain Integration (`js/blockchain.js`)**
```javascript
class AgentChainsBlockchain {
    constructor() {
        this.totalSupply = 1000000000; // 1 billion KAMIKAZE
        this.burnRate = 0.02; // 2% burn rate
        this.tokenName = 'KAMIKAZE';
    }
    
    createAccount(address) {
        // Give new users 1B KAMIKAZE tokens for testing
        if (!this.accounts.has(address)) {
            this.accounts.set(address, 1000000000);
        }
    }
}
```

---

## 🛠️ **Development Guide**

### **Adding New Features**

#### **1. Frontend Components**
```javascript
// Add to website/js/main-fixed.js
function newFeature() {
    // Your feature implementation
    console.log('New feature added');
}
window.newFeature = newFeature;
```

#### **2. Blockchain Functions**
```javascript
// Add to website/js/blockchain.js
class AgentChainsBlockchain {
    newBlockchainFeature() {
        // Implement new blockchain functionality
    }
}
```

#### **3. Styling**
```css
/* Add to website/css/colorful-theme.css */
.new-component {
    background: var(--gradient-rainbow);
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0, 212, 255, 0.3);
}
```

### **Testing Your Changes**
```bash
# 1. Start local server
cd website
python -m http.server 8000

# 2. Open browser
http://localhost:8000

# 3. Test MetaMask integration
# Click "Launch dApp" → Connect wallet → Test features

# 4. Check browser console for errors
# Press F12 to open developer tools
```

---

## 🎯 **Key Features Explained**

### **🔥 Token Economics**
- **Supply**: 1,000,000,000 KAMIKAZE tokens
- **Burn Rate**: 2% of every transaction is burned forever
- **Deflationary**: Total supply decreases with each transaction
- **Distribution**: New users get 1B tokens for testing

### **🤖 AI Agent Integration**
- **Agent Marketplace**: Buy/sell AI agents as NFTs
- **Task Automation**: Agents complete tasks and earn tokens
- **Performance Tracking**: Real-time statistics and earnings
- **Staking Integration**: Stake tokens to boost agent performance

### **💰 Staking System**
```javascript
// Staking APY Rates
const stakingAPY = {
    flexible: 5,   // 5% APY, no lock-up
    "30days": 12,  // 12% APY, 30-day lock
    "90days": 18,  // 18% APY, 90-day lock
    "365days": 25  // 25% APY, 1-year lock
};
```

### **🎨 Visual Design System**
- **Color Palette**: Neon blues, hot pinks, cyber purples
- **Animations**: Smooth transitions with cubic-bezier easing
- **Glassmorphism**: Blur effects and transparency
- **Responsive**: Mobile-first design approach

---

## 🚀 **Deployment**

### **Local Development**
```bash
# 1. Clone repository
git clone https://github.com/DandaAkhilReddy/AgentChain.git

# 2. Start local server
cd AgentChain/website
python -m http.server 8000

# 3. Visit http://localhost:8000
```

### **Production Deployment (Azure)**
```bash
# Deploy to Azure Static Web Apps
npx @azure/static-web-apps-cli deploy ./website \
  --deployment-token YOUR_DEPLOYMENT_TOKEN \
  --env production
```

### **Backend API (Optional)**
```bash
# Start Node.js backend
cd backend
npm install
npm start

# API will be available at http://localhost:3000
```

---

## 🔧 **Environment Setup**

### **Required Browser Extensions**
- **MetaMask** - Web3 wallet for blockchain interactions
- **Install**: [metamask.io](https://metamask.io/download/)

### **Development Tools**
```bash
# Node.js & NPM
node --version  # Should be 16+
npm --version

# Python (for local server)
python --version  # Should be 3.x

# Git
git --version
```

### **Optional Tools**
- **VS Code** with Live Server extension
- **Hardhat** for smart contract development
- **Docker** for containerized deployment

---

## 🧪 **Testing Checklist**

### **✅ Frontend Testing**
```bash
□ Homepage loads without login prompts
□ "Launch dApp" button shows MetaMask connection
□ Dashboard displays 1B KAMIKAZE token balance
□ Send function works with 2% burn calculation
□ Transaction history updates in real-time
□ Staking interface calculates APY correctly
□ All animations and hover effects work
□ Mobile responsive design functions properly
```

### **✅ Blockchain Testing**
```bash
□ MetaMask connects successfully
□ Token balance updates after transactions
□ Burn mechanism reduces total supply
□ Transaction history stores properly
□ Staking rewards calculate correctly
□ Multiple accounts can interact
```

---

## 🐛 **Troubleshooting**

### **Common Issues & Solutions**

#### **MetaMask Not Connecting**
```javascript
// Check if MetaMask is installed
if (typeof window.ethereum === 'undefined') {
    alert('Please install MetaMask');
    window.open('https://metamask.io/download/', '_blank');
}
```

#### **Tokens Not Showing**
```javascript
// Refresh balance manually
function refreshBalance() {
    if (userAccount) {
        const balance = blockchain.getBalance(userAccount);
        document.getElementById('tokenBalance').textContent = balance.toLocaleString();
    }
}
```

#### **Transactions Failing**
1. **Check Balance** - Ensure sufficient KAMIKAZE tokens
2. **Verify Address** - Recipient address must be valid
3. **MetaMask Unlock** - Wallet must be unlocked
4. **Network Issues** - Try refreshing the page

#### **Styling Issues**
```bash
# Clear browser cache
Ctrl + F5 (Windows) or Cmd + Shift + R (Mac)

# Check CSS loading
Open Developer Tools → Network tab → Refresh page
```

---

## 🤝 **Contributing**

### **How to Contribute**
1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** changes: `git commit -m 'Add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### **Development Guidelines**
- **Code Style**: Use ESLint and Prettier
- **Commits**: Use conventional commit messages
- **Testing**: Test all changes locally before submitting
- **Documentation**: Update README for significant changes

---

## 📞 **Support & Contact**

### **Get Help**
- **Issues**: [GitHub Issues](https://github.com/DandaAkhilReddy/AgentChain/issues)
- **Discussions**: [GitHub Discussions](https://github.com/DandaAkhilReddy/AgentChain/discussions)
- **Documentation**: This README and inline code comments

### **Team**
- **Akhil Reddy Danda** - CEO & Lead Developer
- **Abhishek Jha** - CTO & Co-Founder

---

## 📜 **License**

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🌟 **Star This Repository**

If you find KAMIKAZE useful, please ⭐ star this repository to show your support!

---

<div align="center">

### 🚀 **Ready to Build the Future of AI-Powered Finance?**

**[🔥 Try Live Demo](https://icy-mushroom-029b4900f.1.azurestaticapps.net)** • **[📚 Documentation](#)** • **[💬 Community](#)**

---

*Built with ❤️ using Web3, React, Node.js, and cutting-edge AI technology*

</div>