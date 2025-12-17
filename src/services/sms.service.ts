import { env } from '@config/env';
import { logger } from '@config/logger';
import { AppError } from '@shared/errors/app-error';

/**
 * SMS Service
 * Handles sending SMS via Africa's Talking API
 */
export class SmsService {
  private apiKey: string;
  private username: string;
  private baseUrl = 'https://api.africastalking.com/version1';

  constructor() {
    this.apiKey = process.env.AFRICAS_TALKING_API_KEY || '';
    this.username = process.env.AFRICAS_TALKING_USERNAME || '';
  }

  /**
   * Send SMS
   */
  async sendSms(to: string, message: string): Promise<void> {
    // In development mode, just log the SMS
    if (env.NODE_ENV === 'development') {
      logger.info({ to, message }, '📱 SMS (DEV MODE)');
      console.log(`\n📱 SMS to ${to}: ${message}\n`);
      return;
    }

    // Check if API credentials are configured
    if (!this.apiKey || !this.username) {
      logger.warn('Africa\'s Talking API credentials not configured. Skipping SMS.');
      return;
    }

    try {
      const response = await fetch(`${this.baseUrl}/messaging`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          'apiKey': this.apiKey,
        },
        body: new URLSearchParams({
          username: this.username,
          to,
          message,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.SMSMessageData.Recipients[0].status !== 'Success') {
        throw new Error(data.SMSMessageData.Recipients[0].statusCode || 'SMS sending failed');
      }

      logger.info({ to }, 'SMS sent successfully');
    } catch (error) {
      logger.error({ error, to }, 'Failed to send SMS');
      throw new AppError('SMS_FAILED', 'Failed to send SMS', 500);
    }
  }

  /**
   * Send OTP SMS
   */
  async sendOtp(phoneNumber: string, otp: string): Promise<void> {
    const message = `Your AdstatMe verification code is: ${otp}. Valid for 15 minutes.`;
    await this.sendSms(phoneNumber, message);
  }

  /**
   * Send welcome SMS
   */
  async sendWelcome(phoneNumber: string, name: string): Promise<void> {
    const message = `Welcome to AdstatMe, ${name}! Start earning money from your WhatsApp Status. Get your first campaign now!`;
    await this.sendSms(phoneNumber, message);
  }

  /**
   * Send payout notification
   */
  async sendPayoutNotification(phoneNumber: string, amount: string, method: string): Promise<void> {
    const message = `Your payout of $${amount} via ${method} is being processed. You'll receive it shortly.`;
    await this.sendSms(phoneNumber, message);
  }

  /**
   * Send post verification notification
   */
  async sendPostVerified(phoneNumber: string, earnings: string): Promise<void> {
    const message = `Your post has been verified! You earned $${earnings}. Request payout anytime.`;
    await this.sendSms(phoneNumber, message);
  }
}

// Export singleton instance
export const smsService = new SmsService();




