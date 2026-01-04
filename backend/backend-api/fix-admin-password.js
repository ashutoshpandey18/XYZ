const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function updateAdminPassword() {
  try {
    console.log('🔐 Updating admin password in database...\n');

    const newPassword = 'ashutoshremotesweeng';
    
    // Generate new hash
    console.log(`   🔄 Hashing new password: "${newPassword}"`);
    const newHash = await bcrypt.hash(newPassword, 10);
    console.log(`   ✅ New hash generated: ${newHash.substring(0, 20)}...\n`);

    // Update admin user
    const updated = await prisma.user.update({
      where: { email: 'admin@college.edu' },
      data: { passwordHash: newHash },
    });

    console.log('✅ Admin password updated successfully!\n');
    console.log('📝 Login Credentials:');
    console.log('   Email: admin@college.edu');
    console.log('   Password: ashutoshremotesweeng');
    console.log('   Role:', updated.role);
    console.log('   ID:', updated.id);
    console.log('\n🧪 Test the login now!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.code === 'P2025') {
      console.error('\n⚠️  Admin user not found. Create it first with check-users.js');
    } else if (error.code === 'P1001') {
      console.error('\n⚠️  Cannot reach database. Check DATABASE_URL');
    }
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminPassword();
