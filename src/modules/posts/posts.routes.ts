import { Router } from 'express';
import { PostsController } from './posts.controller';
import { authenticate, authorize } from '@shared/middleware/auth.middleware';

const router = Router();
const postsController = new PostsController();

// User routes
router.post('/', authenticate, postsController.createPost);
router.get('/', authenticate, postsController.listUserPosts);
router.get('/:id', authenticate, postsController.getPost);
router.post('/:id/screenshot', authenticate, postsController.uploadScreenshot);
router.delete('/:id', authenticate, postsController.deletePost);

// Brand routes
router.get(
  '/campaign/:campaignId',
  authenticate,
  authorize('BRAND', 'ADMIN'),
  postsController.listCampaignPosts
);

// Admin routes
router.post(
  '/:id/verify',
  authenticate,
  authorize('ADMIN'),
  postsController.verifyPost
);

export default router;

