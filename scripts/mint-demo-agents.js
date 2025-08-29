const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  // Replace with deployed contract addresses
  const agentNFTAddress = "0x..."; // Replace with actual deployed address
  
  const AIAgentNFT = await hre.ethers.getContractFactory("AIAgentNFT");
  const agentNFT = AIAgentNFT.attach(agentNFTAddress);

  // Demo agents with different capabilities
  const demoAgents = [
    {
      name: "TranslatorBot",
      capabilities: ["translation", "language_processing", "communication"]
    },
    {
      name: "DataAnalyst",
      capabilities: ["data_analysis", "pattern_recognition", "statistics", "reporting"]
    },
    {
      name: "CreativeAI",
      capabilities: ["content_creation", "image_generation", "writing", "design"]
    },
    {
      name: "CodeMaster",
      capabilities: ["code_generation", "debugging", "code_review", "optimization"]
    },
    {
      name: "ResearchBot",
      capabilities: ["research", "information_gathering", "fact_checking", "summarization"]
    }
  ];

  console.log("Minting demo AI agents...");

  for (let i = 0; i < demoAgents.length; i++) {
    const agent = demoAgents[i];
    
    try {
      const tx = await agentNFT.mintAgent(
        deployer.address,
        agent.name,
        agent.capabilities
      );
      
      await tx.wait();
      console.log(`✅ Minted ${agent.name} with capabilities: ${agent.capabilities.join(", ")}`);
    } catch (error) {
      console.error(`❌ Failed to mint ${agent.name}:`, error.message);
    }
  }

  console.log("\nDemo agents minted successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });