/**
 * KAMIKAZE Token Deployment Script
 * Deploys the KAMIKAZE token with real-time world population supply
 */

const hre = require("hardhat");
const path = require("path");

// Import our population API
const WorldPopulationAPI = require("../services/population-api.js");

async function main() {
    console.log("🚀 Deploying KAMIKAZE Token Contract...");
    console.log("🌍 Fetching current world population...\n");
    
    // Get real-time world population
    const populationAPI = new WorldPopulationAPI();
    const populationData = await populationAPI.getCurrentPopulation();
    
    console.log("📊 Real-time Population Data:");
    console.log("Current Population:", populationData.population.toLocaleString());
    console.log("Formatted:", populationData.formatted);
    console.log("Data Source:", populationData.source);
    console.log("Timestamp:", populationData.timestamp);
    
    console.log("\n💎 Token Economics:");
    console.log("Total Supply:", populationData.population.toLocaleString(), "KAMIKAZE");
    console.log("🎁 Free Distribution: 1000 tokens per wallet");
    console.log("🔥 Burn Rate: 2% on transfers");
    console.log("🌍 1 token = 1 person on Earth");
    
    // Get the ContractFactory and Signers here.
    const [deployer] = await hre.ethers.getSigners();
    console.log("\n🔑 Deploying from account:", deployer.address);
    
    // Check balance
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH");
    
    // Deploy the contract with current world population
    const KAMIKAZE = await hre.ethers.getContractFactory("KAMIKAZE");
    console.log("\n⚙️ Deploying contract with population:", populationData.population.toLocaleString());
    const kamikaze = await KAMIKAZE.deploy(populationData.population);
    
    await kamikaze.waitForDeployment();
    const contractAddress = await kamikaze.getAddress();
    
    console.log("✅ KAMIKAZE Token deployed to:", contractAddress);
    
    // Verify contract stats
    const totalSupply = await kamikaze.totalSupply();
    const contractBalance = await kamikaze.balanceOf(contractAddress);
    const freeTokenAmount = await kamikaze.FREE_TOKEN_AMOUNT();
    const maxSupply = await kamikaze.MAX_SUPPLY();
    
    console.log("\n📈 Contract Statistics:");
    console.log("Total Supply:", hre.ethers.formatEther(totalSupply), "KAMIKAZE");
    console.log("Contract Balance:", hre.ethers.formatEther(contractBalance), "KAMIKAZE");
    console.log("Free Token Amount:", hre.ethers.formatEther(freeTokenAmount), "KAMIKAZE");
    console.log("Max Supply:", hre.ethers.formatEther(maxSupply), "KAMIKAZE");
    
    // Calculate how many people can claim free tokens
    const maxClaimants = Number(contractBalance) / Number(freeTokenAmount);
    console.log("Max Free Token Claimants:", Math.floor(maxClaimants).toLocaleString(), "people");
    
    console.log("\n🌍 Real-Time Population Token Economics:");
    console.log("Current World Population:", populationData.population.toLocaleString(), "people");
    console.log("Total KAMIKAZE Tokens:", populationData.population.toLocaleString());
    console.log("Each person can claim 1000 tokens from the free pool");
    console.log("Population Source:", populationData.source);
    console.log("Revolutionary universal basic crypto income!");
    
    // Save deployment info with population data
    const deploymentInfo = {
        network: hre.network.name,
        contractAddress: contractAddress,
        deployerAddress: deployer.address,
        timestamp: new Date().toISOString(),
        blockNumber: await hre.ethers.provider.getBlockNumber(),
        totalSupply: totalSupply.toString(),
        maxSupply: maxSupply.toString(),
        freeTokenAmount: freeTokenAmount.toString(),
        worldPopulation: populationData.population,
        populationSource: populationData.source,
        populationTimestamp: populationData.timestamp
    };
    
    console.log("\n💾 Deployment completed!");
    console.log("Contract Address:", contractAddress);
    console.log("Network:", hre.network.name);
    console.log("Block Number:", deploymentInfo.blockNumber);
    
    // Instructions for updating frontend
    console.log("\n🔧 Next Steps:");
    console.log("1. Update web3-integration.js with contract address:", contractAddress);
    console.log("2. Update dashboard to use real contract data");
    console.log("3. Test token claiming and sending functionality");
    console.log("4. Deploy to mainnet for public use");
    
    return deploymentInfo;
}

// Error handling
main()
    .then((deploymentInfo) => {
        console.log("\n✅ Deployment successful!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ Deployment failed:");
        console.error(error);
        process.exit(1);
    });