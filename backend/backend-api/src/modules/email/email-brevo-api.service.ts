import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import axios from 'axios';

export interface EmailDeliveryResult {
  messageId: string;
  accepted: string[];
  rejected: string[];
  response: string;
  success: boolean;
}

@Injectable()
export class EmailBrevoApiService {
  private readonly logger = new Logger(EmailBrevoApiService.name);
  private readonly BREVO_API_KEY = process.env.BREVO_API_KEY || process.env.SMTP_PASS;

  constructor(private readonly prisma: PrismaService) {
    this.logger.log('📧 Using Brevo REST API for email delivery (Railway-compatible)');
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
   * Send email using Brevo REST API (no SMTP port blocking issues)
   */
  async sendEmail(
    to: string,
    subject: string,
    html: string,
  ): Promise<EmailDeliveryResult> {
    const settings = await this.getEmailSettings();

    this.logger.log(`📧 Sending email via Brevo REST API to ${to}`);

    if (!this.BREVO_API_KEY) {
      this.logger.error('❌ BREVO_API_KEY not set in environment variables');
      throw new InternalServerErrorException('Email API key not configured');
    }

    try {
      const response = await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender: {
            name: settings.fromName,
            email: settings.fromEmail,
          },
          to: [
            {
              email: to,
            },
          ],
          subject,
          htmlContent: html,
        },
        {
          headers: {
            'api-key': this.BREVO_API_KEY,
            'Content-Type': 'application/json',
            'accept': 'application/json',
          },
          timeout: 15000,
        },
      );

      this.logger.log(`✅ Email sent via Brevo API: ${response.data.messageId}`);

      return {
        messageId: response.data.messageId,
        accepted: [to],
        rejected: [],
        response: `Brevo API: ${response.status} ${response.statusText}`,
        success: true,
      };
    } catch (error) {
      this.logger.error(`❌ Brevo API failed: ${error.message}`);

      if (error.response) {
        this.logger.error(`Response status: ${error.response.status}`);
        this.logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
      }

      throw new InternalServerErrorException(
        `Email delivery failed: ${error.message}`,
      );
    }
  }

  /**
   * Send college email issued notification
   */
  async sendCollegeEmailIssued(
    to: string,
    studentName: string,
    collegeEmail: string,
    tempPassword: string,
  ): Promise<EmailDeliveryResult> {
    this.logger.log(`📧 Sending college email notification to ${to}`);

    const subject = '🎓 Your College Email Has Been Issued!';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { padding: 30px; }
          .credentials-box { background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .credential-item { margin: 15px 0; }
          .credential-label { font-weight: 600; color: #667eea; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
          .credential-value { font-size: 18px; color: #2d3748; font-weight: 700; font-family: 'Courier New', monospace; padding: 10px; background: white; border-radius: 5px; margin-top: 5px; border: 1px solid #e2e8f0; }
          .warning-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; font-weight: 600; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 College Email Issued!</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${studentName}</strong>,</p>
            <p>Congratulations! Your college email account has been successfully created and activated.</p>

            <div class="credentials-box">
              <h3 style="margin-top: 0; color: #667eea;">📧 Your Login Credentials</h3>
              <div class="credential-item">
                <div class="credential-label">College Email</div>
                <div class="credential-value">${collegeEmail}</div>
              </div>
              <div class="credential-item">
                <div class="credential-label">Temporary Password</div>
                <div class="credential-value">${tempPassword}</div>
              </div>
            </div>

            <div class="warning-box">
              <strong>⚠️ Important Security Notice:</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Please change your password immediately after first login</li>
                <li>Never share your credentials with anyone</li>
                <li>Use a strong, unique password</li>
              </ul>
            </div>

            <p>You can now use this email for:</p>
            <ul>
              <li>✅ Official college communications</li>
              <li>✅ Accessing student portals and resources</li>
              <li>✅ Receiving important announcements</li>
              <li>✅ Academic and administrative correspondence</li>
            </ul>

            <p style="margin-top: 30px;">If you have any questions or need assistance, please contact the IT Help Desk.</p>

            <p style="margin-top: 20px;">Best regards,<br><strong>College Email System Team</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>© ${new Date().getFullYear()} College Email System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(to, subject, html);
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(
    to: string,
    name: string,
    resetToken: string,
  ): Promise<EmailDeliveryResult> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    const subject = '🔐 Password Reset Request';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Password Reset Request</h2>
          <p>Hello ${name},</p>
          <p>We received a request to reset your password. Click the button below to reset it:</p>
          <p><a href="${resetUrl}" class="button">Reset Password</a></p>
          <p>Or copy and paste this link into your browser:</p>
          <p>${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(to, subject, html);
  }
}
