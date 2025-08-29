// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./BasicNFT.sol";

contract AgentMarketplace is Ownable, ReentrancyGuard {
    IERC20 public mindToken;
    BasicNFT public agentNFT;
    
    // Marketplace fee (2% = 200 basis points)
    uint256 public constant MARKETPLACE_FEE = 200;
    uint256 public constant BASIS_POINTS = 10000;
    
    // Agent listing structure
    struct AgentListing {
        uint256 agentId;
        address seller;
        uint256 price;
        bool active;
        uint256 listedAt;
    }
    
    // Trial token system
    mapping(address => bool) public hasClaimedTrial;
    uint256 public constant TRIAL_TOKEN_AMOUNT = 1000 * 10**18; // 1000 MIND tokens
    
    // Listings storage
    mapping(uint256 => AgentListing) public listings;
    mapping(address => uint256[]) public sellerListings;
    uint256[] public activeListings;
    uint256 public totalListingsCreated;
    
    // Events
    event AgentListed(uint256 indexed agentId, address indexed seller, uint256 price);
    event AgentSold(uint256 indexed agentId, address indexed seller, address indexed buyer, uint256 price);
    event AgentDelisted(uint256 indexed agentId, address indexed seller);
    event PriceUpdated(uint256 indexed agentId, uint256 oldPrice, uint256 newPrice);
    event TrialTokensClaimed(address indexed user, uint256 amount);
    
    constructor(address _mindToken, address _agentNFT) {
        mindToken = IERC20(_mindToken);
        agentNFT = BasicNFT(_agentNFT);
    }
    
    // List an agent for sale
    function listAgent(uint256 _agentId, uint256 _price) external nonReentrant {
        require(agentNFT.ownerOf(_agentId) == msg.sender, "Not agent owner");
        require(_price > 0, "Price must be greater than 0");
        require(!listings[_agentId].active, "Agent already listed");
        
        // Transfer agent to marketplace for escrow
        agentNFT.transferFrom(msg.sender, address(this), _agentId);
        
        // Create listing
        listings[_agentId] = AgentListing({
            agentId: _agentId,
            seller: msg.sender,
            price: _price,
            active: true,
            listedAt: block.timestamp
        });
        
        sellerListings[msg.sender].push(_agentId);
        activeListings.push(_agentId);
        totalListingsCreated++;
        
        emit AgentListed(_agentId, msg.sender, _price);
    }
    
    // Buy an agent from the marketplace
    function buyAgent(uint256 _agentId) external nonReentrant {
        AgentListing storage listing = listings[_agentId];
        require(listing.active, "Agent not for sale");
        require(msg.sender != listing.seller, "Cannot buy your own agent");
        
        uint256 price = listing.price;
        address seller = listing.seller;
        
        // Calculate marketplace fee and seller amount
        uint256 fee = (price * MARKETPLACE_FEE) / BASIS_POINTS;
        uint256 sellerAmount = price - fee;
        
        // Transfer MIND tokens from buyer
        require(mindToken.transferFrom(msg.sender, address(this), price), "Payment failed");
        
        // Transfer seller amount to seller (triggers 2% burn automatically)
        require(mindToken.transfer(seller, sellerAmount), "Seller payment failed");
        
        // Keep marketplace fee in contract (can be withdrawn by owner)
        
        // Transfer agent NFT to buyer
        agentNFT.transferFrom(address(this), msg.sender, _agentId);
        
        // Mark listing as inactive
        listing.active = false;
        
        // Remove from active listings
        _removeFromActiveListings(_agentId);
        
        emit AgentSold(_agentId, seller, msg.sender, price);
    }
    
    // Delist an agent (remove from sale)
    function delistAgent(uint256 _agentId) external nonReentrant {
        AgentListing storage listing = listings[_agentId];
        require(listing.active, "Agent not listed");
        require(listing.seller == msg.sender, "Only seller can delist");
        
        // Transfer agent back to seller
        agentNFT.transferFrom(address(this), msg.sender, _agentId);
        
        // Mark listing as inactive
        listing.active = false;
        
        // Remove from active listings
        _removeFromActiveListings(_agentId);
        
        emit AgentDelisted(_agentId, msg.sender);
    }
    
    // Update listing price
    function updatePrice(uint256 _agentId, uint256 _newPrice) external {
        AgentListing storage listing = listings[_agentId];
        require(listing.active, "Agent not listed");
        require(listing.seller == msg.sender, "Only seller can update price");
        require(_newPrice > 0, "Price must be greater than 0");
        
        uint256 oldPrice = listing.price;
        listing.price = _newPrice;
        
        emit PriceUpdated(_agentId, oldPrice, _newPrice);
    }
    
    // Claim free trial tokens (once per address)
    function claimTrialTokens() external {
        require(!hasClaimedTrial[msg.sender], "Trial tokens already claimed");
        
        hasClaimedTrial[msg.sender] = true;
        
        // Transfer trial tokens from contract reserves
        require(mindToken.transfer(msg.sender, TRIAL_TOKEN_AMOUNT), "Trial token transfer failed");
        
        emit TrialTokensClaimed(msg.sender, TRIAL_TOKEN_AMOUNT);
    }
    
    // Get all active listings
    function getActiveListings() external view returns (uint256[] memory) {
        return activeListings;
    }
    
    // Get listings by seller
    function getSellerListings(address _seller) external view returns (uint256[] memory) {
        return sellerListings[_seller];
    }
    
    // Get listing details
    function getListing(uint256 _agentId) external view returns (AgentListing memory) {
        return listings[_agentId];
    }
    
    // Get agent metadata with listing info
    function getAgentWithListing(uint256 _agentId) external view returns (
        string memory name,
        uint256 performanceScore,
        bool isActive,
        bool isListed,
        uint256 price,
        address seller
    ) {
        BasicNFT.Agent memory agent = agentNFT.getAgent(_agentId);
        AgentListing memory listing = listings[_agentId];
        
        return (
            agent.name,
            agent.performanceScore,
            agent.isActive,
            listing.active,
            listing.price,
            listing.seller
        );
    }
    
    // Internal function to remove from active listings array
    function _removeFromActiveListings(uint256 _agentId) private {
        for (uint i = 0; i < activeListings.length; i++) {
            if (activeListings[i] == _agentId) {
                activeListings[i] = activeListings[activeListings.length - 1];
                activeListings.pop();
                break;
            }
        }
    }
    
    // Owner functions
    function withdrawFees() external onlyOwner {
        uint256 balance = mindToken.balanceOf(address(this));
        require(balance > 0, "No fees to withdraw");
        require(mindToken.transfer(owner(), balance), "Fee withdrawal failed");
    }
    
    // Add trial tokens to contract reserves (owner only)
    function addTrialTokenReserves(uint256 _amount) external onlyOwner {
        require(mindToken.transferFrom(msg.sender, address(this), _amount), "Reserve transfer failed");
    }
    
    // Emergency function to return listed agents (owner only)
    function emergencyReturnAgent(uint256 _agentId) external onlyOwner {
        AgentListing storage listing = listings[_agentId];
        require(listing.active, "Agent not listed");
        
        // Transfer agent back to seller
        agentNFT.transferFrom(address(this), listing.seller, _agentId);
        
        // Mark listing as inactive
        listing.active = false;
        
        // Remove from active listings
        _removeFromActiveListings(_agentId);
        
        emit AgentDelisted(_agentId, listing.seller);
    }
}