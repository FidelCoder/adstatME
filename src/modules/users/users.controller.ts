import { Request, Response } from 'express';
import { UsersService } from './users.service';
import { updateProfileSchema, updateDeviceSchema } from './users.types';
import { asyncHandler } from '@shared/middleware/async-handler';
import { AppError } from '@shared/errors/app-error';
import type { ApiResponse } from '@shared/types';

export class UsersController {
  private usersService: UsersService;

  constructor() {
    this.usersService = new UsersService();
  }

  /**
   * GET /api/v1/users/profile
   * Get current user's profile
   */
  getProfile = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const profile = await this.usersService.getUserProfile(req.user.userId);

    const response: ApiResponse = {
      success: true,
      data: { profile },
    };

    res.status(200).json(response);
  });

  /**
   * GET /api/v1/users/:id
   * Get user profile by ID (public info only)
   */
  getUserById = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.id;
    const profile = await this.usersService.getUserProfile(userId);

    // Remove sensitive information for public view
    const publicProfile = {
      id: profile.id,
      name: profile.name,
      locationCity: profile.locationCity,
      locationCountry: profile.locationCountry,
      tier: profile.tier,
      reputationScore: profile.reputationScore,
      campaignsCompleted: profile.campaignsCompleted,
    };

    const response: ApiResponse = {
      success: true,
      data: { profile: publicProfile },
    };

    res.status(200).json(response);
  });

  /**
   * PATCH /api/v1/users/profile
   * Update current user's profile
   */
  updateProfile = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    // Validate request body
    const validatedData = updateProfileSchema.parse(req.body);

    const profile = await this.usersService.updateProfile(
      req.user.userId,
      validatedData
    );

    const response: ApiResponse = {
      success: true,
      data: { profile },
    };

    res.status(200).json(response);
  });

  /**
   * POST /api/v1/users/device
   * Update device fingerprint
   */
  updateDevice = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const validatedData = updateDeviceSchema.parse(req.body);

    await this.usersService.updateDeviceFingerprint(
      req.user.userId,
      validatedData.deviceFingerprint
    );

    const response: ApiResponse = {
      success: true,
      data: { message: 'Device fingerprint updated successfully' },
    };

    res.status(200).json(response);
  });

  /**
   * GET /api/v1/users/stats
   * Get current user's statistics
   */
  getStats = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const stats = await this.usersService.getUserStats(req.user.userId);

    const response: ApiResponse = {
      success: true,
      data: { stats },
    };

    res.status(200).json(response);
  });

  /**
   * GET /api/v1/users/earnings
   * Get current user's earnings breakdown
   */
  getEarnings = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const earnings = await this.usersService.getUserEarnings(req.user.userId);

    const response: ApiResponse = {
      success: true,
      data: { earnings },
    };

    res.status(200).json(response);
  });

  /**
   * GET /api/v1/users/activity
   * Get current user's recent activity
   */
  getActivity = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const activity = await this.usersService.getUserActivity(req.user.userId, limit);

    const response: ApiResponse = {
      success: true,
      data: { activity },
    };

    res.status(200).json(response);
  });

  /**
   * DELETE /api/v1/users/account
   * Delete current user's account
   */
  deleteAccount = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    await this.usersService.deleteUser(req.user.userId);

    const response: ApiResponse = {
      success: true,
      data: { message: 'Account deleted successfully' },
    };

    res.status(200).json(response);
  });
}




