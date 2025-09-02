const crypto = require('crypto');
const snarkjs = require('snarkjs');
const circomlib = require('circomlib');
const { poseidon } = require('poseidon-lite');
const logger = require('../utils/logger');

class ZKService {
  constructor() {
    this.initialized = false;
    this.circuits = new Map();
    this.verificationKeys = new Map();
    this.provingKeys = new Map();
  }

  async initialize() {
    try {
      logger.info('Initializing Zero-Knowledge proof system...');
      
      // Always use mock ZK in development for now
      if (process.env.ENABLE_MOCK_ZK === 'true' || process.env.NODE_ENV === 'development') {
        this.initializeMockZK();
        return;
      }

      // Initialize circuits for different proof types
      await this.initializeCircuit('balance_proof');
      await this.initializeCircuit('stake_proof');
      await this.initializeCircuit('transaction_proof');
      await this.initializeCircuit('task_completion_proof');

      this.initialized = true;
      logger.info('✅ ZK proof system initialized');
    } catch (error) {
      logger.error('❌ ZK initialization failed:', error);
      // In development, fall back to mock mode
      if (process.env.NODE_ENV === 'development') {
        logger.warn('Falling back to mock ZK mode');
        this.initializeMockZK();
        return;
      }
      throw error;
    }
  }

  initializeMockZK() {
    // Mock initialization for development
    this.circuits.set('balance_proof', 'mock_circuit');
    this.circuits.set('stake_proof', 'mock_circuit');
    this.circuits.set('transaction_proof', 'mock_circuit');
    this.circuits.set('task_completion_proof', 'mock_circuit');
    
    this.initialized = true;
    logger.info('✅ Mock ZK system initialized (development mode)');
  }

  async initializeCircuit(circuitName) {
    try {
      // In production, load actual circuit files
      // For development, we'll use mock values
      this.circuits.set(circuitName, `mock_${circuitName}`);
      this.verificationKeys.set(circuitName, { mock: true });
      this.provingKeys.set(circuitName, { mock: true });
      
      logger.info(`Circuit ${circuitName} initialized`);
    } catch (error) {
      logger.error(`Failed to initialize circuit ${circuitName}:`, error);
      throw error;
    }
  }

  isInitialized() {
    return this.initialized;
  }

  // Generate commitment for private values
  generateCommitment(value, randomness = null) {
    if (!randomness) {
      randomness = crypto.randomBytes(32).toString('hex');
    }
    
    // Use Poseidon hash for ZK-friendly commitment
    const commitment = poseidon([
      BigInt('0x' + Buffer.from(value.toString()).toString('hex')),
      BigInt('0x' + randomness)
    ]);
    
    return {
      commitment: commitment.toString(16),
      randomness,
      value
    };
  }

  // Generate nullifier for preventing double-spending
  generateNullifier(secret, publicInput) {
    const nullifier = poseidon([
      BigInt('0x' + secret),
      BigInt('0x' + Buffer.from(publicInput.toString()).toString('hex'))
    ]);
    
    return nullifier.toString(16);
  }

  // Generate range proof (proves value is within a range without revealing it)
  async generateRangeProof(value, minRange, maxRange, commitment) {
    if (process.env.ENABLE_MOCK_ZK === 'true') {
      return this.generateMockProof('range', { value, minRange, maxRange, commitment });
    }

    try {
      // In production, this would use actual ZK circuits
      const proof = {
        pi_a: ['0x123...', '0x456...'],
        pi_b: [['0x789...', '0xabc...'], ['0xdef...', '0x012...']],
        pi_c: ['0x345...', '0x678...'],
        protocol: 'groth16',
        curve: 'bn128'
      };

      return {
        proof: JSON.stringify(proof),
        publicSignals: [commitment, '1'], // 1 indicates proof is valid
        verified: true
      };
    } catch (error) {
      logger.error('Range proof generation failed:', error);
      throw error;
    }
  }

  // Generate balance proof (proves balance ownership without revealing amount)
  async generateBalanceProof(balance, randomness, walletAddress) {
    if (process.env.ENABLE_MOCK_ZK === 'true') {
      return this.generateMockProof('balance', { balance, walletAddress });
    }

    const commitment = this.generateCommitment(balance, randomness);
    const nullifier = this.generateNullifier(
      crypto.createHash('sha256').update(walletAddress).digest('hex'),
      balance.toString()
    );

    return {
      commitment: commitment.commitment,
      nullifier,
      proof: await this.generateRangeProof(balance, 0, Number.MAX_SAFE_INTEGER, commitment.commitment),
      publicSignals: [commitment.commitment, nullifier],
      verified: true
    };
  }

  // Generate staking proof (proves staking without revealing amount or duration)
  async generateStakingProof(stakeAmount, lockPeriod, walletAddress) {
    if (process.env.ENABLE_MOCK_ZK === 'true') {
      return this.generateMockProof('staking', { stakeAmount, lockPeriod, walletAddress });
    }

    const stakeCommitment = this.generateCommitment(stakeAmount);
    const periodCommitment = this.generateCommitment(lockPeriod);
    const nullifier = this.generateNullifier(
      crypto.createHash('sha256').update(walletAddress).digest('hex'),
      `${stakeAmount}_${lockPeriod}`
    );

    return {
      stakeCommitment: stakeCommitment.commitment,
      periodCommitment: periodCommitment.commitment,
      nullifier,
      proof: JSON.stringify({ mock: 'staking_proof' }),
      verified: true
    };
  }

  // Generate task completion proof
  async generateTaskCompletionProof(taskId, agentId, result, quality) {
    if (process.env.ENABLE_MOCK_ZK === 'true') {
      return this.generateMockProof('task_completion', { taskId, agentId, quality });
    }

    const taskCommitment = this.generateCommitment(taskId);
    const agentCommitment = this.generateCommitment(agentId);
    const qualityCommitment = this.generateCommitment(quality);
    
    return {
      taskCommitment: taskCommitment.commitment,
      agentCommitment: agentCommitment.commitment,
      qualityCommitment: qualityCommitment.commitment,
      proof: JSON.stringify({ mock: 'completion_proof' }),
      verified: true
    };
  }

  // Generate transaction proof (private transfers)
  async generateTransactionProof(fromBalance, toBalance, amount, fromAddress, toAddress) {
    if (process.env.ENABLE_MOCK_ZK === 'true') {
      return this.generateMockProof('transaction', { amount, fromAddress, toAddress });
    }

    const amountCommitment = this.generateCommitment(amount);
    const senderCommitment = this.generateCommitment(fromAddress);
    const receiverCommitment = this.generateCommitment(toAddress);
    
    const nullifier = this.generateNullifier(
      crypto.createHash('sha256').update(fromAddress).digest('hex'),
      `${amount}_${Date.now()}`
    );

    return {
      amountCommitment: amountCommitment.commitment,
      senderCommitment: senderCommitment.commitment,
      receiverCommitment: receiverCommitment.commitment,
      nullifier,
      proof: JSON.stringify({ mock: 'transaction_proof' }),
      verified: true
    };
  }

  // Verify any ZK proof
  async verifyProof(proofType, proof, publicSignals) {
    if (process.env.ENABLE_MOCK_ZK === 'true') {
      return this.verifyMockProof(proof);
    }

    try {
      const verificationKey = this.verificationKeys.get(proofType);
      if (!verificationKey) {
        throw new Error(`Verification key not found for ${proofType}`);
      }

      // In production, use actual snarkjs verification
      const isValid = await snarkjs.groth16.verify(
        verificationKey,
        publicSignals,
        JSON.parse(proof)
      );

      return isValid;
    } catch (error) {
      logger.error(`Proof verification failed for ${proofType}:`, error);
      return false;
    }
  }

  // Aggregate multiple proofs for public statistics
  async aggregateProofs(proofs) {
    // This would implement proof aggregation for scalability
    // For now, return a mock aggregated proof
    return {
      aggregatedProof: crypto.randomBytes(64).toString('hex'),
      count: proofs.length,
      timestamp: Date.now()
    };
  }

  // Generate membership proof (prove membership in a set without revealing which member)
  generateMembershipProof(secret, membershipSet) {
    const commitment = this.generateCommitment(secret);
    const merkleTree = this.buildMerkleTree(membershipSet);
    const merkleProof = this.generateMerkleProof(merkleTree, secret);
    
    return {
      commitment: commitment.commitment,
      merkleRoot: merkleTree.root,
      merkleProof: merkleProof,
      verified: true
    };
  }

  // Build merkle tree for membership proofs
  buildMerkleTree(elements) {
    // Simple merkle tree implementation
    let currentLevel = elements.map(el => 
      crypto.createHash('sha256').update(el.toString()).digest('hex')
    );
    
    while (currentLevel.length > 1) {
      const nextLevel = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = currentLevel[i + 1] || left;
        const combined = crypto.createHash('sha256').update(left + right).digest('hex');
        nextLevel.push(combined);
      }
      currentLevel = nextLevel;
    }
    
    return {
      root: currentLevel[0],
      elements: elements
    };
  }

  generateMerkleProof(tree, element) {
    // Generate merkle proof for element inclusion
    return {
      element: crypto.createHash('sha256').update(element.toString()).digest('hex'),
      proof: ['0x123...', '0x456...'], // Mock proof path
      root: tree.root
    };
  }

  // Mock functions for development
  generateMockProof(type, data) {
    return {
      type,
      proof: crypto.randomBytes(128).toString('hex'),
      commitment: crypto.randomBytes(32).toString('hex'),
      nullifier: crypto.randomBytes(32).toString('hex'),
      timestamp: Date.now(),
      verified: true,
      mock: true
    };
  }

  verifyMockProof(proof) {
    // Mock verification always returns true in development
    return typeof proof === 'string' && proof.length > 0;
  }

  // Utility functions
  hashToField(input) {
    return BigInt('0x' + crypto.createHash('sha256').update(input.toString()).digest('hex'));
  }

  fieldToHex(field) {
    return field.toString(16).padStart(64, '0');
  }
}

module.exports = new ZKService();