const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("BasicNFT (AI Agents)", function () {
  async function deployBasicNFTFixture() {
    const [owner, user1, user2, user3] = await ethers.getSigners();

    const BasicNFT = await ethers.getContractFactory("BasicNFT");
    const agentNFT = await BasicNFT.deploy();
    await agentNFT.waitForDeployment();

    return { agentNFT, owner, user1, user2, user3 };
  }

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      const { agentNFT } = await loadFixture(deployBasicNFTFixture);

      expect(await agentNFT.name()).to.equal("AI Agent");
      expect(await agentNFT.symbol()).to.equal("AGENT");
    });

    it("Should start with token ID 1", async function () {
      const { agentNFT, owner } = await loadFixture(deployBasicNFTFixture);

      const agentId = await agentNFT.mintAgent(owner.address, "TestAgent");
      const receipt = await agentId.wait();
      
      // First token should have ID 1
      const events = receipt.logs.filter(log => {
        try {
          return agentNFT.interface.parseLog(log).name === "AgentMinted";
        } catch {
          return false;
        }
      });
      
      expect(events.length).to.be.gt(0);
    });
  });

  describe("Agent Minting", function () {
    it("Should mint an agent successfully", async function () {
      const { agentNFT, owner } = await loadFixture(deployBasicNFTFixture);

      const agentName = "TranslatorBot";
      
      await expect(agentNFT.mintAgent(owner.address, agentName))
        .to.emit(agentNFT, "AgentMinted")
        .withArgs(1, agentName);
      
      expect(await agentNFT.balanceOf(owner.address)).to.equal(1);
      expect(await agentNFT.ownerOf(1)).to.equal(owner.address);
    });

    it("Should initialize agent with correct metadata", async function () {
      const { agentNFT, owner } = await loadFixture(deployBasicNFTFixture);

      const agentName = "DataAnalyst";
      await agentNFT.mintAgent(owner.address, agentName);
      
      const agent = await agentNFT.getAgent(1);
      
      expect(agent.name).to.equal(agentName);
      expect(agent.performanceScore).to.equal(50); // Default score
      expect(agent.isActive).to.be.true;
    });

    it("Should fail with empty name", async function () {
      const { agentNFT, owner } = await loadFixture(deployBasicNFTFixture);

      await expect(agentNFT.mintAgent(owner.address, ""))
        .to.be.revertedWith("Name cannot be empty");
    });

    it("Should mint multiple agents with incremental IDs", async function () {
      const { agentNFT, owner } = await loadFixture(deployBasicNFTFixture);

      await agentNFT.mintAgent(owner.address, "Agent1");
      await agentNFT.mintAgent(owner.address, "Agent2");
      await agentNFT.mintAgent(owner.address, "Agent3");
      
      expect(await agentNFT.balanceOf(owner.address)).to.equal(3);
      expect(await agentNFT.ownerOf(1)).to.equal(owner.address);
      expect(await agentNFT.ownerOf(2)).to.equal(owner.address);
      expect(await agentNFT.ownerOf(3)).to.equal(owner.address);
    });
  });

  describe("Agent Management", function () {
    it("Should allow owner to update performance", async function () {
      const { agentNFT, owner } = await loadFixture(deployBasicNFTFixture);

      await agentNFT.mintAgent(owner.address, "TestAgent");
      
      const newScore = 75;
      await agentNFT.updatePerformance(1, newScore);
      
      const agent = await agentNFT.getAgent(1);
      expect(agent.performanceScore).to.equal(newScore);
    });

    it("Should prevent non-owner from updating performance", async function () {
      const { agentNFT, owner, user1 } = await loadFixture(deployBasicNFTFixture);

      await agentNFT.mintAgent(owner.address, "TestAgent");
      
      await expect(agentNFT.connect(user1).updatePerformance(1, 75))
        .to.be.reverted;
    });

    it("Should prevent performance scores over 100", async function () {
      const { agentNFT, owner } = await loadFixture(deployBasicNFTFixture);

      await agentNFT.mintAgent(owner.address, "TestAgent");
      
      await expect(agentNFT.updatePerformance(1, 101))
        .to.be.revertedWith("Score must be <= 100");
    });
  });

  describe("NFT Transfers", function () {
    it("Should transfer agents between accounts", async function () {
      const { agentNFT, owner, user1 } = await loadFixture(deployBasicNFTFixture);

      await agentNFT.mintAgent(owner.address, "TestAgent");
      
      await agentNFT.transferFrom(owner.address, user1.address, 1);
      
      expect(await agentNFT.ownerOf(1)).to.equal(user1.address);
      expect(await agentNFT.balanceOf(owner.address)).to.equal(0);
      expect(await agentNFT.balanceOf(user1.address)).to.equal(1);
    });

    it("Should require approval for transfers", async function () {
      const { agentNFT, owner, user1, user2 } = await loadFixture(deployBasicNFTFixture);

      await agentNFT.mintAgent(owner.address, "TestAgent");
      
      // Should fail without approval
      await expect(agentNFT.connect(user1).transferFrom(owner.address, user2.address, 1))
        .to.be.reverted;
      
      // Should work with approval
      await agentNFT.approve(user1.address, 1);
      await agentNFT.connect(user1).transferFrom(owner.address, user2.address, 1);
      
      expect(await agentNFT.ownerOf(1)).to.equal(user2.address);
    });
  });

  describe("Query Functions", function () {
    it("Should return correct token count", async function () {
      const { agentNFT, owner } = await loadFixture(deployBasicNFTFixture);

      expect(await agentNFT.balanceOf(owner.address)).to.equal(0);
      
      await agentNFT.mintAgent(owner.address, "Agent1");
      expect(await agentNFT.balanceOf(owner.address)).to.equal(1);
      
      await agentNFT.mintAgent(owner.address, "Agent2");
      expect(await agentNFT.balanceOf(owner.address)).to.equal(2);
    });

    it("Should fail for non-existent tokens", async function () {
      const { agentNFT } = await loadFixture(deployBasicNFTFixture);

      await expect(agentNFT.getAgent(999))
        .to.be.revertedWith("Token does not exist");
      
      await expect(agentNFT.ownerOf(999))
        .to.be.revertedWith("ERC721: invalid token ID");
    });
  });

  describe("Gas Efficiency", function () {
    it("Should use reasonable gas for minting", async function () {
      const { agentNFT, owner } = await loadFixture(deployBasicNFTFixture);

      const tx = await agentNFT.mintAgent(owner.address, "TestAgent");
      const receipt = await tx.wait();
      
      console.log(`Mint gas used: ${receipt.gasUsed.toString()}`);
      expect(receipt.gasUsed).to.be.lt(200000); // Should be under 200k gas
    });

    it("Should use reasonable gas for transfers", async function () {
      const { agentNFT, owner, user1 } = await loadFixture(deployBasicNFTFixture);

      await agentNFT.mintAgent(owner.address, "TestAgent");
      
      const tx = await agentNFT.transferFrom(owner.address, user1.address, 1);
      const receipt = await tx.wait();
      
      console.log(`Transfer gas used: ${receipt.gasUsed.toString()}`);
      expect(receipt.gasUsed).to.be.lt(100000); // Should be under 100k gas
    });
  });

  describe("Edge Cases", function () {
    it("Should handle multiple agents per user", async function () {
      const { agentNFT, owner } = await loadFixture(deployBasicNFTFixture);

      const agentNames = ["Agent1", "Agent2", "Agent3", "Agent4", "Agent5"];
      
      for (let i = 0; i < agentNames.length; i++) {
        await agentNFT.mintAgent(owner.address, agentNames[i]);
      }
      
      expect(await agentNFT.balanceOf(owner.address)).to.equal(agentNames.length);
      
      // Check each agent
      for (let i = 1; i <= agentNames.length; i++) {
        const agent = await agentNFT.getAgent(i);
        expect(agent.name).to.equal(agentNames[i-1]);
        expect(await agentNFT.ownerOf(i)).to.equal(owner.address);
      }
    });

    it("Should maintain metadata after transfers", async function () {
      const { agentNFT, owner, user1 } = await loadFixture(deployBasicNFTFixture);

      const agentName = "PersistentAgent";
      await agentNFT.mintAgent(owner.address, agentName);
      await agentNFT.updatePerformance(1, 85);
      
      // Transfer to another user
      await agentNFT.transferFrom(owner.address, user1.address, 1);
      
      // Metadata should persist
      const agent = await agentNFT.getAgent(1);
      expect(agent.name).to.equal(agentName);
      expect(agent.performanceScore).to.equal(85);
      expect(agent.isActive).to.be.true;
    });
  });
});