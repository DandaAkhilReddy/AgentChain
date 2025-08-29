// Contract addresses (update these with your deployed addresses)
export const CONTRACT_ADDRESSES = {
  // From your local deployment - update these if deploying to testnet
  MIND_TOKEN: "0x6eaE6fE16708Ad36c38DAf73f1DEe3dad9BeC2ed",
  AI_AGENT_NFT: "0x342b37DeFD122d9E421f75895fd091900b792969",
  MARKETPLACE: "0x77079eb61bF15AF9ce4017832cdcEc57280E50F4",
  AGENT_MARKETPLACE: "0x1234567890123456789012345678901234567890" // Update with actual address after deployment
};

// Network configuration
export const NETWORKS = {
  hardhat: {
    chainId: 31337,
    name: "AgentChains Local",
    rpc: "http://127.0.0.1:8545",
    currency: "ETH"
  },
  mumbai: {
    chainId: 80001,
    name: "Polygon Mumbai",
    rpc: "https://matic-mumbai.chainstacklabs.com",
    currency: "MATIC",
    blockExplorer: "https://mumbai.polygonscan.com"
  }
};

// Contract ABIs (simplified for demo)
export const CONTRACT_ABIS = {
  MIND_TOKEN: [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function burn(uint256 amount)",
    "event Transfer(address indexed from, address indexed to, uint256 value)"
  ],
  
  AI_AGENT_NFT: [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function balanceOf(address owner) view returns (uint256)",
    "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
    "function agents(uint256 tokenId) view returns (tuple(string name, uint256 performanceScore, bool isActive))",
    "function mintAgent(address to, string name) returns (uint256)",
    "function getAgent(uint256 tokenId) view returns (tuple(string name, uint256 performanceScore, bool isActive))",
    "event AgentMinted(uint256 indexed tokenId, string name)"
  ],
  
  MARKETPLACE: [
    "function tasks(uint256) view returns (tuple(uint256 id, address creator, string title, uint256 reward, uint256 deadline, uint8 status, address assignedAgent, uint256 assignedAgentId))",
    "function createTask(string title, uint256 reward, uint256 duration) returns (uint256)",
    "function claimTask(uint256 taskId, uint256 agentId)",
    "function completeTask(uint256 taskId)",
    "function getTask(uint256 taskId) view returns (tuple(uint256 id, address creator, string title, uint256 reward, uint256 deadline, uint8 status, address assignedAgent, uint256 assignedAgentId))",
    "event TaskCreated(uint256 indexed taskId, address indexed creator, uint256 reward)",
    "event TaskClaimed(uint256 indexed taskId, address indexed agent)",
    "event TaskCompleted(uint256 indexed taskId)"
  ],

  AGENT_MARKETPLACE: [
    "function listAgent(uint256 agentId, uint256 price)",
    "function buyAgent(uint256 agentId)",
    "function delistAgent(uint256 agentId)",
    "function updatePrice(uint256 agentId, uint256 newPrice)",
    "function claimTrialTokens()",
    "function hasClaimedTrial(address) view returns (bool)",
    "function getActiveListings() view returns (uint256[])",
    "function getListing(uint256 agentId) view returns (tuple(uint256 agentId, address seller, uint256 price, bool active, uint256 listedAt))",
    "function getAgentWithListing(uint256 agentId) view returns (string name, uint256 performanceScore, bool isActive, bool isListed, uint256 price, address seller)",
    "event AgentListed(uint256 indexed agentId, address indexed seller, uint256 price)",
    "event AgentSold(uint256 indexed agentId, address indexed seller, address indexed buyer, uint256 price)",
    "event TrialTokensClaimed(address indexed user, uint256 amount)"
  ]
};