import { z } from 'zod';
import { ageRangeSchema, interestSchema } from '@shared/validators/common.validator';

// Campaign creation schema
export const createCampaignSchema = z.object({
  name: z.string().min(3).max(200),
  description: z.string().max(1000).optional(),
  creativeUrl: z.string().url(),
  callToAction: z.string().max(200).optional(),
  
  // Targeting
  targetLocations: z.array(z.string()).min(1).max(50),
  targetAgeRanges: z.array(ageRangeSchema).min(1),
  targetInterests: z.array(interestSchema).min(1).max(10),
  minContacts: z.number().int().min(0).max(10000).optional(),
  minViewRate: z.number().min(0).max(1).optional(),
  
  // Budget
  totalBudget: z.number().min(10).max(1000000),
  cpm: z.number().min(0.01).max(100), // Cost per 1000 views (brand pays)
  userCpm: z.number().min(0.01).max(50), // What users earn
  flatFee: z.number().min(0).max(100).default(0),
  reshareBonus: z.number().min(0).max(50).default(0),
  
  // Limits
  maxPosters: z.number().int().min(1).max(100000),
  targetImpressions: z.number().int().min(1000).max(100000000),
  
  // Schedule
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// Update campaign schema
export const updateCampaignSchema = createCampaignSchema.partial();

// Campaign status update schema
export const updateCampaignStatusSchema = z.object({
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED']),
});

// Campaign query schema
export const campaignQuerySchema = z.object({
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED']).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export type CreateCampaignRequest = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignRequest = z.infer<typeof updateCampaignSchema>;
export type UpdateCampaignStatusRequest = z.infer<typeof updateCampaignStatusSchema>;
export type CampaignQuery = z.infer<typeof campaignQuerySchema>;

export interface CampaignResponse {
  id: string;
  brandId: string;
  name: string;
  description: string | null;
  creativeUrl: string;
  watermarkId: string;
  callToAction: string | null;
  targetLocations: string[];
  targetAgeRanges: string[];
  targetInterests: string[];
  minContacts: number | null;
  minViewRate: string | null;
  totalBudget: string;
  spentBudget: string;
  cpm: string;
  userCpm: string;
  flatFee: string;
  reshareBonus: string;
  maxPosters: number;
  targetImpressions: number;
  currentImpressions: number;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignStats {
  totalImpressions: number;
  uniquePosters: number;
  totalReshares: number;
  spentBudget: string;
  remainingBudget: string;
  avgViewsPerPost: number;
  completionRate: number;
}

export interface MatchedUser {
  userId: string;
  score: number;
  reasons: string[];
}




