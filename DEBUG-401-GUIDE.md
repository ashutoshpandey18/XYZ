# 🐛 DEBUG GUIDE - 401 Unauthorized Error

## ✅ WHAT WE DEPLOYED

### 1. **Debug Logging in Auth Service**
The auth.service.ts now logs:
- Email being used for login
- Whether user exists in database
- Password hash comparison result
- Detailed error messages

### 2. **Test Endpoint**
```
GET https://xyz-production-b23d.up.railway.app/auth/test
```
Should return:
```json
{
  "status": "ok",
  "message": "Auth module is working",
  "timestamp": "2026-01-04T...",
  "environment": "production"
}
```

---

## 🔍 HOW TO CHECK RAILWAY LOGS

### Option 1: Railway Dashboard
1. Go to: https://railway.app/dashboard
2. Click your backend service
3. Click **"Deployments"** tab
4. Click the latest deployment
5. Click **"View Logs"**

### Option 2: Railway CLI (if installed)
```bash
railway logs
```

---

## 📝 WHAT TO LOOK FOR IN LOGS

When you try to login, you should see:

```
🔐 LOGIN ATTEMPT:
   📧 Email: admin@college.edu
   🔑 Password length: 21 chars
   📅 Timestamp: 2026-01-04T...

✅ USER FOUND: {id: '...', email: '...', role: 'ADMIN', hasPasswordHash: true}
🔄 Comparing passwords...
🔍 Password match result: true
✅ LOGIN SUCCESSFUL for admin@college.edu
```

### If User Not Found:
```
❌ USER NOT FOUND: admin@college.edu
💡 Available users in DB: Run 'select email from "User";' to check
```
**Fix:** Admin user doesn't exist in Railway database. Need to seed it.

### If Password Mismatch:
```
❌ PASSWORD MISMATCH
📝 Provided password: ash...
📝 Hash in DB starts: $2b$10$...
```
**Fix:** Password doesn't match. Check credentials or rehash.

---

## 🧪 TESTING STEPS

### Step 1: Test Basic Connectivity
```bash
curl https://xyz-production-b23d.up.railway.app/auth/test
```
Should return JSON with "status": "ok"

### Step 2: Test Login with Correct Credentials
```bash
curl -X POST https://xyz-production-b23d.up.railway.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@college.edu","password":"ashutoshremotesweeng"}'
```

Expected Success Response (200):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

Expected Error Response (401):
```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

---

## 🔧 COMMON 401 FIXES

### Problem 1: User Doesn't Exist in Railway Database
**Symptom:** Logs show "USER NOT FOUND"

**Fix:** Create admin user in Railway database. SSH into Railway:
```bash
railway run node check-users.js
```
Or manually via Railway database shell:
```sql
INSERT INTO "User" (id, name, email, "passwordHash", role, "isEmailVerified", "emailVerifiedAt", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'Super Admin',
  'admin@college.edu',
  '$2b$10$[hash]', -- Generate with: await bcrypt.hash('ashutoshremotesweeng', 10)
  'ADMIN',
  true,
  NOW(),
  NOW(),
  NOW()
);
```

### Problem 2: Password Hash Mismatch
**Symptom:** Logs show "PASSWORD MISMATCH"

**Causes:**
- Wrong password being sent
- User was created with different password
- Hash algorithm different

**Fix:** Reset admin password in Railway:
```bash
railway run node update-admin-pass.js
```

### Problem 3: JWT Secret Not Set
**Symptom:** Login succeeds in logs but returns 500

**Fix:** Add to Railway environment variables:
```
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
```

### Problem 4: Database Not Connected
**Symptom:** 500 error, logs show Prisma connection error

**Fix:** Verify DATABASE_URL in Railway variables

---

## 📊 DEBUGGING CHECKLIST

- [ ] Railway logs show "Server started successfully"
- [ ] GET /auth/test returns 200
- [ ] Railway DATABASE_URL is set
- [ ] JWT_SECRET is set in Railway
- [ ] Admin user exists in Railway database
- [ ] Admin password is: `ashutoshremotesweeng`
- [ ] Login logs show user found
- [ ] Login logs show password match: true
- [ ] Still getting 401? Check CORS (preflight might be failing)

---

## 🚀 NEXT STEPS

1. **Check Railway Logs** (most important!)
2. **Look for the login attempt logs**
3. **Paste the exact error here**
4. **I'll provide the specific fix**

### Commands to Run:

**Test endpoint:**
```bash
curl https://xyz-production-b23d.up.railway.app/auth/test
```

**Test login:**
```bash
curl -X POST https://xyz-production-b23d.up.railway.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@college.edu","password":"ashutoshremotesweeng"}'
```

**Check local database:**
```bash
cd backend/backend-api
node check-users.js
```

---

## 📞 Report Back With:

1. Railway logs output when you try to login
2. Response from /auth/test endpoint
3. Response from /auth/login attempt
4. Any error messages from browser console

I'll provide the exact fix based on what the logs show!
