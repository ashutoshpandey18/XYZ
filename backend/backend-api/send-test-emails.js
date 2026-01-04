const https = require('https');

const RESEND_API_KEY = 're_JS1gX2FS_5hcbPu6iuPoLz9NqycwfCdGY';
const TO_EMAIL = 'ashutoshpandey23june2005@gmail.com';

async function sendEmail(subject, html, index) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      from: 'onboarding@resend.dev',
      to: [TO_EMAIL],
      subject: subject,
      html: html
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
          console.log(`✅ Email ${index} sent successfully!`);
          resolve(JSON.parse(body));
        } else {
          console.log(`❌ Email ${index} failed: ${body}`);
          reject(new Error(body));
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Email ${index} error: ${error.message}`);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function sendTestEmails() {
  console.log('📧 Sending 4 test emails to:', TO_EMAIL);
  console.log('');

  const emails = [
    {
      subject: 'Test Email 1 - Welcome',
      html: '<h1>Test Email 1</h1><p>Welcome to College Email SaaS</p>'
    },
    {
      subject: 'Test Email 2 - Approved',
      html: '<h1>Test Email 2</h1><p>Your request has been approved</p>'
    },
    {
      subject: 'Test Email 3 - Verification',
      html: '<h1>Test Email 3</h1><p>Your verification code is 123456</p>'
    },
    {
      subject: 'Test Email 4 - Reset',
      html: '<h1>Test Email 4</h1><p>Reset your password</p>'
    }
  ];

  for (let i = 0; i < emails.length; i++) {
    try {
      await sendEmail(emails[i].subject, emails[i].html, i + 1);
      // Wait 1 second between emails
      if (i < emails.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`Failed to send email ${i + 1}`);
    }
  }

  console.log('');
  console.log('✅ All test emails sent!');
  console.log(`📬 Check your inbox: ${TO_EMAIL}`);
}

sendTestEmails();
