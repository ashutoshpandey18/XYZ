const axios = require('axios');

// Use the API key from environment or the one you provided
const BREVO_API_KEY = process.env.BREVO_API_KEY || 'xkeysib-9ff73db9fa4ace77d8a1f9db6869f854f09fe1bee4cb9c82287cdaef99dca0fa-bskpdA6X2Eg1FYk';
const TEST_EMAIL = 'ashutoshpandey23june2005@gmail.com';

async function testBrevoAPI() {
  console.log('\n📧 === BREVO REST API TEST (Railway-Compatible) ===\n');

  console.log('ℹ️  IMPORTANT: You need a Brevo API Key (not SMTP password)');
  console.log('   Get it from: https://app.brevo.com/settings/keys/api');
  console.log('');
  console.log('1️⃣ Testing Brevo REST API (no SMTP ports needed)...');
  console.log('   API Key:', BREVO_API_KEY ? BREVO_API_KEY.substring(0, 20) + '...' : '❌ MISSING');
  console.log('   Test Email:', TEST_EMAIL);
  console.log('');

  if (!BREVO_API_KEY) {
    console.error('❌ BREVO_API_KEY not set!');
    console.log('\nSet it in Railway environment variables:');
    console.log('BREVO_API_KEY=xkeysib-...');
    process.exit(1);
  }

  try {
    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: {
          name: 'College Email System',
          email: '9f4f85001@smtp-brevo.com',
        },
        to: [
          {
            email: TEST_EMAIL,
          },
        ],
        subject: '✅ Brevo REST API Test - Railway Compatible',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #4CAF50;">✅ Brevo REST API Working!</h2>
            <p>This email was sent using Brevo's REST API, which works on Railway.</p>
            <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Method:</strong> Brevo REST API (HTTPS)</p>
            <p><strong>Platform:</strong> Railway-compatible</p>
            <hr>
            <p style="color: #666; font-size: 12px;">
              Unlike SMTP (port 587), REST API uses HTTPS and is not blocked by Railway!
            </p>
          </div>
        `,
      },
      {
        headers: {
          'api-key': BREVO_API_KEY,
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
        timeout: 15000,
      },
    );

    console.log('✅ Email sent successfully via Brevo REST API!');
    console.log('   Message ID:', response.data.messageId);
    console.log('   Status:', response.status, response.statusText);
    console.log('');
    console.log('🎉 Brevo REST API is working!');
    console.log('📧 Check your inbox at:', TEST_EMAIL);
    console.log('');
    console.log('✅ This method works on Railway because it uses HTTPS, not SMTP ports!');

  } catch (error) {
    console.error('\n❌ Brevo API test failed:', error.message);

    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', JSON.stringify(error.response.data, null, 2));

      if (error.response.status === 401) {
        console.error('\n⚠️  API Key is invalid or expired!');
        console.error('   Get a new one from: https://app.brevo.com/settings/keys/api');
      }
    }

    process.exit(1);
  }
}

testBrevoAPI();
