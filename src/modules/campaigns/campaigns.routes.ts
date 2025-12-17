import { Router } from 'express';
import { CampaignsController } from './campaigns.controller';
import { authenticate, authorize } from '@shared/middleware/auth.middleware';

const router = Router();
const campaignsController = new CampaignsController();

// Public routes (available campaigns for users)
router.get('/available', authenticate, campaignsController.getAvailableCampaigns);

// Brand-only routes
router.post(
  '/',
  authenticate,
  authorize('BRAND', 'ADMIN'),
  campaignsController.createCampaign
);

router.get(
  '/',
  authenticate,
  authorize('BRAND', 'ADMIN'),
  campaignsController.listCampaigns
);

router.get(
  '/:id',
  authenticate,
  campaignsController.getCampaign
);

router.patch(
  '/:id',
  authenticate,
  authorize('BRAND', 'ADMIN'),
  campaignsController.updateCampaign
);

router.patch(
  '/:id/status',
  authenticate,
  authorize('BRAND', 'ADMIN'),
  campaignsController.updateCampaignStatus
);

router.get(
  '/:id/stats',
  authenticate,
  authorize('BRAND', 'ADMIN'),
  campaignsController.getCampaignStats
);

router.get(
  '/:id/matches',
  authenticate,
  authorize('BRAND', 'ADMIN'),
  campaignsController.getMatchedUsers
);

export default router;




