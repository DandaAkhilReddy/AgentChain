const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

describe("BasicMarketplace (Task System)", function () {
  async function deployMarketplaceFixture() {
    const [owner, creator, agent1, agent2, user1, user2] = await ethers.getSigners();

    // Deploy MIND token
    const BasicToken = await ethers.getContractFactory("BasicToken");
    const mindToken = await BasicToken.deploy();
    await mindToken.waitForDeployment();

    // Deploy Agent NFT
    const BasicNFT = await ethers.getContractFactory("BasicNFT");
    const agentNFT = await BasicNFT.deploy();
    await agentNFT.waitForDeployment();

    // Deploy Marketplace
    const BasicMarketplace = await ethers.getContractFactory("BasicMarketplace");
    const marketplace = await BasicMarketplace.deploy(mindToken.target, agentNFT.target, owner.address);
    await marketplace.waitForDeployment();

    // Setup: Transfer tokens to users and create agents
    const tokenAmount = ethers.parseEther("10000");
    await mindToken.transfer(creator.address, tokenAmount);
    await mindToken.transfer(agent1.address, tokenAmount);
    await mindToken.transfer(agent2.address, tokenAmount);

    // Create test agents
    await agentNFT.mintAgent(agent1.address, "TranslatorBot");
    await agentNFT.mintAgent(agent2.address, "DataAnalyst");

    return { 
      marketplace, 
      mindToken, 
      agentNFT, 
      owner, 
      creator, 
      agent1, 
      agent2, 
      user1, 
      user2,
      tokenAmount
    };
  }

  describe("Deployment", function () {
    it("Should set correct contract addresses", async function () {
      const { marketplace, mindToken, agentNFT, owner } = await loadFixture(deployMarketplaceFixture);

      expect(await marketplace.mindToken()).to.equal(mindToken.target);
      expect(await marketplace.treasuryWallet()).to.equal(owner.address);
    });

    it("Should start with no tasks", async function () {
      const { marketplace } = await loadFixture(deployMarketplaceFixture);

      expect(await marketplace.totalTasksCreated()).to.equal(0);
      expect(await marketplace.totalTasksCompleted()).to.equal(0);
    });
  });

  describe("Task Creation", function () {
    it("Should create a task successfully", async function () {
      const { marketplace, mindToken, creator } = await loadFixture(deployMarketplaceFixture);

      const taskTitle = "Translate Document";
      const reward = ethers.parseEther("100");
      const duration = 24 * 3600; // 24 hours

      // Approve marketplace to spend tokens
      await mindToken.connect(creator).approve(marketplace.target, reward);

      await expect(marketplace.connect(creator).createTask(taskTitle, reward, duration))
        .to.emit(marketplace, "TaskCreated")
        .withArgs(1, creator.address, reward);

      expect(await marketplace.totalTasksCreated()).to.equal(1);
    });

    it("Should store task details correctly", async function () {
      const { marketplace, mindToken, creator } = await loadFixture(deployMarketplaceFixture);

      const taskTitle = "Analyze Data";
      const reward = ethers.parseEther("200");
      const duration = 48 * 3600; // 48 hours

      await mindToken.connect(creator).approve(marketplace.target, reward);
      await marketplace.connect(creator).createTask(taskTitle, reward, duration);

      const task = await marketplace.getTask(1);
      
      expect(task.id).to.equal(1);
      expect(task.creator).to.equal(creator.address);
      expect(task.title).to.equal(taskTitle);
      expect(task.reward).to.equal(reward);
      expect(task.status).to.equal(0); // TaskStatus.Open
      expect(task.deadline).to.be.gt(await time.latest());
    });

    it("Should fail without token approval", async function () {
      const { marketplace, creator } = await loadFixture(deployMarketplaceFixture);

      const reward = ethers.parseEther("100");
      
      await expect(marketplace.connect(creator).createTask("Test Task", reward, 3600))
        .to.be.revertedWith("Payment failed");
    });

    it("Should fail with empty title", async function () {
      const { marketplace, mindToken, creator } = await loadFixture(deployMarketplaceFixture);

      const reward = ethers.parseEther("100");
      await mindToken.connect(creator).approve(marketplace.target, reward);

      await expect(marketplace.connect(creator).createTask("", reward, 3600))
        .to.be.revertedWith("Title cannot be empty");
    });

    it("Should fail with zero reward", async function () {
      const { marketplace, creator } = await loadFixture(deployMarketplaceFixture);

      await expect(marketplace.connect(creator).createTask("Test Task", 0, 3600))
        .to.be.revertedWith("Reward must be greater than 0");
    });
  });

  describe("Task Claiming", function () {
    it("Should allow agent to claim task", async function () {
      const { marketplace, mindToken, creator, agent1 } = await loadFixture(deployMarketplaceFixture);

      const reward = ethers.parseEther("100");
      await mindToken.connect(creator).approve(marketplace.target, reward);
      await marketplace.connect(creator).createTask("Test Task", reward, 3600);

      await expect(marketplace.connect(agent1).claimTask(1, 1))
        .to.emit(marketplace, "TaskClaimed")
        .withArgs(1, agent1.address);

      const task = await marketplace.getTask(1);
      expect(task.status).to.equal(1); // TaskStatus.Claimed
      expect(task.assignedAgent).to.equal(agent1.address);
      expect(task.assignedAgentId).to.equal(1);
    });

    it("Should fail if agent doesn't own the NFT", async function () {
      const { marketplace, mindToken, creator, agent1 } = await loadFixture(deployMarketplaceFixture);

      const reward = ethers.parseEther("100");
      await mindToken.connect(creator).approve(marketplace.target, reward);
      await marketplace.connect(creator).createTask("Test Task", reward, 3600);

      await expect(marketplace.connect(agent1).claimTask(1, 2)) // Agent1 trying to use Agent2's NFT
        .to.be.revertedWith("Not agent owner");
    });

    it("Should fail if task is already claimed", async function () {
      const { marketplace, mindToken, creator, agent1, agent2 } = await loadFixture(deployMarketplaceFixture);

      const reward = ethers.parseEther("100");
      await mindToken.connect(creator).approve(marketplace.target, reward);
      await marketplace.connect(creator).createTask("Test Task", reward, 3600);

      // Agent1 claims the task
      await marketplace.connect(agent1).claimTask(1, 1);

      // Agent2 tries to claim the same task
      await expect(marketplace.connect(agent2).claimTask(1, 2))
        .to.be.revertedWith("Task not open");
    });

    it("Should fail if task has expired", async function () {
      const { marketplace, mindToken, creator, agent1 } = await loadFixture(deployMarketplaceFixture);

      const reward = ethers.parseEther("100");
      const shortDuration = 1; // 1 second
      
      await mindToken.connect(creator).approve(marketplace.target, reward);
      await marketplace.connect(creator).createTask("Test Task", reward, shortDuration);

      // Wait for task to expire
      await time.increase(2);

      await expect(marketplace.connect(agent1).claimTask(1, 1))
        .to.be.revertedWith("Task expired");
    });
  });

  describe("Task Completion", function () {
    it("Should allow creator to complete task", async function () {
      const { marketplace, mindToken, creator, agent1 } = await loadFixture(deployMarketplaceFixture);

      const reward = ethers.parseEther("100");
      await mindToken.connect(creator).approve(marketplace.target, reward);
      await marketplace.connect(creator).createTask("Test Task", reward, 3600);

      await marketplace.connect(agent1).claimTask(1, 1);

      const initialBalance = await mindToken.balanceOf(agent1.address);

      await expect(marketplace.connect(creator).completeTask(1))
        .to.emit(marketplace, "TaskCompleted")
        .withArgs(1);

      const finalBalance = await mindToken.balanceOf(agent1.address);
      expect(finalBalance - initialBalance).to.equal(reward);

      const task = await marketplace.getTask(1);
      expect(task.status).to.equal(2); // TaskStatus.Completed

      expect(await marketplace.totalTasksCompleted()).to.equal(1);
    });

    it("Should fail if task not claimed", async function () {
      const { marketplace, mindToken, creator } = await loadFixture(deployMarketplaceFixture);

      const reward = ethers.parseEther("100");
      await mindToken.connect(creator).approve(marketplace.target, reward);
      await marketplace.connect(creator).createTask("Test Task", reward, 3600);

      await expect(marketplace.connect(creator).completeTask(1))
        .to.be.revertedWith("Task not claimed");
    });

    it("Should fail if not called by creator", async function () {
      const { marketplace, mindToken, creator, agent1, user1 } = await loadFixture(deployMarketplaceFixture);

      const reward = ethers.parseEther("100");
      await mindToken.connect(creator).approve(marketplace.target, reward);
      await marketplace.connect(creator).createTask("Test Task", reward, 3600);

      await marketplace.connect(agent1).claimTask(1, 1);

      await expect(marketplace.connect(user1).completeTask(1))
        .to.be.revertedWith("Only creator can complete");
    });
  });

  describe("Task Cancellation", function () {
    it("Should allow creator to cancel open task", async function () {
      const { marketplace, mindToken, creator } = await loadFixture(deployMarketplaceFixture);

      const reward = ethers.parseEther("100");
      await mindToken.connect(creator).approve(marketplace.target, reward);
      await marketplace.connect(creator).createTask("Test Task", reward, 3600);

      const initialBalance = await mindToken.balanceOf(creator.address);

      await expect(marketplace.connect(creator).cancelTask(1))
        .to.emit(marketplace, "TaskCancelled")
        .withArgs(1);

      const finalBalance = await mindToken.balanceOf(creator.address);
      expect(finalBalance - initialBalance).to.equal(reward);

      const task = await marketplace.getTask(1);
      expect(task.status).to.equal(3); // TaskStatus.Cancelled
    });

    it("Should fail to cancel claimed task", async function () {
      const { marketplace, mindToken, creator, agent1 } = await loadFixture(deployMarketplaceFixture);

      const reward = ethers.parseEther("100");
      await mindToken.connect(creator).approve(marketplace.target, reward);
      await marketplace.connect(creator).createTask("Test Task", reward, 3600);

      await marketplace.connect(agent1).claimTask(1, 1);

      await expect(marketplace.connect(creator).cancelTask(1))
        .to.be.revertedWith("Can only cancel open tasks");
    });

    it("Should fail if not called by creator", async function () {
      const { marketplace, mindToken, creator, user1 } = await loadFixture(deployMarketplaceFixture);

      const reward = ethers.parseEther("100");
      await mindToken.connect(creator).approve(marketplace.target, reward);
      await marketplace.connect(creator).createTask("Test Task", reward, 3600);

      await expect(marketplace.connect(user1).cancelTask(1))
        .to.be.revertedWith("Only creator can cancel");
    });
  });

  describe("Reputation System", function () {
    it("Should increase agent reputation on task completion", async function () {
      const { marketplace, mindToken, creator, agent1 } = await loadFixture(deployMarketplaceFixture);

      const initialReputation = await marketplace.agentReputation(agent1.address);

      const reward = ethers.parseEther("100");
      await mindToken.connect(creator).approve(marketplace.target, reward);
      await marketplace.connect(creator).createTask("Test Task", reward, 3600);

      await marketplace.connect(agent1).claimTask(1, 1);
      await marketplace.connect(creator).completeTask(1);

      const finalReputation = await marketplace.agentReputation(agent1.address);
      expect(finalReputation - initialReputation).to.equal(10);
    });
  });

  describe("Gas Efficiency", function () {
    it("Should use reasonable gas for task creation", async function () {
      const { marketplace, mindToken, creator } = await loadFixture(deployMarketplaceFixture);

      const reward = ethers.parseEther("100");
      await mindToken.connect(creator).approve(marketplace.target, reward);

      const tx = await marketplace.connect(creator).createTask("Test Task", reward, 3600);
      const receipt = await tx.wait();

      console.log(`Task creation gas used: ${receipt.gasUsed.toString()}`);
      expect(receipt.gasUsed).to.be.lt(200000);
    });

    it("Should use reasonable gas for task claiming", async function () {
      const { marketplace, mindToken, creator, agent1 } = await loadFixture(deployMarketplaceFixture);

      const reward = ethers.parseEther("100");
      await mindToken.connect(creator).approve(marketplace.target, reward);
      await marketplace.connect(creator).createTask("Test Task", reward, 3600);

      const tx = await marketplace.connect(agent1).claimTask(1, 1);
      const receipt = await tx.wait();

      console.log(`Task claiming gas used: ${receipt.gasUsed.toString()}`);
      expect(receipt.gasUsed).to.be.lt(150000);
    });
  });

  describe("Query Functions", function () {
    it("Should return correct task escrow", async function () {
      const { marketplace, mindToken, creator } = await loadFixture(deployMarketplaceFixture);

      const reward = ethers.parseEther("100");
      await mindToken.connect(creator).approve(marketplace.target, reward);
      await marketplace.connect(creator).createTask("Test Task", reward, 3600);

      expect(await marketplace.getTaskEscrow(1)).to.equal(reward);
    });

    it("Should fail for non-existent task", async function () {
      const { marketplace } = await loadFixture(deployMarketplaceFixture);

      await expect(marketplace.getTask(999))
        .to.be.revertedWith("Task does not exist");
    });
  });

  describe("Integration Tests", function () {
    it("Should handle complete workflow", async function () {
      const { marketplace, mindToken, agentNFT, creator, agent1 } = await loadFixture(deployMarketplaceFixture);

      const reward = ethers.parseEther("500");
      
      // 1. Create task
      await mindToken.connect(creator).approve(marketplace.target, reward);
      await marketplace.connect(creator).createTask("Full Workflow Task", reward, 3600);
      
      // 2. Claim task
      await marketplace.connect(agent1).claimTask(1, 1);
      
      // 3. Complete task
      const initialAgentBalance = await mindToken.balanceOf(agent1.address);
      const initialAgentMetadata = await agentNFT.getAgent(1);
      
      await marketplace.connect(creator).completeTask(1);
      
      // Verify final state
      const finalAgentBalance = await mindToken.balanceOf(agent1.address);
      const finalAgentMetadata = await agentNFT.getAgent(1);
      
      expect(finalAgentBalance - initialAgentBalance).to.equal(reward);
      expect(finalAgentMetadata.performanceScore).to.be.gt(initialAgentMetadata.performanceScore);
      expect(await marketplace.agentReputation(agent1.address)).to.equal(10);
      expect(await marketplace.totalTasksCompleted()).to.equal(1);
    });
  });
});