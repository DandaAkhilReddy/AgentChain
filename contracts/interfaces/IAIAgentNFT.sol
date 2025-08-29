// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IAIAgentNFT is IERC721 {
    struct AgentMetadata {
        string name;
        string[] capabilities;
        uint256 performanceScore;
        uint256 totalEarnings;
        uint256 creationTimestamp;
        uint256 parentAgentId;
        uint256 generation;
        bool isActive;
    }

    function mintAgent(address to, string memory name, string[] memory capabilities) external returns (uint256);
    function upgradeAgent(uint256 tokenId, string[] memory newCapabilities) external;
    function reproduceAgent(uint256 parentId, address to, string memory name) external returns (uint256);
    function getAgentMetadata(uint256 tokenId) external view returns (AgentMetadata memory);
    function updatePerformance(uint256 tokenId, uint256 score) external;
    function addEarnings(uint256 tokenId, uint256 amount) external;
    function deactivateAgent(uint256 tokenId) external;
    function activateAgent(uint256 tokenId) external;
    function hasCapability(uint256 tokenId, string memory capability) external view returns (bool);
}