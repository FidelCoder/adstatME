import { prisma } from '@config/database';
import { logger } from '@config/logger';
import { AppError } from '@shared/errors/app-error';
import type { 
  CreateOrganizationRequest, 
  UpdateOrganizationRequest,
  AddMemberRequest,
  UpdateMemberRequest,
  OrganizationResponse,
  OrganizationMemberResponse 
} from './organizations.types';
import type { Prisma } from '@prisma/client';

export class OrganizationsService {
  /**
   * Transform organization to response format
   */
  private transformOrganization(org: any): OrganizationResponse {
    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      description: org.description,
      logoUrl: org.logoUrl,
      website: org.website,
      email: org.email,
      phoneNumber: org.phoneNumber,
      balance: org.balance.toString(),
      totalSpent: org.totalSpent.toString(),
      totalCampaigns: org.totalCampaigns,
      totalImpressions: org.totalImpressions,
      memberCount: org.memberCount,
      isPublic: org.isPublic,
      isActive: org.isActive,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
    };
  }

  /**
   * Create a new organization
   */
  async createOrganization(userId: string, data: CreateOrganizationRequest): Promise<OrganizationResponse> {
    // Check if slug already exists
    const existing = await prisma.organization.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      throw new AppError('CONFLICT', 'Organization with this slug already exists', 409);
    }

    // Create organization
    const organization = await prisma.organization.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        logoUrl: data.logoUrl,
        website: data.website,
        email: data.email,
        phoneNumber: data.phoneNumber,
        isPublic: data.isPublic,
      },
    });

    // Add creator as OWNER
    await prisma.organizationMember.create({
      data: {
        organizationId: organization.id,
        userId,
        role: 'OWNER',
        canCreateCampaigns: true,
        canManageMembers: true,
        canViewAnalytics: true,
      },
    });

    // Update member count
    await prisma.organization.update({
      where: { id: organization.id },
      data: { memberCount: 1 },
    });

    logger.info({ organizationId: organization.id, userId }, 'Organization created');

    return this.transformOrganization(organization);
  }

  /**
   * Get organization by ID or slug
   */
  async getOrganization(identifier: string): Promise<OrganizationResponse> {
    const organization = await prisma.organization.findFirst({
      where: {
        OR: [
          { id: identifier },
          { slug: identifier },
        ],
        deletedAt: null,
      },
    });

    if (!organization) {
      throw new AppError('NOT_FOUND', 'Organization not found', 404);
    }

    return this.transformOrganization(organization);
  }

  /**
   * Update organization
   */
  async updateOrganization(
    organizationId: string,
    userId: string,
    data: UpdateOrganizationRequest
  ): Promise<OrganizationResponse> {
    // Verify user has permission (OWNER or ADMIN)
    const member = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });

    if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
      throw new AppError('FORBIDDEN', 'You do not have permission to update this organization', 403);
    }

    const organization = await prisma.organization.update({
      where: { id: organizationId },
      data,
    });

    logger.info({ organizationId, userId }, 'Organization updated');

    return this.transformOrganization(organization);
  }

  /**
   * List organizations (public or user's organizations)
   */
  async listOrganizations(userId?: string, includePublic: boolean = true) {
    const where: Prisma.OrganizationWhereInput = {
      deletedAt: null,
      isActive: true,
    };

    if (includePublic) {
      where.OR = [
        { isPublic: true },
        ...(userId ? [{
          members: {
            some: { userId },
          },
        }] : []),
      ];
    } else if (userId) {
      where.members = {
        some: { userId },
      };
    } else {
      where.isPublic = true;
    }

    const organizations = await prisma.organization.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            members: true,
            campaigns: true,
          },
        },
      },
    });

    return organizations.map(org => ({
      ...this.transformOrganization(org),
      memberCount: org._count.members,
      totalCampaigns: org._count.campaigns,
    }));
  }

  /**
   * Add member to organization
   */
  async addMember(
    organizationId: string,
    requesterId: string,
    data: AddMemberRequest
  ): Promise<OrganizationMemberResponse> {
    // Verify requester has permission
    const requester = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: requesterId,
        },
      },
    });

    if (!requester || (!requester.canManageMembers && requester.role !== 'OWNER' && requester.role !== 'ADMIN')) {
      throw new AppError('FORBIDDEN', 'You do not have permission to add members', 403);
    }

    // Check if user is already a member
    const existing = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: data.userId,
        },
      },
    });

    if (existing) {
      throw new AppError('CONFLICT', 'User is already a member of this organization', 409);
    }

    // Add member
    const member = await prisma.organizationMember.create({
      data: {
        organizationId,
        userId: data.userId,
        role: data.role,
        canCreateCampaigns: data.canCreateCampaigns,
        canManageMembers: data.canManageMembers,
        canViewAnalytics: data.canViewAnalytics,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
          },
        },
      },
    });

    // Update member count
    await prisma.organization.update({
      where: { id: organizationId },
      data: { memberCount: { increment: 1 } },
    });

    logger.info({ organizationId, userId: data.userId }, 'Member added to organization');

    return {
      id: member.id,
      organizationId: member.organizationId,
      userId: member.userId,
      role: member.role,
      canCreateCampaigns: member.canCreateCampaigns,
      canManageMembers: member.canManageMembers,
      canViewAnalytics: member.canViewAnalytics,
      joinedAt: member.joinedAt,
      user: member.user,
    };
  }

  /**
   * Get organization members
   */
  async getMembers(organizationId: string, userId?: string) {
    // Verify user has access
    if (userId) {
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
    }

    const members = await prisma.organizationMember.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' }, // OWNER first, then ADMIN, then MEMBER
        { joinedAt: 'asc' },
      ],
    });

    return members.map(m => ({
      id: m.id,
      organizationId: m.organizationId,
      userId: m.userId,
      role: m.role,
      canCreateCampaigns: m.canCreateCampaigns,
      canManageMembers: m.canManageMembers,
      canViewAnalytics: m.canViewAnalytics,
      joinedAt: m.joinedAt,
      user: m.user,
    }));
  }

  /**
   * Update member role/permissions
   */
  async updateMember(
    organizationId: string,
    memberUserId: string,
    requesterId: string,
    data: UpdateMemberRequest
  ): Promise<OrganizationMemberResponse> {
    // Verify requester has permission
    const requester = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: requesterId,
        },
      },
    });

    if (!requester || (!requester.canManageMembers && requester.role !== 'OWNER')) {
      throw new AppError('FORBIDDEN', 'You do not have permission to update members', 403);
    }

    // Prevent changing OWNER role unless requester is OWNER
    if (data.role && data.role !== 'OWNER') {
      const targetMember = await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId,
            userId: memberUserId,
          },
        },
      });

      if (targetMember?.role === 'OWNER' && requester.role !== 'OWNER') {
        throw new AppError('FORBIDDEN', 'Only the owner can change owner role', 403);
      }
    }

    const member = await prisma.organizationMember.update({
      where: {
        organizationId_userId: {
          organizationId,
          userId: memberUserId,
        },
      },
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
          },
        },
      },
    });

    logger.info({ organizationId, memberUserId }, 'Member updated');

    return {
      id: member.id,
      organizationId: member.organizationId,
      userId: member.userId,
      role: member.role,
      canCreateCampaigns: member.canCreateCampaigns,
      canManageMembers: member.canManageMembers,
      canViewAnalytics: member.canViewAnalytics,
      joinedAt: member.joinedAt,
      user: member.user,
    };
  }

  /**
   * Remove member from organization
   */
  async removeMember(organizationId: string, memberUserId: string, requesterId: string): Promise<void> {
    // Verify requester has permission
    const requester = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: requesterId,
        },
      },
    });

    if (!requester || (!requester.canManageMembers && requester.role !== 'OWNER')) {
      throw new AppError('FORBIDDEN', 'You do not have permission to remove members', 403);
    }

    // Prevent removing OWNER
    const targetMember = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: memberUserId,
        },
      },
    });

    if (targetMember?.role === 'OWNER') {
      throw new AppError('FORBIDDEN', 'Cannot remove organization owner', 403);
    }

    await prisma.organizationMember.delete({
      where: {
        organizationId_userId: {
          organizationId,
          userId: memberUserId,
        },
      },
    });

    // Update member count
    await prisma.organization.update({
      where: { id: organizationId },
      data: { memberCount: { decrement: 1 } },
    });

    logger.info({ organizationId, memberUserId }, 'Member removed from organization');
  }

  /**
   * Get user's organizations
   */
  async getUserOrganizations(userId: string) {
    const memberships = await prisma.organizationMember.findMany({
      where: { userId },
      include: {
        organization: true,
      },
      orderBy: { joinedAt: 'desc' },
    });

    return memberships.map(m => ({
      ...this.transformOrganization(m.organization),
      role: m.role,
      canCreateCampaigns: m.canCreateCampaigns,
      canManageMembers: m.canManageMembers,
      canViewAnalytics: m.canViewAnalytics,
      joinedAt: m.joinedAt,
    }));
  }

  /**
   * Check if user has permission in organization
   */
  async checkPermission(
    organizationId: string,
    userId: string,
    permission: 'createCampaigns' | 'manageMembers' | 'viewAnalytics'
  ): Promise<boolean> {
    const member = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });

    if (!member) return false;

    if (member.role === 'OWNER' || member.role === 'ADMIN') return true;

    switch (permission) {
      case 'createCampaigns':
        return member.canCreateCampaigns;
      case 'manageMembers':
        return member.canManageMembers;
      case 'viewAnalytics':
        return member.canViewAnalytics;
      default:
        return false;
    }
  }
}

