import { sendNotificationEmail } from './src/utils/emailjs';

// Test EmailJS Configuration
async function testEmailJS() {
  console.log('🧪 Testing EmailJS Configuration...\n');

  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const testEmail = 'ashutoshpandey23june2005@gmail.com'; // Change to your test email
  const testName = 'Test Student';

  console.log('📧 Configuration:');
  console.log(`   Service ID: ${import.meta.env.VITE_EMAILJS_SERVICE_ID}`);
  console.log(`   Public Key: ${import.meta.env.VITE_EMAILJS_PUBLIC_KEY}`);
  console.log(`   Template ID: ${templateId}`);
  console.log(`   Test Email: ${testEmail}\n`);

  try {
    console.log('📤 Sending test email...');

    const result = await sendNotificationEmail(
      templateId,
      testEmail,
      testName,
      'Test Email - College Email Issued',
      `This is a test email from College Email SaaS.

College Email: test.student@college.edu
Temporary Password: Test123!@#

Please login and change your password immediately.

Best regards,
College Email Team`
    );

    if (result.success) {
      console.log('\n✅ Email sent successfully!');
      console.log(`   Message: ${result.message}`);
      console.log(`\n📬 Check your inbox at: ${testEmail}`);
    } else {
      console.error('\n❌ Email failed to send');
      console.error(`   Error: ${result.message}`);
    }
  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error);
  }
}

// Run test
testEmailJS();
