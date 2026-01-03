# Render Deployment Guide

## 🚀 Deploy College Email SaaS to Render

This guide will help you deploy the backend and PostgreSQL database to Render.

---

## 📋 Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **GitHub Repository**: Push your code to GitHub
3. **Email Configured**: Gmail SMTP with App Password ready

---

## 🗄️ Step 1: Create PostgreSQL Database

### Option A: Using render.yaml (Recommended)

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub repository `ashutoshpandey18/XYZ`
4. Render will detect `render.yaml` and create both database and web service
5. Click **"Apply"** to start deployment

### Option B: Manual Setup

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name**: `college-email-saas-db`
   - **Database**: `college_email_saas`
   - **User**: `college_admin`
   - **Region**: Oregon (US West)
   - **Plan**: Free
   - **PostgreSQL Version**: 15
4. Click **"Create Database"**
5. **Copy the Internal Database URL** (starts with `postgresql://`)

---

## 🖥️ Step 2: Deploy Backend Service

### If using Blueprint (render.yaml):
Skip to Step 3 - database and backend are created automatically!

### Manual Setup:

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository `ashutoshpandey18/XYZ`
3. Configure:
   - **Name**: `college-email-saas-backend`
   - **Region**: Oregon (US West)
   - **Branch**: `main`
   - **Root Directory**: `backend/backend-api`
   - **Runtime**: Docker
   - **Plan**: Free
4. Click **"Create Web Service"**

---

## 🔐 Step 3: Configure Environment Variables

After backend service is created, add these environment variables:

### Required Variables:

1. **DATABASE_URL**
   - Click your PostgreSQL database
   - Copy the **Internal Database URL**
   - Paste into backend service environment variables

2. **JWT_SECRET**
   ```
   Generate secure random string (32+ characters)
   Example: openssl rand -base64 32
   ```

3. **JWT_REFRESH_SECRET**
   ```
   Generate different secure random string
   Example: openssl rand -base64 32
   ```

4. **FRONTEND_URL**
   ```
   https://xyz-4lq7.vercel.app
   ```

5. **NODE_ENV**
   ```
   production
   ```

6. **PORT**
   ```
   3000
   ```

### To Add Variables:
1. Go to your web service dashboard
2. Click **"Environment"** tab
3. Click **"Add Environment Variable"**
4. Add each variable above
5. Click **"Save Changes"**

---

## 🗃️ Step 4: Run Database Migrations

After deployment, run migrations in Render Shell:

1. Go to your web service dashboard
2. Click **"Shell"** tab (top right)
3. Run:
   ```bash
   npx prisma migrate deploy
   ```

---

## 👨‍💼 Step 5: Create Admin User

In Render Shell, run:

```bash
node create-admin.js
```

**Admin Credentials:**
- Email: `admin@college.edu`
- Password: `ashutoshajita20232025`

---

## 📧 Step 6: Configure Email Settings

### Get Your Backend URL:
Your Render backend URL will be: `https://college-email-saas-backend.onrender.com`

### Configure Email via API:

```powershell
# Login as admin
$loginBody = @{
    email = "admin@college.edu"
    password = "ashutoshajita20232025"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "https://college-email-saas-backend.onrender.com/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body $loginBody

$token = $loginResponse.accessToken

# Update email settings
$emailBody = @{
    smtpHost = "smtp.gmail.com"
    smtpPort = 587
    smtpUser = "ashutoshpandey23june2005@gmail.com"
    smtpPass = "dsmcsywabjemncat"
    fromEmail = "ashutoshpandey23june2005@gmail.com"
    fromName = "College Email SaaS"
    replyToEmail = "ashutoshpandey23june2005@gmail.com"
    isActive = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://college-email-saas-backend.onrender.com/admin/email-settings" -Method PUT -Headers @{"Authorization"="Bearer $token"; "Content-Type"="application/json"} -Body $emailBody

# Test email
$testBody = @{
    toEmail = "ashutoshpandey23june2005@gmail.com"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://college-email-saas-backend.onrender.com/admin/email-settings/test" -Method POST -Headers @{"Authorization"="Bearer $token"; "Content-Type"="application/json"} -Body $testBody
```

---

## 🌐 Step 7: Update Frontend (Vercel)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your frontend project `xyz`
3. Go to **Settings** → **Environment Variables**
4. Update/Add:
   ```
   VITE_API_URL=https://college-email-saas-backend.onrender.com
   ```
5. Go to **Deployments** tab
6. Click **"Redeploy"** on latest deployment

---

## ✅ Step 8: Verify Deployment

### Test Backend:
```bash
curl https://college-email-saas-backend.onrender.com
```

### Test Full Workflow:
1. Visit: https://xyz-4lq7.vercel.app
2. Register as student
3. Upload ID card
4. Login as admin: `admin@college.edu`
5. Review request
6. Approve and issue college email
7. Check student email inbox

---

## 🔧 Troubleshooting

### Issue: Service won't start
**Solution**: Check Render logs:
1. Go to web service dashboard
2. Click **"Logs"** tab
3. Look for errors

### Issue: Database connection failed
**Solution**: Verify DATABASE_URL:
1. Go to PostgreSQL database
2. Copy **Internal Database URL**
3. Update backend environment variable
4. Redeploy service

### Issue: SMTP still not working
**Solution**: Render allows SMTP on paid plans
- **Option 1**: Upgrade to Render Starter plan ($7/month)
- **Option 2**: Use HTTP-based email service (Resend, SendGrid)

### Issue: Cold starts (free tier)
**Render free tier spins down after 15 minutes of inactivity**
- First request may take 50+ seconds
- Consider paid plan for instant responses

---

## 📊 Monitoring

### View Logs:
```bash
# In Render dashboard
Web Service → Logs tab
```

### Database Metrics:
```bash
# In Render dashboard
PostgreSQL → Metrics tab
```

---

## 🎯 Production URLs

After deployment:
- **Backend**: `https://college-email-saas-backend.onrender.com`
- **Frontend**: `https://xyz-4lq7.vercel.app`
- **Admin Panel**: `https://xyz-4lq7.vercel.app/admin`

---

## 🚨 Important Notes

1. **Free Tier Limitations**:
   - Render spins down after 15 min inactivity
   - First request takes 50+ seconds (cold start)
   - 750 hours/month free (enough for 1 service)

2. **SMTP on Render**:
   - Free tier may have SMTP restrictions
   - Test email functionality after deployment
   - Consider upgrading or using HTTP email APIs

3. **Environment Variables**:
   - Never commit `.env` files to GitHub
   - Use Render dashboard to manage secrets
   - Rotate JWT secrets periodically

4. **Database Backups**:
   - Free tier: Manual backups only
   - Paid plans: Automated daily backups
   - Export important data regularly

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Render PostgreSQL Guide](https://render.com/docs/databases)
- [Render Docker Guide](https://render.com/docs/docker)
- [Blueprint Spec](https://render.com/docs/blueprint-spec)

---

**Need Help?** Check Render community forum or contact support.
