import Redis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on('connect', () => {
  logger.info('Redis connected');
});

redis.on('error', (error) => {
  logger.error({ error }, 'Redis error');
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


