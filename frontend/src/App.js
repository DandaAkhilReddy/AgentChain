import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, CONTRACT_ABIS, NETWORKS } from './contracts';
import './App.css';

const TaskStatus = {
  0: 'Open',
  1: 'Claimed', 
  2: 'Completed',
  3: 'Cancelled'
};

function App() {
  const [account, setAccount] = useState('');
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contracts, setContracts] = useState({});
  const [loading, setLoading] = useState(false);
  const [network, setNetwork] = useState(null);
  
  // State for different sections
  const [mindBalance, setMindBalance] = useState('0');
  const [agentCount, setAgentCount] = useState(0);
  const [agents, setAgents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [agentListings, setAgentListings] = useState([]);
  const [hasClaimedTrial, setHasClaimedTrial] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Form states
  const [newAgentName, setNewAgentName] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskReward, setNewTaskReward] = useState('');
  const [newTaskDuration, setNewTaskDuration] = useState('24');
  const [agentSalePrice, setAgentSalePrice] = useState('');

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  const checkIfWalletIsConnected = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          await connectWallet();
        }
      }
    } catch (error) {
      console.error("Error checking wallet connection:", error);
    }
  };

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask!');
        return;
      }

      setLoading(true);
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = accounts[0];
      setAccount(account);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();
      
      setProvider(provider);
      setSigner(signer);
      setNetwork(network);

      // Initialize contracts
      const mindToken = new ethers.Contract(CONTRACT_ADDRESSES.MIND_TOKEN, CONTRACT_ABIS.MIND_TOKEN, signer);
      const agentNFT = new ethers.Contract(CONTRACT_ADDRESSES.AI_AGENT_NFT, CONTRACT_ABIS.AI_AGENT_NFT, signer);
      const marketplace = new ethers.Contract(CONTRACT_ADDRESSES.MARKETPLACE, CONTRACT_ABIS.MARKETPLACE, signer);
      const agentMarketplace = new ethers.Contract(CONTRACT_ADDRESSES.AGENT_MARKETPLACE, CONTRACT_ABIS.AGENT_MARKETPLACE, signer);

      setContracts({ mindToken, agentNFT, marketplace, agentMarketplace });

      // Load initial data
      await loadUserData(mindToken, agentNFT, marketplace, account);
      await loadTasks(marketplace);
      await loadAgentMarketplace(agentMarketplace, agentNFT, account);

      setLoading(false);
    } catch (error) {
      console.error("Error connecting wallet:", error);
      setLoading(false);
    }
  };

  const loadUserData = async (mindToken, agentNFT, marketplace, userAccount) => {
    try {
      // Get MIND token balance
      const balance = await mindToken.balanceOf(userAccount);
      setMindBalance(ethers.formatEther(balance));

      // Get agent count and details
      const agentBalance = await agentNFT.balanceOf(userAccount);
      setAgentCount(Number(agentBalance));

      const userAgents = [];
      for (let i = 0; i < Number(agentBalance); i++) {
        try {
          const tokenId = await agentNFT.tokenOfOwnerByIndex(userAccount, i);
          const agent = await agentNFT.getAgent(tokenId);
          userAgents.push({
            id: Number(tokenId),
            name: agent.name,
            performanceScore: Number(agent.performanceScore),
            isActive: agent.isActive
          });
        } catch (error) {
          console.log("Error loading agent", i, error);
        }
      }
      setAgents(userAgents);
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const loadTasks = async (marketplace) => {
    try {
      const taskList = [];
      // Try to load first 10 tasks
      for (let i = 1; i <= 10; i++) {
        try {
          const task = await marketplace.getTask(i);
          if (task.id > 0) {
            taskList.push({
              id: Number(task.id),
              creator: task.creator,
              title: task.title,
              reward: ethers.formatEther(task.reward),
              deadline: new Date(Number(task.deadline) * 1000).toLocaleString(),
              status: TaskStatus[task.status] || 'Unknown',
              assignedAgent: task.assignedAgent,
              assignedAgentId: Number(task.assignedAgentId)
            });
          }
        } catch (error) {
          // Task doesn't exist, skip
          break;
        }
      }
      setTasks(taskList);
    } catch (error) {
      console.error("Error loading tasks:", error);
    }
  };

  const loadAgentMarketplace = async (agentMarketplace, agentNFT, userAccount) => {
    try {
      // Check if user has claimed trial tokens
      const hasClaimed = await agentMarketplace.hasClaimedTrial(userAccount);
      setHasClaimedTrial(hasClaimed);

      // Get active agent listings
      const activeListingIds = await agentMarketplace.getActiveListings();
      const listings = [];
      
      for (let i = 0; i < activeListingIds.length && i < 10; i++) {
        try {
          const agentId = activeListingIds[i];
          const agentData = await agentMarketplace.getAgentWithListing(agentId);
          listings.push({
            agentId: Number(agentId),
            name: agentData[0],
            performanceScore: Number(agentData[1]),
            isActive: agentData[2],
            isListed: agentData[3],
            price: ethers.formatEther(agentData[4]),
            seller: agentData[5]
          });
        } catch (error) {
          console.log("Error loading agent listing", activeListingIds[i], error);
        }
      }
      setAgentListings(listings);
    } catch (error) {
      console.error("Error loading agent marketplace:", error);
    }
  };

  const claimTrialTokens = async () => {
    if (hasClaimedTrial) {
      alert('Trial tokens already claimed');
      return;
    }

    try {
      setLoading(true);
      const tx = await contracts.agentMarketplace.claimTrialTokens();
      await tx.wait();
      
      alert('1000 MIND trial tokens claimed successfully!');
      setHasClaimedTrial(true);
      
      // Refresh balance
      const balance = await contracts.mindToken.balanceOf(account);
      setMindBalance(ethers.formatEther(balance));
    } catch (error) {
      console.error("Error claiming trial tokens:", error);
      alert('Error claiming trial tokens: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const listAgentForSale = async (agentId) => {
    if (!agentSalePrice.trim()) {
      alert('Please enter a sale price');
      return;
    }

    try {
      setLoading(true);
      
      // First approve agent marketplace to handle the NFT
      const approveTx = await contracts.agentNFT.approve(CONTRACT_ADDRESSES.AGENT_MARKETPLACE, agentId);
      await approveTx.wait();

      // List the agent
      const priceWei = ethers.parseEther(agentSalePrice);
      const tx = await contracts.agentMarketplace.listAgent(agentId, priceWei);
      await tx.wait();
      
      alert(`Agent ${agentId} listed for ${agentSalePrice} MIND tokens!`);
      setAgentSalePrice('');
      
      // Refresh data
      await loadUserData(contracts.mindToken, contracts.agentNFT, contracts.marketplace, account);
      await loadAgentMarketplace(contracts.agentMarketplace, contracts.agentNFT, account);
    } catch (error) {
      console.error("Error listing agent:", error);
      alert('Error listing agent: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const buyAgent = async (agentId, price) => {
    try {
      setLoading(true);
      
      // First approve marketplace to spend tokens
      const priceWei = ethers.parseEther(price);
      const approveTx = await contracts.mindToken.approve(CONTRACT_ADDRESSES.AGENT_MARKETPLACE, priceWei);
      await approveTx.wait();

      // Buy the agent
      const tx = await contracts.agentMarketplace.buyAgent(agentId);
      await tx.wait();
      
      alert(`Agent ${agentId} purchased successfully!`);
      
      // Refresh data
      await loadUserData(contracts.mindToken, contracts.agentNFT, contracts.marketplace, account);
      await loadAgentMarketplace(contracts.agentMarketplace, contracts.agentNFT, account);
    } catch (error) {
      console.error("Error buying agent:", error);
      alert('Error buying agent: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const mintAgent = async () => {
    if (!newAgentName.trim()) {
      alert('Please enter an agent name');
      return;
    }

    try {
      setLoading(true);
      const tx = await contracts.agentNFT.mintAgent(account, newAgentName);
      await tx.wait();
      
      alert(`Agent "${newAgentName}" minted successfully!`);
      setNewAgentName('');
      
      // Refresh data
      await loadUserData(contracts.mindToken, contracts.agentNFT, contracts.marketplace, account);
      await loadAgentMarketplace(contracts.agentMarketplace, contracts.agentNFT, account);
    } catch (error) {
      console.error("Error minting agent:", error);
      alert('Error minting agent: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async () => {
    if (!newTaskTitle.trim() || !newTaskReward) {
      alert('Please fill in all task details');
      return;
    }

    try {
      setLoading(true);
      
      // First approve marketplace to spend tokens
      const rewardWei = ethers.parseEther(newTaskReward);
      const approveTx = await contracts.mindToken.approve(CONTRACT_ADDRESSES.MARKETPLACE, rewardWei);
      await approveTx.wait();

      // Create the task
      const durationSeconds = parseInt(newTaskDuration) * 3600; // hours to seconds
      const tx = await contracts.marketplace.createTask(newTaskTitle, rewardWei, durationSeconds);
      await tx.wait();
      
      alert(`Task "${newTaskTitle}" created successfully!`);
      setNewTaskTitle('');
      setNewTaskReward('');
      
      // Refresh data
      await loadUserData(contracts.mindToken, contracts.agentNFT, contracts.marketplace, account);
      await loadTasks(contracts.marketplace);
    } catch (error) {
      console.error("Error creating task:", error);
      alert('Error creating task: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const claimTask = async (taskId) => {
    if (agents.length === 0) {
      alert('You need to mint an AI agent first!');
      return;
    }

    try {
      setLoading(true);
      const agentId = agents[0].id; // Use first agent
      const tx = await contracts.marketplace.claimTask(taskId, agentId);
      await tx.wait();
      
      alert(`Task claimed by ${agents[0].name}!`);
      
      // Refresh tasks
      await loadTasks(contracts.marketplace);
    } catch (error) {
      console.error("Error claiming task:", error);
      alert('Error claiming task: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const completeTask = async (taskId) => {
    try {
      setLoading(true);
      const tx = await contracts.marketplace.completeTask(taskId);
      await tx.wait();
      
      alert('Task completed! Reward sent to agent owner.');
      
      // Refresh data
      await loadUserData(contracts.mindToken, contracts.agentNFT, contracts.marketplace, account);
      await loadTasks(contracts.marketplace);
    } catch (error) {
      console.error("Error completing task:", error);
      alert('Error completing task: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const switchToHardhat = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x7a69', // 31337 in hex
          chainName: 'Hardhat Local',
          nativeCurrency: {
            name: 'ETH',
            symbol: 'ETH',
            decimals: 18
          },
          rpcUrls: ['http://127.0.0.1:8545'],
          blockExplorerUrls: null
        }]
      });
    } catch (error) {
      console.error("Error adding Hardhat network:", error);
    }
  };

  if (!account) {
    return (
      <div className="app">
        <div className="connect-container">
          <div className="connect-card">
            <h1>🧠 ConsciousAI Blockchain</h1>
            <p>Connect your wallet to interact with AI agents and tasks</p>
            <button onClick={connectWallet} className="connect-button">
              Connect Wallet
            </button>
            <div className="network-info">
              <p>Make sure you're on Hardhat Local Network (Chain ID: 31337)</p>
              <button onClick={switchToHardhat} className="network-button">
                Add Hardhat Network to MetaMask
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🧠 ConsciousAI Blockchain</h1>
        <div className="account-info">
          <span>🔗 {network?.name || 'Unknown Network'}</span>
          <span>👤 {account.slice(0, 6)}...{account.slice(-4)}</span>
        </div>
      </header>

      <nav className="nav-tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''} 
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={activeTab === 'agents' ? 'active' : ''} 
          onClick={() => setActiveTab('agents')}
        >
          🤖 My Agents
        </button>
        <button 
          className={activeTab === 'tasks' ? 'active' : ''} 
          onClick={() => setActiveTab('tasks')}
        >
          📋 Task Market
        </button>
        <button 
          className={activeTab === 'agents-market' ? 'active' : ''} 
          onClick={() => setActiveTab('agents-market')}
        >
          🏪 Agent Market
        </button>
        <button 
          className={activeTab === 'create' ? 'active' : ''} 
          onClick={() => setActiveTab('create')}
        >
          ➕ Create
        </button>
      </nav>

      <main className="main-content">
        {activeTab === 'overview' && (
          <div className="overview">
            <div className="stats-grid">
              <div className="stat-card">
                <h3>🪙 MIND Balance</h3>
                <p className="stat-value">{parseFloat(mindBalance).toLocaleString()} MIND</p>
              </div>
              <div className="stat-card">
                <h3>🤖 My Agents</h3>
                <p className="stat-value">{agentCount}</p>
              </div>
              <div className="stat-card">
                <h3>📋 Available Tasks</h3>
                <p className="stat-value">{tasks.filter(t => t.status === 'Open').length}</p>
              </div>
              <div className="stat-card">
                <h3>⚡ Network</h3>
                <p className="stat-value">{network?.name || 'Local'}</p>
              </div>
            </div>
            
            <div className="quick-actions">
              <h2>🚀 Quick Actions</h2>
              {!hasClaimedTrial && (
                <div className="trial-tokens">
                  <button 
                    onClick={claimTrialTokens} 
                    className="trial-button"
                    disabled={loading}
                  >
                    🎁 Claim 1000 Free Trial Tokens!
                  </button>
                </div>
              )}
              <div className="action-buttons">
                <button onClick={() => setActiveTab('agents')} className="action-button">
                  🤖 Manage Agents
                </button>
                <button onClick={() => setActiveTab('agents-market')} className="action-button">
                  🏪 Buy/Sell Agents
                </button>
                <button onClick={() => setActiveTab('tasks')} className="action-button">
                  📋 Browse Tasks
                </button>
                <button onClick={() => setActiveTab('create')} className="action-button">
                  ➕ Create Task
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'agents' && (
          <div className="agents-section">
            <h2>🤖 My AI Agents</h2>
            
            <div className="mint-agent">
              <h3>➕ Mint New Agent</h3>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Agent name (e.g., TranslatorBot)"
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                />
                <button onClick={mintAgent} disabled={loading}>
                  {loading ? 'Minting...' : 'Mint Agent'}
                </button>
              </div>
            </div>

            <div className="agents-grid">
              {agents.map((agent) => (
                <div key={agent.id} className="agent-card">
                  <h3>🤖 {agent.name}</h3>
                  <p>ID: #{agent.id}</p>
                  <p>Performance: {agent.performanceScore}/100</p>
                  <p>Status: {agent.isActive ? '🟢 Active' : '🔴 Inactive'}</p>
                  
                  <div className="agent-actions">
                    <div className="list-for-sale">
                      <input
                        type="number"
                        placeholder="Price in MIND"
                        value={agentSalePrice}
                        onChange={(e) => setAgentSalePrice(e.target.value)}
                        min="1"
                        step="1"
                      />
                      <button 
                        onClick={() => listAgentForSale(agent.id)} 
                        disabled={loading || !agentSalePrice}
                        className="list-button"
                      >
                        🏷️ List for Sale
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {agents.length === 0 && (
                <div className="empty-state">
                  <p>No agents yet. Mint your first AI agent above!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="tasks-section">
            <h2>📋 Task Marketplace</h2>
            
            <div className="tasks-grid">
              {tasks.map((task) => (
                <div key={task.id} className="task-card">
                  <h3>{task.title}</h3>
                  <p className="reward">💰 {task.reward} MIND</p>
                  <p className="deadline">⏰ {task.deadline}</p>
                  <p className="status">Status: <span className={`status-${task.status.toLowerCase()}`}>{task.status}</span></p>
                  
                  {task.status === 'Open' && task.creator !== account && (
                    <button onClick={() => claimTask(task.id)} disabled={loading || agents.length === 0}>
                      {loading ? 'Claiming...' : 'Claim Task'}
                    </button>
                  )}
                  
                  {task.status === 'Claimed' && task.creator === account && (
                    <button onClick={() => completeTask(task.id)} disabled={loading}>
                      {loading ? 'Completing...' : 'Complete Task'}
                    </button>
                  )}
                  
                  {task.assignedAgent && task.assignedAgent !== '0x0000000000000000000000000000000000000000' && (
                    <p className="assigned">👤 Agent #{task.assignedAgentId}</p>
                  )}
                </div>
              ))}
              
              {tasks.length === 0 && (
                <div className="empty-state">
                  <p>No tasks available. Create the first one!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'create' && (
          <div className="create-section">
            <h2>➕ Create New Task</h2>
            
            <div className="create-form">
              <div className="form-group">
                <label>Task Title</label>
                <input
                  type="text"
                  placeholder="e.g., Translate document from English to Spanish"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label>Reward (MIND tokens)</label>
                <input
                  type="number"
                  placeholder="e.g., 100"
                  value={newTaskReward}
                  onChange={(e) => setNewTaskReward(e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label>Duration (hours)</label>
                <select value={newTaskDuration} onChange={(e) => setNewTaskDuration(e.target.value)}>
                  <option value="1">1 hour</option>
                  <option value="6">6 hours</option>
                  <option value="24">24 hours</option>
                  <option value="48">48 hours</option>
                  <option value="168">1 week</option>
                </select>
              </div>
              
              <button onClick={createTask} disabled={loading} className="create-button">
                {loading ? 'Creating...' : 'Create Task'}
              </button>
            </div>

            <div className="balance-info">
              <p>Your MIND Balance: {parseFloat(mindBalance).toLocaleString()} MIND</p>
              <p>Make sure you have enough MIND tokens to create tasks!</p>
            </div>
          </div>
        )}

        {activeTab === 'agents-market' && (
          <div className="agent-market-section">
            <h2>🏪 Agent Marketplace</h2>
            <p>Buy and sell AI agents as NFTs. Each agent retains its performance score and history!</p>
            
            {!hasClaimedTrial && (
              <div className="trial-banner">
                <h3>🎁 First time here?</h3>
                <p>Claim 1000 free MIND tokens to get started!</p>
                <button 
                  onClick={claimTrialTokens} 
                  className="trial-button"
                  disabled={loading}
                >
                  {loading ? 'Claiming...' : 'Claim Trial Tokens'}
                </button>
              </div>
            )}

            <div className="market-stats">
              <div className="stat-card">
                <h3>🏷️ Listed Agents</h3>
                <p className="stat-value">{agentListings.length}</p>
              </div>
              <div className="stat-card">
                <h3>💰 Your Balance</h3>
                <p className="stat-value">{parseFloat(mindBalance).toLocaleString()} MIND</p>
              </div>
              <div className="stat-card">
                <h3>🔥 Token Burns</h3>
                <p className="stat-value">2% per transfer</p>
              </div>
            </div>

            <div className="agents-grid">
              {agentListings.map((listing) => (
                <div key={listing.agentId} className="agent-listing-card">
                  <div className="listing-header">
                    <h3>🤖 {listing.name}</h3>
                    <div className="price-tag">💰 {listing.price} MIND</div>
                  </div>
                  
                  <div className="agent-details">
                    <p>ID: #{listing.agentId}</p>
                    <p>Performance: {listing.performanceScore}/100</p>
                    <p>Status: {listing.isActive ? '🟢 Active' : '🔴 Inactive'}</p>
                    <p>Seller: {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}</p>
                  </div>

                  <div className="listing-actions">
                    {listing.seller.toLowerCase() !== account.toLowerCase() ? (
                      <button 
                        onClick={() => buyAgent(listing.agentId, listing.price)}
                        disabled={loading || parseFloat(mindBalance) < parseFloat(listing.price)}
                        className="buy-button"
                      >
                        {loading ? 'Buying...' : `Buy for ${listing.price} MIND`}
                      </button>
                    ) : (
                      <div className="owner-badge">
                        🏷️ Your Listing
                      </div>
                    )}
                  </div>

                  {parseFloat(mindBalance) < parseFloat(listing.price) && 
                   listing.seller.toLowerCase() !== account.toLowerCase() && (
                    <p className="insufficient-funds">⚠️ Insufficient MIND tokens</p>
                  )}
                </div>
              ))}
              
              {agentListings.length === 0 && (
                <div className="empty-state">
                  <h3>🏪 No Agents Listed Yet</h3>
                  <p>Be the first to list an agent for sale!</p>
                  <p>Go to "My Agents" tab to list your agents.</p>
                </div>
              )}
            </div>

            <div className="market-info">
              <h3>💡 How Agent Trading Works</h3>
              <div className="info-grid">
                <div className="info-card">
                  <h4>🛍️ Buying</h4>
                  <p>• Browse listed agents</p>
                  <p>• Pay with MIND tokens</p>
                  <p>• 2% tokens burned on purchase</p>
                  <p>• Agent transfers to your wallet</p>
                </div>
                <div className="info-card">
                  <h4>🏷️ Selling</h4>
                  <p>• List your agents with custom price</p>
                  <p>• 2% marketplace fee</p>
                  <p>• Instant payment on sale</p>
                  <p>• Agent history preserved</p>
                </div>
                <div className="info-card">
                  <h4>🔥 Token Burns</h4>
                  <p>• 2% burned on every transfer</p>
                  <p>• Reduces total supply</p>
                  <p>• Increases remaining token value</p>
                  <p>• Deflationary economics</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner">⏳ Processing...</div>
        </div>
      )}
    </div>
  );
}

export default App;