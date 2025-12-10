import { Worker, Job } from 'bullmq';
import { redis } from '@config/redis';
import { logger } from '@config/logger';
import { PaymentsService } from '@modules/payments';

const paymentsService = new PaymentsService();

/**
 * Payout worker
 * Processes payout requests
 */
export const payoutWorker = new Worker(
  'payouts',
  async (job: Job) => {
    const { payoutId } = job.data;
    
    try {
      logger.info({ payoutId, jobId: job.id }, 'Processing payout job');

      // TODO: Implement payout processing logic
      // 1. Get payout details
      // 2. Route to appropriate payment provider
      //    - NexusPay for crypto
      //    - M-Pesa for Kenya
      //    - Paystack for Nigeria/Ghana
      // 3. Execute payment
      // 4. Update payout status

      // For now, just log
      logger.info({ payoutId }, 'Payout job completed (manual processing required)');

      return { success: true, payoutId };
    } catch (error) {
      logger.error({ error, payoutId }, 'Payout job failed');
      
      // Update payout status to failed
      await paymentsService.updatePayoutStatus(
        payoutId,
        'FAILED',
        undefined,
        error instanceof Error ? error.message : 'Unknown error'
      );

      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 3,
    limiter: {
      max: 50,
      duration: 60000, // 50 jobs per minute
    },
  }
);

payoutWorker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Payout job completed');
});

payoutWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, error: err }, 'Payout job failed');
});

logger.info('✅ Payout worker started');

