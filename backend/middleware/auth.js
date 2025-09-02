const jwt = require('jsonwebtoken');
const database = require('../config/database');
const logger = require('../utils/logger');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Access denied', 
        message: 'No authentication token provided' 
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'kamikaze_secret_key');
    
    // Get user from database
    const { rows: users } = await database.query(
      'SELECT id, wallet_address, commitment_hash, reputation_commitment FROM users WHERE id = ?',
      [decoded.user_id]
    );

    if (users.length === 0) {
      return res.status(401).json({ 
        error: 'Authentication failed', 
        message: 'User not found' 
      });
    }

    // Attach user to request object
    req.user = {
      id: users[0].id,
      wallet_address: users[0].wallet_address,
      commitment_hash: users[0].commitment_hash,
      reputation_commitment: users[0].reputation_commitment,
      privacy_mode: true
    };

    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Authentication failed', 
        message: 'Invalid token' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Authentication failed', 
        message: 'Token expired' 
      });
    }
    
    logger.error('Auth middleware error:', error);
    return res.status(500).json({ 
      error: 'Authentication error', 
      message: 'Internal server error' 
    });
  }
};

module.exports = authMiddleware;