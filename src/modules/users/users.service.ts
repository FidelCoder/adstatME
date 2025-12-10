import { prisma } from '@config/database';
import { logger } from '@config/logger';
import { AppError } from '@shared/errors/app-error';
import type { UpdateProfileRequest, UserProfile, UserStats, UserEarnings } from './users.types';
import type { Prisma } from '@prisma/client';

export class UsersService {
  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('NOT_FOUND', 'User not found', 404);
    }

    return {
      id: user.id,
      phoneNumber: user.phoneNumber,
      whatsappVerified: user.whatsappVerified,
      name: user.name,
      ageRange: user.ageRange,
      locationCity: user.locationCity,
      locationCountry: user.locationCountry,
      interests: user.interests,
      walletAddress: user.walletAddress,
      contactCount: user.contactCount,
      campaignsCompleted: user.campaignsCompleted,
      totalViews: user.totalViews,
      totalReshares: user.totalReshares,
      totalEarned: user.totalEarned.toString(),
      role: user.role,
      tier: user.tier,
      reputationScore: user.reputationScore.toString(),
      avgViewRate: user.avgViewRate?.toString() || null,
      fraudFlags: user.fraudFlags,
      isBanned: user.isBanned,
      createdAt: user.createdAt,
      lastActive: user.lastActive,
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: UpdateProfileRequest): Promise<UserProfile> {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new AppError('NOT_FOUND', 'User not found', 404);
    }

    // Update user
    const updateData: Prisma.UserUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.ageRange !== undefined) updateData.ageRange = data.ageRange;
    if (data.locationCity !== undefined) updateData.locationCity = data.locationCity;
    if (data.locationCountry !== undefined) updateData.locationCountry = data.locationCountry;
    if (data.interests !== undefined) updateData.interests = data.interests;
    if (data.walletAddress !== undefined) updateData.walletAddress = data.walletAddress;
    if (data.contactCount !== undefined) updateData.contactCount = data.contactCount;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    logger.info({ userId }, 'User profile updated');

    return this.getUserProfile(updatedUser.id);
  }

  /**
   * Update device fingerprint
   */
  async updateDeviceFingerprint(userId: string, deviceFingerprint: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { deviceFingerprint },
    });

    logger.info({ userId }, 'Device fingerprint updated');
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string): Promise<UserStats> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        campaignsCompleted: true,
        totalViews: true,
        totalReshares: true,
        totalEarned: true,
        avgViewRate: true,
        tier: true,
        reputationScore: true,
      },
    });

    if (!user) {
      throw new AppError('NOT_FOUND', 'User not found', 404);
    }

    return {
      campaignsCompleted: user.campaignsCompleted,
      totalViews: user.totalViews,
      totalReshares: user.totalReshares,
      totalEarned: user.totalEarned.toString(),
      avgViewRate: user.avgViewRate?.toString() || null,
      tier: user.tier,
      reputationScore: user.reputationScore.toString(),
    };
  }

  /**
   * Get user earnings breakdown
   */
  async getUserEarnings(userId: string): Promise<UserEarnings> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { totalEarned: true },
    });

    if (!user) {
      throw new AppError('NOT_FOUND', 'User not found', 404);
    }

    // Calculate pending earnings (verified but not paid posts)
    const pendingPosts = await prisma.post.aggregate({
      where: {
        userId,
        status: 'VERIFIED',
      },
      _sum: {
        totalEarnings: true,
      },
    });

    // Get last payout
    const lastPayout = await prisma.payout.findFirst({
      where: {
        userId,
        status: 'COMPLETED',
      },
      orderBy: {
        processedAt: 'desc',
      },
      select: {
        amount: true,
        processedAt: true,
      },
    });

    return {
      totalEarned: user.totalEarned.toString(),
      pendingEarnings: (pendingPosts._sum.totalEarnings || 0).toString(),
      lastPayout: lastPayout
        ? {
            amount: lastPayout.amount.toString(),
            date: lastPayout.processedAt!,
          }
        : null,
    };
  }

  /**
   * Get user activity (recent posts)
   */
  async getUserActivity(userId: string, limit: number = 10) {
    const posts = await prisma.post.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return posts.map((post) => ({
      id: post.id,
      campaignId: post.campaignId,
      campaignName: post.campaign.name,
      status: post.status,
      viewsCount: post.viewsCount,
      resharesCount: post.resharesCount,
      totalEarnings: post.totalEarnings.toString(),
      postedAt: post.postedAt,
      createdAt: post.createdAt,
    }));
  }

  /**
   * Delete user account (soft delete)
   */
  async deleteUser(userId: string): Promise<void> {
    // Check for pending payouts
    const pendingPayouts = await prisma.payout.count({
      where: {
        userId,
        status: {
          in: ['PENDING', 'PROCESSING'],
        },
      },
    });

    if (pendingPayouts > 0) {
      throw new AppError(
        'CONFLICT',
        'Cannot delete account with pending payouts. Please wait for payouts to complete.',
        409
      );
    }

    // Soft delete user
    await prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        isBanned: true, // Also ban to prevent access
      },
    });

    logger.info({ userId }, 'User account deleted');
  }
}

