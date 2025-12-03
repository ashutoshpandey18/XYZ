import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailSenderService {
  private resend?: Resend;
  private nodemailerTransporter?: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    console.log('\n🔍 === EMAIL SERVICE INITIALIZATION DEBUG ===');

    // Debug: Check what ConfigService sees
    const resendApiKey = this.configService.get<string>('RESEND_API_KEY');
    console.log('📋 RESEND_API_KEY from ConfigService:', resendApiKey ? `${resendApiKey.substring(0, 10)}...` : 'undefined');
    console.log('📋 RESEND_API_KEY from process.env:', process.env.RESEND_API_KEY ? `${process.env.RESEND_API_KEY.substring(0, 10)}...` : 'undefined');

    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const fromEmail = this.configService.get<string>('FROM_EMAIL');

    console.log('📋 SMTP_HOST from ConfigService:', smtpHost || 'undefined');
    console.log('📋 FROM_EMAIL from ConfigService:', fromEmail || 'undefined');

    // Show all environment variables (filtered for security)
    const envKeys = Object.keys(process.env).filter(key =>
      key.includes('EMAIL') || key.includes('RESEND') || key.includes('SMTP') || key.includes('FROM')
    );
    console.log('📋 Email-related env keys available:', envKeys);

    if (resendApiKey) {
      // Use Resend ONLY when API key is provided
      this.resend = new Resend(resendApiKey);
      console.log('✅ Email service initialized with Resend');
    } else if (smtpHost && smtpUser && this.configService.get<string>('SMTP_PASS')) {
      // Fallback to SMTP only if credentials are provided
      this.nodemailerTransporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(this.configService.get<string>('SMTP_PORT') || '587'),
        secure: false,
        auth: {
          user: smtpUser,
          pass: this.configService.get<string>('SMTP_PASS'),
        },
      });
      console.log('✅ Email service initialized with SMTP');
    } else {
      console.warn('⚠️ No email provider configured. Set RESEND_API_KEY or SMTP credentials.');
    }

    console.log('🔍 === END EMAIL SERVICE DEBUG ===\n');
  }

  /**
   * Send college email credentials to student
   */
  async sendCollegeEmailCredentials(
    studentEmail: string,
    studentName: string,
    collegeEmail: string,
    tempPassword: string,
  ): Promise<void> {
    if (!this.resend && !this.nodemailerTransporter) {
      throw new InternalServerErrorException(
        'Email service not configured. Set RESEND_API_KEY or SMTP credentials in .env'
      );
    }

    const subject = '🎓 Your College Email Account Has Been Issued';
    const htmlContent = this.generateEmailTemplate(
      studentName,
      collegeEmail,
      tempPassword,
    );

    try {
      if (this.resend) {
        await this.sendWithResend(studentEmail, subject, htmlContent);
      } else if (this.nodemailerTransporter) {
        await this.sendWithNodeMailer(studentEmail, subject, htmlContent);
      }
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      throw new InternalServerErrorException(
        `Failed to send credentials email to ${studentEmail}: ${error.message}`
      );
    }
  }

  /**
   * Send email using Resend API
   */
  private async sendWithResend(
    to: string,
    subject: string,
    html: string,
  ): Promise<void> {
    if (!this.resend) {
      throw new InternalServerErrorException('Resend client not initialized');
    }

    const fromEmail = this.configService.get<string>('FROM_EMAIL') || 'noreply@college.edu';
    const result = await this.resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
    });
    console.log(`📧 Email sent via Resend to ${to}`);
  }

  /**
   * Send email using NodeMailer SMTP
   */
  private async sendWithNodeMailer(
    to: string,
    subject: string,
    html: string,
  ): Promise<void> {
    if (!this.nodemailerTransporter) {
      throw new InternalServerErrorException('NodeMailer client not initialized');
    }

    const fromEmail = this.configService.get<string>('FROM_EMAIL') || '"College Admin" <noreply@college.edu>';
    await this.nodemailerTransporter.sendMail({
      from: fromEmail,
      to,
      subject,
      html,
    });
    console.log(`📧 Email sent via SMTP to ${to}`);
  }

  /**
   * Generate professional email template
   */
  private generateEmailTemplate(
    name: string,
    collegeEmail: string,
    tempPassword: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px 10px 0 0;
            text-align: center;
          }
          .content {
            background: #f9fafb;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .credentials {
            background: white;
            padding: 20px;
            border-left: 4px solid #667eea;
            margin: 20px 0;
          }
          .credential-item {
            margin: 10px 0;
          }
          .credential-label {
            font-weight: bold;
            color: #667eea;
          }
          .credential-value {
            font-family: 'Courier New', monospace;
            background: #e5e7eb;
            padding: 8px 12px;
            border-radius: 4px;
            display: inline-block;
            margin-top: 5px;
          }
          .warning {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            color: #6b7280;
            font-size: 12px;
            margin-top: 30px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎓 College Email Issued</h1>
        </div>
        <div class="content">
          <p>Dear <strong>${name}</strong>,</p>

          <p>Congratulations! Your official college email account has been successfully created.</p>

          <div class="credentials">
            <div class="credential-item">
              <div class="credential-label">📧 College Email:</div>
              <div class="credential-value">${collegeEmail}</div>
            </div>

            <div class="credential-item">
              <div class="credential-label">🔑 Temporary Password:</div>
              <div class="credential-value">${tempPassword}</div>
            </div>
          </div>

          <div class="warning">
            <strong>⚠️ Important Security Instructions:</strong>
            <ul>
              <li>Please change your password immediately after first login</li>
              <li>Never share your password with anyone</li>
              <li>Use a strong, unique password</li>
              <li>Enable two-factor authentication if available</li>
            </ul>
          </div>

          <p><strong>Next Steps:</strong></p>
          <ol>
            <li>Visit the college email portal</li>
            <li>Login using the credentials above</li>
            <li>Change your temporary password</li>
            <li>Set up your profile and recovery options</li>
          </ol>

          <p>If you experience any issues accessing your account, please contact IT support.</p>

          <p>Best regards,<br><strong>College Administration</strong></p>
        </div>

        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>&copy; 2024 College Email System. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
  }
}
