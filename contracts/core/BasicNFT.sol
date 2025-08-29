// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract BasicNFT is ERC721, Ownable {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIdCounter;
    
    struct Agent {
        string name;
        uint256 performanceScore;
        bool isActive;
    }
    
    mapping(uint256 => Agent) public agents;
    
    event AgentMinted(uint256 indexed tokenId, string name);
    
    constructor() ERC721("AI Agent", "AGENT") {
        _tokenIdCounter.increment(); // Start at 1
    }
    
    function mintAgent(address to, string memory name) external returns (uint256) {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        _safeMint(to, tokenId);
        
        agents[tokenId] = Agent({
            name: name,
            performanceScore: 50,
            isActive: true
        });
        
        emit AgentMinted(tokenId, name);
        return tokenId;
    }
    
    function getAgent(uint256 tokenId) external view returns (Agent memory) {
        require(_exists(tokenId), "Token does not exist");
        return agents[tokenId];
    }
    
    function updatePerformance(uint256 tokenId, uint256 score) external onlyOwner {
        require(_exists(tokenId), "Token does not exist");
        agents[tokenId].performanceScore = score;
    }
}