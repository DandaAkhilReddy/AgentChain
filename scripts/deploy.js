const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const network = hre.network.name;
  
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Network:", network);
  console.log("Account balance:", hre.ethers.utils.formatEther(await deployer.getBalance()));

  const deploymentData = {
    network: network,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {}
  };

  try {
    // 1. Deploy ConsciousCoin (MIND Token)
    console.log("\n1. Deploying ConsciousCoin...");
    const ConsciousCoin = await hre.ethers.getContractFactory("ConsciousCoin");
    
    const liquidityWallet = deployer.address; // In production, use separate wallet
    const teamWallet = deployer.address; // In production, use separate wallet
    
    const mindToken = await ConsciousCoin.deploy(liquidityWallet, teamWallet);
    await mindToken.deployed();
    
    console.log("ConsciousCoin deployed to:", mindToken.address);
    deploymentData.contracts.ConsciousCoin = {
      address: mindToken.address,
      constructorArgs: [liquidityWallet, teamWallet]
    };

    // Wait for confirmations
    await mindToken.deployTransaction.wait(2);

    // 2. Deploy AI Agent NFT
    console.log("\n2. Deploying AIAgentNFT...");
    const AIAgentNFT = await hre.ethers.getContractFactory("AIAgentNFT");
    
    const treasuryWallet = deployer.address; // In production, use treasury wallet
    const agentNFT = await AIAgentNFT.deploy(mindToken.address, treasuryWallet);
    await agentNFT.deployed();
    
    console.log("AIAgentNFT deployed to:", agentNFT.address);
    deploymentData.contracts.AIAgentNFT = {
      address: agentNFT.address,
      constructorArgs: [mindToken.address, treasuryWallet]
    };

    await agentNFT.deployTransaction.wait(2);

    // 3. Deploy Task Marketplace
    console.log("\n3. Deploying TaskMarketplace...");
    const TaskMarketplace = await hre.ethers.getContractFactory("TaskMarketplace");
    
    const marketplace = await TaskMarketplace.deploy(
      mindToken.address,
      agentNFT.address,
      treasuryWallet
    );
    await marketplace.deployed();
    
    console.log("TaskMarketplace deployed to:", marketplace.address);
    deploymentData.contracts.TaskMarketplace = {
      address: marketplace.address,
      constructorArgs: [mindToken.address, agentNFT.address, treasuryWallet]
    };

    await marketplace.deployTransaction.wait(2);

    // 4. Set up contract interactions
    console.log("\n4. Setting up contract interactions...");
    
    // Set marketplace in NFT contract
    await agentNFT.setMarketplaceContract(marketplace.address);
    console.log("Marketplace address set in NFT contract");

    // Grant necessary roles
    const MINTER_ROLE = await agentNFT.MINTER_ROLE();
    await agentNFT.grantRole(MINTER_ROLE, marketplace.address);
    console.log("Minter role granted to marketplace");

    // 5. Verify contracts (if not on hardhat network)
    if (network !== "hardhat" && network !== "localhost") {
      console.log("\n5. Waiting for block confirmations before verification...");
      await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds

      try {
        await hre.run("verify:verify", {
          address: mindToken.address,
          constructorArguments: [liquidityWallet, teamWallet],
        });
        console.log("ConsciousCoin verified");
      } catch (error) {
        console.log("ConsciousCoin verification failed:", error.message);
      }

      try {
        await hre.run("verify:verify", {
          address: agentNFT.address,
          constructorArguments: [mindToken.address, treasuryWallet],
        });
        console.log("AIAgentNFT verified");
      } catch (error) {
        console.log("AIAgentNFT verification failed:", error.message);
      }

      try {
        await hre.run("verify:verify", {
          address: marketplace.address,
          constructorArguments: [mindToken.address, agentNFT.address, treasuryWallet],
        });
        console.log("TaskMarketplace verified");
      } catch (error) {
        console.log("TaskMarketplace verification failed:", error.message);
      }
    }

    // 6. Save deployment data
    const deploymentFile = path.join(__dirname, "..", "deployment", `${network}-${Date.now()}.json`);
    if (!fs.existsSync(path.dirname(deploymentFile))) {
      fs.mkdirSync(path.dirname(deploymentFile), { recursive: true });
    }
    
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentData, null, 2));
    console.log(`\nDeployment data saved to: ${deploymentFile}`);

    // 7. Deploy summary
    console.log("\n=== DEPLOYMENT SUMMARY ===");
    console.log(`Network: ${network}`);
    console.log(`ConsciousCoin (MIND): ${mindToken.address}`);
    console.log(`AI Agent NFT: ${agentNFT.address}`);
    console.log(`Task Marketplace: ${marketplace.address}`);
    console.log(`Deployer: ${deployer.address}`);
    
    // 8. Calculate deployment costs
    const provider = hre.ethers.provider;
    const deploymentCosts = [];
    
    const mindTx = await provider.getTransaction(mindToken.deployTransaction.hash);
    const agentTx = await provider.getTransaction(agentNFT.deployTransaction.hash);
    const marketplaceTx = await provider.getTransaction(marketplace.deployTransaction.hash);
    
    const mindReceipt = await provider.getTransactionReceipt(mindToken.deployTransaction.hash);
    const agentReceipt = await provider.getTransactionReceipt(agentNFT.deployTransaction.hash);
    const marketplaceReceipt = await provider.getTransactionReceipt(marketplace.deployTransaction.hash);
    
    const totalGasUsed = mindReceipt.gasUsed.add(agentReceipt.gasUsed).add(marketplaceReceipt.gasUsed);
    const avgGasPrice = mindTx.gasPrice.add(agentTx.gasPrice).add(marketplaceTx.gasPrice).div(3);
    const totalCost = totalGasUsed.mul(avgGasPrice);
    
    console.log(`\nGas Used: ${totalGasUsed.toString()}`);
    console.log(`Average Gas Price: ${hre.ethers.utils.formatUnits(avgGasPrice, "gwei")} gwei`);
    console.log(`Total Deployment Cost: ${hre.ethers.utils.formatEther(totalCost)} ${network === "polygon" ? "MATIC" : "ETH"}`);
    
    deploymentData.gasMetrics = {
      totalGasUsed: totalGasUsed.toString(),
      avgGasPriceGwei: hre.ethers.utils.formatUnits(avgGasPrice, "gwei"),
      totalCostEth: hre.ethers.utils.formatEther(totalCost),
      currency: network === "polygon" ? "MATIC" : "ETH"
    };

    // Update deployment file with gas metrics
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentData, null, 2));

  } catch (error) {
    console.error("Deployment failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });