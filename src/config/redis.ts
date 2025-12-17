import Redis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true, // Don't connect immediately
  retryStrategy(times) {
    if (times > 3) {
      logger.warn('Redis unavailable - running without cache');
      return null; // Stop retrying
    }
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

// Try to connect but don't fail startup if it doesn't work
redis.connect().catch(() => {
  logger.warn('⚠️  Redis not available - some features disabled (OTP rate limiting, job queues)');
});

redis.on('connect', () => {
  logger.info('✅ Redis connected');
});

redis.on('error', (error) => {
  // Just warn, don't crash
  logger.warn({ error: error.message }, 'Redis connection issue');
});

redis.on('close', () => {
  logger.info('Redis connection closed');
});

// Graceful shutdown
const shutdown = async () => {
  await redis.quit();
  logger.info('Redis disconnected');
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export default redis;


