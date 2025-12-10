import { Queue, Worker } from 'bullmq';
import { redis } from '@config/redis';
import { logger } from '@config/logger';

// Create queues
export const verificationQueue = new Queue('verification', {
  connection: redis,
});

export const payoutQueue = new Queue('payouts', {
  connection: redis,
});

export const notificationQueue = new Queue('notifications', {
  connection: redis,
});

export const analyticsQueue = new Queue('analytics', {
  connection: redis,
});

// Export queue names for easy reference
export const QUEUE_NAMES = {
  VERIFICATION: 'verification',
  PAYOUTS: 'payouts',
  NOTIFICATIONS: 'notifications',
  ANALYTICS: 'analytics',
} as const;

logger.info('✅ Job queues initialized');

