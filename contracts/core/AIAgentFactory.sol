// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IBasicNFT.sol";

contract AIAgentFactory is ReentrancyGuard, Ownable {
    IERC20 public immutable kamikazeToken;
    IBasicNFT public immutable agentNFT;
    
    struct AgentTemplate {
        string name;
        string category;
        uint256 creationCost;
        uint256 stakingRequirement;
        bool isActive;
    }
    
    struct CreatedAgent {
        uint256 tokenId;
        address owner;
        string agentType;
        string apiEndpoint;
        uint256 stakedAmount;
        uint256 creationTime;
        bool isActive;
        uint256 tasksCompleted;
        uint256 totalEarned;
    }
    
    mapping(string => AgentTemplate) public agentTemplates;
    mapping(uint256 => CreatedAgent) public createdAgents;
    mapping(address => uint256[]) public userAgents;
    
    string[] public availableTemplates;
    uint256 public totalAgentsCreated;
    uint256 public baseCost = 1000 * 10**18; // 1000 KAMIKAZE tokens
    
    event AgentTemplateAdded(string templateId, string name, uint256 cost);
    event AgentCreated(address indexed owner, uint256 indexed tokenId, string agentType);
    event AgentStaked(uint256 indexed tokenId, uint256 amount);
    event AgentTaskCompleted(uint256 indexed tokenId, uint256 reward);
    
    constructor(address _kamikazeToken, address _agentNFT) {
        kamikazeToken = IERC20(_kamikazeToken);
        agentNFT = IBasicNFT(_agentNFT);
        
        _initializeTemplates();
    }
    
    function _initializeTemplates() private {
        // Content Creation Agents
        _addAgentTemplate("content-writer", "Content Writer", "writing", baseCost, baseCost / 2);
        _addAgentTemplate("social-media", "Social Media Manager", "marketing", baseCost, baseCost / 2);
        _addAgentTemplate("copywriter", "Copywriter", "writing", baseCost * 2, baseCost);
        
        // Technical Agents
        _addAgentTemplate("code-reviewer", "Code Reviewer", "development", baseCost * 3, baseCost * 2);
        _addAgentTemplate("bug-finder", "Bug Detector", "development", baseCost * 2, baseCost);
        _addAgentTemplate("api-tester", "API Tester", "development", baseCost, baseCost / 2);
        
        // Data & Analysis
        _addAgentTemplate("data-analyzer", "Data Analyst", "analytics", baseCost * 2, baseCost);
        _addAgentTemplate("report-generator", "Report Generator", "analytics", baseCost, baseCost / 2);
        _addAgentTemplate("trend-spotter", "Trend Analyst", "analytics", baseCost * 3, baseCost * 2);
        
        // Customer Service
        _addAgentTemplate("chatbot", "Customer Support Bot", "support", baseCost, baseCost / 2);
        _addAgentTemplate("translator", "Language Translator", "support", baseCost, baseCost / 2);
        _addAgentTemplate("scheduler", "Meeting Scheduler", "support", baseCost / 2, baseCost / 4);
    }
    
    function _addAgentTemplate(
        string memory _id,
        string memory _name,
        string memory _category,
        uint256 _cost,
        uint256 _stakingReq
    ) private {
        agentTemplates[_id] = AgentTemplate({
            name: _name,
            category: _category,
            creationCost: _cost,
            stakingRequirement: _stakingReq,
            isActive: true
        });
        availableTemplates.push(_id);
        
        emit AgentTemplateAdded(_id, _name, _cost);
    }
    
    function createAgent(
        string memory _templateId,
        string memory _apiEndpoint,
        uint256 _initialStake
    ) external nonReentrant returns (uint256) {
        AgentTemplate memory template = agentTemplates[_templateId];
        require(template.isActive, "Template not active");
        require(_initialStake >= template.stakingRequirement, "Insufficient stake");
        
        uint256 totalCost = template.creationCost + _initialStake;
        require(kamikazeToken.balanceOf(msg.sender) >= totalCost, "Insufficient KAMIKAZE balance");
        
        // Transfer tokens
        kamikazeToken.transferFrom(msg.sender, address(this), totalCost);
        
        // Mint NFT
        uint256 tokenId = agentNFT.mintAgent(msg.sender, template.name);
        
        // Store agent data
        createdAgents[tokenId] = CreatedAgent({
            tokenId: tokenId,
            owner: msg.sender,
            agentType: _templateId,
            apiEndpoint: _apiEndpoint,
            stakedAmount: _initialStake,
            creationTime: block.timestamp,
            isActive: true,
            tasksCompleted: 0,
            totalEarned: 0
        });
        
        userAgents[msg.sender].push(tokenId);
        totalAgentsCreated++;
        
        emit AgentCreated(msg.sender, tokenId, _templateId);
        emit AgentStaked(tokenId, _initialStake);
        
        return tokenId;
    }
    
    function stakeToAgent(uint256 _tokenId, uint256 _amount) external nonReentrant {
        require(createdAgents[_tokenId].owner == msg.sender, "Not agent owner");
        require(createdAgents[_tokenId].isActive, "Agent not active");
        require(_amount > 0, "Amount must be greater than 0");
        
        kamikazeToken.transferFrom(msg.sender, address(this), _amount);
        createdAgents[_tokenId].stakedAmount += _amount;
        
        emit AgentStaked(_tokenId, _amount);
    }
    
    function completeTask(uint256 _tokenId, uint256 _reward) external onlyOwner {
        require(createdAgents[_tokenId].isActive, "Agent not active");
        
        CreatedAgent storage agent = createdAgents[_tokenId];
        agent.tasksCompleted++;
        agent.totalEarned += _reward;
        
        // Pay reward to agent owner
        kamikazeToken.transfer(agent.owner, _reward);
        
        emit AgentTaskCompleted(_tokenId, _reward);
    }
    
    function withdrawStake(uint256 _tokenId, uint256 _amount) external nonReentrant {
        require(createdAgents[_tokenId].owner == msg.sender, "Not agent owner");
        require(createdAgents[_tokenId].stakedAmount >= _amount, "Insufficient stake");
        
        createdAgents[_tokenId].stakedAmount -= _amount;
        kamikazeToken.transfer(msg.sender, _amount);
    }
    
    function deactivateAgent(uint256 _tokenId) external {
        require(createdAgents[_tokenId].owner == msg.sender, "Not agent owner");
        createdAgents[_tokenId].isActive = false;
    }
    
    function activateAgent(uint256 _tokenId) external {
        require(createdAgents[_tokenId].owner == msg.sender, "Not agent owner");
        createdAgents[_tokenId].isActive = true;
    }
    
    function getAgentTemplate(string memory _templateId) external view returns (AgentTemplate memory) {
        return agentTemplates[_templateId];
    }
    
    function getAllTemplates() external view returns (string[] memory) {
        return availableTemplates;
    }
    
    function getUserAgents(address _user) external view returns (uint256[] memory) {
        return userAgents[_user];
    }
    
    function getAgentDetails(uint256 _tokenId) external view returns (CreatedAgent memory) {
        return createdAgents[_tokenId];
    }
    
    function updateBaseCost(uint256 _newCost) external onlyOwner {
        baseCost = _newCost;
    }
    
    function updateTemplate(
        string memory _templateId,
        uint256 _cost,
        uint256 _stakingReq,
        bool _isActive
    ) external onlyOwner {
        AgentTemplate storage template = agentTemplates[_templateId];
        template.creationCost = _cost;
        template.stakingRequirement = _stakingReq;
        template.isActive = _isActive;
    }
}