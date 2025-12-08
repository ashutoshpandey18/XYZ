# 🔧 .ENV SMTP CONFIGURATION - QUICK REFERENCE

## ✅ CURRENT CONFIGURATION

Your `.env` file at: `backend/backend-api/.env`

```env
# SMTP Configuration (Gmail)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your.email@gmail.com"
SMTP_PASS="your_gmail_app_password"

# Email Settings
FROM_EMAIL="your.email@gmail.com"
FROM_NAME="College Email SaaS"

# Frontend URL (for verification links)
FRONTEND_URL="http://localhost:5174"
```

---

## ⚠️ CRITICAL ACTION REQUIRED

### 🚨 Gmail App Password Rejected

Your app password might be rejected by Gmail if it's not valid.

**Error**:
```
Invalid login: 535-5.7.8 Username and Password not accepted
```

---

## 🔐 HOW TO FIX (3 MINUTES)

### Step 1: Generate NEW App Password

1. **Go to**: https://myaccount.google.com/apppasswords

2. **Select**:
   - App: **"Other (Custom name)"**
   - Name: `College Email SaaS`

3. **Click**: Generate

4. **Copy the 16-character password** (remove spaces):
   ```
   Example: abcd efgh ijkl mnop → abcdefghijklmnop
   ```

### Step 2: Update .env File

**Option 1** (WITH quotes):
```env
SMTP_PASS="abcdefghijklmnop"
```

**Option 2** (WITHOUT quotes - recommended):
```env
SMTP_PASS=abcdefghijklmnop
```

### Step 3: Restart Backend

```powershell
cd C:\Users\Lenovo\Downloads\college-email-saas\backend\backend-api
npx nest start --watch
```

### Step 4: Verify Success

Look for this in logs:
```
[EmailService] 🔍 Verifying SMTP connection...
[EmailService] ✅ SMTP connection verified successfully!
```

✅ **If you see this, you're done!**

---

## 📋 ALTERNATIVE .ENV FORMATS (ALL WORK)

### Format 1: With Quotes (Current)
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your.email@gmail.com"
SMTP_PASS="your-app-password"
FROM_EMAIL="your.email@gmail.com"
FROM_NAME="College Email SaaS"
```

### Format 2: Without Quotes (Recommended)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your.email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=your.email@gmail.com
FROM_NAME=College Email SaaS
```

### Format 3: Mixed (Also Works)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your.email@gmail.com
SMTP_PASS="your-app-password"
FROM_EMAIL=your.email@gmail.com
FROM_NAME="College Email SaaS"
```

**All three formats work!** NestJS ConfigService handles both.

---

## ❓ COMMON QUESTIONS

### Q: Should SMTP_PORT be number or string?

**A**: Both work! Our code parses it:
```typescript
port: parseInt(process.env.SMTP_PORT)
```

### Q: Can Gmail password contain special characters?

**A**: Yes! App Passwords are always 16 **lowercase letters only** (no special chars).

### Q: What if my password has spaces?

**A**: Remove all spaces:
```
abcd efgh ijkl mnop  ❌
abcdefghijklmnop     ✅
```

### Q: Do I need to restart after changing .env?

**A**: YES! Always restart backend after changing `.env` files.

### Q: Can I use my regular Gmail password?

**A**: NO! You MUST use an **App Password**. Regular passwords don't work with SMTP.

---

## 🌐 OTHER EMAIL PROVIDERS

### SendGrid

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=College Email SaaS
```

### Mailgun

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@yourdomain.mailgun.org
SMTP_PASS=your-mailgun-smtp-password
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=College Email SaaS
```

### AWS SES

```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
FROM_EMAIL=verified@yourdomain.com
FROM_NAME=College Email SaaS
```

### Outlook/Office365

```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
FROM_EMAIL=your-email@outlook.com
FROM_NAME=College Email SaaS
```

---

## 🔍 DEBUGGING

### Check if .env is loaded correctly

Add this to your backend startup:
```typescript
console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_PORT:', process.env.SMTP_PORT);
console.log('SMTP_USER:', process.env.SMTP_USER);
console.log('SMTP_PASS:', process.env.SMTP_PASS ? '***' : 'NOT SET');
```

Our EmailService already does this! Look for:
```
[EmailService] 📊 Using ENV email settings:
   SMTP_HOST = smtp.gmail.com
   SMTP_PORT = 587
   SMTP_USER = your.email@gmail.com
   SMTP_PASS = ***HIDDEN***
```

### Check .env file location

Must be at: `backend/backend-api/.env`

```
college-email-saas/
  backend/
    backend-api/
      .env          ← HERE!
      src/
      dist/
      package.json
```

### Check line endings

If .env created on Windows:
- ✅ CRLF is fine
- ✅ LF is fine

To change in VS Code:
1. Open `.env`
2. Bottom-right corner: Click "CRLF"
3. Select "LF"
4. Save

---

## ✅ FINAL CHECKLIST

Before testing emails:

- [ ] 2-Factor Authentication enabled on Google Account
- [ ] Generated NEW App Password from https://myaccount.google.com/apppasswords
- [ ] Copied password WITHOUT spaces
- [ ] Updated `SMTP_PASS` in `.env`
- [ ] Restarted backend
- [ ] Saw "✅ SMTP connection verified successfully!" in logs

---

## 🆘 STILL NOT WORKING?

### Try Port 465 (SSL/TLS)

```env
SMTP_PORT=465
```

Our code automatically switches to `secure: true` for port 465!

### Try Different Gmail Account

Sometimes Google blocks certain accounts. Try with:
- A different Gmail account
- A Google Workspace account (paid)
- A third-party email provider

### Check Google Account Security

1. Go to: https://myaccount.google.com/security
2. Look for "Recent security events"
3. Approve any blocked sign-ins
4. Check for account restrictions

---

## 📞 NEED HELP?

If you've tried everything:

1. Share the **exact backend logs** (EmailService initialization)
2. Confirm **2FA is enabled** on Google Account
3. Confirm **App Password is 16 chars, no spaces**
4. Try the Node.js SMTP test script in the main guide

Good luck! 🚀
