import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pgPool, redisClient, checkDatabaseConnection } from './database/client';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import { analyticsMiddleware } from './middleware/analytics';

// Import routes
import authRoutes from './routes/auth';
import matchingRoutes from './routes/matching';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

// Custom middleware
app.use(requestLogger);
app.use(analyticsMiddleware);

// Health Check
app.get('/health', async (req: Request, res: Response) => {
  try {
    const dbConnected = await checkDatabaseConnection();
    const redisConnected = redisClient.isOpen;
    
    if (dbConnected && redisConnected) {
      res.json({
        status: 'healthy',
        database: 'connected',
        redis: 'connected',
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        status: 'unhealthy',
        database: dbConnected ? 'connected' : 'disconnected',
        redis: redisConnected ? 'connected' : 'disconnected',
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: (error as Error).message,
    });
  }
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Homie Rental Platform API',
    version: '0.1.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      matching: '/api/matches',
    },
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/matches', matchingRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
    },
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to Redis
    if (!redisClient.isOpen) {
      await redisClient.connect();
      console.log('✅ Redis connected');
    }
    
    // Check database connection
    const dbConnected = await checkDatabaseConnection();
    if (dbConnected) {
      console.log('✅ PostgreSQL connected');
    } else {
      console.error('❌ PostgreSQL connection failed');
      process.exit(1);
    }
    
    // Start listening
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`API URL: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await pgPool.end();
  await redisClient.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await pgPool.end();
  await redisClient.quit();
  process.exit(0);
});

// Start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
