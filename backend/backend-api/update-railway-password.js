// Railway Database Password Update Script
// This connects directly to Railway PostgreSQL using the connection string

const { Client } = require('pg');

// IMPORTANT: Get your DATABASE_URL from Railway Dashboard:
// 1. Click Postgres service → Variables tab → Copy DATABASE_URL
// 2. Or click "Connect" button → Copy connection string
// 3. Paste it below (replace the placeholder)

const DATABASE_URL = process.env.DATABASE_URL || 'YOUR_RAILWAY_DATABASE_URL_HERE';

const NEW_PASSWORD_HASH = '$2b$10$c6ObyNoWSGH2.2oHaKXkb.kh5l7EE3v.JbHGpFy5VGDccgxSj5U.K';
const ADMIN_EMAIL = 'admin@college.edu';

async function updateAdminPassword() {
  if (DATABASE_URL === 'YOUR_RAILWAY_DATABASE_URL_HERE') {
    console.log('❌ ERROR: You need to set the DATABASE_URL!');
    console.log('\n📝 Instructions:');
    console.log('1. Go to Railway Dashboard → Click Postgres → Variables tab');
    console.log('2. Copy the DATABASE_URL value');
    console.log('3. Run: set DATABASE_URL=<paste-url-here>');
    console.log('4. Then run this script again');
    return;
  }

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to Railway PostgreSQL...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Update the password
    console.log(`🔄 Updating password for ${ADMIN_EMAIL}...`);
    const result = await client.query(
      'UPDATE "User" SET "passwordHash" = $1 WHERE email = $2',
      [NEW_PASSWORD_HASH, ADMIN_EMAIL]
    );

    if (result.rowCount === 1) {
      console.log('✅ Password updated successfully!\n');
      console.log('📝 Login Credentials:');
      console.log('   Email: admin@college.edu');
      console.log('   Password: ashutoshremotesweeng');
      console.log('\n🧪 Test it now at: https://xyz-4lq7.vercel.app');
    } else {
      console.log(`⚠️  No user found with email: ${ADMIN_EMAIL}`);

      // List existing users
      const users = await client.query('SELECT email, role FROM "User"');
      console.log('\n📊 Existing users in database:');
      users.rows.forEach((u, i) => console.log(`   ${i+1}. ${u.email} (${u.role})`));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);

    if (error.message.includes('ENOTFOUND') || error.message.includes('connect')) {
      console.log('\n💡 Connection failed. Check if:');
      console.log('   - DATABASE_URL is correct');
      console.log('   - Railway Postgres is online');
      console.log('   - Your internet connection is working');
    }
  } finally {
    await client.end();
    console.log('\n🔌 Disconnected from database');
  }
}

updateAdminPassword();
