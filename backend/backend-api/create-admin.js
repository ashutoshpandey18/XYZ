/**
 * Admin User Creation Script
 *
 * @description Creates the initial admin user for the application
 * @usage node create-admin.js
 *
 * Use cases:
 * - Initial deployment setup
 * - New environment configuration
 * - First-time application installation
 *
 * @author College Email SaaS Team
 * @version 1.0.0
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const ADMIN_CONFIG = {
  name: process.env.ADMIN_NAME || 'Super Admin',
  email: process.env.ADMIN_EMAIL || 'admin@college.edu',
  password: process.env.ADMIN_PASSWORD || 'ChangeMe123!',
  role: 'ADMIN'
};

const SALT_ROUNDS = 10;

/**
 * Creates or validates the admin user in the database
 */
async function createAdminUser() {
  try {
    console.log('\n[ADMIN SETUP] Initializing Admin User Setup\n');

    const existingUser = await prisma.user.findUnique({
      where: { email: ADMIN_CONFIG.email }
    });

    if (existingUser) {
      console.log('[INFO] Admin user already exists');

      if (existingUser.role !== 'ADMIN') {
        await prisma.user.update({
          where: { email: ADMIN_CONFIG.email },
          data: { role: 'ADMIN' }
        });
        console.log('[SUCCESS] User role updated to ADMIN');
      }

      console.log('\nExisting Admin Details:');
      console.log('   Email:', ADMIN_CONFIG.email);
      console.log('   Status: Active');
      console.log('\nTo reset password, use: node update-admin-password.js\n');
      return;
    }

    const passwordHash = await bcrypt.hash(ADMIN_CONFIG.password, SALT_ROUNDS);

    await prisma.user.create({
      data: {
        name: ADMIN_CONFIG.name,
        email: ADMIN_CONFIG.email,
        passwordHash,
        role: ADMIN_CONFIG.role
      }
    });

    console.log('[SUCCESS] Admin user created successfully\n');
    console.log('Login Credentials:');
    console.log('   Email:', ADMIN_CONFIG.email);
    console.log('   Password:', ADMIN_CONFIG.password);
    console.log('\n[SECURITY WARNING] Change this password immediately after first login');
    console.log('Admin Panel: http://localhost:5173/login\n');

  } catch (error) {
    console.error('\n[ERROR]', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
