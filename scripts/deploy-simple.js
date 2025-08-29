const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const network = hre.network.name;
  
  console.log("🚀 Deploying AgentChains contracts...");
  console.log("Account:", deployer.address);
  console.log("Network:", network);
  console.log("Balance:", hre.ethers.formatEther(await deployer.provider.getBalance(deployer.address)), network === "polygon" ? "MATIC" : "ETH");

  const deploymentData = {
    network: network,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {}
  };

  try {
    // 1. Deploy BasicToken (MIND Token)
    console.log("\n1. 🪙 Deploying ConsciousCoin (BasicToken)...");
    const BasicToken = await hre.ethers.getContractFactory("BasicToken");
    const mindToken = await BasicToken.deploy();
    await mindToken.waitForDeployment();
    
    console.log("✅ ConsciousCoin deployed to:", await mindToken.getAddress());
    deploymentData.contracts.BasicToken = {
      address: await mindToken.getAddress(),
      constructorArgs: []
    };

    // 2. Deploy BasicNFT
    console.log("\n2. 🤖 Deploying BasicNFT...");
    const BasicNFT = await hre.ethers.getContractFactory("BasicNFT");
    const agentNFT = await BasicNFT.deploy();
    await agentNFT.waitForDeployment();
    
    console.log("✅ BasicNFT deployed to:", await agentNFT.getAddress());
    deploymentData.contracts.BasicNFT = {
      address: await agentNFT.getAddress(),
      constructorArgs: []
    };

    // 3. Deploy BasicMarketplace
    console.log("\n3. 🛒 Deploying BasicMarketplace...");
    const BasicMarketplace = await hre.ethers.getContractFactory("BasicMarketplace");
    const marketplace = await BasicMarketplace.deploy(
      await mindToken.getAddress()
    );
    await marketplace.waitForDeployment();
    
    console.log("✅ BasicMarketplace deployed to:", await marketplace.getAddress());
    deploymentData.contracts.BasicMarketplace = {
      address: await marketplace.getAddress(),
      constructorArgs: [await mindToken.getAddress()]
    };

    // 4. Setup contracts (Basic contracts don't need complex setup)
    console.log("\n4. ⚙️ Contracts deployed and ready...");

    // 5. Mint some demo agents
    console.log("\n5. 🎭 Minting demo AI agents...");
    
    const demoAgents = [
      { name: "TranslatorBot" },
      { name: "DataAnalyst" },
      { name: "CreativeAI" }
    ];

    for (let i = 0; i < demoAgents.length; i++) {
      const agent = demoAgents[i];
      const tx = await agentNFT.mintAgent(
        deployer.address,
        agent.name
      );
      await tx.wait();
      console.log(`✅ Minted ${agent.name}`);
    }

    // 6. Create sample tasks
    console.log("\n6. 📋 Creating sample tasks...");
    
    // First, approve marketplace to spend tokens
    const approveAmount = hre.ethers.parseEther("1000");
    await mindToken.approve(await marketplace.getAddress(), approveAmount);
    
    const sampleTasks = [
      {
        title: "Translate Document",
        reward: hre.ethers.parseEther("50"),
        duration: 24 * 3600, // 24 hours
      },
      {
        title: "Data Analysis Report",
        reward: hre.ethers.parseEther("100"),
        duration: 48 * 3600, // 48 hours
      }
    ];

    for (let i = 0; i < sampleTasks.length; i++) {
      const task = sampleTasks[i];
      const tx = await marketplace.createTask(
        task.title,
        task.reward,
        task.duration
      );
      await tx.wait();
      console.log(`✅ Created task: ${task.title}`);
    }

    // 7. Calculate deployment costs
    console.log("\n7. 💰 Calculating deployment costs...");
    
    const mindReceipt = await hre.ethers.provider.getTransactionReceipt(mindToken.deploymentTransaction().hash);
    const agentReceipt = await hre.ethers.provider.getTransactionReceipt(agentNFT.deploymentTransaction().hash);
    const marketplaceReceipt = await hre.ethers.provider.getTransactionReceipt(marketplace.deploymentTransaction().hash);
    
    const totalGasUsed = mindReceipt.gasUsed + agentReceipt.gasUsed + marketplaceReceipt.gasUsed;
    const gasPrice = mindReceipt.gasPrice;
    const totalCost = totalGasUsed * gasPrice;
    
    console.log(`Gas Used: ${totalGasUsed.toLocaleString()}`);
    console.log(`Gas Price: ${hre.ethers.formatUnits(gasPrice, "gwei")} gwei`);
    console.log(`Total Cost: ${hre.ethers.formatEther(totalCost)} ${network === "polygon" || network === "mumbai" ? "MATIC" : "ETH"}`);
    
    deploymentData.gasMetrics = {
      totalGasUsed: totalGasUsed.toString(),
      gasPriceGwei: hre.ethers.formatUnits(gasPrice, "gwei"),
      totalCostEth: hre.ethers.formatEther(totalCost),
      currency: network === "polygon" || network === "mumbai" ? "MATIC" : "ETH"
    };

    // 8. Save deployment data
    const deploymentFile = path.join(__dirname, "..", "deployment", `simple-${network}-${Date.now()}.json`);
    if (!fs.existsSync(path.dirname(deploymentFile))) {
      fs.mkdirSync(path.dirname(deploymentFile), { recursive: true });
    }
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentData, null, 2));

    // 9. Display success message
    console.log("\n🎉 ===== AgentChains DEPLOYMENT SUCCESSFUL! =====");
    console.log(`Network: ${network.toUpperCase()}`);
    console.log(`MIND Token: ${await mindToken.getAddress()}`);
    console.log(`AI Agent NFT: ${await agentNFT.getAddress()}`);
    console.log(`Task Marketplace: ${await marketplace.getAddress()}`);
    console.log(`Total Cost: ${hre.ethers.formatEther(totalCost)} ${deploymentData.gasMetrics.currency}`);
    console.log("\n✨ Your AgentChains blockchain is now LIVE and ready to use!");
    
    if (network === "mumbai") {
      console.log("\n📱 View on PolygonScan Mumbai:");
      console.log(`🪙 MIND Token: https://mumbai.polygonscan.com/address/${await mindToken.getAddress()}`);
      console.log(`🤖 AI Agents: https://mumbai.polygonscan.com/address/${await agentNFT.getAddress()}`);
      console.log(`🛒 Marketplace: https://mumbai.polygonscan.com/address/${await marketplace.getAddress()}`);
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