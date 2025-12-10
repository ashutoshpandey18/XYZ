import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import * as nodemailer from 'nodemailer';
import { Transporter, SentMessageInfo } from 'nodemailer';
import * as crypto from 'crypto';

export interface EmailDeliveryResult {
  messageId: string;
  accepted: string[];
  rejected: string[];
  response: string;
  success: boolean;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-32-character-secret-key!!'; // Must be 32 chars
  private readonly ENCRYPTION_ALGORITHM = 'aes-256-cbc';

  constructor(private readonly prisma: PrismaService) {}

  /**
   * AES-256 Decrypt SMTP password
   */
  private decrypt(encryptedText: string): string {
    try {
      const parts = encryptedText.split(':');
      const iv = Buffer.from(parts.shift()!, 'hex');
      const encrypted = Buffer.from(parts.join(':'), 'hex');
      const key = Buffer.from(this.ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));

      const decipher = crypto.createDecipheriv(this.ENCRYPTION_ALGORITHM, key, iv);
      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      return decrypted.toString();
    } catch (error) {
      this.logger.error('Failed to decrypt SMTP password', error);
      throw new InternalServerErrorException('Email configuration error');
    }
  }

  /**
   * AES-256 Encrypt SMTP password (for admin settings)
   */
  encrypt(text: string): string {
    const key = Buffer.from(this.ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.ENCRYPTION_ALGORITHM, key, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  /**
   * Get Nodemailer transporter from database EmailSettings
   * Enhanced with connection validation and better error handling
   */
  private async getTransporter(): Promise<Transporter> {
    const settings = await this.prisma.emailSettings.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!settings) {
      this.logger.error('No active email settings found in database');
      throw new InternalServerErrorException('Email system not configured');
    }

    this.logger.log(`📧 Loading email settings: ${settings.smtpHost}:${settings.smtpPort} (${settings.smtpUser})`);

    const decryptedPassword = this.decrypt(settings.smtpPass);

    // Gmail-specific optimized configuration
    const isGmail = settings.smtpHost.includes('gmail.com');

    const transportConfig: any = {
      host: settings.smtpHost,
      port: settings.smtpPort,
      secure: settings.smtpPort === 465, // true for 465, false for 587
      auth: {
        user: settings.smtpUser,
        pass: decryptedPassword,
      },
      // Connection timeout and retry settings
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 5000,
      socketTimeout: 15000,
      // Gmail-specific optimizations
      ...(isGmail && {
        service: 'gmail',
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        rateDelta: 1000,
        rateLimit: 5,
      }),
      // TLS settings for better compatibility
      tls: {
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2',
      },
      logger: false,
      debug: process.env.NODE_ENV === 'development',
    };

    const transporter = nodemailer.createTransport(transportConfig);

    // Verify connection
    try {
      await transporter.verify();
      this.logger.log(`✅ SMTP connection verified successfully`);
    } catch (error) {
      this.logger.error(`❌ SMTP connection failed: ${error.message}`);
      this.logger.error(`🔍 Check credentials for ${settings.smtpUser}`);
      throw new InternalServerErrorException(
        `Email server connection failed. Please verify SMTP credentials.`
      );
    }

    return transporter;
  }

  /**
   * Send verification email to user
   */
  async sendVerificationEmail(email: string, token: string): Promise<void> {
    try {
      const transporter = await this.getTransporter();
      const settings = await this.prisma.emailSettings.findFirst({
        where: { isActive: true },
      });

      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

      await transporter.sendMail({
        from: `"${settings!.fromName}" <${settings!.fromEmail}>`,
        to: email,
        subject: 'Verify Your Email Address',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Email Verification</h2>
            <p>Thank you for registering! Please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}"
                 style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Verify Email
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${verificationUrl}">${verificationUrl}</a>
            </p>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">
              This link will expire in 24 hours. If you didn't request this, please ignore this email.
            </p>
          </div>
        `,
      });

      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}`, error);
      throw new InternalServerErrorException('Failed to send verification email');
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    try {
      const transporter = await this.getTransporter();
      const settings = await this.prisma.emailSettings.findFirst({
        where: { isActive: true },
      });

      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

      await transporter.sendMail({
        from: `"${settings!.fromName}" <${settings!.fromEmail}>`,
        to: email,
        subject: 'Password Reset Request',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Reset</h2>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}"
                 style="background-color: #DC2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${resetUrl}">${resetUrl}</a>
            </p>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">
              This link will expire in 1 hour. If you didn't request this, please ignore this email and your password will remain unchanged.
            </p>
          </div>
        `,
      });

      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}`, error);
      throw new InternalServerErrorException('Failed to send password reset email');
    }
  }

  /**
   * Send college email issued notification with credentials
   * Returns delivery info for logging
   */
  async sendCollegeEmailIssued(
    recipientEmail: string,
    studentName: string,
    collegeEmail: string,
    temporaryPassword: string,
  ): Promise<EmailDeliveryResult> {
    try {
      this.logger.log(`📧 Preparing to send college email notification to ${recipientEmail}`);

      const transporter = await this.getTransporter();
      const settings = await this.prisma.emailSettings.findFirst({
        where: { isActive: true },
      });

      if (!settings) {
        throw new InternalServerErrorException('Email settings not configured');
      }

      const mailOptions = {
        from: `"${settings.fromName}" <${settings.fromEmail}>`,
        to: recipientEmail,
        subject: '🎉 Your College Email Has Been Issued!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
            <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color: #10B981; margin-top: 0;">Congratulations, ${studentName}! 🎓</h2>
              <p style="color: #333; font-size: 16px;">Your college email has been successfully issued and is ready to use.</p>

              <div style="background-color: #EFF6FF; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #1E40AF; margin-top: 0;">Your Credentials</h3>
                <p style="margin: 10px 0;">
                  <strong>Email:</strong> <code style="background-color: #DBEAFE; padding: 5px 10px; border-radius: 4px; color: #1E40AF; font-size: 14px;">${collegeEmail}</code>
                </p>
                <p style="margin: 10px 0;">
                  <strong>Temporary Password:</strong> <code style="background-color: #DBEAFE; padding: 5px 10px; border-radius: 4px; color: #1E40AF; font-size: 14px;">${temporaryPassword}</code>
                </p>
              </div>

              <div style="background-color: #FEF3C7; padding: 15px; border-left: 4px solid #F59E0B; border-radius: 4px; margin: 20px 0;">
                <p style="margin: 0; color: #92400E; font-size: 14px;">
                  <strong>⚠️ Important Security Notice:</strong> Please change your password immediately after your first login. Do not share your credentials with anyone.
                </p>
              </div>

              <div style="margin-top: 30px; padding: 20px; background-color: #F3F4F6; border-radius: 8px;">
                <h4 style="color: #374151; margin-top: 0;">Next Steps:</h4>
                <ol style="color: #4B5563; margin: 10px 0; padding-left: 20px;">
                  <li style="margin: 8px 0;">Use your college email to access campus services</li>
                  <li style="margin: 8px 0;">Change your password on first login</li>
                  <li style="margin: 8px 0;">Set up two-factor authentication if available</li>
                  <li style="margin: 8px 0;">Configure your email client or mobile device</li>
                </ol>
              </div>

              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
                <p style="color: #6B7280; font-size: 13px; margin: 5px 0;">
                  If you have any questions or issues accessing your email, please contact the IT support desk.
                </p>
                <p style="color: #6B7280; font-size: 13px; margin: 5px 0;">
                  This is an automated message. Please do not reply to this email.
                </p>
                <p style="color: #9CA3AF; font-size: 12px; margin-top: 15px;">
                  Sent on ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}
                </p>
              </div>
            </div>
          </div>
        `,
      };

      const info: SentMessageInfo = await transporter.sendMail(mailOptions);

      this.logger.log(`✅ College email notification sent successfully`);
      this.logger.log(`📨 Message ID: ${info.messageId}`);
      this.logger.log(`✅ Accepted: ${info.accepted.join(', ')}`);

      if (info.rejected && info.rejected.length > 0) {
        this.logger.warn(`⚠️ Rejected: ${info.rejected.join(', ')}`);
      }

      return {
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected || [],
        response: info.response,
        success: info.accepted && info.accepted.length > 0,
      };
    } catch (error) {
      this.logger.error(`❌ Failed to send college email notification to ${recipientEmail}`, error.stack);
      throw new InternalServerErrorException(`Email delivery failed: ${error.message}`);
    }
  }

  /**
   * Send test email to verify SMTP configuration
   */
  async sendTestEmail(recipientEmail: string): Promise<EmailDeliveryResult> {
    try {
      this.logger.log(`🧪 Sending test email to ${recipientEmail}`);

      const transporter = await this.getTransporter();
      const settings = await this.prisma.emailSettings.findFirst({
        where: { isActive: true },
      });

      if (!settings) {
        throw new InternalServerErrorException('Email settings not configured');
      }

      const mailOptions = {
        from: `"${settings.fromName}" <${settings.fromEmail}>`,
        to: recipientEmail,
        subject: '✅ Test Email - SMTP Configuration Working',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #10B981; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
              <h2 style="margin: 0;">✅ SMTP Test Successful!</h2>
            </div>
            <div style="background-color: white; padding: 30px; border: 1px solid #E5E7EB; border-radius: 0 0 8px 8px;">
              <p style="color: #333; font-size: 16px;">Your email configuration is working correctly.</p>
              <div style="background-color: #F3F4F6; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 5px 0; color: #4B5563;"><strong>SMTP Host:</strong> ${settings.smtpHost}</p>
                <p style="margin: 5px 0; color: #4B5563;"><strong>SMTP Port:</strong> ${settings.smtpPort}</p>
                <p style="margin: 5px 0; color: #4B5563;"><strong>From Email:</strong> ${settings.fromEmail}</p>
                <p style="margin: 5px 0; color: #4B5563;"><strong>Test Time:</strong> ${new Date().toLocaleString()}</p>
              </div>
              <p style="color: #6B7280; font-size: 14px;">
                You can now use this configuration to send emails from your application.
              </p>
            </div>
          </div>
        `,
      };

      const info: SentMessageInfo = await transporter.sendMail(mailOptions);

      this.logger.log(`✅ Test email sent successfully`);
      this.logger.log(`📨 Message ID: ${info.messageId}`);

      return {
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected || [],
        response: info.response,
        success: true,
      };
    } catch (error) {
      this.logger.error(`❌ Test email failed`, error.stack);
      throw new InternalServerErrorException(`Test email failed: ${error.message}`);
    }
  }
}
