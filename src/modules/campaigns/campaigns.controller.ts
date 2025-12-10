import { Request, Response } from 'express';
import { CampaignsService } from './campaigns.service';
import { 
  createCampaignSchema, 
  updateCampaignSchema, 
  updateCampaignStatusSchema,
  campaignQuerySchema 
} from './campaigns.types';
import { asyncHandler } from '@shared/middleware/async-handler';
import { AppError } from '@shared/errors/app-error';
import type { ApiResponse } from '@shared/types';

export class CampaignsController {
  private campaignsService: CampaignsService;

  constructor() {
    this.campaignsService = new CampaignsService();
  }

  /**
   * POST /api/v1/campaigns
   * Create a new campaign
   */
  createCampaign = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    // Validate request body
    const validatedData = createCampaignSchema.parse(req.body);

    const campaign = await this.campaignsService.createCampaign(
      req.user.userId,
      validatedData
    );

    const response: ApiResponse = {
      success: true,
      data: { campaign },
    };

    res.status(201).json(response);
  });

  /**
   * GET /api/v1/campaigns/:id
   * Get campaign by ID
   */
  getCampaign = asyncHandler(async (req: Request, res: Response) => {
    const campaignId = req.params.id;
    const brandId = req.user?.userId;

    const campaign = await this.campaignsService.getCampaign(campaignId, brandId);

    const response: ApiResponse = {
      success: true,
      data: { campaign },
    };

    res.status(200).json(response);
  });

  /**
   * PATCH /api/v1/campaigns/:id
   * Update campaign
   */
  updateCampaign = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const campaignId = req.params.id;
    const validatedData = updateCampaignSchema.parse(req.body);

    const campaign = await this.campaignsService.updateCampaign(
      campaignId,
      req.user.userId,
      validatedData
    );

    const response: ApiResponse = {
      success: true,
      data: { campaign },
    };

    res.status(200).json(response);
  });

  /**
   * PATCH /api/v1/campaigns/:id/status
   * Update campaign status
   */
  updateCampaignStatus = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const campaignId = req.params.id;
    const validatedData = updateCampaignStatusSchema.parse(req.body);

    const campaign = await this.campaignsService.updateCampaignStatus(
      campaignId,
      req.user.userId,
      validatedData.status
    );

    const response: ApiResponse = {
      success: true,
      data: { campaign },
    };

    res.status(200).json(response);
  });

  /**
   * GET /api/v1/campaigns
   * List campaigns (for brands)
   */
  listCampaigns = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const query = campaignQuerySchema.parse({
      status: req.query.status,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      cursor: req.query.cursor,
    });

    const result = await this.campaignsService.listCampaigns(
      req.user.userId,
      query.status,
      query.limit,
      query.cursor
    );

    const response: ApiResponse = {
      success: true,
      data: result,
    };

    res.status(200).json(response);
  });

  /**
   * GET /api/v1/campaigns/available
   * Get available campaigns for users
   */
  getAvailableCampaigns = asyncHandler(async (req: Request, res: Response) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const campaigns = await this.campaignsService.getAvailableCampaigns(limit);

    const response: ApiResponse = {
      success: true,
      data: { campaigns },
    };

    res.status(200).json(response);
  });

  /**
   * GET /api/v1/campaigns/:id/stats
   * Get campaign statistics
   */
  getCampaignStats = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const campaignId = req.params.id;
    const stats = await this.campaignsService.getCampaignStats(
      campaignId,
      req.user.userId
    );

    const response: ApiResponse = {
      success: true,
      data: { stats },
    };

    res.status(200).json(response);
  });

  /**
   * GET /api/v1/campaigns/:id/matches
   * Get matched users for campaign
   */
  getMatchedUsers = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const campaignId = req.params.id;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;

    const matches = await this.campaignsService.matchUsersToCampaign(campaignId, limit);

    const response: ApiResponse = {
      success: true,
      data: { matches },
    };

    res.status(200).json(response);
  });
}

