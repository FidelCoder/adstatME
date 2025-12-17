import { z } from 'zod';
import { phoneNumberSchema } from '@shared/validators/common.validator';

// Request validation schemas
export const sendOtpSchema = z.object({
  phoneNumber: phoneNumberSchema,
});

export const verifyOtpSchema = z.object({
  phoneNumber: phoneNumberSchema,
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// Types
export type SendOtpRequest = z.infer<typeof sendOtpSchema>;
export type VerifyOtpRequest = z.infer<typeof verifyOtpSchema>;
export type RefreshTokenRequest = z.infer<typeof refreshTokenSchema>;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: {
    id: string;
    phoneNumber: string;
    role: string;
    name: string | null;
  };
  tokens: AuthTokens;
  isNewUser: boolean;
}

export interface OtpRecord {
  phoneNumber: string;
  otp: string;
  expiresAt: Date;
  attempts: number;
}




