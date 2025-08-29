const hre = require("hardhat");

async function main() {
  console.log("🔍 Estimating deployment costs across different networks...\n");

  const [deployer] = await hre.ethers.getSigners();

  // Get contract factories
  const ConsciousCoin = await hre.ethers.getContractFactory("ConsciousCoin");
  const AIAgentNFT = await hre.ethers.getContractFactory("AIAgentNFT");
  const TaskMarketplace = await hre.ethers.getContractFactory("TaskMarketplace");

  // Dummy addresses for estimation
  const dummyAddress = "0x1234567890123456789012345678901234567890";

  try {
    // Estimate deployment gas
    const mindTokenGas = await ConsciousCoin.estimateGas.deploy(dummyAddress, dummyAddress);
    const agentNFTGas = await AIAgentNFT.estimateGas.deploy(dummyAddress, dummyAddress);
    const marketplaceGas = await TaskMarketplace.estimateGas.deploy(dummyAddress, dummyAddress, dummyAddress);

    const totalGas = mindTokenGas.add(agentNFTGas).add(marketplaceGas);

    console.log("📊 Gas Estimates:");
    console.log(`ConsciousCoin: ${mindTokenGas.toLocaleString()} gas`);
    console.log(`AIAgentNFT: ${agentNFTGas.toLocaleString()} gas`);
    console.log(`TaskMarketplace: ${marketplaceGas.toLocaleString()} gas`);
    console.log(`Total: ${totalGas.toLocaleString()} gas\n`);

    // Network cost estimates (approximate gas prices)
    const networks = [
      { name: "Mumbai Testnet", gasPrice: 0, symbol: "FREE", multiplier: 0 },
      { name: "Base Testnet", gasPrice: 0, symbol: "FREE", multiplier: 0 },
      { name: "Arbitrum Sepolia", gasPrice: 0, symbol: "FREE", multiplier: 0 },
      { name: "Polygon Mainnet", gasPrice: 100, symbol: "MATIC", multiplier: 0.0000001 }, // ~$0.10 per MATIC
      { name: "Arbitrum One", gasPrice: 200, symbol: "ETH", multiplier: 0.001 }, // ~$2000 per ETH
      { name: "Base Mainnet", gasPrice: 150, symbol: "ETH", multiplier: 0.001 },
      { name: "Ethereum Mainnet", gasPrice: 50000, symbol: "ETH", multiplier: 0.001 }
    ];

    console.log("💰 Deployment Cost Estimates:\n");
    console.log("Network".padEnd(20) + "Gas Cost".padEnd(15) + "USD Cost".padEnd(12) + "Status");
    console.log("-".repeat(60));

    for (const network of networks) {
      if (network.gasPrice === 0) {
        console.log(
          network.name.padEnd(20) + 
          "FREE".padEnd(15) + 
          "$0.00".padEnd(12) + 
          "✅ Recommended"
        );
      } else {
        const gasCostGwei = totalGas.mul(network.gasPrice);
        const gasCostEth = parseFloat(hre.ethers.utils.formatUnits(gasCostGwei, "gwei"));
        const usdCost = gasCostEth * network.multiplier * (network.symbol === "MATIC" ? 1000 : 1);
        
        const status = usdCost < 1 ? "✅ Cheap" : usdCost < 10 ? "⚠️ Moderate" : "❌ Expensive";
        
        console.log(
          network.name.padEnd(20) + 
          `${gasCostEth.toFixed(4)} ${network.symbol}`.padEnd(15) + 
          `$${usdCost.toFixed(2)}`.padEnd(12) + 
          status
        );
      }
    }

    console.log("\n🎯 Recommendations:");
    console.log("1. Start with Mumbai testnet (FREE) for development");
    console.log("2. Test on Base testnet (FREE) for L2 compatibility");
    console.log("3. Deploy to Polygon mainnet for production (~$0.50)");
    console.log("4. Avoid Ethereum mainnet unless absolutely necessary");

    console.log("\n⚡ Quick Deploy Commands:");
    console.log("npm run deploy:testnet -- --network mumbai      # FREE");
    console.log("npm run deploy:testnet -- --network baseTestnet # FREE");
    console.log("npm run deploy:mainnet -- --network polygon     # ~$0.50");

  } catch (error) {
    console.error("❌ Error estimating costs:", error.message);
    console.log("\n💡 Tip: Make sure contracts compile first:");
    console.log("npm run compile");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });