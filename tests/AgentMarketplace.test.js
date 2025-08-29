const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("AgentMarketplace", function () {
  async function deployAgentMarketplaceFixture() {
    const [owner, seller, buyer, user1, user2] = await ethers.getSigners();

    // Deploy MIND token
    const BasicToken = await ethers.getContractFactory("BasicToken");
    const mindToken = await BasicToken.deploy();
    await mindToken.waitForDeployment();

    // Deploy Agent NFT
    const BasicNFT = await ethers.getContractFactory("BasicNFT");
    const agentNFT = await BasicNFT.deploy();
    await agentNFT.waitForDeployment();

    // Deploy Agent Marketplace
    const AgentMarketplace = await ethers.getContractFactory("AgentMarketplace");
    const agentMarketplace = await AgentMarketplace.deploy(mindToken.target, agentNFT.target);
    await agentMarketplace.waitForDeployment();

    // Setup: Transfer tokens and mint agents
    const tokenAmount = ethers.parseEther("10000");
    await mindToken.transfer(seller.address, tokenAmount);
    await mindToken.transfer(buyer.address, tokenAmount);
    await mindToken.transfer(user1.address, tokenAmount);

    // Fund marketplace with trial tokens
    const trialReserve = ethers.parseEther("100000");
    await mindToken.transfer(agentMarketplace.target, trialReserve);

    // Mint test agents
    await agentNFT.mintAgent(seller.address, "SalesBot");
    await agentNFT.mintAgent(seller.address, "AnalyzerBot");
    await agentNFT.mintAgent(buyer.address, "BuyerBot");

    return {
      agentMarketplace,
      mindToken,
      agentNFT,
      owner,
      seller,
      buyer,
      user1,
      user2,
      tokenAmount,
    };
  }

  describe("Deployment", function () {
    it("Should set correct token and NFT addresses", async function () {
      const { agentMarketplace, mindToken, agentNFT } = await loadFixture(
        deployAgentMarketplaceFixture
      );

      expect(await agentMarketplace.mindToken()).to.equal(mindToken.target);
      expect(await agentMarketplace.agentNFT()).to.equal(agentNFT.target);
    });

    it("Should set marketplace fee correctly", async function () {
      const { agentMarketplace } = await loadFixture(deployAgentMarketplaceFixture);

      expect(await agentMarketplace.MARKETPLACE_FEE()).to.equal(200); // 2%
      expect(await agentMarketplace.BASIS_POINTS()).to.equal(10000);
    });
  });

  describe("Trial Token System", function () {
    it("Should allow users to claim trial tokens once", async function () {
      const { agentMarketplace, mindToken, user1 } = await loadFixture(
        deployAgentMarketplaceFixture
      );

      const initialBalance = await mindToken.balanceOf(user1.address);
      const trialAmount = ethers.parseEther("1000");

      await expect(agentMarketplace.connect(user1).claimTrialTokens())
        .to.emit(agentMarketplace, "TrialTokensClaimed")
        .withArgs(user1.address, trialAmount);

      const finalBalance = await mindToken.balanceOf(user1.address);
      expect(finalBalance - initialBalance).to.equal(trialAmount);

      expect(await agentMarketplace.hasClaimedTrial(user1.address)).to.be.true;
    });

    it("Should prevent claiming trial tokens twice", async function () {
      const { agentMarketplace, user1 } = await loadFixture(
        deployAgentMarketplaceFixture
      );

      await agentMarketplace.connect(user1).claimTrialTokens();

      await expect(
        agentMarketplace.connect(user1).claimTrialTokens()
      ).to.be.revertedWith("Trial tokens already claimed");
    });

    it("Should track trial token claims correctly", async function () {
      const { agentMarketplace, user1, user2 } = await loadFixture(
        deployAgentMarketplaceFixture
      );

      expect(await agentMarketplace.hasClaimedTrial(user1.address)).to.be.false;
      expect(await agentMarketplace.hasClaimedTrial(user2.address)).to.be.false;

      await agentMarketplace.connect(user1).claimTrialTokens();

      expect(await agentMarketplace.hasClaimedTrial(user1.address)).to.be.true;
      expect(await agentMarketplace.hasClaimedTrial(user2.address)).to.be.false;
    });
  });

  describe("Agent Listing", function () {
    it("Should allow agent owner to list agent for sale", async function () {
      const { agentMarketplace, agentNFT, seller } = await loadFixture(
        deployAgentMarketplaceFixture
      );

      const agentId = 1;
      const price = ethers.parseEther("500");

      // Approve marketplace to handle NFT
      await agentNFT.connect(seller).approve(agentMarketplace.target, agentId);

      await expect(agentMarketplace.connect(seller).listAgent(agentId, price))
        .to.emit(agentMarketplace, "AgentListed")
        .withArgs(agentId, seller.address, price);

      // Check that agent is now owned by marketplace (escrowed)
      expect(await agentNFT.ownerOf(agentId)).to.equal(agentMarketplace.target);

      // Check listing details
      const listing = await agentMarketplace.getListing(agentId);
      expect(listing.seller).to.equal(seller.address);
      expect(listing.price).to.equal(price);
      expect(listing.active).to.be.true;
    });

    it("Should fail if non-owner tries to list agent", async function () {
      const { agentMarketplace, buyer } = await loadFixture(
        deployAgentMarketplaceFixture
      );

      const agentId = 1;
      const price = ethers.parseEther("500");

      await expect(
        agentMarketplace.connect(buyer).listAgent(agentId, price)
      ).to.be.revertedWith("Not agent owner");
    });

    it("Should fail if price is zero", async function () {
      const { agentMarketplace, agentNFT, seller } = await loadFixture(
        deployAgentMarketplaceFixture
      );

      const agentId = 1;
      await agentNFT.connect(seller).approve(agentMarketplace.target, agentId);

      await expect(
        agentMarketplace.connect(seller).listAgent(agentId, 0)
      ).to.be.revertedWith("Price must be greater than 0");
    });

    it("Should fail if agent already listed", async function () {
      const { agentMarketplace, agentNFT, seller } = await loadFixture(
        deployAgentMarketplaceFixture
      );

      const agentId = 1;
      const price = ethers.parseEther("500");

      await agentNFT.connect(seller).approve(agentMarketplace.target, agentId);
      await agentMarketplace.connect(seller).listAgent(agentId, price);

      await expect(
        agentMarketplace.connect(seller).listAgent(agentId, price)
      ).to.be.revertedWith("Agent already listed");
    });

    it("Should update active listings array", async function () {
      const { agentMarketplace, agentNFT, seller } = await loadFixture(
        deployAgentMarketplaceFixture
      );

      const agentId1 = 1;
      const agentId2 = 2;
      const price = ethers.parseEther("500");

      await agentNFT.connect(seller).approve(agentMarketplace.target, agentId1);
      await agentNFT.connect(seller).approve(agentMarketplace.target, agentId2);

      await agentMarketplace.connect(seller).listAgent(agentId1, price);
      await agentMarketplace.connect(seller).listAgent(agentId2, price);

      const activeListings = await agentMarketplace.getActiveListings();
      expect(activeListings.length).to.equal(2);
      expect(activeListings).to.include(BigInt(agentId1));
      expect(activeListings).to.include(BigInt(agentId2));
    });
  });

  describe("Agent Buying", function () {
    it("Should allow users to buy listed agents", async function () {
      const { agentMarketplace, mindToken, agentNFT, seller, buyer } =
        await loadFixture(deployAgentMarketplaceFixture);

      const agentId = 1;
      const price = ethers.parseEther("500");

      // List agent
      await agentNFT.connect(seller).approve(agentMarketplace.target, agentId);
      await agentMarketplace.connect(seller).listAgent(agentId, price);

      // Buyer approves marketplace to spend tokens
      await mindToken.connect(buyer).approve(agentMarketplace.target, price);

      const initialBuyerBalance = await mindToken.balanceOf(buyer.address);
      const initialSellerBalance = await mindToken.balanceOf(seller.address);

      await expect(agentMarketplace.connect(buyer).buyAgent(agentId))
        .to.emit(agentMarketplace, "AgentSold")
        .withArgs(agentId, seller.address, buyer.address, price);

      // Check NFT ownership
      expect(await agentNFT.ownerOf(agentId)).to.equal(buyer.address);

      // Check token transfers (accounting for 2% burn on transfer and marketplace fee)
      const finalBuyerBalance = await mindToken.balanceOf(buyer.address);
      const finalSellerBalance = await mindToken.balanceOf(seller.address);

      const fee = (price * 200n) / 10000n; // 2% marketplace fee
      const sellerAmount = price - fee;
      
      // Buyer paid the full price
      expect(initialBuyerBalance - finalBuyerBalance).to.be.gt(price); // More due to burn

      // Seller received amount after fee and burn
      expect(finalSellerBalance).to.be.gt(initialSellerBalance);

      // Check listing is inactive
      const listing = await agentMarketplace.getListing(agentId);
      expect(listing.active).to.be.false;
    });

    it("Should fail if agent not for sale", async function () {
      const { agentMarketplace, buyer } = await loadFixture(
        deployAgentMarketplaceFixture
      );

      const agentId = 1;

      await expect(
        agentMarketplace.connect(buyer).buyAgent(agentId)
      ).to.be.revertedWith("Agent not for sale");
    });

    it("Should fail if seller tries to buy own agent", async function () {
      const { agentMarketplace, agentNFT, seller } = await loadFixture(
        deployAgentMarketplaceFixture
      );

      const agentId = 1;
      const price = ethers.parseEther("500");

      await agentNFT.connect(seller).approve(agentMarketplace.target, agentId);
      await agentMarketplace.connect(seller).listAgent(agentId, price);

      await expect(
        agentMarketplace.connect(seller).buyAgent(agentId)
      ).to.be.revertedWith("Cannot buy your own agent");
    });
  });

  describe("Agent Delisting", function () {
    it("Should allow seller to delist their agent", async function () {
      const { agentMarketplace, agentNFT, seller } = await loadFixture(
        deployAgentMarketplaceFixture
      );

      const agentId = 1;
      const price = ethers.parseEther("500");

      // List agent
      await agentNFT.connect(seller).approve(agentMarketplace.target, agentId);
      await agentMarketplace.connect(seller).listAgent(agentId, price);

      await expect(agentMarketplace.connect(seller).delistAgent(agentId))
        .to.emit(agentMarketplace, "AgentDelisted")
        .withArgs(agentId, seller.address);

      // Check NFT returned to seller
      expect(await agentNFT.ownerOf(agentId)).to.equal(seller.address);

      // Check listing is inactive
      const listing = await agentMarketplace.getListing(agentId);
      expect(listing.active).to.be.false;
    });

    it("Should fail if non-seller tries to delist", async function () {
      const { agentMarketplace, agentNFT, seller, buyer } = await loadFixture(
        deployAgentMarketplaceFixture
      );

      const agentId = 1;
      const price = ethers.parseEther("500");

      await agentNFT.connect(seller).approve(agentMarketplace.target, agentId);
      await agentMarketplace.connect(seller).listAgent(agentId, price);

      await expect(
        agentMarketplace.connect(buyer).delistAgent(agentId)
      ).to.be.revertedWith("Only seller can delist");
    });
  });

  describe("Price Updates", function () {
    it("Should allow seller to update listing price", async function () {
      const { agentMarketplace, agentNFT, seller } = await loadFixture(
        deployAgentMarketplaceFixture
      );

      const agentId = 1;
      const oldPrice = ethers.parseEther("500");
      const newPrice = ethers.parseEther("750");

      await agentNFT.connect(seller).approve(agentMarketplace.target, agentId);
      await agentMarketplace.connect(seller).listAgent(agentId, oldPrice);

      await expect(
        agentMarketplace.connect(seller).updatePrice(agentId, newPrice)
      )
        .to.emit(agentMarketplace, "PriceUpdated")
        .withArgs(agentId, oldPrice, newPrice);

      const listing = await agentMarketplace.getListing(agentId);
      expect(listing.price).to.equal(newPrice);
    });

    it("Should fail if non-seller tries to update price", async function () {
      const { agentMarketplace, agentNFT, seller, buyer } = await loadFixture(
        deployAgentMarketplaceFixture
      );

      const agentId = 1;
      const price = ethers.parseEther("500");

      await agentNFT.connect(seller).approve(agentMarketplace.target, agentId);
      await agentMarketplace.connect(seller).listAgent(agentId, price);

      await expect(
        agentMarketplace.connect(buyer).updatePrice(agentId, ethers.parseEther("750"))
      ).to.be.revertedWith("Only seller can update price");
    });
  });

  describe("Query Functions", function () {
    it("Should return agent with listing info", async function () {
      const { agentMarketplace, agentNFT, seller } = await loadFixture(
        deployAgentMarketplaceFixture
      );

      const agentId = 1;
      const price = ethers.parseEther("500");

      await agentNFT.connect(seller).approve(agentMarketplace.target, agentId);
      await agentMarketplace.connect(seller).listAgent(agentId, price);

      const agentInfo = await agentMarketplace.getAgentWithListing(agentId);
      
      expect(agentInfo[0]).to.equal("SalesBot"); // name
      expect(agentInfo[1]).to.equal(50); // performance score (default)
      expect(agentInfo[2]).to.be.true; // isActive
      expect(agentInfo[3]).to.be.true; // isListed
      expect(agentInfo[4]).to.equal(price); // price
      expect(agentInfo[5]).to.equal(seller.address); // seller
    });

    it("Should return seller listings correctly", async function () {
      const { agentMarketplace, agentNFT, seller } = await loadFixture(
        deployAgentMarketplaceFixture
      );

      const price = ethers.parseEther("500");

      await agentNFT.connect(seller).approve(agentMarketplace.target, 1);
      await agentNFT.connect(seller).approve(agentMarketplace.target, 2);

      await agentMarketplace.connect(seller).listAgent(1, price);
      await agentMarketplace.connect(seller).listAgent(2, price);

      const sellerListings = await agentMarketplace.getSellerListings(seller.address);
      expect(sellerListings.length).to.equal(2);
      expect(sellerListings).to.include(BigInt(1));
      expect(sellerListings).to.include(BigInt(2));
    });
  });

  describe("Owner Functions", function () {
    it("Should allow owner to withdraw fees", async function () {
      const { agentMarketplace, mindToken, agentNFT, seller, buyer, owner } =
        await loadFixture(deployAgentMarketplaceFixture);

      const agentId = 1;
      const price = ethers.parseEther("500");

      // Create and complete a sale to generate fees
      await agentNFT.connect(seller).approve(agentMarketplace.target, agentId);
      await agentMarketplace.connect(seller).listAgent(agentId, price);

      await mindToken.connect(buyer).approve(agentMarketplace.target, price);
      await agentMarketplace.connect(buyer).buyAgent(agentId);

      const initialOwnerBalance = await mindToken.balanceOf(owner.address);
      
      await agentMarketplace.withdrawFees();
      
      const finalOwnerBalance = await mindToken.balanceOf(owner.address);
      expect(finalOwnerBalance).to.be.gt(initialOwnerBalance);
    });

    it("Should allow owner to add trial token reserves", async function () {
      const { agentMarketplace, mindToken, owner } = await loadFixture(
        deployAgentMarketplaceFixture
      );

      const reserveAmount = ethers.parseEther("50000");
      
      await mindToken.approve(agentMarketplace.target, reserveAmount);
      await agentMarketplace.addTrialTokenReserves(reserveAmount);

      const contractBalance = await mindToken.balanceOf(agentMarketplace.target);
      expect(contractBalance).to.be.gte(reserveAmount);
    });

    it("Should allow owner to emergency return agents", async function () {
      const { agentMarketplace, agentNFT, seller, owner } = await loadFixture(
        deployAgentMarketplaceFixture
      );

      const agentId = 1;
      const price = ethers.parseEther("500");

      await agentNFT.connect(seller).approve(agentMarketplace.target, agentId);
      await agentMarketplace.connect(seller).listAgent(agentId, price);

      await agentMarketplace.connect(owner).emergencyReturnAgent(agentId);

      expect(await agentNFT.ownerOf(agentId)).to.equal(seller.address);
    });
  });

  describe("Integration Tests", function () {
    it("Should handle complete marketplace workflow", async function () {
      const { agentMarketplace, mindToken, agentNFT, seller, buyer, user1 } =
        await loadFixture(deployAgentMarketplaceFixture);

      // 1. User claims trial tokens
      await agentMarketplace.connect(user1).claimTrialTokens();
      expect(await agentMarketplace.hasClaimedTrial(user1.address)).to.be.true;

      // 2. Seller lists agent
      const agentId = 1;
      const price = ethers.parseEther("500");
      
      await agentNFT.connect(seller).approve(agentMarketplace.target, agentId);
      await agentMarketplace.connect(seller).listAgent(agentId, price);

      // 3. Check active listings
      const activeListings = await agentMarketplace.getActiveListings();
      expect(activeListings.length).to.equal(1);
      expect(activeListings[0]).to.equal(BigInt(agentId));

      // 4. Buyer purchases agent
      await mindToken.connect(buyer).approve(agentMarketplace.target, price);
      await agentMarketplace.connect(buyer).buyAgent(agentId);

      // 5. Verify final state
      expect(await agentNFT.ownerOf(agentId)).to.equal(buyer.address);
      
      const listing = await agentMarketplace.getListing(agentId);
      expect(listing.active).to.be.false;

      const finalActiveListings = await agentMarketplace.getActiveListings();
      expect(finalActiveListings.length).to.equal(0);
    });
  });

  describe("Gas Efficiency", function () {
    it("Should use reasonable gas for listing agents", async function () {
      const { agentMarketplace, agentNFT, seller } = await loadFixture(
        deployAgentMarketplaceFixture
      );

      const agentId = 1;
      const price = ethers.parseEther("500");

      await agentNFT.connect(seller).approve(agentMarketplace.target, agentId);
      
      const tx = await agentMarketplace.connect(seller).listAgent(agentId, price);
      const receipt = await tx.wait();

      console.log(`Agent listing gas used: ${receipt.gasUsed.toString()}`);
      expect(receipt.gasUsed).to.be.lt(200000);
    });

    it("Should use reasonable gas for buying agents", async function () {
      const { agentMarketplace, mindToken, agentNFT, seller, buyer } =
        await loadFixture(deployAgentMarketplaceFixture);

      const agentId = 1;
      const price = ethers.parseEther("500");

      await agentNFT.connect(seller).approve(agentMarketplace.target, agentId);
      await agentMarketplace.connect(seller).listAgent(agentId, price);

      await mindToken.connect(buyer).approve(agentMarketplace.target, price);
      
      const tx = await agentMarketplace.connect(buyer).buyAgent(agentId);
      const receipt = await tx.wait();

      console.log(`Agent buying gas used: ${receipt.gasUsed.toString()}`);
      expect(receipt.gasUsed).to.be.lt(300000);
    });
  });
});