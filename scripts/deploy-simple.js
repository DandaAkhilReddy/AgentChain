const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const network = hre.network.name;
  
  console.log("🚀 Deploying SIMPLE blockchain contracts...");
  console.log("Account:", deployer.address);
  console.log("Network:", network);
  console.log("Balance:", hre.ethers.utils.formatEther(await deployer.getBalance()), network === "polygon" ? "MATIC" : "ETH");

  const deploymentData = {
    network: network,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {}
  };

  try {
    // 1. Deploy SimpleConsciousCoin (MIND Token)
    console.log("\n1. 🪙 Deploying SimpleConsciousCoin...");
    const SimpleConsciousCoin = await hre.ethers.getContractFactory("SimpleConsciousCoin");
    const mindToken = await SimpleConsciousCoin.deploy();
    await mindToken.deployed();
    
    console.log("✅ ConsciousCoin deployed to:", mindToken.address);
    deploymentData.contracts.SimpleConsciousCoin = {
      address: mindToken.address,
      constructorArgs: []
    };

    // 2. Deploy SimpleAIAgentNFT
    console.log("\n2. 🤖 Deploying SimpleAIAgentNFT...");
    const SimpleAIAgentNFT = await hre.ethers.getContractFactory("SimpleAIAgentNFT");
    const treasuryWallet = deployer.address; // In production, use separate treasury
    const agentNFT = await SimpleAIAgentNFT.deploy(mindToken.address, treasuryWallet);
    await agentNFT.deployed();
    
    console.log("✅ AIAgentNFT deployed to:", agentNFT.address);
    deploymentData.contracts.SimpleAIAgentNFT = {
      address: agentNFT.address,
      constructorArgs: [mindToken.address, treasuryWallet]
    };

    // 3. Deploy SimpleTaskMarketplace
    console.log("\n3. 🛒 Deploying SimpleTaskMarketplace...");
    const SimpleTaskMarketplace = await hre.ethers.getContractFactory("SimpleTaskMarketplace");
    const marketplace = await SimpleTaskMarketplace.deploy(
      mindToken.address,
      agentNFT.address,
      treasuryWallet
    );
    await marketplace.deployed();
    
    console.log("✅ TaskMarketplace deployed to:", marketplace.address);
    deploymentData.contracts.SimpleTaskMarketplace = {
      address: marketplace.address,
      constructorArgs: [mindToken.address, agentNFT.address, treasuryWallet]
    };

    // 4. Setup contract interactions
    console.log("\n4. ⚙️ Setting up contract interactions...");
    
    // Set marketplace in NFT contract
    await agentNFT.setMarketplaceContract(marketplace.address);
    console.log("✅ Marketplace connected to NFT contract");

    // Authorize marketplace in NFT contract
    await agentNFT.authorizeContract(marketplace.address);
    console.log("✅ Marketplace authorized in NFT contract");

    // 5. Mint some demo agents
    console.log("\n5. 🎭 Minting demo AI agents...");
    
    const demoAgents = [
      { name: "TranslatorBot", capabilities: ["translation", "language"] },
      { name: "DataAnalyst", capabilities: ["analysis", "data", "statistics"] },
      { name: "CreativeAI", capabilities: ["creation", "content", "writing"] }
    ];

    for (let i = 0; i < demoAgents.length; i++) {
      const agent = demoAgents[i];
      const tx = await agentNFT.mintAgent(
        deployer.address,
        agent.name,
        agent.capabilities
      );
      await tx.wait();
      console.log(`✅ Minted ${agent.name}`);
    }

    // 6. Create sample tasks
    console.log("\n6. 📋 Creating sample tasks...");
    
    // First, approve marketplace to spend tokens
    const approveAmount = hre.ethers.utils.parseEther("1000");
    await mindToken.approve(marketplace.address, approveAmount);
    
    const sampleTasks = [
      {
        title: "Translate Document",
        description: "Translate English document to Spanish",
        category: 0, // Translation
        reward: hre.ethers.utils.parseEther("50"),
        duration: 24 * 3600, // 24 hours
        capabilities: ["translation"]
      },
      {
        title: "Data Analysis Report",
        description: "Analyze sales data and create report",
        category: 1, // Analysis
        reward: hre.ethers.utils.parseEther("100"),
        duration: 48 * 3600, // 48 hours
        capabilities: ["analysis", "data"]
      }
    ];

    for (let i = 0; i < sampleTasks.length; i++) {
      const task = sampleTasks[i];
      const tx = await marketplace.createTask(
        task.title,
        task.description,
        task.category,
        task.reward,
        task.duration,
        task.capabilities
      );
      await tx.wait();
      console.log(`✅ Created task: ${task.title}`);
    }

    // 7. Calculate deployment costs
    console.log("\n7. 💰 Calculating deployment costs...");
    
    const mindReceipt = await hre.ethers.provider.getTransactionReceipt(mindToken.deployTransaction.hash);
    const agentReceipt = await hre.ethers.provider.getTransactionReceipt(agentNFT.deployTransaction.hash);
    const marketplaceReceipt = await hre.ethers.provider.getTransactionReceipt(marketplace.deployTransaction.hash);
    
    const totalGasUsed = mindReceipt.gasUsed.add(agentReceipt.gasUsed).add(marketplaceReceipt.gasUsed);
    const gasPrice = mindReceipt.effectiveGasPrice;
    const totalCost = totalGasUsed.mul(gasPrice);
    
    console.log(`Gas Used: ${totalGasUsed.toLocaleString()}`);
    console.log(`Gas Price: ${hre.ethers.utils.formatUnits(gasPrice, "gwei")} gwei`);
    console.log(`Total Cost: ${hre.ethers.utils.formatEther(totalCost)} ${network === "polygon" || network === "mumbai" ? "MATIC" : "ETH"}`);
    
    deploymentData.gasMetrics = {
      totalGasUsed: totalGasUsed.toString(),
      gasPriceGwei: hre.ethers.utils.formatUnits(gasPrice, "gwei"),
      totalCostEth: hre.ethers.utils.formatEther(totalCost),
      currency: network === "polygon" || network === "mumbai" ? "MATIC" : "ETH"
    };

    // 8. Save deployment data
    const deploymentFile = path.join(__dirname, "..", "deployment", `simple-${network}-${Date.now()}.json`);
    if (!fs.existsSync(path.dirname(deploymentFile))) {
      fs.mkdirSync(path.dirname(deploymentFile), { recursive: true });
    }
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentData, null, 2));

    // 9. Display success message
    console.log("\n🎉 ===== DEPLOYMENT SUCCESSFUL! =====");
    console.log(`Network: ${network.toUpperCase()}`);
    console.log(`MIND Token: ${mindToken.address}`);
    console.log(`AI Agent NFT: ${agentNFT.address}`);
    console.log(`Task Marketplace: ${marketplace.address}`);
    console.log(`Total Cost: ${hre.ethers.utils.formatEther(totalCost)} ${deploymentData.gasMetrics.currency}`);
    console.log("\n✨ Your blockchain is now LIVE and ready to use!");
    
    if (network === "mumbai") {
      console.log("\n📱 View on PolygonScan Mumbai:");
      console.log(`🪙 MIND Token: https://mumbai.polygonscan.com/address/${mindToken.address}`);
      console.log(`🤖 AI Agents: https://mumbai.polygonscan.com/address/${agentNFT.address}`);
      console.log(`🛒 Marketplace: https://mumbai.polygonscan.com/address/${marketplace.address}`);
    }

    console.log("\n🎯 Next Steps:");
    console.log("1. Claim tasks with your AI agents");
    console.log("2. Complete tasks to earn MIND tokens");
    console.log("3. Upgrade your agents with new capabilities");
    console.log("4. Create your own tasks for other agents");

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