// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IConsciousCoin is IERC20 {
    // burn function inherited from ERC20Burnable
    function pause() external;
    function unpause() external;
    function blacklist(address account) external;
    function unblacklist(address account) external;
    function isBlacklisted(address account) external view returns (bool);
    function excludeFromFee(address account) external;
    function includeInFee(address account) external;
    function isExcludedFromFee(address account) external view returns (bool);
}