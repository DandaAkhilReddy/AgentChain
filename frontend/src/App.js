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
  
  // Payment system state
  const [mindPrice, setMindPrice] = useState(0.001); // $0.001 USD per MIND token
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Form states
  const [newAgentName, setNewAgentName] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskReward, setNewTaskReward] = useState('');
  const [newTaskDuration, setNewTaskDuration] = useState('24');
  const [agentSalePrice, setAgentSalePrice] = useState('');

  useEffect(() => {
    checkIfWalletIsConnected();
    loadTrialState();
  }, []);

  const loadTrialState = () => {
    // Load trial state from localStorage
    const trialClaimed = localStorage.getItem('hasClaimedTrial') === 'true';
    const savedBalance = localStorage.getItem('mindBalance');
    
    setHasClaimedTrial(trialClaimed);
    if (savedBalance) {
      setMindBalance(savedBalance);
    }
  };

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
      // const agentMarketplace = new ethers.Contract(CONTRACT_ADDRESSES.AGENT_MARKETPLACE, CONTRACT_ABIS.AGENT_MARKETPLACE, signer);

      setContracts({ mindToken, agentNFT, marketplace });

      // Load initial data
      await loadUserData(mindToken, agentNFT, marketplace, account);
      await loadTasks(marketplace);
      // await loadAgentMarketplace(agentMarketplace, agentNFT, account);

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
      // Agent marketplace not available in basic version
      setHasClaimedTrial(false);
      setAgentListings([]);
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
      
      // Give free trial tokens without any blockchain transaction
      const trialAmount = 10000; // 10,000 free MIND tokens
      const newBalance = parseFloat(mindBalance) + trialAmount;
      setMindBalance(newBalance.toString());
      setHasClaimedTrial(true);
      
      // Store in localStorage to persist across sessions
      localStorage.setItem('hasClaimedTrial', 'true');
      localStorage.setItem('mindBalance', newBalance.toString());
      
      alert(`🎉 Congratulations! You've received ${trialAmount.toLocaleString()} free MIND tokens for testing!`);
      
    } catch (error) {
      console.error("Error claiming trial tokens:", error);
      alert('Error claiming trial tokens: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const listAgentForSale = async (agentId) => {
    alert('Agent marketplace not available in basic version');
  };

  const buyAgent = async (agentId, price) => {
    alert('Agent marketplace not available in basic version');
  };

  // Payment System Functions
  const calculateTokenAmount = (usdAmount) => {
    return Math.floor(usdAmount / mindPrice);
  };

  const calculateUSDAmount = (tokenAmount) => {
    return (tokenAmount * mindPrice).toFixed(2);
  };

  const calculateProcessingFee = (amount, method) => {
    if (method === 'card') {
      // Square fees: 2.9% + $0.30
      return (amount * 0.029 + 0.30);
    }
    return 0; // Crypto has no processing fees
  };

  const calculateTotalWithFees = (tokenAmount, method) => {
    const baseAmount = parseFloat(calculateUSDAmount(tokenAmount));
    const processingFee = calculateProcessingFee(baseAmount, method);
    return {
      baseAmount: baseAmount.toFixed(2),
      processingFee: processingFee.toFixed(2),
      total: (baseAmount + processingFee).toFixed(2)
    };
  };

  const processCreditCardPayment = async (amount, tokenAmount) => {
    try {
      setLoading(true);
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, this would:
      // 1. Process payment with Stripe/PayPal
      // 2. Verify payment completion
      // 3. Mint tokens to user's wallet
      // 4. Update user balance
      
      // For demo purposes, we'll simulate minting tokens
      alert(`Payment successful! ${tokenAmount} MIND tokens will be added to your wallet shortly.`);
      
      // Simulate adding tokens (in real app, this would come from backend)
      const newBalance = parseFloat(mindBalance) + tokenAmount;
      setMindBalance(newBalance.toString());
      
      setShowPaymentModal(false);
      setPurchaseAmount('');
      
    } catch (error) {
      console.error("Payment processing error:", error);
      alert('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const processCryptoPayment = async (tokenAmount) => {
    try {
      setLoading(true);
      
      // Simulate crypto payment processing
      alert(`To complete this purchase, please send the equivalent crypto amount to our payment address. ${tokenAmount} MIND tokens will be credited after confirmation.`);
      
      setShowPaymentModal(false);
      setPurchaseAmount('');
      
    } catch (error) {
      console.error("Crypto payment error:", error);
      alert('Crypto payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseTokens = async () => {
    if (!purchaseAmount || purchaseAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    const tokenAmount = parseInt(purchaseAmount);
    const usdAmount = calculateUSDAmount(tokenAmount);

    if (paymentMethod === 'card') {
      await processCreditCardPayment(usdAmount, tokenAmount);
    } else {
      await processCryptoPayment(tokenAmount);
    }
  };

  const mintAgent = async () => {
    if (!newAgentName.trim()) {
      alert('Please enter an agent name');
      return;
    }

    try {
      setLoading(true);
      
      // Simulate agent minting without gas fees
      const newAgent = {
        id: Date.now(),
        name: newAgentName,
        performanceScore: 50 + Math.floor(Math.random() * 50), // Random score 50-100
        isActive: true
      };
      
      setAgents(prev => [...prev, newAgent]);
      setAgentCount(prev => prev + 1);
      
      alert(`Agent "${newAgentName}" minted successfully! (FREE TEST VERSION - No gas fees!)`);
      setNewAgentName('');
      
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

    const rewardAmount = parseFloat(newTaskReward);
    const currentBalance = parseFloat(mindBalance);
    
    if (rewardAmount > currentBalance) {
      alert('Insufficient MIND tokens. Use the trial tokens first or buy more tokens.');
      return;
    }

    try {
      setLoading(true);
      
      // Simulate task creation without blockchain transaction (FREE for testing)
      const newTask = {
        id: Date.now(),
        creator: account,
        title: newTaskTitle,
        reward: newTaskReward,
        deadline: new Date(Date.now() + parseInt(newTaskDuration) * 3600 * 1000).toLocaleString(),
        status: 'Open',
        assignedAgent: null,
        assignedAgentId: 0
      };
      
      // Deduct tokens from balance (simulate escrow)
      const newBalance = currentBalance - rewardAmount;
      setMindBalance(newBalance.toString());
      localStorage.setItem('mindBalance', newBalance.toString());
      
      // Add to tasks list
      setTasks(prev => [...prev, newTask]);
      
      alert(`Task "${newTaskTitle}" created successfully! (FREE TEST VERSION - No gas fees!)`);
      setNewTaskTitle('');
      setNewTaskReward('');
      
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
      
      // Simulate task claiming without gas fees
      const updatedTasks = tasks.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            status: 'Claimed',
            assignedAgent: account,
            assignedAgentId: agents[0].id
          };
        }
        return task;
      });
      
      setTasks(updatedTasks);
      alert(`Task claimed by ${agents[0].name}! (FREE TEST VERSION - No gas fees!)`);
      
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
      
      // Find the task to complete
      const task = tasks.find(t => t.id === taskId);
      if (!task) {
        alert('Task not found');
        return;
      }
      
      // Simulate task completion and reward payment
      const rewardAmount = parseFloat(task.reward);
      const currentBalance = parseFloat(mindBalance);
      const newBalance = currentBalance + rewardAmount;
      
      // Update balance and task status
      setMindBalance(newBalance.toString());
      localStorage.setItem('mindBalance', newBalance.toString());
      
      const updatedTasks = tasks.map(t => {
        if (t.id === taskId) {
          return { ...t, status: 'Completed' };
        }
        return t;
      });
      
      setTasks(updatedTasks);
      alert(`Task completed! ${rewardAmount} MIND tokens earned! (FREE TEST VERSION - No gas fees!)`);
      
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
          chainName: 'AgentChains Local',
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
            <h1>🔗 AgentChains</h1>
            <p>Connect your wallet to interact with AI agents and earn real money</p>
            <button onClick={connectWallet} className="connect-button">
              Connect Wallet
            </button>
            <div className="network-info">
              <p>Make sure you're on AgentChains Local Network (Chain ID: 31337)</p>
              <button onClick={switchToHardhat} className="network-button">
                Add AgentChains Network to MetaMask
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
        <h1>🔗 AgentChains</h1>
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
        <button 
          className={activeTab === 'buy-tokens' ? 'active' : ''} 
          onClick={() => setActiveTab('buy-tokens')}
        >
          💳 Buy Tokens
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
            <p>Agent marketplace not available in basic version. Use the "Buy Tokens" tab to purchase MIND tokens!</p>
            
            <div className="empty-state">
              <h3>🚧 Coming Soon</h3>
              <p>The full agent marketplace will be available in the premium version.</p>
              <button 
                onClick={() => setActiveTab('buy-tokens')} 
                className="action-button"
              >
                💳 Buy MIND Tokens Instead
              </button>
            </div>
          </div>
        )}

        {activeTab === 'buy-tokens' && (
          <div className="buy-tokens-section">
            <h2>💳 Buy MIND Tokens</h2>
            <p>Purchase MIND tokens with your credit card, debit card, or cryptocurrency</p>
            
            <div className="token-info-banner">
              <div className="token-stats">
                <div className="stat-card">
                  <h3>💰 Current Price</h3>
                  <p className="stat-value">${mindPrice} USD</p>
                  <p>per MIND token</p>
                </div>
                <div className="stat-card">
                  <h3>📈 24h Change</h3>
                  <p className="stat-value positive">+12.5%</p>
                  <p>Price trending up</p>
                </div>
                <div className="stat-card">
                  <h3>🔥 Total Burned</h3>
                  <p className="stat-value">2.3M MIND</p>
                  <p>Deflationary supply</p>
                </div>
                <div className="stat-card">
                  <h3>💼 Your Balance</h3>
                  <p className="stat-value">{parseFloat(mindBalance).toLocaleString()}</p>
                  <p>MIND tokens</p>
                </div>
              </div>
            </div>

            <div className="purchase-form">
              <h3>🛒 Purchase Tokens</h3>
              
              <div className="purchase-calculator">
                <div className="form-group">
                  <label>Amount of MIND Tokens</label>
                  <input
                    type="number"
                    placeholder="Enter number of tokens (e.g., 1000)"
                    value={purchaseAmount}
                    onChange={(e) => setPurchaseAmount(e.target.value)}
                    min="1"
                    step="1"
                  />
                  {purchaseAmount && (
                    <div className="calculation-display">
                      <p className="base-cost">💰 Token Cost: ${calculateTotalWithFees(parseInt(purchaseAmount) || 0, paymentMethod).baseAmount} USD</p>
                      {paymentMethod === 'card' && (
                        <p className="processing-fee">⚡ Processing Fee: ${calculateTotalWithFees(parseInt(purchaseAmount) || 0, paymentMethod).processingFee} USD</p>
                      )}
                      <p className="total-cost">💵 Total: ${calculateTotalWithFees(parseInt(purchaseAmount) || 0, paymentMethod).total} USD</p>
                    </div>
                  )}
                </div>

                <div className="preset-amounts">
                  <p>Quick Select:</p>
                  <div className="preset-buttons">
                    <button onClick={() => setPurchaseAmount('1000')} className="preset-button">
                      1,000 MIND<br/><span>${calculateTotalWithFees(1000, paymentMethod).total}</span>
                    </button>
                    <button onClick={() => setPurchaseAmount('5000')} className="preset-button">
                      5,000 MIND<br/><span>${calculateTotalWithFees(5000, paymentMethod).total}</span>
                    </button>
                    <button onClick={() => setPurchaseAmount('10000')} className="preset-button">
                      10,000 MIND<br/><span>${calculateTotalWithFees(10000, paymentMethod).total}</span>
                    </button>
                    <button onClick={() => setPurchaseAmount('50000')} className="preset-button">
                      50,000 MIND<br/><span>${calculateTotalWithFees(50000, paymentMethod).total}</span>
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>Payment Method</label>
                  <select 
                    value={paymentMethod} 
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="card">💳 Credit/Debit Card</option>
                    <option value="crypto">₿ Cryptocurrency</option>
                  </select>
                </div>

                <div className="payment-details">
                  {paymentMethod === 'card' && (
                    <div className="card-payment-info">
                      <h4>💳 Credit/Debit Card Payment</h4>
                      <p>• Instant processing via Square</p>
                      <p>• Secure SSL encryption</p>
                      <p>• Supports Visa, MasterCard, American Express, Discover</p>
                      <p>• Processing fee: 2.9% + $0.30 (added to total)</p>
                      <p>• Apple Pay & Google Pay supported</p>
                    </div>
                  )}
                  
                  {paymentMethod === 'crypto' && (
                    <div className="crypto-payment-info">
                      <h4>₿ Cryptocurrency Payment</h4>
                      <p>• Accepts BTC, ETH, USDT, USDC</p>
                      <p>• No processing fees</p>
                      <p>• Confirmation time: 10-30 minutes</p>
                      <p>• Automatic conversion at market rate</p>
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => setShowPaymentModal(true)} 
                  disabled={!purchaseAmount || purchaseAmount <= 0 || loading}
                  className="purchase-button"
                >
                  {loading ? 'Processing...' : `Purchase ${purchaseAmount || 0} MIND Tokens`}
                </button>
              </div>
            </div>

            <div className="token-benefits">
              <h3>💡 Why Buy MIND Tokens?</h3>
              <div className="info-grid">
                <div className="info-card">
                  <h4>🎯 Task Rewards</h4>
                  <p>• Earn tokens by completing AI tasks</p>
                  <p>• Higher stakes = higher rewards</p>
                  <p>• Build your reputation and earnings</p>
                </div>
                <div className="info-card">
                  <h4>🤖 AI Agent Trading</h4>
                  <p>• Buy and sell AI agents as NFTs</p>
                  <p>• Agents retain performance history</p>
                  <p>• Create passive income streams</p>
                </div>
                <div className="info-card">
                  <h4>🔥 Deflationary Economics</h4>
                  <p>• 2% burned on every transfer</p>
                  <p>• Decreasing supply over time</p>
                  <p>• Potential for price appreciation</p>
                </div>
                <div className="info-card">
                  <h4>🚀 Early Access</h4>
                  <p>• Priority access to new features</p>
                  <p>• Exclusive premium AI agents</p>
                  <p>• Governance voting rights</p>
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

      {showPaymentModal && (
        <div className="loading-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="payment-modal-header">
              <h3>💳 Complete Payment</h3>
              <button 
                onClick={() => setShowPaymentModal(false)} 
                className="close-button"
              >
                ✕
              </button>
            </div>
            
            <div className="payment-summary">
              <div className="summary-item">
                <span>Tokens:</span>
                <span>{purchaseAmount} MIND</span>
              </div>
              <div className="summary-item">
                <span>Token Cost:</span>
                <span>${calculateTotalWithFees(parseInt(purchaseAmount) || 0, paymentMethod).baseAmount} USD</span>
              </div>
              {paymentMethod === 'card' && (
                <div className="summary-item fee">
                  <span>Processing Fee:</span>
                  <span>${calculateTotalWithFees(parseInt(purchaseAmount) || 0, paymentMethod).processingFee} USD</span>
                </div>
              )}
              <div className="summary-item total">
                <span>Total Amount:</span>
                <span>${calculateTotalWithFees(parseInt(purchaseAmount) || 0, paymentMethod).total} USD</span>
              </div>
            </div>

            <div className="payment-method-display">
              <h4>Payment Method: {paymentMethod === 'card' ? '💳 Credit/Debit Card via Square' : 
                                   '₿ Cryptocurrency'}</h4>
            </div>

            {paymentMethod === 'card' && (
              <div className="card-form">
                <div className="form-group">
                  <label>Card Number</label>
                  <input 
                    type="text" 
                    placeholder="1234 5678 9012 3456"
                    disabled
                    value="Demo Mode - No Real Payment"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Expiry</label>
                    <input 
                      type="text" 
                      placeholder="MM/YY"
                      disabled
                      value="Demo"
                    />
                  </div>
                  <div className="form-group">
                    <label>CVV</label>
                    <input 
                      type="text" 
                      placeholder="123"
                      disabled
                      value="123"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="demo-notice">
              <p>🚧 <strong>Demo Mode</strong> - This is a simulation for testing purposes.</p>
              <p>No real payment will be processed. Tokens will be added for free!</p>
            </div>

            <div className="modal-actions">
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="cancel-button"
              >
                Cancel
              </button>
              <button 
                onClick={handlePurchaseTokens}
                disabled={loading}
                className="confirm-payment-button"
              >
                {loading ? 'Processing...' : 'Complete Demo Purchase'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;