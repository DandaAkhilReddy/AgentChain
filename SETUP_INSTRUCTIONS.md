# AgentChains Local Development Setup

## 🎉 Setup Complete! Your AgentChains blockchain is ready to use.

### 📋 Summary of Deployed Components

#### Smart Contracts (Local Network)
- **MIND Token (BasicToken)**: `0x6eaE6fE16708Ad36c38DAf73f1DEe3dad9BeC2ed`
- **AI Agent NFT (BasicNFT)**: `0x342b37DeFD122d9E421f75895fd091900b792969`
- **Task Marketplace**: `0x77079eb61bF15AF9ce4017832cdcEc57280E50F4`

#### Test Accounts Available
1. **Primary Account**: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
   - Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
   - Balance: 10,000 ETH

2. **Secondary Account**: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
   - Private Key: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`
   - Balance: 10,000 ETH

3. **Third Account**: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
   - Private Key: `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a`
   - Balance: 10,000 ETH

### 🦊 MetaMask Setup

1. **Add Local Network to MetaMask**:
   - Network Name: `AgentChains Local`
   - RPC URL: `http://localhost:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`

2. **Import Test Account**:
   - Use the private key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
   - This account already has MIND tokens and demo AI agents

### 🚀 Running the Application

#### Start the Blockchain Node
```bash
cd AgentChain
npx hardhat node
```
Keep this running in a separate terminal.

#### Start the Frontend
```bash
cd AgentChain/frontend  
npm start
```
Frontend will be available at: http://localhost:3001

### 🎮 Demo Features Available

1. **Connect Wallet**: Connect MetaMask with the local network
2. **View Balance**: See your MIND token balance (1 billion initial supply)
3. **AI Agents**: 3 demo agents already minted:
   - TranslatorBot
   - DataAnalyst  
   - CreativeAI
4. **Task Market**: 2 sample tasks available:
   - "Translate Document" (50 MIND reward)
   - "Data Analysis Report" (100 MIND reward)

### 🎯 What You Can Test

1. **Mint New AI Agents**: Create your own AI agents as NFTs
2. **Create Tasks**: Post tasks with MIND token rewards
3. **Claim Tasks**: Have your agents claim available tasks
4. **Complete Tasks**: Task creators can mark tasks complete and pay agents
5. **Token Burns**: 2% of tokens are burned on transfers (deflationary)

### 💰 Token Economics

- **Name**: ConsciousCoin
- **Symbol**: MIND
- **Total Supply**: 1 billion tokens (deflationary)
- **Burn Rate**: 2% on every transfer
- **Decimals**: 18

### 📁 Important Files

- **Contract Addresses**: `deployment-addresses.json`
- **Frontend Config**: `frontend/src/contracts.js`
- **Environment**: `.env`

### 🔧 Troubleshooting

1. **MetaMask Connection Issues**: Make sure you're on the correct network (31337)
2. **Transaction Failures**: Ensure you have enough ETH for gas fees
3. **Contract Errors**: Check that the Hardhat node is running
4. **Frontend Issues**: Refresh page and reconnect wallet

### 🎉 Success! You now have:
- ✅ Local AgentChains blockchain running
- ✅ Smart contracts deployed
- ✅ MetaMask configured  
- ✅ Frontend connected
- ✅ Test tokens and agents ready
- ✅ Full working UI for interactions

Enjoy testing your AgentChains AI agent marketplace! 🚀
Visit agentchains.ai for more information!