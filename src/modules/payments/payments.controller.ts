import { Request, Response } from 'express';
import { PaymentsService } from './payments.service';
import { requestPayoutSchema, updatePayoutStatusSchema } from './payments.types';
import { asyncHandler } from '@shared/middleware/async-handler';
import { AppError } from '@shared/errors/app-error';
import type { ApiResponse } from '@shared/types';

export class PaymentsController {
  private paymentsService: PaymentsService;

  constructor() {
    this.paymentsService = new PaymentsService();
  }

  /**
   * GET /api/v1/payments/balance
   * Get available balance
   */
  getBalance = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const balance = await this.paymentsService.getAvailableBalance(req.user.userId);

    const response: ApiResponse = {
      success: true,
      data: { balance: balance.toString() },
    };

    res.status(200).json(response);
  });

  /**
   * POST /api/v1/payments/payouts
   * Request a payout
   */
  requestPayout = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const validatedData = requestPayoutSchema.parse(req.body);
    const payout = await this.paymentsService.requestPayout(req.user.userId, validatedData);

    const response: ApiResponse = {
      success: true,
      data: { payout },
    };

    res.status(201).json(response);
  });

  /**
   * GET /api/v1/payments/payouts/:id
   * Get payout by ID
   */
  getPayout = asyncHandler(async (req: Request, res: Response) => {
    const payoutId = req.params.id;
    const userId = req.user?.userId;

    const payout = await this.paymentsService.getPayout(payoutId, userId);

    const response: ApiResponse = {
      success: true,
      data: { payout },
    };

    res.status(200).json(response);
  });

  /**
   * GET /api/v1/payments/payouts
   * List user's payouts
   */
  listPayouts = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const cursor = req.query.cursor as string | undefined;

    const result = await this.paymentsService.listPayouts(req.user.userId, limit, cursor);

    const response: ApiResponse = {
      success: true,
      data: result,
    };

    res.status(200).json(response);
  });

  /**
   * GET /api/v1/payments/stats
   * Get payout statistics
   */
  getPayoutStats = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const stats = await this.paymentsService.getPayoutStats(req.user.userId);

    const response: ApiResponse = {
      success: true,
      data: { stats },
    };

    res.status(200).json(response);
  });

  /**
   * PATCH /api/v1/payments/payouts/:id/status
   * Update payout status (admin only)
   */
  updatePayoutStatus = asyncHandler(async (req: Request, res: Response) => {
    const payoutId = req.params.id;
    const validatedData = updatePayoutStatusSchema.parse(req.body);

    const payout = await this.paymentsService.updatePayoutStatus(
      payoutId,
      validatedData.status,
      validatedData.transactionHash,
      validatedData.failureReason
    );

    const response: ApiResponse = {
      success: true,
      data: { payout },
    };

    res.status(200).json(response);
  });

  /**
   * GET /api/v1/payments/payouts/pending
   * Get pending payouts (admin only)
   */
  getPendingPayouts = asyncHandler(async (req: Request, res: Response) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const payouts = await this.paymentsService.getPendingPayouts(limit);

    const response: ApiResponse = {
      success: true,
      data: { payouts },
    };

    res.status(200).json(response);
  });
}




