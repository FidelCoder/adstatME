import { z } from 'zod';

export const createPostSchema = z.object({
  campaignId: z.string().uuid(),
});

export const uploadScreenshotSchema = z.object({
  screenshotUrl: z.string().url(),
  viewsCount: z.number().int().min(0),
  resharesCount: z.number().int().min(0).default(0),
  postedAt: z.string().datetime(),
});

export const verifyPostSchema = z.object({
  status: z.enum(['VERIFIED', 'REJECTED']),
  verificationNotes: z.string().max(1000).optional(),
});

export type CreatePostRequest = z.infer<typeof createPostSchema>;
export type UploadScreenshotRequest = z.infer<typeof uploadScreenshotSchema>;
export type VerifyPostRequest = z.infer<typeof verifyPostSchema>;

export interface PostResponse {
  id: string;
  userId: string;
  campaignId: string;
  screenshotUrl: string | null;
  viewsCount: number | null;
  resharesCount: number | null;
  postedAt: Date | null;
  screenshotUploadedAt: Date | null;
  status: string;
  verifiedBy: string | null;
  verificationNotes: string | null;
  baseEarnings: string;
  bonusEarnings: string;
  totalEarnings: string;
  isReshare: boolean;
  originalPostId: string | null;
  deviceFingerprint: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EarningsBreakdown {
  baseEarnings: number;
  flatFee: number;
  reshareBonus: number;
  tierBonus: number;
  streakBonus: number;
  totalEarnings: number;
}

export interface PostWithCampaign extends PostResponse {
  campaign: {
    id: string;
    name: string;
    creativeUrl: string;
  };
}




