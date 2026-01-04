const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function checkAndCreateTestUser() {
  try {
    console.log('🔍 Checking database users...\n');

    // List all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    console.log(`📊 Found ${users.length} users in database:`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.role}) - Created: ${user.createdAt.toLocaleDateString()}`);
    });
    console.log('');

    // Check if admin exists
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@college.edu' },
    });

    if (admin) {
      console.log('✅ Admin user exists');
      console.log(`   Email: admin@college.edu`);
      console.log(`   Password: ashutoshremotesweeng`);
      console.log(`   Role: ${admin.role}`);
    } else {
      console.log('❌ Admin user not found. Creating...');

      const passwordHash = await bcrypt.hash('ashutoshremotesweeng', 10);

      const newAdmin = await prisma.user.create({
        data: {
          name: 'Super Admin',
          email: 'admin@college.edu',
          passwordHash,
          role: 'ADMIN',
          isEmailVerified: true,
          emailVerifiedAt: new Date(),
        },
      });

      console.log('✅ Admin user created');
      console.log(`   Email: admin@college.edu`);
      console.log(`   Password: ashutoshremotesweeng`);
      console.log(`   ID: ${newAdmin.id}`);
    }

    console.log('\n📝 Test Credentials:');
    console.log('   Email: admin@college.edu');
    console.log('   Password: ashutoshremotesweeng');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'P1001') {
      console.error('\n⚠️  Cannot reach database. Check DATABASE_URL in .env');
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkAndCreateTestUser();
