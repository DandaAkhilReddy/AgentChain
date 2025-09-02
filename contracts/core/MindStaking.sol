// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract KamikazeStaking is ReentrancyGuard, Ownable {
    IERC20 public immutable kamikazeToken;
    
    struct StakeInfo {
        uint256 amount;
        uint256 timestamp;
        uint256 rewardDebt;
        uint256 lockPeriod; // in seconds
    }
    
    mapping(address => StakeInfo[]) public userStakes;
    mapping(address => uint256) public totalStaked;
    
    uint256 public totalPoolStaked;
    uint256 public rewardRate = 100; // 10% APY base rate (100/1000)
    uint256 public constant REWARD_PRECISION = 1000;
    uint256 public constant SECONDS_PER_YEAR = 31536000;
    
    // Lock period multipliers (basis points)
    uint256 public constant NO_LOCK_MULTIPLIER = 1000; // 1x (100%)
    uint256 public constant MONTH_LOCK_MULTIPLIER = 1200; // 1.2x (120%)
    uint256 public constant QUARTER_LOCK_MULTIPLIER = 1500; // 1.5x (150%)
    uint256 public constant YEAR_LOCK_MULTIPLIER = 2000; // 2x (200%)
    
    uint256 public constant NO_LOCK_PERIOD = 0;
    uint256 public constant MONTH_LOCK_PERIOD = 30 days;
    uint256 public constant QUARTER_LOCK_PERIOD = 90 days;
    uint256 public constant YEAR_LOCK_PERIOD = 365 days;
    
    event Staked(address indexed user, uint256 amount, uint256 lockPeriod);
    event Unstaked(address indexed user, uint256 amount, uint256 reward);
    event RewardClaimed(address indexed user, uint256 reward);
    
    constructor(address _kamikazeToken) {
        kamikazeToken = IERC20(_kamikazeToken);
    }
    
    function stake(uint256 _amount, uint256 _lockPeriod) external nonReentrant {
        require(_amount > 0, "Amount must be greater than 0");
        require(_isValidLockPeriod(_lockPeriod), "Invalid lock period");
        
        kamikazeToken.transferFrom(msg.sender, address(this), _amount);
        
        userStakes[msg.sender].push(StakeInfo({
            amount: _amount,
            timestamp: block.timestamp,
            rewardDebt: 0,
            lockPeriod: _lockPeriod
        }));
        
        totalStaked[msg.sender] += _amount;
        totalPoolStaked += _amount;
        
        emit Staked(msg.sender, _amount, _lockPeriod);
    }
    
    function unstake(uint256 _stakeIndex) external nonReentrant {
        require(_stakeIndex < userStakes[msg.sender].length, "Invalid stake index");
        
        StakeInfo storage stakeInfo = userStakes[msg.sender][_stakeIndex];
        require(stakeInfo.amount > 0, "Stake already withdrawn");
        require(
            block.timestamp >= stakeInfo.timestamp + stakeInfo.lockPeriod,
            "Stake is still locked"
        );
        
        uint256 reward = calculateReward(msg.sender, _stakeIndex);
        uint256 amount = stakeInfo.amount;
        
        stakeInfo.amount = 0;
        totalStaked[msg.sender] -= amount;
        totalPoolStaked -= amount;
        
        kamikazeToken.transfer(msg.sender, amount + reward);
        
        emit Unstaked(msg.sender, amount, reward);
    }
    
    function claimReward(uint256 _stakeIndex) external nonReentrant {
        require(_stakeIndex < userStakes[msg.sender].length, "Invalid stake index");
        
        StakeInfo storage stakeInfo = userStakes[msg.sender][_stakeIndex];
        require(stakeInfo.amount > 0, "No active stake");
        
        uint256 reward = calculateReward(msg.sender, _stakeIndex);
        require(reward > 0, "No reward available");
        
        stakeInfo.rewardDebt += reward;
        stakeInfo.timestamp = block.timestamp; // Reset timestamp for next reward calculation
        
        kamikazeToken.transfer(msg.sender, reward);
        
        emit RewardClaimed(msg.sender, reward);
    }
    
    function calculateReward(address _user, uint256 _stakeIndex) public view returns (uint256) {
        require(_stakeIndex < userStakes[_user].length, "Invalid stake index");
        
        StakeInfo memory stakeInfo = userStakes[_user][_stakeIndex];
        if (stakeInfo.amount == 0) return 0;
        
        uint256 stakingTime = block.timestamp - stakeInfo.timestamp;
        uint256 multiplier = _getLockMultiplier(stakeInfo.lockPeriod);
        
        uint256 annualReward = (stakeInfo.amount * rewardRate * multiplier) / (REWARD_PRECISION * 1000);
        uint256 reward = (annualReward * stakingTime) / SECONDS_PER_YEAR;
        
        return reward;
    }
    
    function getUserStakes(address _user) external view returns (StakeInfo[] memory) {
        return userStakes[_user];
    }
    
    function getUserStakeCount(address _user) external view returns (uint256) {
        return userStakes[_user].length;
    }
    
    function getTotalRewards(address _user) external view returns (uint256) {
        uint256 totalRewards = 0;
        for (uint256 i = 0; i < userStakes[_user].length; i++) {
            totalRewards += calculateReward(_user, i);
        }
        return totalRewards;
    }
    
    function _isValidLockPeriod(uint256 _lockPeriod) private pure returns (bool) {
        return _lockPeriod == NO_LOCK_PERIOD ||
               _lockPeriod == MONTH_LOCK_PERIOD ||
               _lockPeriod == QUARTER_LOCK_PERIOD ||
               _lockPeriod == YEAR_LOCK_PERIOD;
    }
    
    function _getLockMultiplier(uint256 _lockPeriod) private pure returns (uint256) {
        if (_lockPeriod == NO_LOCK_PERIOD) return NO_LOCK_MULTIPLIER;
        if (_lockPeriod == MONTH_LOCK_PERIOD) return MONTH_LOCK_MULTIPLIER;
        if (_lockPeriod == QUARTER_LOCK_PERIOD) return QUARTER_LOCK_MULTIPLIER;
        if (_lockPeriod == YEAR_LOCK_PERIOD) return YEAR_LOCK_MULTIPLIER;
        return NO_LOCK_MULTIPLIER;
    }
    
    function setRewardRate(uint256 _newRate) external onlyOwner {
        require(_newRate <= 500, "Reward rate too high"); // Max 50% APY
        rewardRate = _newRate;
    }
    
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = kamikazeToken.balanceOf(address(this));
        kamikazeToken.transfer(owner(), balance);
    }
}