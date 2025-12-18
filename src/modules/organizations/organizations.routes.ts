import { Router } from 'express';
import { OrganizationsController } from './organizations.controller';
import { authenticate, optionalAuthenticate } from '@shared/middleware/auth.middleware';

const router = Router();
const organizationsController = new OrganizationsController();

// Create organization (requires auth)
router.post('/', authenticate, organizationsController.createOrganization);

// List organizations (public or user's)
router.get('/', optionalAuthenticate, organizationsController.listOrganizations);

// Get user's organizations
router.get('/my', authenticate, organizationsController.getMyOrganizations);

// Get organization by ID or slug
router.get('/:id', optionalAuthenticate, organizationsController.getOrganization);

// Update organization (requires auth + permission)
router.patch('/:id', authenticate, organizationsController.updateOrganization);

// Members routes
router.get('/:id/members', optionalAuthenticate, organizationsController.getMembers);
router.post('/:id/members', authenticate, organizationsController.addMember);
router.patch('/:id/members/:userId', authenticate, organizationsController.updateMember);
router.delete('/:id/members/:userId', authenticate, organizationsController.removeMember);

export default router;

