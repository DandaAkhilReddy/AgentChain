# 🎮 How to Test Your Blockchain UI

## 🚀 Quick Start (Easiest Way)

### Option 1: One-Click Start (Windows)
```bash
# Double-click this file to start everything automatically
start-ui.bat
```

### Option 2: Manual Steps

1. **Start the blockchain:**
   ```bash
   npx hardhat node
   ```

2. **Deploy contracts** (in new terminal):
   ```bash
   npx hardhat run scripts/deploy-basic.js --network localhost
   ```

3. **Start the UI** (in new terminal):
   ```bash
   cd frontend
   npm install
   npm start
   ```

4. **Open browser:** http://localhost:3000

## 🦊 MetaMask Setup

### Add Hardhat Network to MetaMask:
1. Open MetaMask
2. Click network dropdown
3. Add Network → Add a network manually
4. Fill in:
   - **Network Name:** Hardhat Local
   - **RPC URL:** http://127.0.0.1:8545
   - **Chain ID:** 31337
   - **Currency Symbol:** ETH

### Import Test Account:
1. Copy a private key from Hardhat node output (starts with `0x...`)
2. MetaMask → Import Account → Paste private key
3. You'll have 10,000 ETH for testing!

## 🎯 What You Can Test

### 🏠 Overview Tab
- ✅ View your MIND token balance (1 billion tokens!)
- ✅ See number of AI agents you own
- ✅ Check available tasks
- ✅ Quick navigation buttons

### 🤖 My Agents Tab
- ✅ **Mint new AI agents** with custom names
- ✅ View your agent collection
- ✅ See agent performance scores
- ✅ Check agent status (Active/Inactive)

### 📋 Marketplace Tab
- ✅ **Browse available tasks** (3 sample tasks included)
- ✅ **Claim tasks** with your AI agents
- ✅ **Complete tasks** as task creator
- ✅ See task rewards and deadlines
- ✅ Track task status (Open/Claimed/Completed)

### ➕ Create Tab
- ✅ **Create new tasks** for other agents
- ✅ Set custom rewards in MIND tokens
- ✅ Choose task duration (1 hour to 1 week)
- ✅ Automatic token approval and escrow

## 🎮 Complete Testing Workflow

### 1. Connect Your Wallet
- Click "Connect Wallet"
- Approve MetaMask connection
- Make sure you're on Hardhat network

### 2. Mint Your First Agent
```
Go to My Agents → Enter name "MyBot" → Click "Mint Agent"
```

### 3. Claim a Sample Task
```
Go to Marketplace → Find open task → Click "Claim Task"
```

### 4. Complete the Task
```
As task creator, click "Complete Task" to pay the agent
```

### 5. Create Your Own Task
```
Go to Create → Fill details → Click "Create Task"
```

### 6. Watch Your Balance Change
```
Go to Overview → See MIND balance update after each transaction
```

## 🎨 UI Features

### 🎯 Real-Time Updates
- Balance updates automatically
- Task status changes instantly
- Agent count updates after minting

### 📱 Responsive Design
- Works on desktop, tablet, and mobile
- Beautiful gradient backgrounds
- Smooth animations and transitions

### 🔔 User Feedback
- Success/error alerts for all actions
- Loading states during transactions
- Clear status indicators

### 💰 Transaction Handling
- Automatic token approvals
- Gas estimation
- Transaction confirmations

## 🐛 Troubleshooting

### "Please install MetaMask"
- Install MetaMask browser extension
- Refresh page and try again

### "Wrong Network"
- Add Hardhat network (Chain ID: 31337)
- Switch to Hardhat in MetaMask

### "Insufficient Funds"
- Make sure you imported test account with ETH
- Check Hardhat node is running

### "Contract not found"
- Redeploy contracts: `npx hardhat run scripts/deploy-basic.js --network localhost`
- Check contract addresses in frontend/src/contracts.js

### Transactions Fail
- Reset MetaMask account (Settings → Advanced → Reset Account)
- Make sure Hardhat node is running

## 🎉 Success Metrics

You'll know it's working when:
- ✅ Wallet connects successfully
- ✅ Shows 1 billion MIND tokens
- ✅ Can mint AI agents
- ✅ Can claim and complete tasks
- ✅ Balance updates after transactions
- ✅ All 4 tabs work perfectly

## 🚀 Going Live

Once testing works locally:

### Deploy to Mumbai Testnet (FREE):
1. Get Mumbai MATIC: https://mumbaifaucet.com
2. Update .env with your private key
3. Deploy: `npx hardhat run scripts/deploy-basic.js --network mumbai`
4. Update contract addresses in frontend/src/contracts.js
5. Your blockchain is live on testnet! 🎉

**Your AI-powered blockchain with full UI is now ready for testing!** 🚀