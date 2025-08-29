// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract BasicMarketplace is Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    enum TaskStatus { Open, Claimed, Completed, Cancelled }
    
    struct Task {
        uint256 id;
        address creator;
        string title;
        uint256 reward;
        uint256 deadline;
        TaskStatus status;
        address assignedAgent;
        uint256 assignedAgentId;
    }
    
    Counters.Counter private _taskIdCounter;
    IERC20 public mindToken;
    
    mapping(uint256 => Task) public tasks;
    mapping(uint256 => uint256) private _taskEscrow;
    
    event TaskCreated(uint256 indexed taskId, address indexed creator, uint256 reward);
    event TaskClaimed(uint256 indexed taskId, address indexed agent);
    event TaskCompleted(uint256 indexed taskId);
    
    constructor(address _mindToken) {
        require(_mindToken != address(0), "Invalid token address");
        mindToken = IERC20(_mindToken);
        _taskIdCounter.increment();
    }
    
    function createTask(
        string memory title,
        uint256 reward,
        uint256 duration
    ) external nonReentrant returns (uint256) {
        require(bytes(title).length > 0, "Title cannot be empty");
        require(reward > 0, "Reward must be greater than 0");
        
        require(mindToken.transferFrom(msg.sender, address(this), reward), "Payment failed");
        
        uint256 taskId = _taskIdCounter.current();
        _taskIdCounter.increment();
        
        tasks[taskId] = Task({
            id: taskId,
            creator: msg.sender,
            title: title,
            reward: reward,
            deadline: block.timestamp + duration,
            status: TaskStatus.Open,
            assignedAgent: address(0),
            assignedAgentId: 0
        });
        
        _taskEscrow[taskId] = reward;
        
        emit TaskCreated(taskId, msg.sender, reward);
        return taskId;
    }
    
    function claimTask(uint256 taskId, uint256 agentId) external nonReentrant {
        require(tasks[taskId].id != 0, "Task does not exist");
        Task storage task = tasks[taskId];
        require(task.status == TaskStatus.Open, "Task not open");
        require(task.deadline > block.timestamp, "Task expired");
        
        task.status = TaskStatus.Claimed;
        task.assignedAgent = msg.sender;
        task.assignedAgentId = agentId;
        
        emit TaskClaimed(taskId, msg.sender);
    }
    
    function completeTask(uint256 taskId) external nonReentrant {
        require(tasks[taskId].id != 0, "Task does not exist");
        Task storage task = tasks[taskId];
        require(task.status == TaskStatus.Claimed, "Task not claimed");
        require(msg.sender == task.creator, "Only creator can complete");
        
        task.status = TaskStatus.Completed;
        
        uint256 reward = _taskEscrow[taskId];
        _taskEscrow[taskId] = 0;
        
        require(mindToken.transfer(task.assignedAgent, reward), "Reward transfer failed");
        
        emit TaskCompleted(taskId);
    }
    
    function getTask(uint256 taskId) external view returns (Task memory) {
        require(tasks[taskId].id != 0, "Task does not exist");
        return tasks[taskId];
    }
}