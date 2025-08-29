const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("BasicToken (MIND)", function () {
  async function deployBasicTokenFixture() {
    const [owner, user1, user2, user3] = await ethers.getSigners();

    const BasicToken = await ethers.getContractFactory("BasicToken");
    const mindToken = await BasicToken.deploy();
    await mindToken.waitForDeployment();

    return { mindToken, owner, user1, user2, user3 };
  }

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      const { mindToken } = await loadFixture(deployBasicTokenFixture);

      expect(await mindToken.name()).to.equal("ConsciousCoin");
      expect(await mindToken.symbol()).to.equal("MIND");
    });

    it("Should mint 1 billion tokens to owner", async function () {
      const { mindToken, owner } = await loadFixture(deployBasicTokenFixture);

      const ownerBalance = await mindToken.balanceOf(owner.address);
      const expectedSupply = ethers.parseEther("1000000000"); // 1 billion
      
      expect(ownerBalance).to.equal(expectedSupply);
      expect(await mindToken.totalSupply()).to.equal(expectedSupply);
    });

    it("Should set correct decimals", async function () {
      const { mindToken } = await loadFixture(deployBasicTokenFixture);

      expect(await mindToken.decimals()).to.equal(18);
    });
  });

  describe("Transfers", function () {
    it("Should transfer tokens between accounts", async function () {
      const { mindToken, owner, user1 } = await loadFixture(deployBasicTokenFixture);

      const transferAmount = ethers.parseEther("1000");
      
      await expect(() => mindToken.transfer(user1.address, transferAmount))
        .to.changeTokenBalances(mindToken, [owner, user1], [-transferAmount, transferAmount]);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const { mindToken, user1, user2 } = await loadFixture(deployBasicTokenFixture);

      const transferAmount = ethers.parseEther("1");
      
      await expect(mindToken.connect(user1).transfer(user2.address, transferAmount))
        .to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });

    it("Should update allowances correctly", async function () {
      const { mindToken, owner, user1 } = await loadFixture(deployBasicTokenFixture);

      const approvalAmount = ethers.parseEther("1000");
      
      await mindToken.approve(user1.address, approvalAmount);
      expect(await mindToken.allowance(owner.address, user1.address)).to.equal(approvalAmount);
    });

    it("Should handle transferFrom correctly", async function () {
      const { mindToken, owner, user1, user2 } = await loadFixture(deployBasicTokenFixture);

      const approvalAmount = ethers.parseEther("1000");
      const transferAmount = ethers.parseEther("500");
      
      // Approve user1 to spend owner's tokens
      await mindToken.approve(user1.address, approvalAmount);
      
      // User1 transfers owner's tokens to user2
      await expect(() => mindToken.connect(user1).transferFrom(owner.address, user2.address, transferAmount))
        .to.changeTokenBalances(mindToken, [owner, user2], [-transferAmount, transferAmount]);
      
      // Check remaining allowance
      expect(await mindToken.allowance(owner.address, user1.address)).to.equal(approvalAmount - transferAmount);
    });
  });

  describe("Burn functionality", function () {
    it("Should allow token holders to burn their tokens", async function () {
      const { mindToken, owner } = await loadFixture(deployBasicTokenFixture);

      const burnAmount = ethers.parseEther("1000");
      const initialSupply = await mindToken.totalSupply();
      const initialBalance = await mindToken.balanceOf(owner.address);
      
      await mindToken.burn(burnAmount);
      
      const finalSupply = await mindToken.totalSupply();
      const finalBalance = await mindToken.balanceOf(owner.address);
      
      expect(finalSupply).to.equal(initialSupply - burnAmount);
      expect(finalBalance).to.equal(initialBalance - burnAmount);
    });

    it("Should fail if trying to burn more than balance", async function () {
      const { mindToken, user1 } = await loadFixture(deployBasicTokenFixture);

      const burnAmount = ethers.parseEther("1");
      
      await expect(mindToken.connect(user1).burn(burnAmount))
        .to.be.revertedWith("ERC20: burn amount exceeds balance");
    });
  });

  describe("Access Control", function () {
    it("Should only allow owner to call owner functions", async function () {
      const { mindToken, owner, user1 } = await loadFixture(deployBasicTokenFixture);

      // Only owner should be able to call owner functions
      expect(await mindToken.owner()).to.equal(owner.address);
    });
  });

  describe("Gas Efficiency", function () {
    it("Should use reasonable gas for transfers", async function () {
      const { mindToken, owner, user1 } = await loadFixture(deployBasicTokenFixture);

      const transferAmount = ethers.parseEther("1000");
      
      const tx = await mindToken.transfer(user1.address, transferAmount);
      const receipt = await tx.wait();
      
      // Should use less than 100k gas for simple transfers
      console.log(`Transfer gas used: ${receipt.gasUsed.toString()}`);
      expect(receipt.gasUsed).to.be.lt(100000);
    });

    it("Should use reasonable gas for approvals", async function () {
      const { mindToken, owner, user1 } = await loadFixture(deployBasicTokenFixture);

      const approvalAmount = ethers.parseEther("1000");
      
      const tx = await mindToken.approve(user1.address, approvalAmount);
      const receipt = await tx.wait();
      
      // Should use less than 50k gas for approvals
      console.log(`Approval gas used: ${receipt.gasUsed.toString()}`);
      expect(receipt.gasUsed).to.be.lt(50000);
    });
  });

  describe("Events", function () {
    it("Should emit Transfer event", async function () {
      const { mindToken, owner, user1 } = await loadFixture(deployBasicTokenFixture);

      const transferAmount = ethers.parseEther("1000");
      
      await expect(mindToken.transfer(user1.address, transferAmount))
        .to.emit(mindToken, "Transfer")
        .withArgs(owner.address, user1.address, transferAmount);
    });

    it("Should emit Approval event", async function () {
      const { mindToken, owner, user1 } = await loadFixture(deployBasicTokenFixture);

      const approvalAmount = ethers.parseEther("1000");
      
      await expect(mindToken.approve(user1.address, approvalAmount))
        .to.emit(mindToken, "Approval")
        .withArgs(owner.address, user1.address, approvalAmount);
    });
  });
});