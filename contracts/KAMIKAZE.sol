// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title KAMIKAZE Token
 * @dev Deflationary ERC20 token with 2% burn on transfers and free token distribution
 * @author AgentChains Team
 */
contract KAMIKAZE is ERC20, Ownable, ReentrancyGuard {
    uint256 public constant BURN_RATE = 200; // 2% = 200 basis points
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant FREE_TOKEN_AMOUNT = 1000 * 10**18; // 1000 tokens per person
    uint256 public MAX_SUPPLY; // Dynamic supply based on current world population
    
    mapping(address => bool) public hasClaimedFreeTokens;
    mapping(address => uint256) public lastTransferTime;
    
    uint256 public totalBurned;
    uint256 public totalFreeTokensClaimed;
    uint256 public worldPopulation;
    uint256 public lastPopulationUpdate;
    
    event TokensBurned(uint256 amount);
    event FreeTokensClaimed(address indexed user, uint256 amount);
    event PopulationUpdated(uint256 newPopulation, uint256 newSupply);
    
    constructor(uint256 _worldPopulation) ERC20("KAMIKAZE", "KAMIKAZE") {
        require(_worldPopulation > 0, "Population must be greater than 0");
        worldPopulation = _worldPopulation;
        MAX_SUPPLY = _worldPopulation * 10**18; // 1 token per person in existence
        lastPopulationUpdate = block.timestamp;
        _mint(address(this), MAX_SUPPLY);
    }
    
    /**
     * @dev Claim free tokens (1000 KAMIKAZE per wallet, once only)
     */
    function claimFreeTokens() external nonReentrant {
        require(!hasClaimedFreeTokens[msg.sender], "Already claimed free tokens");
        require(balanceOf(address(this)) >= FREE_TOKEN_AMOUNT, "Insufficient contract balance");
        
        hasClaimedFreeTokens[msg.sender] = true;
        totalFreeTokensClaimed += FREE_TOKEN_AMOUNT;
        
        _transfer(address(this), msg.sender, FREE_TOKEN_AMOUNT);
        
        emit FreeTokensClaimed(msg.sender, FREE_TOKEN_AMOUNT);
    }
    
    /**
     * @dev Transfer with 2% burn mechanism
     */
    function transfer(address to, uint256 amount) public virtual override returns (bool) {
        address owner = _msgSender();
        _transferWithBurn(owner, to, amount);
        return true;
    }
    
    /**
     * @dev TransferFrom with 2% burn mechanism  
     */
    function transferFrom(address from, address to, uint256 amount) public virtual override returns (bool) {
        address spender = _msgSender();
        _spendAllowance(from, spender, amount);
        _transferWithBurn(from, to, amount);
        return true;
    }
    
    /**
     * @dev Internal transfer function with burn mechanism
     */
    function _transferWithBurn(address from, address to, uint256 amount) internal {
        require(from != address(0), "Transfer from zero address");
        require(to != address(0), "Transfer to zero address");
        
        uint256 burnAmount = 0;
        
        // Apply burn only for regular transfers (not contract operations)
        if (from != address(this) && to != address(this) && from != owner() && to != owner()) {
            burnAmount = (amount * BURN_RATE) / BASIS_POINTS;
            totalBurned += burnAmount;
            
            // Burn tokens by sending to dead address
            if (burnAmount > 0) {
                _transfer(from, address(0xdead), burnAmount);
                emit TokensBurned(burnAmount);
            }
        }
        
        // Transfer remaining amount
        uint256 transferAmount = amount - burnAmount;
        if (transferAmount > 0) {
            _transfer(from, to, transferAmount);
        }
        
        lastTransferTime[from] = block.timestamp;
    }
    
    /**
     * @dev Send tokens to another address (with burn)
     */
    function sendTokens(address to, uint256 amount) external {
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        _transferWithBurn(msg.sender, to, amount);
    }
    
    /**
     * @dev Get user's token information
     */
    function getUserInfo(address user) external view returns (
        uint256 balance,
        bool hasClaimed,
        uint256 lastTransfer,
        bool canClaim
    ) {
        return (
            balanceOf(user),
            hasClaimedFreeTokens[user],
            lastTransferTime[user],
            !hasClaimedFreeTokens[user]
        );
    }
    
    /**
     * @dev Get token statistics
     */
    function getTokenStats() external view returns (
        uint256 _totalSupply,
        uint256 _totalBurned,
        uint256 _circulatingSupply,
        uint256 _contractBalance,
        uint256 _totalClaimed
    ) {
        uint256 totalSupplyAmount = totalSupply();
        return (
            totalSupplyAmount,
            totalBurned,
            totalSupplyAmount - totalBurned - balanceOf(address(this)),
            balanceOf(address(this)),
            totalFreeTokensClaimed
        );
    }
    
    /**
     * @dev Owner can withdraw any remaining tokens (emergency)
     */
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        require(balanceOf(address(this)) >= amount, "Insufficient balance");
        _transfer(address(this), owner(), amount);
    }
    
    /**
     * @dev Check if address has claimed free tokens
     */
    function checkClaimStatus(address user) external view returns (bool) {
        return hasClaimedFreeTokens[user];
    }
    
    /**
     * @dev Update world population and mint additional tokens (Owner only)
     * @param newPopulation Current world population
     */
    function updateWorldPopulation(uint256 newPopulation) external onlyOwner {
        require(newPopulation > worldPopulation, "Population can only increase");
        require(block.timestamp >= lastPopulationUpdate + 1 days, "Can only update once per day");
        
        uint256 populationIncrease = newPopulation - worldPopulation;
        uint256 additionalTokens = populationIncrease * 10**18;
        
        worldPopulation = newPopulation;
        MAX_SUPPLY += additionalTokens;
        lastPopulationUpdate = block.timestamp;
        
        // Mint additional tokens to contract
        _mint(address(this), additionalTokens);
        
        emit PopulationUpdated(newPopulation, MAX_SUPPLY);
    }
    
    /**
     * @dev Get population-based token info
     */
    function getPopulationInfo() external view returns (
        uint256 currentPopulation,
        uint256 maxSupply,
        uint256 tokensPerPerson,
        uint256 lastUpdate
    ) {
        return (
            worldPopulation,
            MAX_SUPPLY,
            10**18, // 1 token per person
            lastPopulationUpdate
        );
    }
}