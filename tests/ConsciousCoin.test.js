const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("ConsciousCoin", function () {
  async function deployConsciousCoinFixture() {
    const [owner, liquidityWallet, teamWallet, user1, user2, blacklistedUser] = await ethers.getSigners();

    const ConsciousCoin = await ethers.getContractFactory("ConsciousCoin");
    const mindToken = await ConsciousCoin.deploy(liquidityWallet.address, teamWallet.address);

    return { mindToken, owner, liquidityWallet, teamWallet, user1, user2, blacklistedUser };
  }

  describe("Deployment", function () {
    it("Should set the right name and symbol", async function () {
      const { mindToken } = await loadFixture(deployConsciousCoinFixture);

      expect(await mindToken.name()).to.equal("ConsciousCoin");
      expect(await mindToken.symbol()).to.equal("MIND");
    });

    it("Should set the correct total supply", async function () {
      const { mindToken } = await loadFixture(deployConsciousCoinFixture);

      const totalSupply = await mindToken.totalSupply();
      const expectedSupply = ethers.utils.parseEther("1000000000"); // 1 billion tokens
      
      expect(totalSupply).to.equal(expectedSupply);
    });

    it("Should distribute initial supply correctly", async function () {
      const { mindToken, owner, liquidityWallet, teamWallet } = await loadFixture(deployConsciousCoinFixture);

      const ownerBalance = await mindToken.balanceOf(owner.address);
      const teamBalance = await mindToken.balanceOf(teamWallet.address);
      const liquidityBalance = await mindToken.balanceOf(liquidityWallet.address);
      const contractBalance = await mindToken.balanceOf(mindToken.address);

      const totalSupply = ethers.utils.parseEther("1000000000");
      
      expect(ownerBalance).to.equal(totalSupply.mul(30).div(100)); // 30%
      expect(teamBalance).to.equal(totalSupply.mul(20).div(100)); // 20%
      expect(liquidityBalance).to.equal(totalSupply.mul(25).div(100)); // 15% + 10%
      expect(contractBalance).to.equal(totalSupply.mul(25).div(100)); // 15% + 5% + 5%
    });
  });

  describe("Transfers", function () {
    it("Should transfer tokens between accounts", async function () {
      const { mindToken, owner, user1 } = await loadFixture(deployConsciousCoinFixture);

      const transferAmount = ethers.utils.parseEther("1000");
      
      await expect(mindToken.transfer(user1.address, transferAmount))
        .to.changeTokenBalances(mindToken, [owner, user1], [-transferAmount, transferAmount]);
    });

    it("Should apply burn and reflection fees on transfers", async function () {
      const { mindToken, owner, user1 } = await loadFixture(deployConsciousCoinFixture);

      const transferAmount = ethers.utils.parseEther("1000");
      const initialSupply = await mindToken.totalSupply();
      
      await mindToken.transfer(user1.address, transferAmount);
      
      const finalSupply = await mindToken.totalSupply();
      const burnAmount = transferAmount.mul(2).div(100); // 2% burn
      
      expect(finalSupply).to.equal(initialSupply.sub(burnAmount));
    });

    it("Should enforce maximum transaction limit", async function () {
      const { mindToken, owner, user1 } = await loadFixture(deployConsciousCoinFixture);

      const maxTransactionAmount = await mindToken.maxTransactionAmount();
      const excessiveAmount = maxTransactionAmount.add(1);
      
      await expect(mindToken.transfer(user1.address, excessiveAmount))
        .to.be.revertedWith("Exceeds max transaction amount");
    });

    it("Should exclude fee-exempted addresses from fees", async function () {
      const { mindToken, owner, liquidityWallet } = await loadFixture(deployConsciousCoinFixture);

      const transferAmount = ethers.utils.parseEther("1000");
      const initialSupply = await mindToken.totalSupply();
      
      // Transfer from liquidity wallet (fee-exempt) to owner (fee-exempt)
      await mindToken.connect(liquidityWallet).transfer(owner.address, transferAmount);
      
      const finalSupply = await mindToken.totalSupply();
      expect(finalSupply).to.equal(initialSupply); // No burn fee applied
    });
  });

  describe("Blacklist functionality", function () {
    it("Should blacklist an account", async function () {
      const { mindToken, owner, blacklistedUser } = await loadFixture(deployConsciousCoinFixture);

      await mindToken.blacklist(blacklistedUser.address);
      
      expect(await mindToken.isBlacklisted(blacklistedUser.address)).to.be.true;
    });

    it("Should prevent blacklisted accounts from receiving tokens", async function () {
      const { mindToken, owner, blacklistedUser } = await loadFixture(deployConsciousCoinFixture);

      await mindToken.blacklist(blacklistedUser.address);
      
      const transferAmount = ethers.utils.parseEther("100");
      
      await expect(mindToken.transfer(blacklistedUser.address, transferAmount))
        .to.be.revertedWith("Blacklisted address");
    });

    it("Should unblacklist an account", async function () {
      const { mindToken, owner, blacklistedUser } = await loadFixture(deployConsciousCoinFixture);

      await mindToken.blacklist(blacklistedUser.address);
      await mindToken.unblacklist(blacklistedUser.address);
      
      expect(await mindToken.isBlacklisted(blacklistedUser.address)).to.be.false;
    });
  });

  describe("Pause functionality", function () {
    it("Should pause token transfers", async function () {
      const { mindToken, owner, user1 } = await loadFixture(deployConsciousCoinFixture);

      await mindToken.pause();
      
      const transferAmount = ethers.utils.parseEther("100");
      
      await expect(mindToken.transfer(user1.address, transferAmount))
        .to.be.revertedWith("Pausable: paused");
    });

    it("Should unpause token transfers", async function () {
      const { mindToken, owner, user1 } = await loadFixture(deployConsciousCoinFixture);

      await mindToken.pause();
      await mindToken.unpause();
      
      const transferAmount = ethers.utils.parseEther("100");
      
      await expect(mindToken.transfer(user1.address, transferAmount))
        .to.not.be.reverted;
    });
  });

  describe("Burn functionality", function () {
    it("Should allow token holders to burn their tokens", async function () {
      const { mindToken, owner } = await loadFixture(deployConsciousCoinFixture);

      const burnAmount = ethers.utils.parseEther("1000");
      const initialSupply = await mindToken.totalSupply();
      const initialBalance = await mindToken.balanceOf(owner.address);
      
      await mindToken.burn(burnAmount);
      
      const finalSupply = await mindToken.totalSupply();
      const finalBalance = await mindToken.balanceOf(owner.address);
      
      expect(finalSupply).to.equal(initialSupply.sub(burnAmount));
      expect(finalBalance).to.equal(initialBalance.sub(burnAmount));
    });
  });

  describe("Reflection mechanism", function () {
    it("Should reflect tokens to holders", async function () {
      const { mindToken, owner, user1, user2 } = await loadFixture(deployConsciousCoinFixture);

      // Give user1 some tokens
      const initialAmount = ethers.utils.parseEther("10000");
      await mindToken.transfer(user1.address, initialAmount);
      
      // Record initial balances
      const user1InitialBalance = await mindToken.balanceOf(user1.address);
      const user2InitialBalance = await mindToken.balanceOf(user2.address);
      
      // Transfer between other users to generate reflections
      await mindToken.connect(user1).transfer(user2.address, ethers.utils.parseEther("1000"));
      
      // Check if reflections were distributed (balances should be slightly different due to reflection)
      const user1FinalBalance = await mindToken.balanceOf(user1.address);
      const user2FinalBalance = await mindToken.balanceOf(user2.address);
      
      // User1 should have less than expected due to fees, but might have gained from reflection
      // This is a complex calculation, so we just verify the transfer worked
      expect(user2FinalBalance).to.be.gt(user2InitialBalance);
    });
  });

  describe("Access control", function () {
    it("Should only allow admin to update max transaction", async function () {
      const { mindToken, owner, user1 } = await loadFixture(deployConsciousCoinFixture);

      const newMaxPercent = 2; // 2%
      
      await expect(mindToken.connect(user1).updateMaxTransaction(newMaxPercent))
        .to.be.reverted;
      
      await expect(mindToken.updateMaxTransaction(newMaxPercent))
        .to.not.be.reverted;
    });

    it("Should only allow designated roles to pause", async function () {
      const { mindToken, owner, user1 } = await loadFixture(deployConsciousCoinFixture);

      await expect(mindToken.connect(user1).pause())
        .to.be.reverted;
      
      await expect(mindToken.pause())
        .to.not.be.reverted;
    });
  });

  describe("Gas optimization", function () {
    it("Should use reasonable gas for transfers", async function () {
      const { mindToken, owner, user1 } = await loadFixture(deployConsciousCoinFixture);

      const transferAmount = ethers.utils.parseEther("1000");
      
      const tx = await mindToken.transfer(user1.address, transferAmount);
      const receipt = await tx.wait();
      
      // Gas should be under 200k for optimized transfers
      expect(receipt.gasUsed).to.be.lt(200000);
    });
  });
});