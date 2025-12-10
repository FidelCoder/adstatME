import { Router } from 'express';
import { PaymentsController } from './payments.controller';
import { authenticate, authorize } from '@shared/middleware/auth.middleware';

const router = Router();
const paymentsController = new PaymentsController();

// User routes
router.get('/balance', authenticate, paymentsController.getBalance);
router.post('/payouts', authenticate, paymentsController.requestPayout);
router.get('/payouts', authenticate, paymentsController.listPayouts);
router.get('/payouts/:id', authenticate, paymentsController.getPayout);
router.get('/stats', authenticate, paymentsController.getPayoutStats);

// Admin routes
router.get(
  '/payouts/pending',
  authenticate,
  authorize('ADMIN'),
  paymentsController.getPendingPayouts
);

router.patch(
  '/payouts/:id/status',
  authenticate,
  authorize('ADMIN'),
  paymentsController.updatePayoutStatus
);

export default router;

