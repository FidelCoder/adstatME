import { z } from 'zod';
import { uuidSchema } from '@shared/validators/common.validator';

// Create organization schema
export const createOrganizationSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().max(1000).optional(),
  logoUrl: z.string().url().optional(),
  website: z.string().url().optional(),
  email: z.string().email().optional(),
  phoneNumber: z.string().optional(),
  isPublic: z.boolean().default(false),
});

// Update organization schema
export const updateOrganizationSchema = createOrganizationSchema.partial().omit({ slug: true });

// Add member schema
export const addMemberSchema = z.object({
  userId: uuidSchema,
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER']).default('MEMBER'),
  canCreateCampaigns: z.boolean().default(false),
  canManageMembers: z.boolean().default(false),
  canViewAnalytics: z.boolean().default(true),
});

// Update member schema
export const updateMemberSchema = z.object({
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER']).optional(),
  canCreateCampaigns: z.boolean().optional(),
  canManageMembers: z.boolean().optional(),
  canViewAnalytics: z.boolean().optional(),
});

export type CreateOrganizationRequest = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationRequest = z.infer<typeof updateOrganizationSchema>;
export type AddMemberRequest = z.infer<typeof addMemberSchema>;
export type UpdateMemberRequest = z.infer<typeof updateMemberSchema>;

export interface OrganizationResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  website: string | null;
  email: string | null;
  phoneNumber: string | null;
  balance: string;
  totalSpent: string;
  totalCampaigns: number;
  totalImpressions: number;
  memberCount: number;
  isPublic: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationMemberResponse {
  id: string;
  organizationId: string;
  userId: string;
  role: string;
  canCreateCampaigns: boolean;
  canManageMembers: boolean;
  canViewAnalytics: boolean;
  joinedAt: Date;
  user: {
    id: string;
    name: string | null;
    phoneNumber: string;
  };
}

