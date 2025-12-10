import { Router } from 'express';
import { BrandsController } from './brands.controller';
import { authenticate, authorize } from '@shared/middleware/auth.middleware';

const router = Router();
const brandsController = new BrandsController();

// Admin only - create brand
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  brandsController.createBrand
);

// Brand access routes
router.get(
  '/:id',
  authenticate,
  authorize('BRAND', 'ADMIN'),
  brandsController.getBrand
);

router.patch(
  '/:id',
  authenticate,
  authorize('BRAND', 'ADMIN'),
  brandsController.updateBrand
);

router.post(
  '/:id/balance',
  authenticate,
  authorize('ADMIN'),
  brandsController.addBalance
);

router.post(
  '/:id/api-key/regenerate',
  authenticate,
  authorize('BRAND', 'ADMIN'),
  brandsController.regenerateApiKey
);

router.get(
  '/:id/stats',
  authenticate,
  authorize('BRAND', 'ADMIN'),
  brandsController.getBrandStats
);

export default router;

