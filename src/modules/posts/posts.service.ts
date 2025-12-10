import { prisma } from '@config/database';
import { logger } from '@config/logger';
import { AppError } from '@shared/errors/app-error';
import type { 
  CreatePostRequest, 
  UploadScreenshotRequest, 
  PostResponse,
  EarningsBreakdown,
  PostWithCampaign 
} from './posts.types';
import type { Prisma } from '@prisma/client';

export class PostsService {
  /**
   * Transform post to response format
   */
  private transformPost(post: any): PostResponse {
    return {
      id: post.id,
      userId: post.userId,
      campaignId: post.campaignId,
      screenshotUrl: post.screenshotUrl,
      viewsCount: post.viewsCount,
      resharesCount: post.resharesCount,
      postedAt: post.postedAt,
      screenshotUploadedAt: post.screenshotUploadedAt,
      status: post.status,
      verifiedBy: post.verifiedBy,
      verificationNotes: post.verificationNotes,
      baseEarnings: post.baseEarnings.toString(),
      bonusEarnings: post.bonusEarnings.toString(),
      totalEarnings: post.totalEarnings.toString(),
      isReshare: post.isReshare,
      originalPostId: post.originalPostId,
      deviceFingerprint: post.deviceFingerprint,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }

  /**
   * Calculate earnings for a post
   */
  private calculateEarnings(
    viewsCount: number,
    campaign: any,
    user: any,
    isReshare: boolean = false
  ): EarningsBreakdown {
    // Base earnings from views (CPM calculation)
    const baseEarnings = (viewsCount / 1000) * campaign.userCpm.toNumber();

    // Flat fee per post
    const flatFee = isReshare ? 0 : campaign.flatFee.toNumber();

    // Reshare bonus (0 for now, would be set by original poster)
    const reshareBonus = 0;

    // Tier bonus multiplier
    const tierMultipliers: { [key: string]: number } = {
      BRONZE: 1.0,
      SILVER: 1.1,
      GOLD: 1.2,
      PLATINUM: 1.3,
    };
    const tierBonus = baseEarnings * (tierMultipliers[user.tier] - 1);

    // Streak bonus (TODO: Implement streak tracking)
    const streakBonus = 0;

    const totalEarnings = baseEarnings + flatFee + reshareBonus + tierBonus + streakBonus;

    return {
      baseEarnings,
      flatFee,
      reshareBonus,
      tierBonus,
      streakBonus,
      totalEarnings,
    };
  }

  /**
   * Create a new post (user claims a campaign)
   */
  async createPost(userId: string, data: CreatePostRequest): Promise<PostResponse> {
    // Get campaign
    const campaign = await prisma.campaign.findUnique({
      where: { id: data.campaignId },
    });

    if (!campaign) {
      throw new AppError('NOT_FOUND', 'Campaign not found', 404);
    }

    if (campaign.status !== 'ACTIVE') {
      throw new AppError('INVALID_STATUS', 'Campaign is not active', 400);
    }

    // Check if user already has a post for this campaign
    const existingPost = await prisma.post.findFirst({
      where: {
        userId,
        campaignId: data.campaignId,
      },
    });

    if (existingPost) {
      throw new AppError('CONFLICT', 'You have already claimed this campaign', 409);
    }

    // Check if campaign has reached max posters
    const postersCount = await prisma.post.count({
      where: { campaignId: data.campaignId },
    });

    if (postersCount >= campaign.maxPosters) {
      throw new AppError('CAMPAIGN_FULL', 'Campaign has reached maximum posters', 400);
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.isBanned) {
      throw new AppError('FORBIDDEN', 'User not allowed to create posts', 403);
    }

    // Create post
    const post = await prisma.post.create({
      data: {
        userId,
        campaignId: data.campaignId,
        deviceFingerprint: user.deviceFingerprint,
      },
    });

    logger.info({ postId: post.id, userId, campaignId: data.campaignId }, 'Post created');

    return this.transformPost(post);
  }

  /**
   * Upload screenshot and submit for verification
   */
  async uploadScreenshot(
    postId: string,
    userId: string,
    data: UploadScreenshotRequest
  ): Promise<PostResponse> {
    // Get post
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { campaign: true, user: true },
    });

    if (!post) {
      throw new AppError('NOT_FOUND', 'Post not found', 404);
    }

    if (post.userId !== userId) {
      throw new AppError('FORBIDDEN', 'Access denied to this post', 403);
    }

    if (post.status !== 'PENDING') {
      throw new AppError('INVALID_STATUS', 'Post has already been submitted', 400);
    }

    // Validate views against user's contact count
    if (data.viewsCount > post.user.contactCount * 0.95) {
      throw new AppError(
        'SUSPICIOUS_VIEWS',
        'View count exceeds contact count. This looks suspicious.',
        400
      );
    }

    // Calculate earnings
    const earnings = this.calculateEarnings(
      data.viewsCount,
      post.campaign,
      post.user,
      post.isReshare
    );

    // Update post
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        screenshotUrl: data.screenshotUrl,
        viewsCount: data.viewsCount,
        resharesCount: data.resharesCount,
        postedAt: new Date(data.postedAt),
        screenshotUploadedAt: new Date(),
        baseEarnings: earnings.baseEarnings,
        bonusEarnings: earnings.tierBonus + earnings.streakBonus,
        totalEarnings: earnings.totalEarnings,
      },
    });

    logger.info({ postId, userId, viewsCount: data.viewsCount }, 'Screenshot uploaded');

    // TODO: Queue verification job
    // await verificationQueue.add('verify-screenshot', { postId });

    return this.transformPost(updatedPost);
  }

  /**
   * Get post by ID
   */
  async getPost(postId: string, userId?: string): Promise<PostWithCampaign> {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
            creativeUrl: true,
          },
        },
      },
    });

    if (!post) {
      throw new AppError('NOT_FOUND', 'Post not found', 404);
    }

    // If userId provided, verify ownership
    if (userId && post.userId !== userId) {
      throw new AppError('FORBIDDEN', 'Access denied to this post', 403);
    }

    return {
      ...this.transformPost(post),
      campaign: post.campaign,
    };
  }

  /**
   * List user's posts
   */
  async listUserPosts(userId: string, limit: number = 20, cursor?: string) {
    const posts = await prisma.post.findMany({
      where: { userId },
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
            creativeUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    });

    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, -1) : posts;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return {
      items: items.map(post => ({
        ...this.transformPost(post),
        campaign: post.campaign,
      })),
      nextCursor,
      hasMore,
    };
  }

  /**
   * List campaign posts (for brands)
   */
  async listCampaignPosts(campaignId: string, brandId: string, limit: number = 50) {
    // Verify campaign ownership
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      throw new AppError('NOT_FOUND', 'Campaign not found', 404);
    }

    if (campaign.brandId !== brandId) {
      throw new AppError('FORBIDDEN', 'Access denied to this campaign', 403);
    }

    const posts = await prisma.post.findMany({
      where: { campaignId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return posts.map(this.transformPost);
  }

  /**
   * Verify post (manual or auto)
   */
  async verifyPost(
    postId: string,
    status: 'VERIFIED' | 'REJECTED',
    verifiedBy: string,
    notes?: string
  ): Promise<PostResponse> {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { campaign: true, user: true },
    });

    if (!post) {
      throw new AppError('NOT_FOUND', 'Post not found', 404);
    }

    if (post.status !== 'PENDING') {
      throw new AppError('INVALID_STATUS', 'Post has already been verified', 400);
    }

    // Update post
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        status,
        verifiedBy,
        verificationNotes: notes,
      },
    });

    if (status === 'VERIFIED') {
      // Update user stats
      await prisma.user.update({
        where: { id: post.userId },
        data: {
          campaignsCompleted: { increment: 1 },
          totalViews: { increment: post.viewsCount || 0 },
          totalReshares: { increment: post.resharesCount || 0 },
        },
      });

      // Update campaign stats
      await prisma.campaign.update({
        where: { id: post.campaignId },
        data: {
          currentImpressions: { increment: post.viewsCount || 0 },
          spentBudget: { increment: post.totalEarnings.toNumber() },
        },
      });

      // Deduct from brand balance
      await prisma.brand.update({
        where: { id: post.campaign.brandId },
        data: {
          balance: { decrement: post.totalEarnings.toNumber() },
          totalSpent: { increment: post.totalEarnings.toNumber() },
        },
      });

      logger.info({ postId, userId: post.userId, earnings: post.totalEarnings.toString() }, 'Post verified');
    } else {
      logger.info({ postId, reason: notes }, 'Post rejected');
    }

    return this.transformPost(updatedPost);
  }

  /**
   * Delete post (before submission only)
   */
  async deletePost(postId: string, userId: string): Promise<void> {
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new AppError('NOT_FOUND', 'Post not found', 404);
    }

    if (post.userId !== userId) {
      throw new AppError('FORBIDDEN', 'Access denied to this post', 403);
    }

    if (post.status !== 'PENDING' || post.screenshotUrl) {
      throw new AppError('INVALID_STATUS', 'Cannot delete submitted post', 400);
    }

    await prisma.post.delete({
      where: { id: postId },
    });

    logger.info({ postId, userId }, 'Post deleted');
  }
}

