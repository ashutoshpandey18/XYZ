const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const prisma = new PrismaClient();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-32-character-secret-key!!';
const ENCRYPTION_ALGORITHM = 'aes-256-cbc';

function decrypt(encryptedText) {
  try {
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const encrypted = Buffer.from(parts.join(':'), 'hex');
    const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));

    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString();
  } catch (error) {
    console.error('❌ Failed to decrypt:', error.message);
    throw error;
  }
}

async function testEmailDelivery() {
  console.log('\n📧 === COMPREHENSIVE EMAIL DELIVERY TEST ===\n');

  try {
    // 1. Check environment variables
    console.log('1️⃣ Checking Environment Variables:');
    console.log('   DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ MISSING');
    console.log('   ENCRYPTION_KEY:', process.env.ENCRYPTION_KEY ? '✅ Set' : '❌ MISSING (using default)');
    console.log('   NODE_ENV:', process.env.NODE_ENV || 'development');
    console.log('   PORT:', process.env.PORT || '3000');
    console.log('');

    // 2. Check database connection
    console.log('2️⃣ Testing Database Connection...');
    await prisma.$connect();
    console.log('   ✅ Database connected\n');

    // 3. Get email settings
    console.log('3️⃣ Fetching Email Settings from Database...');
    const settings = await prisma.emailSettings.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!settings) {
      console.error('   ❌ No active email settings found in database!');
      console.log('\n📝 Run setup-brevo.js to configure email settings');
      process.exit(1);
    }

    console.log('   ✅ Email settings found:');
    console.log('   SMTP Host:', settings.smtpHost);
    console.log('   SMTP Port:', settings.smtpPort);
    console.log('   SMTP User:', settings.smtpUser);
    console.log('   From Email:', settings.fromEmail);
    console.log('   From Name:', settings.fromName);
    console.log('');

    // 4. Decrypt password
    console.log('4️⃣ Decrypting SMTP Password...');
    let smtpPassword;
    try {
      smtpPassword = decrypt(settings.smtpPass);
      console.log('   ✅ Password decrypted successfully');
      console.log('   Password preview:', smtpPassword.substring(0, 4) + '****');
      console.log('');
    } catch (error) {
      console.error('   ❌ Failed to decrypt password:', error.message);
      console.log('\n   This usually means ENCRYPTION_KEY env var is not set correctly in Railway!');
      process.exit(1);
    }

    // 5. Create transporter
    console.log('5️⃣ Creating SMTP Transporter...');
    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort,
      secure: settings.smtpPort === 465,
      auth: {
        user: settings.smtpUser,
        pass: smtpPassword,
      },
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 15000,
      tls: {
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2',
      },
    });
    console.log('   ✅ Transporter created\n');

    // 6. Verify connection
    console.log('6️⃣ Verifying SMTP Connection...');
    try {
      await transporter.verify();
      console.log('   ✅ SMTP connection verified successfully!\n');
    } catch (error) {
      console.error('   ❌ SMTP verification failed:', error.message);
      console.log('\n   Possible causes:');
      console.log('   - Wrong SMTP credentials');
      console.log('   - SMTP server not accessible');
      console.log('   - Firewall blocking outbound SMTP connections');
      console.log('   - Railway network restrictions');
      process.exit(1);
    }

    // 7. Send test email
    console.log('7️⃣ Sending Test Email...');
    const testEmail = 'ashutoshpandey23june2005@gmail.com';

    const mailOptions = {
      from: `"${settings.fromName}" <${settings.fromEmail}>`,
      to: testEmail,
      subject: '✅ College Email SaaS - Test Email Delivery',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #4CAF50;">✅ Email Delivery Test Successful!</h2>
          <p>This is a test email from your College Email SaaS backend.</p>
          <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>SMTP Host:</strong> ${settings.smtpHost}</p>
          <p><strong>From:</strong> ${settings.fromEmail}</p>
          <hr>
          <p style="color: #666; font-size: 12px;">If you received this email, your email delivery system is working correctly!</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('   ✅ Email sent successfully!');
    console.log('   Message ID:', info.messageId);
    console.log('   Accepted:', info.accepted);
    console.log('   Response:', info.response);
    console.log('');

    console.log('🎉 === ALL TESTS PASSED ===\n');
    console.log('✅ Email delivery is working correctly!');
    console.log('📧 Check your inbox at:', testEmail);
    console.log('');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testEmailDelivery();
