import { z } from 'zod';

// Phone number validation (international format)
export const phoneNumberSchema = z
  .string()
  .regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone number format. Must be in international format (e.g., +254712345678)');

// UUID validation
export const uuidSchema = z.string().uuid('Invalid UUID format');

// Pagination schemas
export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

// Date range validation
export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// Common query params
export const idParamSchema = z.object({
  id: uuidSchema,
});

// Location validation
export const locationSchema = z.object({
  city: z.string().min(2).max(100).optional(),
  country: z.string().length(2, 'Country code must be ISO 3166-1 alpha-2 format').optional(),
});

// Age range validation
export const ageRangeSchema = z.enum(['18-24', '25-34', '35-44', '45-54', '55+']);

// Interest validation
export const interestSchema = z.enum([
  'fashion',
  'tech',
  'food',
  'travel',
  'sports',
  'music',
  'gaming',
  'fitness',
  'beauty',
  'education',
  'business',
  'entertainment',
]);

export type PhoneNumber = z.infer<typeof phoneNumberSchema>;
export type UUID = z.infer<typeof uuidSchema>;
export type PaginationParams = z.infer<typeof paginationSchema>;
export type DateRange = z.infer<typeof dateRangeSchema>;
export type AgeRange = z.infer<typeof ageRangeSchema>;
export type Interest = z.infer<typeof interestSchema>;

