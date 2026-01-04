const { Client } = require('pg');

async function setupResend() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to Railway PostgreSQL...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Update to use Resend API
    await client.query(`
      UPDATE "EmailSettings" 
      SET 
        "smtpHost" = 'resend',
        "smtpPort" = 0,
        "smtpUser" = '',
        "smtpPass" = 're_JS1gX2FS_5hcbPu6iuPoLz9NqycwfCdGY',
        "fromEmail" = 'onboarding@resend.dev',
        "fromName" = 'College Email SaaS',
        "updatedAt" = NOW()
    `);

    console.log('✅ Email settings updated to use Resend API!');
    console.log('\n📝 Configuration:');
    console.log('   Provider: Resend API');
    console.log('   From: onboarding@resend.dev');
    console.log('   API Key: re_JS1gX2FS_5hcbPu6iuPoLz9NqycwfCdGY');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    console.log('\n🔌 Disconnected from database');
  }
}

setupResend();
