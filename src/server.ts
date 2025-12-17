import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env, isDevelopment } from '@config/env';
import { logger } from '@config/logger';
import { errorHandler } from '@shared/middleware/error-handler';
import { globalRateLimiter } from '@shared/middleware/rate-limiter';
import { prisma } from '@config/database';
import { redis } from '@config/redis';

// Initialize Express app
const app: Application = express();

// ============================================
// MIDDLEWARE
// ============================================

// Security middleware
app.use(helmet());

// CORS
app.use(
  cors({
    origin: isDevelopment ? '*' : process.env.ALLOWED_ORIGINS?.split(','),
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use(globalRateLimiter);

// Request logging
app.use((req: Request, res: Response, next) => {
  logger.info({
    method: req.method,
    url: req.url,
    ip: req.ip,
  }, 'Incoming request');
  next();
});

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check Redis connection (optional)
    let redisHealthy = true;
    try {
      await redis.ping();
    } catch (err) {
      redisHealthy = false;
    }
    
    res.json({
      success: true,
      data: {
        status: redisHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        environment: env.NODE_ENV,
        version: env.API_VERSION,
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Service health check failed',
      },
    });
  }
});

// API version info
app.get(`/api/${env.API_VERSION}`, (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      name: 'AdstatMe API',
      version: env.API_VERSION,
      description: 'WhatsApp Status Monetization Platform',
      documentation: '/api/docs',
    },
  });
});

// Mount module routes
import { authRouter } from '@modules/auth';
import { usersRouter } from '@modules/users';
import { brandsRouter } from '@modules/brands';
import { campaignsRouter } from '@modules/campaigns';
import { postsRouter } from '@modules/posts';
import { paymentsRouter } from '@modules/payments';

app.use(`/api/${env.API_VERSION}/auth`, authRouter);
app.use(`/api/${env.API_VERSION}/users`, usersRouter);
app.use(`/api/${env.API_VERSION}/brands`, brandsRouter);
app.use(`/api/${env.API_VERSION}/campaigns`, campaignsRouter);
app.use(`/api/${env.API_VERSION}/posts`, postsRouter);
app.use(`/api/${env.API_VERSION}/payments`, paymentsRouter);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
    },
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// ============================================
// SERVER START
// ============================================

const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('✅ Database connected');

    // Test Redis connection (optional)
    try {
      await redis.ping();
      logger.info('✅ Redis connected');
    } catch (redisError) {
      logger.warn('⚠️  Redis not available - continuing without cache');
    }

    // Start server
    const PORT = env.PORT;
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📍 Environment: ${env.NODE_ENV}`);
      logger.info(`🔗 API: http://localhost:${PORT}/api/${env.API_VERSION}`);
      logger.info(`❤️  Health: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error({ error }, '❌ Failed to start server');
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down gracefully...');
  await prisma.$disconnect();
  await redis.quit();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start the server
startServer();

export default app;


