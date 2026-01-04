const { Client } = require('pg');

async function checkEmailSettings() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to Railway PostgreSQL...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Check email settings
    const result = await client.query('SELECT * FROM "EmailSettings"');

    if (result.rows.length === 0) {
      console.log('❌ No email settings found in database');
      console.log('📝 You need to configure email settings from admin dashboard');
    } else {
      console.log('✅ Email settings found:');
      const settings = result.rows[0];
      console.log(`   SMTP Host: ${settings.smtpHost || 'Not set'}`);
      console.log(`   SMTP Port: ${settings.smtpPort || 'Not set'}`);
      console.log(`   SMTP User: ${settings.smtpUser || 'Not set'}`);
      console.log(`   From Email: ${settings.fromEmail || 'Not set'}`);
      console.log(`   From Name: ${settings.fromName || 'Not set'}`);
      console.log(`   Password set: ${settings.smtpPass ? 'Yes' : 'No'}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    console.log('\n🔌 Disconnected from database');
  }
}

checkEmailSettings();
