import { Request, Response, NextFunction } from 'express';
import { AuthService } from '@modules/auth/auth.service';
import { AppError } from '@shared/errors/app-error';
import { prisma } from '@config/database';
import type { UserRole } from '@prisma/client';

const authService = new AuthService();

/**
 * Middleware to authenticate requests using JWT
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('UNAUTHORIZED', 'No token provided', 401);
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token
    const payload = authService.verifyAccessToken(token);
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        phoneNumber: true,
        role: true,
        isBanned: true,
      },
    });

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'User not found', 401);
    }

    if (user.isBanned) {
      throw new AppError('FORBIDDEN', 'Account has been banned', 403);
    }

    // Attach user to request
    req.user = {
      userId: user.id,
      role: user.role,
      phoneNumber: user.phoneNumber,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to authorize requests based on user role
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
      }

      if (!allowedRoles.includes(req.user.role as UserRole)) {
        throw new AppError(
          'FORBIDDEN',
          'You do not have permission to access this resource',
          403
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Optional authentication - does not throw error if no token
 */
export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const payload = authService.verifyAccessToken(token);
      
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          phoneNumber: true,
          role: true,
          isBanned: true,
        },
      });

      if (user && !user.isBanned) {
        req.user = {
          userId: user.id,
          role: user.role,
          phoneNumber: user.phoneNumber,
        };
      }
    }

    next();
  } catch (error) {
    // Ignore auth errors for optional authentication
    next();
  }
};




