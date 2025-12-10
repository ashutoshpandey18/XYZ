const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
require('dotenv').config();

const prisma = new PrismaClient();

// AES-256 Encryption (matching EmailService)
function encrypt(text) {
  const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-32-character-secret-key!!';
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

async function updateEmailSettings() {
  try {
    console.log('\n📧 Updating Email Settings with Gmail Credentials...\n');

    // Get credentials from .env
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const fromEmail = process.env.FROM_EMAIL || smtpUser;
    const fromName = process.env.FROM_NAME || 'College Email System';

    if (!smtpUser || !smtpPass) {
      console.error('❌ SMTP_USER and SMTP_PASS must be set in .env file!');
      console.log('\n📝 Please update your .env file with:');
      console.log('   SMTP_USER=your-email@gmail.com');
      console.log('   SMTP_PASS=your-gmail-app-password');
      process.exit(1);
    }

    console.log(`📋 Configuration:`);
    console.log(`   Host: ${smtpHost}`);
    console.log(`   Port: ${smtpPort}`);
    console.log(`   User: ${smtpUser}`);
    console.log(`   From: ${fromEmail}`);
    console.log(`   Name: ${fromName}`);
    console.log('');

    // Encrypt password
    const encryptedPassword = encrypt(smtpPass);

    // Mark all existing settings as inactive
    await prisma.emailSettings.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Create new settings
    const newSettings = await prisma.emailSettings.create({
      data: {
        smtpHost,
        smtpPort,
        smtpUser,
        smtpPass: encryptedPassword,
        fromEmail,
        fromName,
        isActive: true,
      },
    });

    console.log('✅ Email settings updated successfully!');
    console.log(`📧 Active configuration: ${newSettings.smtpUser}`);
    console.log(`🔒 Password encrypted and stored securely`);
    console.log(`🆔 Settings ID: ${newSettings.id}`);
    console.log('');

    // Test decryption
    const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-32-character-secret-key!!';
    const parts = encryptedPassword.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const encrypted = Buffer.from(parts.join(':'), 'hex');
    const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    const decryptedPass = decrypted.toString();

    console.log('🔍 Encryption verification:');
    console.log(`   Original password matches: ${decryptedPass === smtpPass ? '✅' : '❌'}`);
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

updateEmailSettings();
