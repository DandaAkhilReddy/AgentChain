// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface ITaskMarketplace {
    enum TaskStatus { Open, Claimed, InProgress, Completed, Disputed, Cancelled, Expired }
    enum TaskCategory { Translation, Analysis, Creation, Verification, DataProcessing, Training }
    enum DisputeStatus { None, Raised, UnderReview, Resolved, Rejected }

    struct Task {
        uint256 id;
        address creator;
        string title;
        string description;
        string requirementsHash; // IPFS hash for detailed requirements
        TaskCategory category;
        uint256 reward;
        uint256 deadline;
        TaskStatus status;
        address assignedAgent;
        uint256 assignedAgentId;
        uint256 completionTime;
        string submissionHash; // IPFS hash for submission
        uint256 createdAt;
        bool isUrgent;
        uint256 minPerformanceScore;
        string[] requiredCapabilities;
    }

    struct Dispute {
        uint256 taskId;
        address disputer;
        string reason;
        DisputeStatus status;
        uint256 createdAt;
        uint256 resolvedAt;
        address resolver;
        bool refunded;
    }

    event TaskCreated(uint256 indexed taskId, address indexed creator, uint256 reward, TaskCategory category);
    event TaskClaimed(uint256 indexed taskId, address indexed agent, uint256 agentId);
    event TaskCompleted(uint256 indexed taskId, address indexed agent, string submissionHash);
    event TaskDisputed(uint256 indexed taskId, address indexed disputer, string reason);
    event DisputeResolved(uint256 indexed taskId, DisputeStatus resolution, address resolver);
    event TaskCancelled(uint256 indexed taskId, address indexed creator);
    event TaskExpired(uint256 indexed taskId);
    event RewardClaimed(uint256 indexed taskId, address indexed agent, uint256 amount);

    function createTask(
        string memory title,
        string memory description,
        string memory requirementsHash,
        TaskCategory category,
        uint256 reward,
        uint256 duration,
        bool isUrgent,
        uint256 minPerformanceScore,
        string[] memory requiredCapabilities
    ) external returns (uint256);

    function createBulkTasks(
        string[] memory titles,
        string[] memory descriptions,
        string[] memory requirementsHashes,
        TaskCategory[] memory categories,
        uint256[] memory rewards,
        uint256[] memory durations
    ) external returns (uint256[] memory);

    function claimTask(uint256 taskId, uint256 agentId) external;
    function submitTask(uint256 taskId, string memory submissionHash) external;
    function completeTask(uint256 taskId) external;
    function disputeTask(uint256 taskId, string memory reason) external;
    function resolveDispute(uint256 taskId, DisputeStatus resolution) external;
    function cancelTask(uint256 taskId) external;
    function getTask(uint256 taskId) external view returns (Task memory);
    function getTasksByCreator(address creator) external view returns (uint256[] memory);
    function getTasksByAgent(address agent) external view returns (uint256[] memory);
    function getOpenTasksByCategory(TaskCategory category) external view returns (uint256[] memory);
}