const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
require('dotenv').config();

const prisma = new PrismaClient();

// Decrypt function (matching EmailService)
function decrypt(encryptedText) {
  const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-32-character-secret-key!!';
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts.shift(), 'hex');
  const encrypted = Buffer.from(parts.join(':'), 'hex');
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));

  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString();
}

async function testEmailSetup() {
  try {
    console.log('\n🧪 ======== EMAIL SETUP TEST ========\n');

    // Step 1: Check database settings
    console.log('📋 Step 1: Checking Database Settings...');
    const settings = await prisma.emailSettings.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!settings) {
      console.error('❌ No active email settings found in database!');
      process.exit(1);
    }

    console.log(`✅ Active settings found:`);
    console.log(`   Host: ${settings.smtpHost}`);
    console.log(`   Port: ${settings.smtpPort}`);
    console.log(`   User: ${settings.smtpUser}`);
    console.log(`   From: ${settings.fromEmail} (${settings.fromName})`);
    console.log('');

    // Step 2: Decrypt password
    console.log('🔓 Step 2: Decrypting Password...');
    let decryptedPassword;
    try {
      decryptedPassword = decrypt(settings.smtpPass);
      console.log(`✅ Password decrypted successfully (length: ${decryptedPassword.length})`);
      console.log('');
    } catch (error) {
      console.error('❌ Failed to decrypt password:', error.message);
      process.exit(1);
    }

    // Step 3: Create transporter
    console.log('🔧 Step 3: Creating Nodemailer Transporter...');
    const isGmail = settings.smtpHost.includes('gmail.com');

    const transportConfig = {
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
        maxMessages: 100,
      }),
      tls: {
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2',
      },
      logger: true,
      debug: true,
    };

    const transporter = nodemailer.createTransport(transportConfig);
    console.log(`✅ Transporter created for ${isGmail ? 'Gmail' : settings.smtpHost}`);
    console.log('');

    // Step 4: Verify connection
    console.log('🔌 Step 4: Verifying SMTP Connection...');
    try {
      await transporter.verify();
      console.log('✅ SMTP connection verified successfully!');
      console.log('');
    } catch (error) {
      console.error('❌ SMTP connection failed!');
      console.error(`   Error: ${error.message}`);
      console.error('');
      console.error('🔍 Common issues:');
      console.error('   1. Invalid Gmail App Password');
      console.error('   2. 2FA not enabled on Gmail account');
      console.error('   3. "Less secure app access" needed (deprecated)');
      console.error('   4. Network/firewall blocking SMTP ports');
      console.error('');
      console.error('✅ Solution: Use Gmail App Password');
      console.error('   1. Go to https://myaccount.google.com/security');
      console.error('   2. Enable 2-Step Verification');
      console.error('   3. Go to https://myaccount.google.com/apppasswords');
      console.error('   4. Generate new app password for "Mail"');
      console.error('   5. Update SMTP_PASS in .env with the 16-char password');
      console.error('   6. Run: node update-gmail-settings.js');
      console.error('');
      process.exit(1);
    }

    // Step 5: Send test email
    console.log('📧 Step 5: Sending Test Email...');
    const testRecipient = settings.smtpUser; // Send to self

    const mailOptions = {
      from: `"${settings.fromName}" <${settings.fromEmail}>`,
      to: testRecipient,
      subject: '✅ Gmail SMTP Test - College Email SaaS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #10B981; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">✅ Gmail SMTP Test Successful!</h2>
          </div>
          <div style="background-color: white; padding: 30px; border: 1px solid #E5E7EB; border-radius: 0 0 8px 8px;">
            <p style="color: #333; font-size: 16px;"><strong>Congratulations!</strong> Your Gmail SMTP configuration is working correctly.</p>

            <div style="background-color: #F3F4F6; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1F2937;">Configuration Details:</h3>
              <p style="margin: 5px 0; color: #4B5563;"><strong>SMTP Host:</strong> ${settings.smtpHost}</p>
              <p style="margin: 5px 0; color: #4B5563;"><strong>SMTP Port:</strong> ${settings.smtpPort}</p>
              <p style="margin: 5px 0; color: #4B5563;"><strong>SMTP User:</strong> ${settings.smtpUser}</p>
              <p style="margin: 5px 0; color: #4B5563;"><strong>From Email:</strong> ${settings.fromEmail}</p>
              <p style="margin: 5px 0; color: #4B5563;"><strong>From Name:</strong> ${settings.fromName}</p>
              <p style="margin: 5px 0; color: #4B5563;"><strong>Test Time:</strong> ${new Date().toLocaleString()}</p>
            </div>

            <div style="background-color: #DBEAFE; padding: 15px; border-left: 4px solid #3B82F6; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0; color: #1E40AF; font-size: 14px;">
                <strong>✅ Next Steps:</strong> Your email system is ready! You can now issue college emails to students from the admin dashboard.
              </p>
            </div>

            <p style="color: #6B7280; font-size: 14px; margin-top: 20px;">
              This test email was sent from the College Email SaaS backend using Nodemailer + Gmail SMTP.
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Test email sent successfully!');
    console.log(`📨 Message ID: ${info.messageId}`);
    console.log(`✅ Accepted: ${info.accepted.join(', ')}`);
    console.log(`📬 To: ${testRecipient}`);

    if (info.rejected && info.rejected.length > 0) {
      console.log(`⚠️  Rejected: ${info.rejected.join(', ')}`);
    }

    console.log('');
    console.log('🎉 ======== ALL TESTS PASSED ========');
    console.log('');
    console.log('✅ Email system is fully functional!');
    console.log(`📧 Check your inbox at ${testRecipient}`);
    console.log('');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testEmailSetup();
