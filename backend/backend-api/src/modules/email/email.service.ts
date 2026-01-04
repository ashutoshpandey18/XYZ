import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import * as nodemailer from 'nodemailer';
import { Transporter, SentMessageInfo } from 'nodemailer';
import * as crypto from 'crypto';
import { Resend } from 'resend';

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
  private readonly ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-32-character-secret-key!!';
  private readonly ENCRYPTION_ALGORITHM = 'aes-256-cbc';
  private resend: Resend | null = null;

  constructor(private readonly prisma: PrismaService) {
    // Initialize Resend if API key is available
    if (process.env.RESEND_API_KEY) {
      this.resend = new Resend(process.env.RESEND_API_KEY);
      this.logger.log('✅ Resend API initialized');
    } else {
      this.logger.log('📧 Using SMTP for email delivery (no RESEND_API_KEY found)');
    }
  }

  /**
   * Check if Resend is available
   */
  private useResend(): boolean {
    return this.resend !== null;
  }

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
   * AES-256 Encrypt SMTP password
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
   * Get email settings from database
   */
  private async getEmailSettings() {
    const settings = await this.prisma.emailSettings.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!settings) {
      this.logger.error('No active email settings found');
      throw new InternalServerErrorException('Email system not configured');
    }

    return settings;
  }

  /**
   * Get SMTP transporter (fallback when Resend not available)
   */
  private async getTransporter(): Promise<Transporter> {
    const settings = await this.getEmailSettings();

    this.logger.log(`📧 Loading SMTP: ${settings.smtpHost}:${settings.smtpPort}`);

    const decryptedPassword = this.decrypt(settings.smtpPass);
    const isGmail = settings.smtpHost.includes('gmail.com');

    const transportConfig: any = {
      host: settings.smtpHost,
      port: settings.smtpPort,
      secure: settings.smtpPort === 465,
      auth: {
        user: settings.smtpUser,
        pass: decryptedPassword,
      },
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 15000,
      ...(isGmail && {
        service: 'gmail',
        pool: true,
        maxConnections: 5,
      }),
      tls: {
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2',
      },
    };

    const transporter = nodemailer.createTransport(transportConfig);

    try {
      await transporter.verify();
      this.logger.log('✅ SMTP connection verified');
    } catch (error) {
      this.logger.error(`❌ SMTP connection failed: ${error.message}`);
      throw new InternalServerErrorException('Email server connection failed');
    }

    return transporter;
  }

  /**
   * Send email using Resend API
   */
  private async sendWithResend(
    to: string,
    subject: string,
    html: string,
  ): Promise<EmailDeliveryResult> {
    if (!this.resend) {
      throw new InternalServerErrorException('Resend not configured');
    }

    const settings = await this.getEmailSettings();

    // Resend requires verified domain or uses onboarding@resend.dev for testing
    const fromEmail = `${settings.fromName} <onboarding@resend.dev>`;

    this.logger.log(`📧 Sending via Resend to ${to}`);

    try {
      const { data, error } = await this.resend.emails.send({
        from: fromEmail,
        to: [to],
        subject,
        html,
      });

      if (error) {
        this.logger.error(`❌ Resend error: ${error.message}`);
        throw new InternalServerErrorException(`Email failed: ${error.message}`);
      }

      this.logger.log(`✅ Email sent via Resend: ${data?.id}`);

      return {
        messageId: data?.id || '',
        accepted: [to],
        rejected: [],
        response: 'Sent via Resend',
        success: true,
      };
    } catch (error) {
      this.logger.error(`❌ Resend send failed: ${error.message}`);
      throw new InternalServerErrorException(`Email delivery failed: ${error.message}`);
    }
  }

  /**
   * Send email using SMTP
   */
  private async sendWithSMTP(
    to: string,
    subject: string,
    html: string,
  ): Promise<EmailDeliveryResult> {
    const transporter = await this.getTransporter();
    const settings = await this.getEmailSettings();

    const mailOptions = {
      from: `"${settings.fromName}" <${settings.fromEmail}>`,
      to,
      subject,
      html,
    };

    const info: SentMessageInfo = await transporter.sendMail(mailOptions);

    this.logger.log(`✅ Email sent via SMTP: ${info.messageId}`);

    return {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected || [],
      response: info.response,
      success: info.accepted && info.accepted.length > 0,
    };
  }

  /**
   * Send email - automatically selects Resend or SMTP
   */
  private async sendEmail(
    to: string,
    subject: string,
    html: string,
  ): Promise<EmailDeliveryResult> {
    if (this.useResend()) {
      return this.sendWithResend(to, subject, html);
    }
    return this.sendWithSMTP(to, subject, html);
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    const html = `
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
          This link will expire in 24 hours.
        </p>
      </div>
    `;

    try {
      await this.sendEmail(email, 'Verify Your Email Address', html);
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
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const html = `
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
          If the button doesn't work, copy and paste this link:<br>
          <a href="${resetUrl}">${resetUrl}</a>
        </p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          This link will expire in 1 hour.
        </p>
      </div>
    `;

    try {
      await this.sendEmail(email, 'Password Reset Request', html);
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}`, error);
      throw new InternalServerErrorException('Failed to send password reset email');
    }
  }

  /**
   * Send college email issued notification
   */
  async sendCollegeEmailIssued(
    recipientEmail: string,
    studentName: string,
    collegeEmail: string,
    temporaryPassword: string,
  ): Promise<EmailDeliveryResult> {
    this.logger.log(`📧 Sending college email notification to ${recipientEmail}`);

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #10B981; margin-top: 0;">Congratulations, ${studentName}! 🎓</h2>
          <p style="color: #333; font-size: 16px;">Your college email has been successfully issued and is ready to use.</p>

          <div style="background-color: #EFF6FF; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1E40AF; margin-top: 0;">Your Credentials</h3>
            <p style="margin: 10px 0;">
              <strong>Email:</strong> <code style="background-color: #DBEAFE; padding: 5px 10px; border-radius: 4px; color: #1E40AF;">${collegeEmail}</code>
            </p>
            <p style="margin: 10px 0;">
              <strong>Temporary Password:</strong> <code style="background-color: #DBEAFE; padding: 5px 10px; border-radius: 4px; color: #1E40AF;">${temporaryPassword}</code>
            </p>
          </div>

          <div style="background-color: #FEF3C7; padding: 15px; border-left: 4px solid #F59E0B; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0; color: #92400E; font-size: 14px;">
              <strong>⚠️ Important:</strong> Please change your password immediately after your first login.
            </p>
          </div>

          <div style="margin-top: 30px; padding: 20px; background-color: #F3F4F6; border-radius: 8px;">
            <h4 style="color: #374151; margin-top: 0;">Next Steps:</h4>
            <ol style="color: #4B5563; margin: 10px 0; padding-left: 20px;">
              <li style="margin: 8px 0;">Use your college email to access campus services</li>
              <li style="margin: 8px 0;">Change your password on first login</li>
              <li style="margin: 8px 0;">Set up two-factor authentication</li>
            </ol>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
            <p style="color: #6B7280; font-size: 13px;">
              Contact IT support if you have any questions.
            </p>
            <p style="color: #9CA3AF; font-size: 12px; margin-top: 15px;">
              Sent on ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}
            </p>
          </div>
        </div>
      </div>
    `;

    try {
      const result = await this.sendEmail(
        recipientEmail,
        '🎉 Your College Email Has Been Issued!',
        html,
      );
      this.logger.log(`✅ College email notification sent to ${recipientEmail}`);
      return result;
    } catch (error) {
      this.logger.error(`❌ Failed to send to ${recipientEmail}: ${error.message}`);
      throw new InternalServerErrorException(`Email delivery failed: ${error.message}`);
    }
  }

  /**
   * Send test email
   */
  async sendTestEmail(recipientEmail: string): Promise<EmailDeliveryResult> {
    this.logger.log(`🧪 Sending test email to ${recipientEmail}`);

    const settings = await this.getEmailSettings();
    const provider = this.useResend() ? 'Resend API' : 'SMTP';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #10B981; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0;">✅ Email Test Successful!</h2>
        </div>
        <div style="background-color: white; padding: 30px; border: 1px solid #E5E7EB; border-radius: 0 0 8px 8px;">
          <p style="color: #333; font-size: 16px;">Your email configuration is working correctly.</p>
          <div style="background-color: #F3F4F6; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 5px 0; color: #4B5563;"><strong>Provider:</strong> ${provider}</p>
            <p style="margin: 5px 0; color: #4B5563;"><strong>From:</strong> ${settings.fromEmail}</p>
            <p style="margin: 5px 0; color: #4B5563;"><strong>Test Time:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p style="color: #6B7280; font-size: 14px;">
            You can now send emails from your application.
          </p>
        </div>
      </div>
    `;

    try {
      const result = await this.sendEmail(
        recipientEmail,
        '✅ Test Email - Configuration Working',
        html,
      );
      this.logger.log(`✅ Test email sent to ${recipientEmail}`);
      return result;
    } catch (error) {
      this.logger.error(`❌ Test email failed: ${error.message}`);
      throw new InternalServerErrorException(`Test email failed: ${error.message}`);
    }
  }
}
