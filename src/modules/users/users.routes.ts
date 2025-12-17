import { Router } from 'express';
import { UsersController } from './users.controller';
import { authenticate } from '@shared/middleware/auth.middleware';

const router = Router();
const usersController = new UsersController();

// All user routes require authentication
router.use(authenticate);

// Profile routes
router.get('/profile', usersController.getProfile);
router.patch('/profile', usersController.updateProfile);

// Public user info
router.get('/:id', usersController.getUserById);

// Device tracking
router.post('/device', usersController.updateDevice);

// Stats and analytics
router.get('/stats', usersController.getStats);
router.get('/earnings', usersController.getEarnings);
router.get('/activity', usersController.getActivity);

// Account deletion
router.delete('/account', usersController.deleteAccount);

export default router;




