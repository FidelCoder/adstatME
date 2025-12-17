import jwt from 'jsonwebtoken';
import { prisma } from '@config/database';
import { redis } from '@config/redis';
import { env } from '@config/env';
import { logger } from '@config/logger';
import { AppError } from '@shared/errors/app-error';
import { smsService } from '@/services/sms.service';
import type { AuthResponse, AuthTokens, OtpRecord } from './auth.types';

export class AuthService {
  private readonly OTP_EXPIRY_MINUTES = 15;
  private readonly OTP_MAX_ATTEMPTS = 5;
  private readonly RATE_LIMIT_KEY_PREFIX = 'auth:ratelimit:';
  private readonly OTP_KEY_PREFIX = 'auth:otp:';

  /**
   * Generate a 6-digit OTP
   */
  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Check rate limiting for OTP requests
   */
  private async checkRateLimit(phoneNumber: string): Promise<void> {
    const key = `${this.RATE_LIMIT_KEY_PREFIX}${phoneNumber}`;
    const attempts = await redis.incr(key);
    
    if (attempts === 1) {
      // First attempt, set expiry
      await redis.expire(key, this.OTP_EXPIRY_MINUTES * 60);
    }
    
    if (attempts > this.OTP_MAX_ATTEMPTS) {
      const ttl = await redis.ttl(key);
      throw new AppError(
        'TOO_MANY_REQUESTS',
        `Too many OTP requests. Please try again in ${Math.ceil(ttl / 60)} minutes`,
        429
      );
    }
  }

  /**
   * Send OTP to user's phone number
   */
  async sendOtp(phoneNumber: string): Promise<{ message: string; expiresIn: number }> {
    // Check rate limiting
    await this.checkRateLimit(phoneNumber);

    // Generate OTP
    const otp = this.generateOtp();
    
    // Store OTP in Redis with expiry
    const otpKey = `${this.OTP_KEY_PREFIX}${phoneNumber}`;
    const otpRecord: OtpRecord = {
      phoneNumber,
      otp,
      expiresAt: new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000),
      attempts: 0,
    };
    
    await redis.setex(
      otpKey,
      this.OTP_EXPIRY_MINUTES * 60,
      JSON.stringify(otpRecord)
    );

    // Send SMS via Africa's Talking
    await smsService.sendOtp(phoneNumber, otp);

    return {
      message: 'OTP sent successfully',
      expiresIn: this.OTP_EXPIRY_MINUTES * 60,
    };
  }

  /**
   * Verify OTP and authenticate user
   */
  async verifyOtp(phoneNumber: string, otp: string): Promise<AuthResponse> {
    // Retrieve OTP record from Redis
    const otpKey = `${this.OTP_KEY_PREFIX}${phoneNumber}`;
    const otpRecordStr = await redis.get(otpKey);
    
    if (!otpRecordStr) {
      throw new AppError('INVALID_OTP', 'OTP has expired or is invalid', 401);
    }

    const otpRecord: OtpRecord = JSON.parse(otpRecordStr);
    
    // Increment attempt counter
    otpRecord.attempts += 1;
    
    if (otpRecord.attempts > 3) {
      await redis.del(otpKey);
      throw new AppError('TOO_MANY_ATTEMPTS', 'Too many failed attempts. Please request a new OTP', 429);
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      // Update attempts in Redis
      await redis.setex(
        otpKey,
        this.OTP_EXPIRY_MINUTES * 60,
        JSON.stringify(otpRecord)
      );
      throw new AppError('INVALID_OTP', 'Invalid OTP', 401);
    }

    // OTP is valid, delete from Redis
    await redis.del(otpKey);

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { phoneNumber },
      select: {
        id: true,
        phoneNumber: true,
        role: true,
        name: true,
        whatsappVerified: true,
      },
    });

    let isNewUser = false;

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          phoneNumber,
          whatsappVerified: true,
          lastActive: new Date(),
        },
        select: {
          id: true,
          phoneNumber: true,
          role: true,
          name: true,
          whatsappVerified: true,
        },
      });
      isNewUser = true;
      logger.info({ userId: user.id, phoneNumber }, 'New user created');
    } else {
      // Update last active
      await prisma.user.update({
        where: { id: user.id },
        data: { lastActive: new Date() },
      });
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.role);

    return {
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        role: user.role,
        name: user.name,
      },
      tokens,
      isNewUser,
    };
  }

  /**
   * Generate JWT access and refresh tokens
   */
  private async generateTokens(userId: string, role: string): Promise<AuthTokens> {
    // Generate access token
    const accessToken = jwt.sign(
      { userId, role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      { userId, role, type: 'refresh' },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
    );

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    // Verify refresh token
    let payload: any;
    try {
      payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
    } catch (error) {
      throw new AppError('INVALID_TOKEN', 'Invalid or expired refresh token', 401);
    }

    // Check if refresh token exists in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!storedToken) {
      throw new AppError('INVALID_TOKEN', 'Refresh token not found', 401);
    }

    // Check if token is expired
    if (storedToken.expiresAt < new Date()) {
      await prisma.refreshToken.delete({
        where: { token: refreshToken },
      });
      throw new AppError('INVALID_TOKEN', 'Refresh token has expired', 401);
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, isBanned: true },
    });

    if (!user || user.isBanned) {
      throw new AppError('UNAUTHORIZED', 'User not found or banned', 401);
    }

    // Delete old refresh token
    await prisma.refreshToken.delete({
      where: { token: refreshToken },
    });

    // Generate new tokens
    return this.generateTokens(user.id, user.role);
  }

  /**
   * Logout user by invalidating refresh token
   */
  async logout(refreshToken: string): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }

  /**
   * Verify JWT access token
   */
  verifyAccessToken(token: string): { userId: string; role: string } {
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as any;
      return {
        userId: payload.userId,
        role: payload.role,
      };
    } catch (error) {
      throw new AppError('INVALID_TOKEN', 'Invalid or expired access token', 401);
    }
  }
}

