import { z } from 'zod';

export const createBrandSchema = z.object({
  name: z.string().min(2).max(200),
  email: z.string().email(),
  company: z.string().min(2).max(200).optional(),
});

export const updateBrandSchema = createBrandSchema.partial();

export const addBalanceSchema = z.object({
  amount: z.number().min(10).max(1000000),
});

export type CreateBrandRequest = z.infer<typeof createBrandSchema>;
export type UpdateBrandRequest = z.infer<typeof updateBrandSchema>;
export type AddBalanceRequest = z.infer<typeof addBalanceSchema>;

export interface BrandResponse {
  id: string;
  name: string;
  email: string;
  company: string | null;
  apiKey: string | null;
  balance: string;
  totalSpent: string;
  totalCampaigns: number;
  totalImpressions: number;
  createdAt: Date;
  updatedAt: Date;
}




