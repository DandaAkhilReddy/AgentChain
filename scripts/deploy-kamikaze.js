const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const network = hre.network.name;
  
  console.log("🥷 DEPLOYING KAMIKAZE ECOSYSTEM TO", network.toUpperCase());
  console.log("Account:", deployer.address);
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), network === "polygon" || network === "mumbai" ? "MATIC" : "ETH");

  try {
    // 1. Deploy KAMIKAZE Token
    console.log("\n1. 🪙 Deploying KAMIKAZE Token...");
    const BasicToken = await hre.ethers.getContractFactory("BasicToken");
    const kamikazeToken = await BasicToken.deploy();
    await kamikazeToken.waitForDeployment();
    console.log("✅ KAMIKAZE Token deployed:", kamikazeToken.target);

    // 2. Deploy KAMIKAZE Staking Contract
    console.log("\n2. 💎 Deploying KAMIKAZE Staking...");
    const KamikazeStaking = await hre.ethers.getContractFactory("KamikazeStaking");
    const stakingContract = await KamikazeStaking.deploy(kamikazeToken.target);
    await stakingContract.waitForDeployment();
    console.log("✅ KAMIKAZE Staking deployed:", stakingContract.target);

    // 3. Deploy AI Agent NFT
    console.log("\n3. 🤖 Deploying AI Agent NFTs...");
    const BasicNFT = await hre.ethers.getContractFactory("BasicNFT");
    const agentNFT = await BasicNFT.deploy();
    await agentNFT.waitForDeployment();
    console.log("✅ AI Agent NFT deployed:", agentNFT.target);

    // 4. Deploy AI Agent Factory
    console.log("\n4. 🏭 Deploying AI Agent Factory...");
    const AIAgentFactory = await hre.ethers.getContractFactory("AIAgentFactory");
    const agentFactory = await AIAgentFactory.deploy(kamikazeToken.target, agentNFT.target);
    await agentFactory.waitForDeployment();
    console.log("✅ AI Agent Factory deployed:", agentFactory.target);

    // 5. Deploy Basic Marketplace
    console.log("\n5. 🛒 Deploying Task Marketplace...");
    const BasicMarketplace = await hre.ethers.getContractFactory("BasicMarketplace");
    const marketplace = await BasicMarketplace.deploy(kamikazeToken.target);
    await marketplace.waitForDeployment();
    console.log("✅ Task Marketplace deployed:", marketplace.target);

    // 6. Deploy Agent Marketplace
    console.log("\n6. 🏪 Deploying Agent Marketplace...");
    const AgentMarketplace = await hre.ethers.getContractFactory("AgentMarketplace");
    const agentMarketplace = await AgentMarketplace.deploy(kamikazeToken.target, agentNFT.target);
    await agentMarketplace.waitForDeployment();
    console.log("✅ Agent Marketplace deployed:", agentMarketplace.target);

    // 7. Setup initial staking rewards pool
    console.log("\n7. 🏆 Setting up staking rewards...");
    const stakingRewards = ethers.parseEther("10000000"); // 10M KAMIKAZE for staking rewards
    await kamikazeToken.transfer(stakingContract.target, stakingRewards);
    console.log("✅ Staking contract funded with 10M KAMIKAZE");

    // 8. Setup demo data
    console.log("\n8. 🎭 Setting up demo data...");
    
    // Create demo AI agents using the factory
    const agentCreationCost = ethers.parseEther("1000");
    const initialStake = ethers.parseEther("1000"); // Use higher stake to meet requirements
    const totalAgentCost = (agentCreationCost + initialStake) * 3n;
    
    await kamikazeToken.approve(agentFactory.target, totalAgentCost);
    
    // Create different types of agents
    await agentFactory.createAgent("content-writer", "https://api.deepseek.com/v1", initialStake);
    await agentFactory.createAgent("code-reviewer", "https://api.groq.com/openai/v1", initialStake);
    await agentFactory.createAgent("data-analyzer", "https://api.huggingface.co/models", initialStake);
    console.log("✅ Created 3 demo AI agents with factory");

    // Create demo tasks
    const taskReward = ethers.parseEther("100");
    await kamikazeToken.approve(marketplace.target, taskReward * 5n);
    
    await marketplace.createTask("Write Blog Post About AI", taskReward, 24 * 3600);
    await marketplace.createTask("Review Smart Contract Code", taskReward * 2n, 48 * 3600);
    await marketplace.createTask("Analyze Market Data", taskReward, 36 * 3600);
    await marketplace.createTask("Translate Technical Documentation", taskReward, 24 * 3600);
    await marketplace.createTask("Generate Social Media Content", taskReward, 12 * 3600);
    console.log("✅ Created 5 demo tasks");

    // Fund marketplaces
    const marketplaceFunding = ethers.parseEther("50000");
    await kamikazeToken.transfer(marketplace.target, marketplaceFunding);
    await kamikazeToken.transfer(agentMarketplace.target, marketplaceFunding);
    console.log("✅ Marketplaces funded with KAMIKAZE tokens");

    // 9. Save deployment addresses
    const deploymentData = {
      network: network,
      timestamp: new Date().toISOString(),
      contracts: {
        KAMIKAZE_TOKEN: kamikazeToken.target,
        KAMIKAZE_STAKING: stakingContract.target,
        AI_AGENT_NFT: agentNFT.target,
        AI_AGENT_FACTORY: agentFactory.target,
        TASK_MARKETPLACE: marketplace.target,
        AGENT_MARKETPLACE: agentMarketplace.target
      },
      deployer: deployer.address
    };

    console.log("\n📝 Saving deployment data...");
    const fs = require('fs');
    const path = require('path');
    
    const deploymentPath = path.join(__dirname, '..', 'deployment', `kamikaze-${network}-${Date.now()}.json`);
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentData, null, 2));
    console.log("✅ Deployment data saved to:", deploymentPath);

    // 10. Calculate deployment costs
    const totalGasUsed = 2000000n; // Approximate gas used for all contracts
    const gasPrice = await hre.ethers.provider.getFeeData();
    const totalCost = totalGasUsed * (gasPrice.gasPrice || 1000000000n);
    
    // Success summary
    console.log("\n🥷 ===== KAMIKAZE ECOSYSTEM DEPLOYED! =====");
    console.log(`Network: ${network.toUpperCase()}`);
    console.log(`KAMIKAZE Token: ${kamikazeToken.target}`);
    console.log(`KAMIKAZE Staking: ${stakingContract.target}`);
    console.log(`AI Agent NFT: ${agentNFT.target}`);
    console.log(`AI Agent Factory: ${agentFactory.target}`);
    console.log(`Task Marketplace: ${marketplace.target}`);
    console.log(`Agent Marketplace: ${agentMarketplace.target}`);
    console.log(`Total Gas Used: ~${totalGasUsed.toLocaleString()}`);
    console.log(`Estimated Cost: ~${ethers.formatEther(totalCost)} ${network === "polygon" || network === "mumbai" ? "MATIC" : "ETH"}`);
    
    if (network === "mumbai" || network === "polygon") {
      const scanUrl = network === "mumbai" ? "mumbai.polygonscan.com" : "polygonscan.com";
      console.log(`\n📱 VIEW ON ${scanUrl.toUpperCase()}:`);
      console.log(`🪙 KAMIKAZE Token: https://${scanUrl}/address/${kamikazeToken.target}`);
      console.log(`💎 Staking Contract: https://${scanUrl}/address/${stakingContract.target}`);
      console.log(`🏭 Agent Factory: https://${scanUrl}/address/${agentFactory.target}`);
      console.log(`🛒 Task Marketplace: https://${scanUrl}/address/${marketplace.target}`);
    }

    console.log("\n🎯 KAMIKAZE ECOSYSTEM FEATURES:");
    console.log("✅ 1 billion KAMIKAZE tokens with 2% burn on transfer");
    console.log("✅ Staking with 10-20% APY (based on lock period)");
    console.log("✅ AI agent creation factory with 12 templates");
    console.log("✅ Task marketplace for AI agent work");
    console.log("✅ Agent marketplace for trading AI agents");
    console.log("✅ 3 demo AI agents ready to work");
    console.log("✅ 5 sample tasks available");
    console.log("✅ 10M KAMIKAZE staking rewards pool");
    
    console.log("\n💡 NEXT STEPS:");
    console.log("1. 💰 Stake KAMIKAZE tokens to earn 10-20% APY");
    console.log("2. 🤖 Create AI agents using DeepSeek/Groq/HuggingFace APIs");
    console.log("3. 📋 Submit tasks for AI agents to complete");
    console.log("4. 💸 Earn KAMIKAZE tokens when agents complete tasks");
    console.log("5. 🔥 Watch token value increase as supply burns");
    console.log("6. 🏪 Trade AI agents on the marketplace");
    
    console.log("\n🚨 IMPORTANT NOTES:");
    console.log("• KAMIKAZE tokens have a 2% burn rate on transfers");
    console.log("• Longer staking periods = higher rewards (up to 2x multiplier)");
    console.log("• AI agents require staking KAMIKAZE to stay active");
    console.log("• Task rewards are paid in KAMIKAZE tokens");

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