// Common types used across the application

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    nextCursor?: string;
    hasMore?: boolean;
    timestamp?: string;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface PaginationParams {
  cursor?: string;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
}

export interface JWTPayload {
  userId: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface RequestUser {
  userId: string;
  role: string;
  phoneNumber: string;
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
      requestId?: string;
    }
  }
}

