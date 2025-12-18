import { Router } from 'express';
import { CampaignsController } from './campaigns.controller';
import { authenticate, authorize } from '@shared/middleware/auth.middleware';

const router = Router();
const campaignsController = new CampaignsController();

// Public routes (available campaigns for users)
router.get('/available', authenticate, campaignsController.getAvailableCampaigns);

// Create campaign (requires auth, organization permission checked in service)
router.post(
  '/',
  authenticate,
  campaignsController.createCampaign
);

router.get(
  '/',
  authenticate,
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
  campaignsController.updateCampaign
);

router.patch(
  '/:id/status',
  authenticate,
  campaignsController.updateCampaignStatus
);

router.get(
  '/:id/stats',
  authenticate,
  campaignsController.getCampaignStats
);

router.get(
  '/:id/matches',
  authenticate,
  campaignsController.getMatchedUsers
);

export default router;




