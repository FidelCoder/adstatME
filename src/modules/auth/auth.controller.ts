import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { sendOtpSchema, verifyOtpSchema, refreshTokenSchema } from './auth.types';
import { asyncHandler } from '@shared/middleware/async-handler';
import { AppError } from '@shared/errors/app-error';
import type { ApiResponse } from '@shared/types';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * POST /api/v1/auth/send-otp
   * Send OTP to phone number
   */
  sendOtp = asyncHandler(async (req: Request, res: Response) => {
    // Validate request body
    const validatedData = sendOtpSchema.parse(req.body);

    // Send OTP
    const result = await this.authService.sendOtp(validatedData.phoneNumber);

    const response: ApiResponse = {
      success: true,
      data: result,
    };

    res.status(200).json(response);
  });

  /**
   * POST /api/v1/auth/verify-otp
   * Verify OTP and authenticate user
   */
  verifyOtp = asyncHandler(async (req: Request, res: Response) => {
    // Validate request body
    const validatedData = verifyOtpSchema.parse(req.body);

    // Verify OTP
    const result = await this.authService.verifyOtp(
      validatedData.phoneNumber,
      validatedData.otp
    );

    const response: ApiResponse = {
      success: true,
      data: result,
    };

    res.status(200).json(response);
  });

  /**
   * POST /api/v1/auth/refresh
   * Refresh access token
   */
  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    // Validate request body
    const validatedData = refreshTokenSchema.parse(req.body);

    // Refresh token
    const tokens = await this.authService.refreshAccessToken(validatedData.refreshToken);

    const response: ApiResponse = {
      success: true,
      data: { tokens },
    };

    res.status(200).json(response);
  });

  /**
   * POST /api/v1/auth/logout
   * Logout user
   */
  logout = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.body.refreshToken;

    if (!refreshToken) {
      throw new AppError('VALIDATION_ERROR', 'Refresh token is required', 400);
    }

    await this.authService.logout(refreshToken);

    const response: ApiResponse = {
      success: true,
      data: { message: 'Logged out successfully' },
    };

    res.status(200).json(response);
  });

  /**
   * GET /api/v1/auth/me
   * Get current authenticated user
   */
  getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
    // User is attached by auth middleware
    if (!req.user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const response: ApiResponse = {
      success: true,
      data: { user: req.user },
    };

    res.status(200).json(response);
  });
}




