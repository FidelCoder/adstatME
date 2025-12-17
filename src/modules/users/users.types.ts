import { z } from 'zod';
import { phoneNumberSchema, ageRangeSchema, interestSchema } from '@shared/validators/common.validator';

// Update user profile schema
export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  ageRange: ageRangeSchema.optional(),
  locationCity: z.string().min(2).max(100).optional(),
  locationCountry: z.string().length(2).optional(),
  interests: z.array(interestSchema).min(1).max(10).optional(),
  walletAddress: z.string().min(26).max(62).optional(), // Crypto wallet
  contactCount: z.number().int().min(0).max(100000).optional(),
});

// Update device fingerprint schema
export const updateDeviceSchema = z.object({
  deviceFingerprint: z.string().min(1).max(255),
});

export type UpdateProfileRequest = z.infer<typeof updateProfileSchema>;
export type UpdateDeviceRequest = z.infer<typeof updateDeviceSchema>;

export interface UserProfile {
  id: string;
  phoneNumber: string;
  whatsappVerified: boolean;
  name: string | null;
  ageRange: string | null;
  locationCity: string | null;
  locationCountry: string | null;
  interests: string[];
  walletAddress: string | null;
  contactCount: number;
  campaignsCompleted: number;
  totalViews: number;
  totalReshares: number;
  totalEarned: string;
  role: string;
  tier: string;
  reputationScore: string;
  avgViewRate: string | null;
  fraudFlags: number;
  isBanned: boolean;
  createdAt: Date;
  lastActive: Date | null;
}

export interface UserStats {
  campaignsCompleted: number;
  totalViews: number;
  totalReshares: number;
  totalEarned: string;
  avgViewRate: string | null;
  tier: string;
  reputationScore: string;
}

export interface UserEarnings {
  totalEarned: string;
  pendingEarnings: string;
  lastPayout: {
    amount: string;
    date: Date;
  } | null;
}




