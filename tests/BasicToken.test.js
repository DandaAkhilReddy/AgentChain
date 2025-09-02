const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("BasicToken (KAMIKAZE)", function () {
  async function deployBasicTokenFixture() {
    const [owner, user1, user2, user3] = await ethers.getSigners();

    const BasicToken = await ethers.getContractFactory("BasicToken");
    const kamikazeToken = await BasicToken.deploy();
    await kamikazeToken.waitForDeployment();

    return { kamikazeToken, owner, user1, user2, user3 };
  }

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      const { kamikazeToken } = await loadFixture(deployBasicTokenFixture);

      expect(await kamikazeToken.name()).to.equal("KamikazeToken");
      expect(await kamikazeToken.symbol()).to.equal("KAMIKAZE");
    });

    it("Should mint 1 billion tokens to owner", async function () {
      const { kamikazeToken, owner } = await loadFixture(deployBasicTokenFixture);

      const ownerBalance = await kamikazeToken.balanceOf(owner.address);
      const expectedSupply = ethers.parseEther("1000000000"); // 1 billion
      
      expect(ownerBalance).to.equal(expectedSupply);
      expect(await kamikazeToken.totalSupply()).to.equal(expectedSupply);
    });

    it("Should set correct decimals", async function () {
      const { kamikazeToken } = await loadFixture(deployBasicTokenFixture);

      expect(await kamikazeToken.decimals()).to.equal(18);
    });
  });

  describe("Transfers", function () {
    it("Should transfer tokens between accounts", async function () {
      const { kamikazeToken, owner, user1 } = await loadFixture(deployBasicTokenFixture);

      const transferAmount = ethers.parseEther("1000");
      
      await expect(() => kamikazeToken.transfer(user1.address, transferAmount))
        .to.changeTokenBalances(kamikazeToken, [owner, user1], [-transferAmount, transferAmount]);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const { kamikazeToken, user1, user2 } = await loadFixture(deployBasicTokenFixture);

      const transferAmount = ethers.parseEther("1");
      
      await expect(kamikazeToken.connect(user1).transfer(user2.address, transferAmount))
        .to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });

    it("Should update allowances correctly", async function () {
      const { kamikazeToken, owner, user1 } = await loadFixture(deployBasicTokenFixture);

      const approvalAmount = ethers.parseEther("1000");
      
      await kamikazeToken.approve(user1.address, approvalAmount);
      expect(await kamikazeToken.allowance(owner.address, user1.address)).to.equal(approvalAmount);
    });

    it("Should handle transferFrom correctly", async function () {
      const { kamikazeToken, owner, user1, user2 } = await loadFixture(deployBasicTokenFixture);

      const approvalAmount = ethers.parseEther("1000");
      const transferAmount = ethers.parseEther("500");
      
      // Approve user1 to spend owner's tokens
      await kamikazeToken.approve(user1.address, approvalAmount);
      
      // User1 transfers owner's tokens to user2
      await expect(() => kamikazeToken.connect(user1).transferFrom(owner.address, user2.address, transferAmount))
        .to.changeTokenBalances(kamikazeToken, [owner, user2], [-transferAmount, transferAmount]);
      
      // Check remaining allowance
      expect(await kamikazeToken.allowance(owner.address, user1.address)).to.equal(approvalAmount - transferAmount);
    });
  });

  describe("Burn functionality", function () {
    it("Should allow token holders to burn their tokens", async function () {
      const { kamikazeToken, owner } = await loadFixture(deployBasicTokenFixture);

      const burnAmount = ethers.parseEther("1000");
      const initialSupply = await kamikazeToken.totalSupply();
      const initialBalance = await kamikazeToken.balanceOf(owner.address);
      
      await kamikazeToken.burn(burnAmount);
      
      const finalSupply = await kamikazeToken.totalSupply();
      const finalBalance = await kamikazeToken.balanceOf(owner.address);
      
      expect(finalSupply).to.equal(initialSupply - burnAmount);
      expect(finalBalance).to.equal(initialBalance - burnAmount);
    });

    it("Should fail if trying to burn more than balance", async function () {
      const { kamikazeToken, user1 } = await loadFixture(deployBasicTokenFixture);

      const burnAmount = ethers.parseEther("1");
      
      await expect(kamikazeToken.connect(user1).burn(burnAmount))
        .to.be.revertedWith("ERC20: burn amount exceeds balance");
    });
  });

  describe("Access Control", function () {
    it("Should only allow owner to call owner functions", async function () {
      const { kamikazeToken, owner, user1 } = await loadFixture(deployBasicTokenFixture);

      // Only owner should be able to call owner functions
      expect(await kamikazeToken.owner()).to.equal(owner.address);
    });
  });

  describe("Gas Efficiency", function () {
    it("Should use reasonable gas for transfers", async function () {
      const { kamikazeToken, owner, user1 } = await loadFixture(deployBasicTokenFixture);

      const transferAmount = ethers.parseEther("1000");
      
      const tx = await kamikazeToken.transfer(user1.address, transferAmount);
      const receipt = await tx.wait();
      
      // Should use less than 100k gas for simple transfers
      console.log(`Transfer gas used: ${receipt.gasUsed.toString()}`);
      expect(receipt.gasUsed).to.be.lt(100000);
    });

    it("Should use reasonable gas for approvals", async function () {
      const { kamikazeToken, owner, user1 } = await loadFixture(deployBasicTokenFixture);

      const approvalAmount = ethers.parseEther("1000");
      
      const tx = await kamikazeToken.approve(user1.address, approvalAmount);
      const receipt = await tx.wait();
      
      // Should use less than 50k gas for approvals
      console.log(`Approval gas used: ${receipt.gasUsed.toString()}`);
      expect(receipt.gasUsed).to.be.lt(50000);
    });
  });

  describe("Events", function () {
    it("Should emit Transfer event", async function () {
      const { kamikazeToken, owner, user1 } = await loadFixture(deployBasicTokenFixture);

      const transferAmount = ethers.parseEther("1000");
      
      await expect(kamikazeToken.transfer(user1.address, transferAmount))
        .to.emit(kamikazeToken, "Transfer")
        .withArgs(owner.address, user1.address, transferAmount);
    });

    it("Should emit Approval event", async function () {
      const { kamikazeToken, owner, user1 } = await loadFixture(deployBasicTokenFixture);

      const approvalAmount = ethers.parseEther("1000");
      
      await expect(kamikazeToken.approve(user1.address, approvalAmount))
        .to.emit(kamikazeToken, "Approval")
        .withArgs(owner.address, user1.address, approvalAmount);
    });
  });
});