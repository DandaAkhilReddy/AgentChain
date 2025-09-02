const winston = require('winston');
const path = require('path');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Custom format for privacy-conscious logging
const privacyFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
    // Filter out sensitive information
    const sanitizedMeta = { ...meta };
    
    // Remove sensitive fields
    const sensitiveFields = [
      'password', 
      'private_key', 
      'secret', 
      'token', 
      'api_key',
      'randomness',
      'commitment_value',
      'proof_witness'
    ];
    
    const sanitizeObject = (obj) => {
      if (typeof obj !== 'object' || obj === null) return obj;
      
      const sanitized = Array.isArray(obj) ? [] : {};
      
      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        if (sensitiveFields.some(field => lowerKey.includes(field))) {
          sanitized[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
          sanitized[key] = sanitizeObject(value);
        } else {
          sanitized[key] = value;
        }
      }
      
      return sanitized;
    };
    
    const sanitizedMetaClean = sanitizeObject(sanitizedMeta);
    
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...(stack && { stack }),
      ...(Object.keys(sanitizedMetaClean).length > 0 && { meta: sanitizedMetaClean })
    });
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: privacyFormat,
  defaultMeta: { service: 'kamikaze-backend' },
  transports: [
    // File transport for errors
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      handleExceptions: true,
      handleRejections: true
    }),
    
    // File transport for all logs
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5
    })
  ],
  exitOnError: false
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      winston.format.printf(({ level, message, timestamp }) => {
        return `${timestamp} ${level}: ${message}`;
      })
    )
  }));
}

// Create a stream object for Morgan HTTP logging
logger.stream = {
  write: (message) => {
    // Remove newline and log as info
    logger.info(message.trim());
  }
};

// Helper methods for structured logging
logger.logUserAction = (walletAddress, action, metadata = {}) => {
  logger.info('User action', {
    wallet_address: walletAddress,
    action,
    timestamp: new Date().toISOString(),
    privacy_note: 'Only public wallet address logged, no private data',
    ...metadata
  });
};

logger.logZKProof = (proofType, verified, metadata = {}) => {
  logger.info('ZK proof verification', {
    proof_type: proofType,
    verified,
    timestamp: new Date().toISOString(),
    privacy_note: 'No proof details or sensitive data logged',
    ...metadata
  });
};

logger.logTransaction = (transactionType, success, metadata = {}) => {
  logger.info('Transaction processed', {
    transaction_type: transactionType,
    success,
    timestamp: new Date().toISOString(),
    privacy_note: 'No amounts or sensitive details logged',
    ...metadata
  });
};

logger.logSystemEvent = (event, status, metadata = {}) => {
  logger.info('System event', {
    event,
    status,
    timestamp: new Date().toISOString(),
    ...metadata
  });
};

// Privacy-conscious error logging
logger.logPrivacyError = (error, context = {}) => {
  const sanitizedContext = { ...context };
  
  // Remove sensitive data from context
  delete sanitizedContext.proof;
  delete sanitizedContext.commitment;
  delete sanitizedContext.randomness;
  delete sanitizedContext.private_key;
  delete sanitizedContext.secret;
  
  logger.error('Privacy-conscious error log', {
    error_message: error.message,
    error_name: error.name,
    context: sanitizedContext,
    timestamp: new Date().toISOString(),
    privacy_note: 'Sensitive data redacted from error logs'
  });
};

module.exports = logger;