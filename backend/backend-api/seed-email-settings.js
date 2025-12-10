/**
 * Email Settings Seed Script
 *
 * @description Initialize email configuration for the application
 * @usage node seed-email-settings.js
 *
 * Configuration:
 * - Updates .env file or uses environment variables
 * - Configures SMTP settings for email delivery
 * - Encrypts sensitive credentials using AES-256-CBC
 *
 * Environment Variables Required:
 * - GMAIL_USER: Gmail email address
 * - GMAIL_APP_PASSWORD: Gmail app-specific password
 * - ENCRYPTION_KEY: 32-character encryption key
 *
 * @author College Email SaaS Team
 * @version 1.0.0
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-32-character-secret-key!!';
const ENCRYPTION_ALGORITHM = 'aes-256-cbc';

/**
 * Encrypts sensitive data using AES-256-CBC encryption
 * @param {string} text - Plain text to encrypt
 * @returns {string} Encrypted text with IV prepended
 */
function encryptPassword(text) {
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);

  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Seeds email settings into the database
 */
async function seedEmailSettings() {
  try {
    console.log('\n[EMAIL SETUP] Initializing Email Configuration\n');

    const existingSettings = await prisma.emailSettings.findFirst({
      where: { isActive: true }
    });

    if (existingSettings) {
      console.log('[INFO] Email settings already exist\n');
      console.log('Current Configuration:');
      console.log(`   Host: ${existingSettings.smtpHost}`);
      console.log(`   Port: ${existingSettings.smtpPort}`);
      console.log(`   User: ${existingSettings.smtpUser}`);
      console.log(`   From: ${existingSettings.fromEmail}`);
      console.log(`   Name: ${existingSettings.fromName}\n`);
      return;
    }

    const gmailUser = process.env.GMAIL_USER || 'your-email@gmail.com';
    const gmailPassword = process.env.GMAIL_APP_PASSWORD || 'your-gmail-app-password-here';

    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.warn('[WARNING] Using default placeholder credentials\n');
    }

    const encryptedPassword = encryptPassword(gmailPassword);

    const settings = await prisma.emailSettings.create({
      data: {
        smtpHost: 'smtp.gmail.com',
        smtpPort: 465,
        smtpUser: gmailUser,
        smtpPass: encryptedPassword,
        fromEmail: gmailUser,
        fromName: 'College Email System',
        isActive: true
      }
    });

    console.log('[SUCCESS] Email settings created successfully\n');
    console.log('Configuration:');
    console.log(`   Host: ${settings.smtpHost}`);
    console.log(`   Port: ${settings.smtpPort}`);
    console.log(`   User: ${settings.smtpUser}`);
    console.log(`   From: ${settings.fromEmail}`);
    console.log(`   Name: ${settings.fromName}\n`);

    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.log('[IMPORTANT] Update .env file with:');
      console.log('   GMAIL_USER=your-email@gmail.com');
      console.log('   GMAIL_APP_PASSWORD=your-app-password');
      console.log('   ENCRYPTION_KEY=your-32-char-secret-key\n');
    }

  } catch (error) {
    console.error('\n[ERROR]', error.message, '\n');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedEmailSettings();
