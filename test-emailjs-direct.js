// Direct EmailJS test - run this in browser console on your site
// Or create a simple test page

const emailjs = require('emailjs-com');

// Initialize with your credentials
emailjs.init('OB8zWyOp1gGkNwZcO');

// Test email
emailjs.send(
  'service_j5b5n9l',      // Service ID
  'template_99rui32',     // Template ID
  {
    to_email: 'pandeymenka06@gmail.com',
    to_name: 'Test Student',
    from_name: 'College Email SaaS',
    subject: 'Test Email from EmailJS',
    message: 'This is a test email to verify EmailJS is working.\n\nCollege Email: test@college.edu\nPassword: Test123'
  },
  'OB8zWyOp1gGkNwZcO'     // Public Key
)
.then(response => {
  console.log('✅ Email sent successfully!', response);
})
.catch(error => {
  console.error('❌ Email failed:', error);
});
