const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkEmailSettings() {
  try {
    console.log('\n🔍 Checking Email Settings in Database...\n');

    const settings = await prisma.emailSettings.findMany({
      orderBy: { createdAt: 'desc' }
    });

    if (settings.length === 0) {
      console.log('❌ No email settings found in database!\n');
    } else {
      settings.forEach((s, index) => {
        console.log(`Settings ${index + 1}:`);
        console.log(`  ID: ${s.id}`);
        console.log(`  Host: ${s.smtpHost}`);
        console.log(`  Port: ${s.smtpPort}`);
        console.log(`  User: ${s.smtpUser}`);
        console.log(`  From: ${s.fromEmail}`);
        console.log(`  Name: ${s.fromName}`);
        console.log(`  Active: ${s.isActive ? '✅' : '❌'}`);
        console.log(`  Password (encrypted): ${s.smtpPass.substring(0, 20)}...`);
        console.log(`  Created: ${s.createdAt}`);
        console.log('');
      });
    }

    const activeSettings = settings.find(s => s.isActive);
    if (!activeSettings) {
      console.log('⚠️ No active email settings found!\n');
    } else {
      console.log(`✅ Active settings found: ${activeSettings.smtpUser}\n`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkEmailSettings();
