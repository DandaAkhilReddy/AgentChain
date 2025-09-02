const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const logger = require('./utils/logger');
const database = require('./config/database');
const zkService = require('./services/zkService');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const tokenRoutes = require('./routes/tokens');
const stakingRoutes = require('./routes/staking');
const agentRoutes = require('./routes/agents');
const taskRoutes = require('./routes/tasks');
const marketplaceRoutes = require('./routes/marketplace');
const zkRoutes = require('./routes/zk');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const PORT = process.env.PORT || 3001;

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'KAMIKAZE Token Ecosystem API',
      version: '1.0.0',
      description: 'Privacy-first API with Zero-Knowledge proofs for AI agent marketplace',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./routes/*.js', './models/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(compression());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: process.env.CORS_CREDENTIALS === 'true',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 15 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    zk_status: zkService.isInitialized() ? 'ready' : 'initializing',
    database: database.isConnected() ? 'connected' : 'disconnected',
  });
});

// Swagger documentation (only in development)
if (process.env.ENABLE_SWAGGER === 'true') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  logger.info('Swagger documentation available at /api-docs');
}

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/staking', stakingRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/zk', zkRoutes);
app.use('/api/analytics', analyticsRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🥷 KAMIKAZE Token Ecosystem API',
    features: [
      'Zero-Knowledge Privacy',
      'AI Agent Creation',
      'Deflationary Tokenomics',
      'Anonymous Staking',
      'Private Task Execution',
      'ZK Marketplace Trading'
    ],
    endpoints: {
      health: '/health',
      docs: '/api-docs',
      version: '/api/v1'
    },
    privacy: {
      'balance_privacy': 'All balances are commitment-based',
      'transaction_privacy': 'ZK proofs hide transaction details',
      'agent_privacy': 'Agent capabilities and performance are private',
      'task_privacy': 'Task content never stored in plaintext'
    }
  });
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: 'The requested resource does not exist',
    suggestion: 'Check /api-docs for available endpoints'
  });
});

// Initialize services
async function initializeServices() {
  try {
    logger.info('Initializing KAMIKAZE backend services...');
    
    // Initialize database connection
    await database.connect();
    logger.info('✅ Database connected');
    
    // Initialize ZK proof system
    if (process.env.ENABLE_MOCK_ZK !== 'true') {
      await zkService.initialize();
      logger.info('✅ Zero-Knowledge proof system initialized');
    } else {
      logger.warn('⚠️ Using mock ZK proofs for development');
    }
    
    logger.info('🚀 All services initialized successfully');
  } catch (error) {
    logger.error('❌ Failed to initialize services:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT. Graceful shutdown starting...');
  
  try {
    await database.disconnect();
    logger.info('Database disconnected');
    
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM. Graceful shutdown starting...');
  
  try {
    await database.disconnect();
    logger.info('Database disconnected');
    
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
});

// Start server
async function startServer() {
  await initializeServices();
  
  app.listen(PORT, () => {
    logger.info(`🥷 KAMIKAZE API server running on port ${PORT}`);
    logger.info(`🔒 Zero-Knowledge privacy enabled`);
    logger.info(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    if (process.env.ENABLE_SWAGGER === 'true') {
      logger.info(`📚 API documentation: http://localhost:${PORT}/api-docs`);
    }
    
    console.log(`
🥷 KAMIKAZE Token Ecosystem Backend
=====================================
🔗 API Server: http://localhost:${PORT}
🔒 Privacy: Zero-Knowledge Proofs Enabled
🤖 AI Agents: Anonymous Creation & Trading
💎 Staking: Private Balance Commitments
📊 Analytics: Aggregated ZK Statistics
=====================================
    `);
  });
}

startServer().catch(error => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});

module.exports = app;