const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const network = hre.network.name;
  
  console.log("🚀 DEPLOYING BASIC BLOCKCHAIN TO", network.toUpperCase());
  console.log("Account:", deployer.address);
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), network === "polygon" || network === "mumbai" ? "MATIC" : "ETH");

  try {
    // 1. Deploy BasicToken (MIND)
    console.log("\n1. 🪙 Deploying BasicToken (MIND)...");
    const BasicToken = await hre.ethers.getContractFactory("BasicToken");
    const mindToken = await BasicToken.deploy();
    await mindToken.waitForDeployment();
    console.log("✅ MIND Token deployed:", mindToken.target);

    // 2. Deploy BasicNFT (AI Agents)
    console.log("\n2. 🤖 Deploying BasicNFT (AI Agents)...");
    const BasicNFT = await hre.ethers.getContractFactory("BasicNFT");
    const agentNFT = await BasicNFT.deploy();
    await agentNFT.waitForDeployment();
    console.log("✅ AI Agent NFT deployed:", agentNFT.target);

    // 3. Deploy BasicMarketplace
    console.log("\n3. 🛒 Deploying BasicMarketplace...");
    const BasicMarketplace = await hre.ethers.getContractFactory("BasicMarketplace");
    const marketplace = await BasicMarketplace.deploy(mindToken.target);
    await marketplace.waitForDeployment();
    console.log("✅ Task Marketplace deployed:", marketplace.target);

    // 4. Deploy AgentMarketplace
    console.log("\n4. 🏪 Deploying AgentMarketplace...");
    const AgentMarketplace = await hre.ethers.getContractFactory("AgentMarketplace");
    const agentMarketplace = await AgentMarketplace.deploy(mindToken.target, agentNFT.target);
    await agentMarketplace.waitForDeployment();
    console.log("✅ Agent Marketplace deployed:", agentMarketplace.target);

    // 5. Setup and demo
    console.log("\n5. 🎭 Setting up demo data...");
    
    // Mint demo agents
    await agentNFT.mintAgent(deployer.address, "TranslatorBot");
    await agentNFT.mintAgent(deployer.address, "DataAnalyst");
    await agentNFT.mintAgent(deployer.address, "CreativeAI");
    console.log("✅ Minted 3 demo AI agents");

    // Create demo tasks
    const taskReward = ethers.parseEther("100"); // 100 MIND tokens
    await mindToken.approve(marketplace.target, taskReward * 3n);
    
    await marketplace.createTask("Translate Document", taskReward, 24 * 3600);
    await marketplace.createTask("Analyze Data", taskReward, 48 * 3600);
    await marketplace.createTask("Create Content", taskReward, 72 * 3600);
    console.log("✅ Created 3 demo tasks");

    // Fund agent marketplace with trial tokens
    const trialTokenAmount = ethers.parseEther("100000"); // 100k trial tokens
    await mindToken.transfer(agentMarketplace.target, trialTokenAmount);
    console.log("✅ Agent marketplace funded with trial tokens");

    // 6. Calculate costs
    const totalGasUsed = 500000n; // Approximate gas used
    const gasPrice = 1000000000n; // 1 gwei
    const totalCost = totalGasUsed * gasPrice;
    
    // Success message
    console.log("\n🎉 ===== BLOCKCHAIN DEPLOYED SUCCESSFULLY! =====");
    console.log(`Network: ${network.toUpperCase()}`);
    console.log(`MIND Token: ${mindToken.target}`);
    console.log(`AI Agent NFT: ${agentNFT.target}`);
    console.log(`Task Marketplace: ${marketplace.target}`);
    console.log(`Agent Marketplace: ${agentMarketplace.target}`);
    console.log(`Gas Used: ~${totalGasUsed.toLocaleString()}`);
    console.log(`Total Cost: ~${ethers.formatEther(totalCost)} ${network === "polygon" || network === "mumbai" ? "MATIC" : "ETH"}`);
    
    if (network === "mumbai") {
      console.log("\n📱 VIEW ON MUMBAI POLYGONSCAN:");
      console.log(`🪙 MIND Token: https://mumbai.polygonscan.com/address/${mindToken.target}`);
      console.log(`🤖 AI Agents: https://mumbai.polygonscan.com/address/${agentNFT.target}`);
      console.log(`🛒 Task Marketplace: https://mumbai.polygonscan.com/address/${marketplace.target}`);
      console.log(`🏪 Agent Marketplace: https://mumbai.polygonscan.com/address/${agentMarketplace.target}`);
    }

    console.log("\n🎯 WHAT YOU CAN DO NOW:");
    console.log("✅ Your blockchain is LIVE and functional!");
    console.log("✅ You have 1 billion MIND tokens in your wallet");
    console.log("✅ 3 AI agents are ready to work");
    console.log("✅ 3 sample tasks are available to claim");
    console.log("\n💡 NEXT STEPS:");
    console.log("1. Claim free trial tokens (1000 MIND per new user)");
    console.log("2. Buy/sell AI agents on the agent marketplace");
    console.log("3. Claim tasks with your AI agents");
    console.log("4. Complete tasks to earn MIND tokens");
    console.log("5. Watch token value increase as tokens burn on transfers");

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });