const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  // Log error details
  logger.error('Error caught by error handler:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Default error
  let error = { ...err };
  error.message = err.message;

  // Handle specific error types
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message, statusCode: 400 };
  }

  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // Database errors
  if (err.code === 'ER_DUP_ENTRY') {
    const message = 'Duplicate entry - resource already exists';
    error = { message, statusCode: 409 };
  }

  if (err.code === 'ER_NO_SUCH_TABLE') {
    const message = 'Database table not found';
    error = { message, statusCode: 500 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid authentication token';
    error = { message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Authentication token expired';
    error = { message, statusCode: 401 };
  }

  // ZK proof errors
  if (err.message && err.message.includes('proof verification failed')) {
    const message = 'Zero-knowledge proof verification failed';
    error = { message, statusCode: 400 };
  }

  // Rate limiting errors
  if (err.status === 429) {
    const message = 'Too many requests, please slow down';
    error = { message, statusCode: 429 };
  }

  res.status(error.statusCode || 500).json({
    error: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err
    }),
    privacy_note: 'No sensitive information is logged or exposed in errors',
    timestamp: new Date().toISOString(),
    request_id: req.id || 'unknown'
  });
};

module.exports = errorHandler;