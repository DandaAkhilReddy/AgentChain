const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

class Database {
  constructor() {
    this.pool = null;
    this.connected = false;
  }

  async connect() {
    try {
      this.pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'kamikaze_zk_ecosystem',
        connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
        multipleStatements: true,
        timezone: '+00:00',
        dateStrings: ['DATE', 'DATETIME'],
        supportBigNumbers: true,
        bigNumberStrings: true,
        // Remove invalid options
        waitForConnections: true,
        queueLimit: 0
      });

      // Test connection
      await this.pool.execute('SELECT 1');
      this.connected = true;
      
      logger.info('✅ Database connection established');
      
      // Initialize database if needed
      await this.initializeDatabase();
      
    } catch (error) {
      logger.warn('⚠️ Database connection failed, running in mock mode:', error.message);
      this.connected = false;
      // In development, we can continue without database
      if (process.env.NODE_ENV === 'development') {
        logger.info('📡 Continuing in development mode without database');
        return;
      }
      throw error;
    }
  }

  async disconnect() {
    if (this.pool) {
      await this.pool.end();
      this.connected = false;
      logger.info('Database connection closed');
    }
  }

  isConnected() {
    return this.connected;
  }

  async query(sql, params = []) {
    if (!this.pool || !this.connected) {
      // Return mock data in development when database is not available
      if (process.env.NODE_ENV === 'development') {
        logger.warn('Mock database query:', { sql: sql.substring(0, 50) + '...' });
        return { rows: [], fields: [] };
      }
      throw new Error('Database not connected');
    }

    try {
      const [rows, fields] = await this.pool.execute(sql, params);
      return { rows, fields };
    } catch (error) {
      logger.error('Database query error:', { sql, params, error: error.message });
      throw error;
    }
  }

  async transaction(callback) {
    const connection = await this.pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const result = await callback(connection);
      
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async initializeDatabase() {
    try {
      // Check if tables exist
      const { rows } = await this.query(`
        SELECT COUNT(*) as table_count 
        FROM information_schema.tables 
        WHERE table_schema = ? AND table_name IN ('users', 'tokens', 'zk_agents')
      `, [process.env.DB_NAME]);

      if (rows[0].table_count === 0) {
        logger.info('Initializing database tables...');
        
        // In production, you would run migrations separately
        // This is just for development convenience
        if (process.env.NODE_ENV === 'development') {
          await this.runMigrations();
        }
      }
    } catch (error) {
      logger.error('Database initialization error:', error);
      throw error;
    }
  }

  async runMigrations() {
    logger.info('Running database migrations...');
    
    try {
      // Create basic tables for development
      await this.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          wallet_address VARCHAR(42) UNIQUE NOT NULL,
          public_key VARCHAR(128),
          commitment_hash VARCHAR(64),
          nullifier_hash VARCHAR(64),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_activity_proof VARCHAR(512),
          reputation_commitment VARCHAR(64),
          is_active BOOLEAN DEFAULT TRUE,
          INDEX idx_wallet (wallet_address),
          INDEX idx_commitment (commitment_hash)
        )
      `);

      await this.query(`
        CREATE TABLE IF NOT EXISTS tokens (
          id INT AUTO_INCREMENT PRIMARY KEY,
          contract_address VARCHAR(42) UNIQUE NOT NULL,
          token_name VARCHAR(50) NOT NULL,
          token_symbol VARCHAR(10) NOT NULL,
          decimals INT DEFAULT 18,
          merkle_root VARCHAR(64),
          total_supply DECIMAL(30, 8) DEFAULT 0,
          burned_supply DECIMAL(30, 8) DEFAULT 0,
          burn_rate DECIMAL(5, 4) DEFAULT 0.02,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await this.query(`
        CREATE TABLE IF NOT EXISTS balance_proofs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          token_id INT NOT NULL,
          balance_commitment VARCHAR(64) NOT NULL,
          range_proof VARCHAR(1024),
          merkle_proof VARCHAR(512),
          nullifier VARCHAR(64),
          proof_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          is_valid BOOLEAN DEFAULT TRUE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (token_id) REFERENCES tokens(id) ON DELETE CASCADE
        )
      `);

      await this.query(`
        CREATE TABLE IF NOT EXISTS public_stats (
          id INT AUTO_INCREMENT PRIMARY KEY,
          stat_name VARCHAR(100) UNIQUE NOT NULL,
          stat_value DECIMAL(30, 8) DEFAULT 0,
          proof_aggregation VARCHAR(1024),
          merkle_root VARCHAR(64),
          last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      // Insert KAMIKAZE token
      await this.query(`
        INSERT IGNORE INTO tokens (contract_address, token_name, token_symbol, total_supply)
        VALUES ('0x0000000000000000000000000000000000000000', 'KAMIKAZE Token', 'KAMIKAZE', 1000000000)
      `);

      // Insert initial stats
      await this.query(`
        INSERT IGNORE INTO public_stats (stat_name, stat_value) VALUES
        ('total_users', 0),
        ('total_agents', 0),
        ('total_tasks_completed', 0),
        ('total_staked', 0),
        ('total_burned', 0)
      `);

      logger.info('✅ Basic tables created successfully');
    } catch (error) {
      logger.error('Migration error:', error);
      throw error;
    }
  }

  // ZK-specific database operations
  async storeBalanceProof(userId, tokenId, commitment, rangeProof, merkleProof) {
    const nullifier = require('crypto').createHash('sha256')
      .update(`${userId}_${tokenId}_${commitment}`)
      .digest('hex');

    return await this.query(`
      INSERT INTO balance_proofs (user_id, token_id, balance_commitment, range_proof, merkle_proof, nullifier)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        balance_commitment = VALUES(balance_commitment),
        range_proof = VALUES(range_proof),
        merkle_proof = VALUES(merkle_proof),
        proof_timestamp = CURRENT_TIMESTAMP
    `, [userId, tokenId, commitment, rangeProof, merkleProof, nullifier]);
  }

  async verifyBalanceProof(commitment, proof) {
    const { rows } = await this.query(`
      SELECT * FROM balance_proofs 
      WHERE balance_commitment = ? AND is_valid = TRUE
    `, [commitment]);

    return rows.length > 0;
  }

  async getPublicStats() {
    if (!this.connected && process.env.NODE_ENV === 'development') {
      // Return mock stats for development
      return {
        total_users: { value: 150, last_update: new Date(), proof: 'mock_proof' },
        total_agents: { value: 75, last_update: new Date(), proof: 'mock_proof' },
        total_tasks_completed: { value: 324, last_update: new Date(), proof: 'mock_proof' },
        total_staked: { value: 125000, last_update: new Date(), proof: 'mock_proof' },
        total_burned: { value: 5200, last_update: new Date(), proof: 'mock_proof' }
      };
    }

    const { rows } = await this.query('SELECT * FROM public_stats ORDER BY stat_name');
    
    return rows.reduce((stats, row) => {
      stats[row.stat_name] = {
        value: row.stat_value,
        last_update: row.last_update,
        proof: row.proof_aggregation
      };
      return stats;
    }, {});
  }

  async updatePublicStat(statName, value, proof = '') {
    return await this.query(`
      UPDATE public_stats 
      SET stat_value = ?, proof_aggregation = ?, last_update = CURRENT_TIMESTAMP 
      WHERE stat_name = ?
    `, [value, proof, statName]);
  }

  async getUserDashboard(walletAddress) {
    if (!this.connected && process.env.NODE_ENV === 'development') {
      // Return mock dashboard data for development
      return [{
        wallet_address: walletAddress,
        commitment_hash: 'mock_commitment_hash_123',
        reputation_commitment: 'mock_reputation_456',
        created_at: new Date(),
        balance_proofs_count: 3,
        token_symbol: 'KAMIKAZE',
        token_name: 'KAMIKAZE Token'
      }];
    }

    const { rows } = await this.query(`
      SELECT 
        u.wallet_address,
        u.commitment_hash,
        u.reputation_commitment,
        u.created_at,
        COUNT(DISTINCT bp.id) as balance_proofs_count,
        t.token_symbol,
        t.token_name
      FROM users u
      LEFT JOIN balance_proofs bp ON u.id = bp.user_id AND bp.is_valid = TRUE
      LEFT JOIN tokens t ON bp.token_id = t.id
      WHERE u.wallet_address = ?
      GROUP BY u.id, t.id
    `, [walletAddress]);

    return rows;
  }
}

module.exports = new Database();