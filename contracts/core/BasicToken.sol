// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BasicToken is ERC20, Ownable {
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens
    
    // Burn settings
    uint256 public constant TRANSFER_BURN_RATE = 200; // 2% = 200 basis points
    uint256 public constant BASIS_POINTS = 10000;
    
    // Track total burned tokens for deflationary metrics
    uint256 public totalBurned;
    
    // Events
    event TokensBurned(address indexed from, uint256 amount, string reason);
    event TransferWithBurn(address indexed from, address indexed to, uint256 amount, uint256 burned);
    
    constructor() ERC20("KamikazeToken", "KAMIKAZE") {
        _mint(msg.sender, TOTAL_SUPPLY);
    }

    // Enhanced transfer function with automatic burning
    function transfer(address to, uint256 amount) public override returns (bool) {
        address owner = _msgSender();
        
        // Calculate burn amount (2% of transfer)
        uint256 burnAmount = (amount * TRANSFER_BURN_RATE) / BASIS_POINTS;
        uint256 transferAmount = amount - burnAmount;
        
        // Burn tokens (reduces total supply)
        if (burnAmount > 0) {
            _burn(owner, burnAmount);
            totalBurned += burnAmount;
            emit TokensBurned(owner, burnAmount, "Transfer burn");
        }
        
        // Transfer remaining tokens
        _transfer(owner, to, transferAmount);
        
        emit TransferWithBurn(owner, to, transferAmount, burnAmount);
        return true;
    }

    // Enhanced transferFrom function with automatic burning
    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        address spender = _msgSender();
        
        // Check allowance first
        _spendAllowance(from, spender, amount);
        
        // Calculate burn amount (2% of transfer)
        uint256 burnAmount = (amount * TRANSFER_BURN_RATE) / BASIS_POINTS;
        uint256 transferAmount = amount - burnAmount;
        
        // Burn tokens (reduces total supply)
        if (burnAmount > 0) {
            _burn(from, burnAmount);
            totalBurned += burnAmount;
            emit TokensBurned(from, burnAmount, "Transfer burn");
        }
        
        // Transfer remaining tokens
        _transfer(from, to, transferAmount);
        
        emit TransferWithBurn(from, to, transferAmount, burnAmount);
        return true;
    }

    // Manual burn function for users
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
        totalBurned += amount;
        emit TokensBurned(msg.sender, amount, "Manual burn");
    }
    
    // Burn from allowance (for contracts)
    function burnFrom(address account, uint256 amount) external {
        _spendAllowance(account, _msgSender(), amount);
        _burn(account, amount);
        totalBurned += amount;
        emit TokensBurned(account, amount, "Allowance burn");
    }
    
    // Get burn statistics
    function getBurnStats() external view returns (
        uint256 currentSupply,
        uint256 totalBurnedAmount,
        uint256 burnPercentage
    ) {
        currentSupply = totalSupply();
        totalBurnedAmount = totalBurned;
        burnPercentage = (totalBurnedAmount * BASIS_POINTS) / TOTAL_SUPPLY; // In basis points
    }
    
    // Calculate circulating supply (for price calculations)
    function circulatingSupply() external view returns (uint256) {
        return totalSupply();
    }
    
    // Estimate burn amount for a transfer
    function estimateBurnAmount(uint256 transferAmount) external pure returns (uint256) {
        return (transferAmount * TRANSFER_BURN_RATE) / BASIS_POINTS;
    }
}