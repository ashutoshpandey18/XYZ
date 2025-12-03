const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('\n🔧 Creating Admin User...\n');

    // Admin credentials
    const adminData = {
      name: 'Super Admin',
      email: 'admin@college.edu',
      password: 'Admin@123', // Change this password after first login!
      role: 'ADMIN'
    };

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminData.email }
    });

    if (existingAdmin) {
      console.log('❌ Admin user already exists with email:', adminData.email);

      if (existingAdmin.role !== 'ADMIN') {
        // Promote existing user to admin
        await prisma.user.update({
          where: { email: adminData.email },
          data: { role: 'ADMIN' }
        });
        console.log('✅ User promoted to ADMIN role');
      }

      console.log('\n📋 Admin Details:');
      console.log('  Email:', adminData.email);
      console.log('  Password: Use your existing password or reset it\n');
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(adminData.password, 10);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        name: adminData.name,
        email: adminData.email,
        passwordHash: passwordHash,
        role: 'ADMIN'
      }
    });

    console.log('✅ Admin user created successfully!\n');
    console.log('📋 Admin Login Credentials:');
    console.log('  Email:', adminData.email);
    console.log('  Password:', adminData.password);
    console.log('\n⚠️  IMPORTANT: Change this password after first login!\n');
    console.log('🔗 Login at: http://localhost:5173/login\n');

  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
