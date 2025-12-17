import { z } from 'zod';

export const requestPayoutSchema = z.object({
  method: z.enum(['NEXUSPAY', 'MPESA', 'PAYSTACK', 'BANK']),
  amount: z.number().min(5).max(100000),
  walletAddress: z.string().optional(),
  phoneNumber: z.string().optional(),
  network: z.string().optional(), // For crypto: 'polygon', 'ethereum', etc.
});

export const updatePayoutStatusSchema = z.object({
  status: z.enum(['PROCESSING', 'COMPLETED', 'FAILED']),
  transactionHash: z.string().optional(),
  failureReason: z.string().optional(),
});

export type RequestPayoutRequest = z.infer<typeof requestPayoutSchema>;
export type UpdatePayoutStatusRequest = z.infer<typeof updatePayoutStatusSchema>;

export interface PayoutResponse {
  id: string;
  userId: string;
  amount: string;
  currency: string;
  method: string;
  walletAddress: string | null;
  transactionHash: string | null;
  network: string | null;
  phoneNumber: string | null;
  status: string;
  processedAt: Date | null;
  failureReason: string | null;
  postIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PayoutStats {
  totalPaidOut: string;
  pendingPayouts: string;
  completedPayouts: number;
  failedPayouts: number;
}




