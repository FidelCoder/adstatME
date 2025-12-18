import { prisma } from '@config/database';
import { logger } from '@config/logger';
import { AppError } from '@shared/errors/app-error';
import type { 
  CreateCampaignRequest, 
  UpdateCampaignRequest, 
  CampaignResponse, 
  CampaignStats,
  MatchedUser 
} from './campaigns.types';
import type { Prisma, CampaignStatus } from '@prisma/client';
import crypto from 'crypto';

export class CampaignsService {
  /**
   * Generate unique watermark ID for campaign
   */
  private generateWatermarkId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Transform campaign to response format
   */
  private transformCampaign(campaign: any): CampaignResponse {
    return {
      id: campaign.id,
      brandId: campaign.brandId,
      organizationId: campaign.organizationId,
      name: campaign.name,
      description: campaign.description,
      category: campaign.category,
      creativeUrl: campaign.creativeUrl,
      watermarkId: campaign.watermarkId,
      callToAction: campaign.callToAction,
      targetLocations: campaign.targetLocations,
      targetAgeRanges: campaign.targetAgeRanges,
      targetInterests: campaign.targetInterests,
      minContacts: campaign.minContacts,
      minViewRate: campaign.minViewRate?.toString() || null,
      totalBudget: campaign.totalBudget.toString(),
      spentBudget: campaign.spentBudget.toString(),
      cpm: campaign.cpm.toString(),
      userCpm: campaign.userCpm.toString(),
      flatFee: campaign.flatFee.toString(),
      reshareBonus: campaign.reshareBonus.toString(),
      maxPosters: campaign.maxPosters,
      targetImpressions: campaign.targetImpressions,
      currentImpressions: campaign.currentImpressions,
      status: campaign.status,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
    };
  }

  /**
   * Create a new campaign
   */
  async createCampaign(userId: string, data: CreateCampaignRequest): Promise<CampaignResponse> {
    let brandId: string | null = null;
    let organizationId: string | null = data.organizationId || null;

    // If organizationId provided, verify user has permission
    if (organizationId) {
      const { OrganizationsService } = await import('@modules/organizations');
      const orgService = new OrganizationsService();
      
      const hasPermission = await orgService.checkPermission(
        organizationId,
        userId,
        'createCampaigns'
      );

      if (!hasPermission) {
        throw new AppError(
          'FORBIDDEN',
          'You do not have permission to create campaigns in this organization',
          403
        );
      }

      // Verify organization exists and has sufficient balance
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
      });

      if (!organization) {
        throw new AppError('NOT_FOUND', 'Organization not found', 404);
      }

      if (organization.balance.toNumber() < data.totalBudget) {
        throw new AppError(
          'INSUFFICIENT_BALANCE',
          'Insufficient organization balance to create campaign',
          400
        );
      }
    } else {
      // Legacy: use brand (for backward compatibility)
      // Find user's brand or use default brand logic
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (user?.role !== 'BRAND' && user?.role !== 'ADMIN') {
        throw new AppError(
          'FORBIDDEN',
          'You must be part of an organization or be a brand to create campaigns',
          403
        );
      }

      // For now, we'll require organizationId for new campaigns
      throw new AppError(
        'VALIDATION_ERROR',
        'organizationId is required to create a campaign',
        400
      );
    }

    // Validate CPM rates
    if (data.userCpm >= data.cpm) {
      throw new AppError(
        'INVALID_CPM',
        'User CPM must be less than brand CPM to cover platform fees',
        400
      );
    }

    // Generate watermark ID
    const watermarkId = this.generateWatermarkId();

    // Create campaign
    const campaign = await prisma.campaign.create({
      data: {
        brandId,
        organizationId,
        name: data.name,
        description: data.description,
        category: data.category,
        creativeUrl: data.creativeUrl,
        watermarkId,
        callToAction: data.callToAction,
        targetLocations: data.targetLocations,
        targetAgeRanges: data.targetAgeRanges,
        targetInterests: data.targetInterests,
        minContacts: data.minContacts,
        minViewRate: data.minViewRate,
        totalBudget: data.totalBudget,
        cpm: data.cpm,
        userCpm: data.userCpm,
        flatFee: data.flatFee,
        reshareBonus: data.reshareBonus,
        maxPosters: data.maxPosters,
        targetImpressions: data.targetImpressions,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        status: 'DRAFT',
      },
    });

    // Update organization stats
    if (organizationId) {
      await prisma.organization.update({
        where: { id: organizationId },
        data: {
          totalCampaigns: { increment: 1 },
        },
      });
    }

    logger.info({ campaignId: campaign.id, brandId, organizationId }, 'Campaign created');

    return this.transformCampaign(campaign);
  }

  /**
   * Get campaign by ID
   */
  async getCampaign(campaignId: string, brandId?: string): Promise<CampaignResponse> {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      throw new AppError('NOT_FOUND', 'Campaign not found', 404);
    }

    // If brandId is provided, verify ownership
    if (brandId && campaign.brandId !== brandId) {
      throw new AppError('FORBIDDEN', 'Access denied to this campaign', 403);
    }

    return this.transformCampaign(campaign);
  }

  /**
   * Update campaign
   */
  async updateCampaign(
    campaignId: string,
    userId: string,
    data: UpdateCampaignRequest
  ): Promise<CampaignResponse> {
    // Verify ownership
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      throw new AppError('NOT_FOUND', 'Campaign not found', 404);
    }

    // Check organization permission
    if (campaign.organizationId) {
      const { OrganizationsService } = await import('@modules/organizations');
      const orgService = new OrganizationsService();
      const hasPermission = await orgService.checkPermission(
        campaign.organizationId,
        userId,
        'createCampaigns'
      );

      if (!hasPermission) {
        throw new AppError('FORBIDDEN', 'Access denied to this campaign', 403);
      }
    } else if (campaign.brandId) {
      // Legacy brand check
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (user?.role !== 'BRAND' && user?.role !== 'ADMIN') {
        throw new AppError('FORBIDDEN', 'Access denied to this campaign', 403);
      }
    } else {
      throw new AppError('FORBIDDEN', 'Access denied to this campaign', 403);
    }

    // Can only update draft campaigns
    if (campaign.status !== 'DRAFT') {
      throw new AppError(
        'INVALID_STATUS',
        'Can only update campaigns in DRAFT status',
        400
      );
    }

    // Update campaign
    const updateData: Prisma.CampaignUpdateInput = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.creativeUrl !== undefined) updateData.creativeUrl = data.creativeUrl;
    if (data.callToAction !== undefined) updateData.callToAction = data.callToAction;
    if (data.targetLocations !== undefined) updateData.targetLocations = data.targetLocations;
    if (data.targetAgeRanges !== undefined) updateData.targetAgeRanges = data.targetAgeRanges;
    if (data.targetInterests !== undefined) updateData.targetInterests = data.targetInterests;
    if (data.minContacts !== undefined) updateData.minContacts = data.minContacts;
    if (data.minViewRate !== undefined) updateData.minViewRate = data.minViewRate;
    if (data.totalBudget !== undefined) updateData.totalBudget = data.totalBudget;
    if (data.cpm !== undefined) updateData.cpm = data.cpm;
    if (data.userCpm !== undefined) updateData.userCpm = data.userCpm;
    if (data.flatFee !== undefined) updateData.flatFee = data.flatFee;
    if (data.reshareBonus !== undefined) updateData.reshareBonus = data.reshareBonus;
    if (data.maxPosters !== undefined) updateData.maxPosters = data.maxPosters;
    if (data.targetImpressions !== undefined) updateData.targetImpressions = data.targetImpressions;
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);

    const updatedCampaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: updateData,
    });

    logger.info({ campaignId, organizationId: campaign.organizationId, brandId: campaign.brandId }, 'Campaign updated');

    return this.transformCampaign(updatedCampaign);
  }

  /**
   * Update campaign status
   */
  async updateCampaignStatus(
    campaignId: string,
    userId: string,
    status: CampaignStatus
  ): Promise<CampaignResponse> {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { brand: true, organization: true },
    });

    if (!campaign) {
      throw new AppError('NOT_FOUND', 'Campaign not found', 404);
    }

    // Check organization permission
    if (campaign.organizationId) {
      const { OrganizationsService } = await import('@modules/organizations');
      const orgService = new OrganizationsService();
      const hasPermission = await orgService.checkPermission(
        campaign.organizationId,
        userId,
        'createCampaigns'
      );

      if (!hasPermission) {
        throw new AppError('FORBIDDEN', 'Access denied to this campaign', 403);
      }
    } else if (campaign.brandId) {
      // Legacy brand check
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (user?.role !== 'BRAND' && user?.role !== 'ADMIN') {
        throw new AppError('FORBIDDEN', 'Access denied to this campaign', 403);
      }
    } else {
      throw new AppError('FORBIDDEN', 'Access denied to this campaign', 403);
    }

    // Validate status transition
    if (status === 'ACTIVE') {
      // Check balance (organization or brand)
      const remainingBudget = campaign.totalBudget.toNumber() - campaign.spentBudget.toNumber();
      
      if (campaign.organization) {
        if (campaign.organization.balance.toNumber() < remainingBudget) {
          throw new AppError(
            'INSUFFICIENT_BALANCE',
            'Insufficient organization balance to activate campaign',
            400
          );
        }
      } else if (campaign.brand) {
        if (campaign.brand.balance.toNumber() < remainingBudget) {
          throw new AppError(
            'INSUFFICIENT_BALANCE',
            'Insufficient balance to activate campaign',
            400
          );
        }
      }

      // Set start date if not set
      if (!campaign.startDate) {
        await prisma.campaign.update({
          where: { id: campaignId },
          data: { startDate: new Date() },
        });
      }
    }

    // Update status
    const updatedCampaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: { status },
    });

    logger.info({ campaignId, organizationId: campaign.organizationId, brandId: campaign.brandId, status }, 'Campaign status updated');

    return this.transformCampaign(updatedCampaign);
  }

  /**
   * List campaigns (with filters)
   */
  async listCampaigns(
    userId: string,
    status?: CampaignStatus,
    organizationId?: string,
    category?: string,
    limit: number = 20,
    cursor?: string
  ) {
    const where: Prisma.CampaignWhereInput = {};
    
    if (status) where.status = status;
    if (category) where.category = category as any;
    
    // Filter by organization if user is member
    if (organizationId) {
      where.organizationId = organizationId;
      
      // Verify user has access
      const member = await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId,
            userId,
          },
        },
      });

      if (!member) {
        const org = await prisma.organization.findUnique({
          where: { id: organizationId },
        });

        if (!org || !org.isPublic) {
          throw new AppError('FORBIDDEN', 'You do not have access to this organization', 403);
        }
      }
    } else {
      // Show campaigns from user's organizations or public campaigns
      const userOrgs = await prisma.organizationMember.findMany({
        where: { userId },
        select: { organizationId: true },
      });

      const orgIds = userOrgs.map(o => o.organizationId);

      where.OR = [
        { organizationId: { in: orgIds } },
        { organization: { isPublic: true } },
      ];
    }

    const campaigns = await prisma.campaign.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    });

    const hasMore = campaigns.length > limit;
    const items = hasMore ? campaigns.slice(0, -1) : campaigns;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return {
      items: items.map(this.transformCampaign),
      nextCursor,
      hasMore,
    };
  }

  /**
   * Get active campaigns available for users
   */
  async getAvailableCampaigns(category?: string, organizationId?: string, limit: number = 20) {
    const now = new Date();

    const where: Prisma.CampaignWhereInput = {
      status: 'ACTIVE',
      OR: [
        { startDate: null },
        { startDate: { lte: now } },
      ],
      AND: [
        {
          OR: [
            { endDate: null },
            { endDate: { gte: now } },
          ],
        },
      ],
    };

    if (category) {
      where.category = category as any;
    }

    if (organizationId) {
      where.organizationId = organizationId;
    }

    const campaigns = await prisma.campaign.findMany({
      where,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return campaigns.map(c => ({
      ...this.transformCampaign(c),
      organization: c.organization ? {
        id: c.organization.id,
        name: c.organization.name,
        slug: c.organization.slug,
      } : null,
    }));
  }

  /**
   * Get campaign statistics
   */
  async getCampaignStats(campaignId: string, userId: string): Promise<CampaignStats> {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        posts: {
          where: { status: { in: ['VERIFIED', 'PAID'] } },
        },
      },
    });

    if (!campaign) {
      throw new AppError('NOT_FOUND', 'Campaign not found', 404);
    }

    // Check organization permission
    if (campaign.organizationId) {
      const { OrganizationsService } = await import('@modules/organizations');
      const orgService = new OrganizationsService();
      const hasPermission = await orgService.checkPermission(
        campaign.organizationId,
        userId,
        'viewAnalytics'
      );

      if (!hasPermission) {
        throw new AppError('FORBIDDEN', 'Access denied to this campaign', 403);
      }
    } else if (campaign.brandId) {
      // Legacy brand check
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (user?.role !== 'BRAND' && user?.role !== 'ADMIN') {
        throw new AppError('FORBIDDEN', 'Access denied to this campaign', 403);
      }
    } else {
      throw new AppError('FORBIDDEN', 'Access denied to this campaign', 403);
    }

    const uniquePosters = new Set(campaign.posts.map(p => p.userId)).size;
    const totalViews = campaign.posts.reduce((sum, p) => sum + (p.viewsCount || 0), 0);
    const totalReshares = campaign.posts.reduce((sum, p) => sum + (p.resharesCount || 0), 0);
    const avgViewsPerPost = campaign.posts.length > 0 ? totalViews / campaign.posts.length : 0;
    const completionRate = (campaign.currentImpressions / campaign.targetImpressions) * 100;

    return {
      totalImpressions: campaign.currentImpressions,
      uniquePosters,
      totalReshares,
      spentBudget: campaign.spentBudget.toString(),
      remainingBudget: (campaign.totalBudget.toNumber() - campaign.spentBudget.toNumber()).toString(),
      avgViewsPerPost: Math.round(avgViewsPerPost),
      completionRate: Math.min(completionRate, 100),
    };
  }

  /**
   * Campaign matching algorithm
   * Match users to campaign based on multiple criteria
   */
  async matchUsersToCampaign(campaignId: string, limit: number = 100): Promise<MatchedUser[]> {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign || campaign.status !== 'ACTIVE') {
      return [];
    }

    // Get eligible users
    const users = await prisma.user.findMany({
      where: {
        isBanned: false,
        role: 'USER',
        whatsappVerified: true,
        ...(campaign.minContacts && { contactCount: { gte: campaign.minContacts } }),
        ...(campaign.minViewRate && { avgViewRate: { gte: campaign.minViewRate } }),
      },
      select: {
        id: true,
        locationCountry: true,
        locationCity: true,
        ageRange: true,
        interests: true,
        avgViewRate: true,
        reputationScore: true,
        contactCount: true,
      },
    });

    // Score each user
    const scoredUsers: MatchedUser[] = users.map(user => {
      let score = 0;
      const reasons: string[] = [];

      // Location match (30% weight)
      const locationMatch = campaign.targetLocations.some(loc => 
        user.locationCountry === loc || user.locationCity === loc
      );
      if (locationMatch) {
        score += 0.3;
        reasons.push('Location match');
      }

      // Demographics match (20% weight)
      if (user.ageRange && campaign.targetAgeRanges.includes(user.ageRange)) {
        score += 0.2;
        reasons.push('Age range match');
      }

      // Interest match (30% weight)
      const interestMatches = user.interests.filter(interest => 
        campaign.targetInterests.includes(interest)
      );
      const interestScore = (interestMatches.length / campaign.targetInterests.length) * 0.3;
      score += interestScore;
      if (interestMatches.length > 0) {
        reasons.push(`${interestMatches.length} interest match(es)`);
      }

      // Performance score (20% weight)
      const avgViewRate = user.avgViewRate ? parseFloat(user.avgViewRate.toString()) : 0;
      const performanceScore = avgViewRate * 0.2;
      score += performanceScore;
      if (avgViewRate > 0.5) {
        reasons.push('High view rate');
      }

      // Reputation bonus
      const reputationScore = parseFloat(user.reputationScore.toString());
      if (reputationScore > 0.8) {
        score += 0.05;
        reasons.push('High reputation');
      }

      return {
        userId: user.id,
        score,
        reasons,
      };
    });

    // Sort by score and return top matches
    return scoredUsers
      .filter(u => u.score > 0.3) // Minimum 30% match
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}




