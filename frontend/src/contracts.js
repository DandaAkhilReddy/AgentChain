// Contract addresses (update these with your deployed addresses)
export const CONTRACT_ADDRESSES = {
  // From your local deployment - update these if deploying to testnet
  MIND_TOKEN: "0xc9205abC4A4fceC25E15446A8c2DD19ab60e1149",
  AI_AGENT_NFT: "0xA38062F23cbF30680De009e59E62B62F6c95a35A",
  MARKETPLACE: "0xefBa1032bB5f9bEC79e022f52D89C2cc9090D1B8"
};

// Network configuration
export const NETWORKS = {
  hardhat: {
    chainId: 31337,
    name: "Hardhat Local",
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
  ]
};