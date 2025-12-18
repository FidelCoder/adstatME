import { Request, Response } from 'express';
import { OrganizationsService } from './organizations.service';
import { 
  createOrganizationSchema, 
  updateOrganizationSchema,
  addMemberSchema,
  updateMemberSchema 
} from './organizations.types';
import { asyncHandler } from '@shared/middleware/async-handler';
import { AppError } from '@shared/errors/app-error';
import type { ApiResponse } from '@shared/types';

export class OrganizationsController {
  private organizationsService: OrganizationsService;

  constructor() {
    this.organizationsService = new OrganizationsService();
  }

  /**
   * POST /api/v1/organizations
   * Create a new organization
   */
  createOrganization = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const validatedData = createOrganizationSchema.parse(req.body);
    const organization = await this.organizationsService.createOrganization(
      req.user.userId,
      validatedData
    );

    const response: ApiResponse = {
      success: true,
      data: { organization },
    };

    res.status(201).json(response);
  });

  /**
   * GET /api/v1/organizations
   * List organizations
   */
  listOrganizations = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const includePublic = req.query.public !== 'false';

    const organizations = await this.organizationsService.listOrganizations(
      userId,
      includePublic
    );

    const response: ApiResponse = {
      success: true,
      data: { organizations },
    };

    res.status(200).json(response);
  });

  /**
   * GET /api/v1/organizations/my
   * Get user's organizations
   */
  getMyOrganizations = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const organizations = await this.organizationsService.getUserOrganizations(
      req.user.userId
    );

    const response: ApiResponse = {
      success: true,
      data: { organizations },
    };

    res.status(200).json(response);
  });

  /**
   * GET /api/v1/organizations/:id
   * Get organization by ID or slug
   */
  getOrganization = asyncHandler(async (req: Request, res: Response) => {
    const identifier = req.params.id;
    const organization = await this.organizationsService.getOrganization(identifier);

    const response: ApiResponse = {
      success: true,
      data: { organization },
    };

    res.status(200).json(response);
  });

  /**
   * PATCH /api/v1/organizations/:id
   * Update organization
   */
  updateOrganization = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const organizationId = req.params.id;
    const validatedData = updateOrganizationSchema.parse(req.body);

    const organization = await this.organizationsService.updateOrganization(
      organizationId,
      req.user.userId,
      validatedData
    );

    const response: ApiResponse = {
      success: true,
      data: { organization },
    };

    res.status(200).json(response);
  });

  /**
   * GET /api/v1/organizations/:id/members
   * Get organization members
   */
  getMembers = asyncHandler(async (req: Request, res: Response) => {
    const organizationId = req.params.id;
    const userId = req.user?.userId;

    const members = await this.organizationsService.getMembers(organizationId, userId);

    const response: ApiResponse = {
      success: true,
      data: { members },
    };

    res.status(200).json(response);
  });

  /**
   * POST /api/v1/organizations/:id/members
   * Add member to organization
   */
  addMember = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const organizationId = req.params.id;
    const validatedData = addMemberSchema.parse(req.body);

    const member = await this.organizationsService.addMember(
      organizationId,
      req.user.userId,
      validatedData
    );

    const response: ApiResponse = {
      success: true,
      data: { member },
    };

    res.status(201).json(response);
  });

  /**
   * PATCH /api/v1/organizations/:id/members/:userId
   * Update member role/permissions
   */
  updateMember = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const organizationId = req.params.id;
    const memberUserId = req.params.userId;
    const validatedData = updateMemberSchema.parse(req.body);

    const member = await this.organizationsService.updateMember(
      organizationId,
      memberUserId,
      req.user.userId,
      validatedData
    );

    const response: ApiResponse = {
      success: true,
      data: { member },
    };

    res.status(200).json(response);
  });

  /**
   * DELETE /api/v1/organizations/:id/members/:userId
   * Remove member from organization
   */
  removeMember = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const organizationId = req.params.id;
    const memberUserId = req.params.userId;

    await this.organizationsService.removeMember(
      organizationId,
      memberUserId,
      req.user.userId
    );

    const response: ApiResponse = {
      success: true,
      data: { message: 'Member removed successfully' },
    };

    res.status(200).json(response);
  });
}

