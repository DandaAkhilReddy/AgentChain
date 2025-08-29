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
  const [activeTab, setActiveTab] = useState('overview');

  // Form states
  const [newAgentName, setNewAgentName] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskReward, setNewTaskReward] = useState('');
  const [newTaskDuration, setNewTaskDuration] = useState('24');

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

      setContracts({ mindToken, agentNFT, marketplace });

      // Load initial data
      await loadUserData(mindToken, agentNFT, marketplace, account);
      await loadTasks(marketplace);

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
          📋 Marketplace
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
              <div className="action-buttons">
                <button onClick={() => setActiveTab('agents')} className="action-button">
                  🤖 Manage Agents
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