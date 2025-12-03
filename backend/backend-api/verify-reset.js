const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyReset() {
  try {
    const users = await prisma.user.count();
    const requests = await prisma.emailRequest.count();
    const history = await prisma.issuedEmailHistory.count();

    console.log('\n✓ Database Verification After Reset:');
    console.log('  ├─ Users: ' + users);
    console.log('  ├─ Email Requests: ' + requests);
    console.log('  └─ Issued Email History: ' + history);

    if (users === 0 && requests === 0 && history === 0) {
      console.log('\n✅ SUCCESS: All tables empty - Fresh database confirmed!\n');
    } else {
      console.log('\n❌ WARNING: Tables not empty - reset may have failed!\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error verifying database:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyReset();
