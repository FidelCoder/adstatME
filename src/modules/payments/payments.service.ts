import { prisma } from '@config/database';
import { logger } from '@config/logger';
import { AppError } from '@shared/errors/app-error';
import type { RequestPayoutRequest, PayoutResponse, PayoutStats } from './payments.types';
import type { PayoutStatus, PayoutMethod } from '@prisma/client';

export class PaymentsService {
  private readonly MIN_PAYOUT_AMOUNT = 5;

  /**
   * Transform payout to response format
   */
  private transformPayout(payout: any): PayoutResponse {
    return {
      id: payout.id,
      userId: payout.userId,
      amount: payout.amount.toString(),
      currency: payout.currency,
      method: payout.method,
      walletAddress: payout.walletAddress,
      transactionHash: payout.transactionHash,
      network: payout.network,
      phoneNumber: payout.phoneNumber,
      status: payout.status,
      processedAt: payout.processedAt,
      failureReason: payout.failureReason,
      postIds: payout.postIds,
      createdAt: payout.createdAt,
      updatedAt: payout.updatedAt,
    };
  }

  /**
   * Calculate available balance for user
   */
  async getAvailableBalance(userId: string): Promise<number> {
    // Get all verified posts that haven't been paid
    const verifiedPosts = await prisma.post.findMany({
      where: {
        userId,
        status: 'VERIFIED',
      },
      select: {
        totalEarnings: true,
      },
    });

    const totalEarnings = verifiedPosts.reduce(
      (sum, post) => sum + post.totalEarnings.toNumber(),
      0
    );

    // Get pending payouts
    const pendingPayouts = await prisma.payout.findMany({
      where: {
        userId,
        status: {
          in: ['PENDING', 'PROCESSING'],
        },
      },
      select: {
        amount: true,
      },
    });

    const pendingAmount = pendingPayouts.reduce(
      (sum, payout) => sum + payout.amount.toNumber(),
      0
    );

    return totalEarnings - pendingAmount;
  }

  /**
   * Request a payout
   */
  async requestPayout(userId: string, data: RequestPayoutRequest): Promise<PayoutResponse> {
    // Check available balance
    const availableBalance = await this.getAvailableBalance(userId);

    if (availableBalance < data.amount) {
      throw new AppError(
        'INSUFFICIENT_BALANCE',
        `Insufficient balance. Available: $${availableBalance.toFixed(2)}`,
        400
      );
    }

    if (data.amount < this.MIN_PAYOUT_AMOUNT) {
      throw new AppError(
        'AMOUNT_TOO_LOW',
        `Minimum payout amount is $${this.MIN_PAYOUT_AMOUNT}`,
        400
      );
    }

    // Validate payout method specific fields
    if (data.method === 'NEXUSPAY' && !data.walletAddress) {
      throw new AppError('VALIDATION_ERROR', 'Wallet address is required for crypto payouts', 400);
    }

    if ((data.method === 'MPESA' || data.method === 'PAYSTACK') && !data.phoneNumber) {
      throw new AppError('VALIDATION_ERROR', 'Phone number is required for mobile money payouts', 400);
    }

    // Get verified posts for this amount
    const verifiedPosts = await prisma.post.findMany({
      where: {
        userId,
        status: 'VERIFIED',
      },
      select: {
        id: true,
        totalEarnings: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Select posts until we reach the payout amount
    let remainingAmount = data.amount;
    const selectedPostIds: string[] = [];

    for (const post of verifiedPosts) {
      if (remainingAmount <= 0) break;
      selectedPostIds.push(post.id);
      remainingAmount -= post.totalEarnings.toNumber();
    }

    // Create payout
    const payout = await prisma.payout.create({
      data: {
        userId,
        amount: data.amount,
        currency: 'USDT',
        method: data.method as PayoutMethod,
        walletAddress: data.walletAddress,
        phoneNumber: data.phoneNumber,
        network: data.network,
        postIds: selectedPostIds,
        status: 'PENDING',
      },
    });

    logger.info({ payoutId: payout.id, userId, amount: data.amount, method: data.method }, 'Payout requested');

    // TODO: Queue payout processing job
    // await payoutQueue.add('process-payout', { payoutId: payout.id });

    return this.transformPayout(payout);
  }

  /**
   * Get payout by ID
   */
  async getPayout(payoutId: string, userId?: string): Promise<PayoutResponse> {
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
    });

    if (!payout) {
      throw new AppError('NOT_FOUND', 'Payout not found', 404);
    }

    // Verify ownership if userId provided
    if (userId && payout.userId !== userId) {
      throw new AppError('FORBIDDEN', 'Access denied to this payout', 403);
    }

    return this.transformPayout(payout);
  }

  /**
   * List user's payouts
   */
  async listPayouts(userId: string, limit: number = 20, cursor?: string) {
    const payouts = await prisma.payout.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    });

    const hasMore = payouts.length > limit;
    const items = hasMore ? payouts.slice(0, -1) : payouts;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return {
      items: items.map(this.transformPayout),
      nextCursor,
      hasMore,
    };
  }

  /**
   * Update payout status (admin/system only)
   */
  async updatePayoutStatus(
    payoutId: string,
    status: PayoutStatus,
    transactionHash?: string,
    failureReason?: string
  ): Promise<PayoutResponse> {
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
    });

    if (!payout) {
      throw new AppError('NOT_FOUND', 'Payout not found', 404);
    }

    // Update payout
    const updatedPayout = await prisma.payout.update({
      where: { id: payoutId },
      data: {
        status,
        transactionHash,
        failureReason,
        ...(status === 'COMPLETED' && { processedAt: new Date() }),
      },
    });

    // If completed, mark posts as PAID
    if (status === 'COMPLETED') {
      await prisma.post.updateMany({
        where: {
          id: { in: payout.postIds },
        },
        data: {
          status: 'PAID',
        },
      });

      // Update user total earned
      await prisma.user.update({
        where: { id: payout.userId },
        data: {
          totalEarned: { increment: payout.amount.toNumber() },
        },
      });

      logger.info({ payoutId, userId: payout.userId, amount: payout.amount.toString() }, 'Payout completed');
    } else if (status === 'FAILED') {
      logger.warn({ payoutId, reason: failureReason }, 'Payout failed');
    }

    return this.transformPayout(updatedPayout);
  }

  /**
   * Get payout statistics
   */
  async getPayoutStats(userId: string): Promise<PayoutStats> {
    const payouts = await prisma.payout.findMany({
      where: { userId },
      select: {
        amount: true,
        status: true,
      },
    });

    const totalPaidOut = payouts
      .filter(p => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + p.amount.toNumber(), 0);

    const pendingPayouts = payouts
      .filter(p => p.status === 'PENDING' || p.status === 'PROCESSING')
      .reduce((sum, p) => sum + p.amount.toNumber(), 0);

    const completedPayouts = payouts.filter(p => p.status === 'COMPLETED').length;
    const failedPayouts = payouts.filter(p => p.status === 'FAILED').length;

    return {
      totalPaidOut: totalPaidOut.toString(),
      pendingPayouts: pendingPayouts.toString(),
      completedPayouts,
      failedPayouts,
    };
  }

  /**
   * Get pending payouts (admin)
   */
  async getPendingPayouts(limit: number = 50) {
    const payouts = await prisma.payout.findMany({
      where: {
        status: 'PENDING',
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            phoneNumber: true,
            name: true,
          },
        },
      },
    });

    return payouts.map(payout => ({
      ...this.transformPayout(payout),
      user: payout.user,
    }));
  }
}




