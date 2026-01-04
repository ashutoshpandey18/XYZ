# EmailJS Troubleshooting Guide

## Issue: Emails Not Being Sent

### Check These Items:

1. **EmailJS Dashboard** (https://dashboard.emailjs.com/)
   - Login and check "Email History"
   - See if any emails were attempted
   - Check for error messages

2. **Template Configuration**
   Your template `template_99rui32` needs these variables:
   - `{{to_email}}` - Recipient email
   - `{{to_name}}` - Recipient name
   - `{{from_name}}` - Sender name
   - `{{subject}}` - Email subject
   - `{{message}}` - Email body

3. **Service Configuration**
   Service `service_j5b5n9l` must be:
   - Active/enabled
   - Connected to an email provider (Gmail, etc.)
   - Not rate-limited

4. **Browser Console Errors**
   - Open DevTools (F12)
   - Check Console tab for EmailJS errors
   - Look for CORS or network errors

5. **Monthly Limit**
   - EmailJS free tier: 200 emails/month
   - Check if limit exceeded

## Quick Test Steps:

### Option 1: Browser Console Test
1. Open https://xyz-4lq7.vercel.app
2. Press F12 (DevTools)
3. Go to Console tab
4. Paste and run this:
\`\`\`javascript
emailjs.send(
  'service_j5b5n9l',
  'template_99rui32',
  {
    to_email: 'your-test-email@gmail.com',
    to_name: 'Test User',
    from_name: 'College Email SaaS',
    subject: 'Test Email',
    message: 'Testing EmailJS integration'
  },
  'OB8zWyOp1gGkNwZcO'
).then(r => console.log('✅ Success:', r))
 .catch(e => console.error('❌ Error:', e));
\`\`\`

### Option 2: Check EmailJS Dashboard
1. Go to https://dashboard.emailjs.com/
2. Click "Email History"
3. Look for recent send attempts
4. Check error messages if any

### Option 3: Verify Template in Dashboard
1. Go to https://dashboard.emailjs.com/
2. Click "Email Templates"
3. Find template: `template_99rui32`
4. Click "Edit"
5. Verify template has correct variables
6. Test template with "Test" button

## Common Issues:

### Issue 1: Template Not Found
**Error:** `Template template_99rui32 not found`
**Fix:**
- Check template ID is correct
- Ensure template exists in EmailJS dashboard
- Update VITE_EMAILJS_TEMPLATE_ID in .env

### Issue 2: Service Not Connected
**Error:** `Service service_j5b5n9l not found or inactive`
**Fix:**
- Go to EmailJS dashboard → Email Services
- Ensure service is active
- Reconnect email provider if needed

### Issue 3: Invalid Public Key
**Error:** `Invalid public key`
**Fix:**
- Go to EmailJS dashboard → Account
- Copy correct Public Key
- Update VITE_EMAILJS_PUBLIC_KEY in .env

### Issue 4: CORS Error
**Error:** `Cross-Origin Request Blocked`
**Fix:**
- EmailJS should work from any domain
- Check if EmailJS script loaded correctly
- Verify network tab shows emailjs.com requests

### Issue 5: Rate Limit Exceeded
**Error:** `Monthly quota exceeded`
**Fix:**
- Wait until next month, or
- Upgrade EmailJS plan

## Alternative: Use Backend Email (SendGrid/Mailgun)

If EmailJS continues to fail, switch to a backend email provider:

1. **SendGrid** (Free: 100 emails/day)
2. **Mailgun** (Free: 5,000 emails/month)
3. **Resend** (Free: 100 emails/day, requires domain verification)

Would you like me to set up one of these instead?
