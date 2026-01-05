import emailjs from 'emailjs-com';

// EmailJS Configuration from environment variables
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

// Debug: Log configuration (remove in production)
console.log('🔍 EmailJS Configuration:');
console.log('  Service ID:', EMAILJS_SERVICE_ID || '❌ MISSING');
console.log('  Public Key:', EMAILJS_PUBLIC_KEY ? '✅ Set' : '❌ MISSING');

// Initialize EmailJS with your public key
if (EMAILJS_PUBLIC_KEY) {
  emailjs.init(EMAILJS_PUBLIC_KEY);
  console.log('✅ EmailJS initialized');
} else {
  console.error('❌ EmailJS Public Key missing! Set VITE_EMAILJS_PUBLIC_KEY in Vercel environment variables');
}

interface EmailParams {
  to_email: string;
  to_name: string;
  from_name: string;
  subject: string;
  message: string;
  [key: string]: any; // Index signature for EmailJS compatibility
}

/**
 * Send an email using EmailJS
 * @param templateId - Your EmailJS template ID
 * @param params - Email parameters
 * @returns Promise with the result
 */
export const sendEmail = async (
  templateId: string,
  params: EmailParams
): Promise<{ success: boolean; message: string }> => {
  console.log('📧 Attempting to send email via EmailJS...');
  console.log('  Template ID:', templateId || '❌ MISSING');
  console.log('  Service ID:', EMAILJS_SERVICE_ID || '❌ MISSING');
  console.log('  To Email:', params.to_email);

  if (!EMAILJS_SERVICE_ID || !EMAILJS_PUBLIC_KEY || !templateId) {
    const error = 'EmailJS not configured. Missing: ' +
      (!EMAILJS_SERVICE_ID ? 'SERVICE_ID ' : '') +
      (!EMAILJS_PUBLIC_KEY ? 'PUBLIC_KEY ' : '') +
      (!templateId ? 'TEMPLATE_ID' : '');
    console.error('❌', error);
    return {
      success: false,
      message: error,
    };
  }

  try {
    console.log('📤 Sending email...');
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      templateId,
      params,
      EMAILJS_PUBLIC_KEY
    );

    console.log('✅ EmailJS Response:', response);
    if (response.status === 200) {
      return {
        success: true,
        message: 'Email sent successfully!',
      };
    } else {
      console.warn('⚠️ Unexpected status:', response.status);
      return {
        success: false,
        message: 'Failed to send email. Please try again.',
      };
    }
  } catch (error: any) {
    console.error('❌ EmailJS Error:', error);
    return {
      success: false,
      message: error?.text || 'An error occurred while sending the email.',
    };
  }
};

/**
 * Send a contact form email
 * @param templateId - Your EmailJS template ID for contact forms
 * @param name - Sender's name
 * @param email - Sender's email
 * @param message - Message content
 */
export const sendContactEmail = async (
  templateId: string,
  name: string,
  email: string,
  message: string
) => {
  return sendEmail(templateId, {
    to_email: 'admin@example.com', // Replace with your admin email
    to_name: 'Admin',
    from_name: name,
    subject: 'New Contact Form Submission',
    message: `From: ${name} (${email})\n\n${message}`,
  });
};

/**
 * Send a notification email
 * @param templateId - Your EmailJS template ID for notifications
 * @param recipientEmail - Recipient's email
 * @param recipientName - Recipient's name
 * @param subject - Email subject
 * @param message - Email message
 */
export const sendNotificationEmail = async (
  templateId: string,
  recipientEmail: string,
  recipientName: string,
  subject: string,
  message: string
) => {
  return sendEmail(templateId, {
    to_email: recipientEmail,
    to_name: recipientName,
    from_name: 'College Email SaaS',
    subject: subject,
    message: message,
  });
};

export default { sendEmail, sendContactEmail, sendNotificationEmail };
