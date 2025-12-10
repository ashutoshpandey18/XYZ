/**
 * Admin Password Reset Utility
 *
 * @description Emergency password reset for admin account
 * @usage node update-admin-password.js
 *
 * Security Notice:
 * - Only use this script in secure environments
 * - Never commit passwords to version control
 * - Change password immediately after recovery
 *
 * @author College Email SaaS Team
 * @version 1.0.0
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@college.edu';
const NEW_PASSWORD = process.env.NEW_ADMIN_PASSWORD || 'ChangeMe123!';
const SALT_ROUNDS = 10;

/**
 * Updates admin password in the database
 */
async function updateAdminPassword() {
  try {
    console.log('\n[PASSWORD RESET] Admin Password Reset Utility\n');

    const admin = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL },
      select: { id: true, email: true, role: true, name: true }
    });

    if (!admin) {
      console.error(`[ERROR] Admin user not found: ${ADMIN_EMAIL}`);
      console.log('\nCreate admin user first:');
      console.log('   node create-admin.js\n');
      process.exit(1);
    }

    if (admin.role !== 'ADMIN') {
      console.error(`[ERROR] User ${ADMIN_EMAIL} is not an admin`);
      process.exit(1);
    }

    const passwordHash = await bcrypt.hash(NEW_PASSWORD, SALT_ROUNDS);

    await prisma.user.update({
      where: { email: ADMIN_EMAIL },
      data: { passwordHash }
    });

    console.log('[SUCCESS] Password reset successful\n');
    console.log('Updated Credentials:');
    console.log(`   Name: ${admin.name}`);
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${NEW_PASSWORD}`);
    console.log('\n[SECURITY WARNING] Change this password via admin panel');
    console.log('Login: http://localhost:5173/login\n');

  } catch (error) {
    console.error('\n[ERROR]', error.message, '\n');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminPassword();
