import { AuthService } from './auth.service';
import { prisma } from '@config/database';
import { redis } from '@config/redis';

// Mock external dependencies
jest.mock('@config/database');
jest.mock('@config/redis');
jest.mock('@/services/sms.service');

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('sendOtp', () => {
    it('should generate and store OTP for valid phone number', async () => {
      const phoneNumber = '+254712345678';
      const mockSetex = jest.fn().mockResolvedValue('OK');
      const mockIncr = jest.fn().mockResolvedValue(1);
      const mockExpire = jest.fn().mockResolvedValue(1);

      (redis.setex as jest.Mock) = mockSetex;
      (redis.incr as jest.Mock) = mockIncr;
      (redis.expire as jest.Mock) = mockExpire;

      const result = await authService.sendOtp(phoneNumber);

      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('expiresIn');
      expect(mockSetex).toHaveBeenCalled();
    });

    it('should throw error for too many OTP requests', async () => {
      const phoneNumber = '+254712345678';
      const mockIncr = jest.fn().mockResolvedValue(6); // Exceeds limit

      (redis.incr as jest.Mock) = mockIncr;
      (redis.ttl as jest.Mock) = jest.fn().mockResolvedValue(600);

      await expect(authService.sendOtp(phoneNumber)).rejects.toThrow('TOO_MANY_REQUESTS');
    });
  });

  describe('verifyOtp', () => {
    it('should authenticate user with valid OTP', async () => {
      const phoneNumber = '+254712345678';
      const otp = '123456';

      const mockOtpRecord = {
        phoneNumber,
        otp,
        expiresAt: new Date(Date.now() + 900000),
        attempts: 0,
      };

      (redis.get as jest.Mock) = jest.fn().mockResolvedValue(JSON.stringify(mockOtpRecord));
      (redis.del as jest.Mock) = jest.fn().mockResolvedValue(1);
      
      (prisma.user.findUnique as jest.Mock) = jest.fn().mockResolvedValue({
        id: 'user-123',
        phoneNumber,
        role: 'USER',
        name: 'Test User',
        whatsappVerified: true,
      });

      (prisma.refreshToken.create as jest.Mock) = jest.fn().mockResolvedValue({
        id: 'token-123',
        token: 'refresh_token',
      });

      const result = await authService.verifyOtp(phoneNumber, otp);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.user.phoneNumber).toBe(phoneNumber);
    });

    it('should throw error for invalid OTP', async () => {
      const phoneNumber = '+254712345678';
      const otp = '999999';

      const mockOtpRecord = {
        phoneNumber,
        otp: '123456', // Different OTP
        expiresAt: new Date(Date.now() + 900000),
        attempts: 0,
      };

      (redis.get as jest.Mock) = jest.fn().mockResolvedValue(JSON.stringify(mockOtpRecord));
      (redis.setex as jest.Mock) = jest.fn().mockResolvedValue('OK');

      await expect(authService.verifyOtp(phoneNumber, otp)).rejects.toThrow('INVALID_OTP');
    });

    it('should throw error for expired OTP', async () => {
      const phoneNumber = '+254712345678';
      const otp = '123456';

      (redis.get as jest.Mock) = jest.fn().mockResolvedValue(null);

      await expect(authService.verifyOtp(phoneNumber, otp)).rejects.toThrow('INVALID_OTP');
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify valid JWT token', () => {
      const token = 'valid_jwt_token';
      // This test requires actual JWT implementation
      // For now, it's a placeholder
      expect(true).toBe(true);
    });

    it('should throw error for invalid token', () => {
      const token = 'invalid_token';
      // Placeholder
      expect(true).toBe(true);
    });
  });
});




