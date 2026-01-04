const https = require('https');

const RESEND_API_KEY = 're_JS1gX2FS_5hcbPu6iuPoLz9NqycwfCdGY';

// Add your 100 email addresses here
const RECIPIENT_EMAILS = [
  'user1@example.com',
  'user2@example.com',
  'user3@example.com',
  // ... add up to 100 emails
  'ashutoshpandey23june2005@gmail.com' // for testing
];

async function sendEmail(toEmail, index) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      from: 'onboarding@resend.dev',
      to: [toEmail],
      subject: 'Welcome to College Email System',
      html: `
        <h1>Welcome!</h1>
        <p>Hello,</p>
        <p>Your college email account has been created.</p>
        <p>Email: <strong>${toEmail}</strong></p>
        <p>Please login to access your account.</p>
        <br>
        <p>Best regards,<br>College Email Team</p>
      `
    });

    const options = {
      hostname: 'api.resend.com',
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`✅ [${index}/${RECIPIENT_EMAILS.length}] Email sent to: ${toEmail}`);
          resolve(JSON.parse(body));
        } else {
          console.log(`❌ [${index}/${RECIPIENT_EMAILS.length}] Failed to send to: ${toEmail}`);
          reject(new Error(body));
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ [${index}/${RECIPIENT_EMAILS.length}] Error for ${toEmail}: ${error.message}`);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function sendBulkEmails() {
  console.log(`📧 Starting bulk email send to ${RECIPIENT_EMAILS.length} recipients`);
  console.log(`⏰ This will take approximately ${Math.ceil(RECIPIENT_EMAILS.length * 1.5 / 60)} minutes\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < RECIPIENT_EMAILS.length; i++) {
    try {
      await sendEmail(RECIPIENT_EMAILS[i], i + 1);
      successCount++;

      // Wait 1.5 seconds between emails to avoid rate limiting
      if (i < RECIPIENT_EMAILS.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    } catch (error) {
      failCount++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📧 Total: ${RECIPIENT_EMAILS.length}`);
}

sendBulkEmails();
