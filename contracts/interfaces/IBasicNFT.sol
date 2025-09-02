// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IBasicNFT is IERC721 {
    struct Agent {
        string name;
        uint256 performanceScore;
        bool isActive;
    }

    function mintAgent(address to, string memory name) external returns (uint256);
    function getAgent(uint256 tokenId) external view returns (Agent memory);
    function updatePerformance(uint256 tokenId, uint256 score) external;
    function setActive(uint256 tokenId, bool active) external;
    function totalSupply() external view returns (uint256);
}