# ⚡ QUICK START - Get Running in 2 Minutes!

## 🚀 **Option 1: One-Click Windows Start**
```bash
# Double-click this file (opens everything automatically):
start-ui.bat
```

## 🚀 **Option 2: Manual Setup**

### **Step 1: Install & Setup**
```bash
npm install
cd frontend && npm install && cd ..
```

### **Step 2: Start Blockchain (Terminal 1)**
```bash
npx hardhat node
```
**Keep this running!** You'll see accounts with 10,000 ETH each.

### **Step 3: Deploy Contracts (Terminal 2)**
```bash
npx hardhat run scripts/deploy-basic.js --network localhost
```
**Copy the contract addresses!** You'll need them.

### **Step 4: Start Frontend (Terminal 3)**
```bash
cd frontend
npm start
```
**Opens browser automatically!** Go to http://localhost:3000

## 🦊 **MetaMask Setup (30 seconds)**

### Add Hardhat Network:
1. MetaMask → Networks → Add Network
2. Fill in:
   - **Network Name:** `Hardhat Local`
   - **RPC URL:** `http://127.0.0.1:8545`
   - **Chain ID:** `31337`
   - **Currency:** `ETH`

### Import Test Account:
1. Copy private key from Hardhat terminal (starts with `0x`)
2. MetaMask → Import Account → Paste key
3. **You now have 10,000 ETH!** 💰

## ✅ **What You Should See**

### **In Browser (http://localhost:3000):**
- ✅ Connect wallet button
- ✅ After connecting: Your 1 billion MIND tokens
- ✅ 4 navigation tabs working
- ✅ 3 sample AI agents ready
- ✅ 3 sample tasks available

### **Test the Full Flow:**
1. **Connect MetaMask** ✅
2. **Go to "My Agents" → Mint new agent** ✅  
3. **Go to "Marketplace" → Claim a task** ✅
4. **Complete the task → Get paid MIND tokens** ✅
5. **Go to "Create" → Create your own task** ✅

## 🎯 **Success Indicators**

You'll know it's working when:
- ✅ **Balance shows 1,000,000,000 MIND**
- ✅ **Can mint AI agents successfully** 
- ✅ **Can claim and complete tasks**
- ✅ **Balance changes after transactions**
- ✅ **All UI interactions work smoothly**

## 🐛 **Troubleshooting**

### **"Please install MetaMask"**
→ Install MetaMask browser extension

### **"Wrong Network"** 
→ Add Hardhat network (Chain ID: 31337)

### **"Contract not found"**
→ Redeploy: `npx hardhat run scripts/deploy-basic.js --network localhost`

### **Transactions Fail**
→ Reset MetaMask: Settings → Advanced → Reset Account

## 🌟 **You're Done!**

**🎉 Congratulations! You now have:**
- ✅ **Full blockchain running locally**
- ✅ **AI agents earning MIND tokens**  
- ✅ **Complete Web3 UI interface**
- ✅ **Task marketplace working**
- ✅ **Ready for testnet deployment!**

---

**Next: Deploy to FREE Mumbai testnet and go live!** 🚀

**Having issues? Check the full README.md for detailed guides.**