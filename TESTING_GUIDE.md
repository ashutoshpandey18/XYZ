# Quick Test Guide - Role-Based UI

## 🧪 Testing the Implementation

### Prerequisites
- Backend running on `http://localhost:3000`
- Frontend running on `http://localhost:5174`
- PostgreSQL database running

---

## Test Scenario 1: Student User Journey

### Step 1: Register as Student
1. Navigate to: `http://localhost:5174/register`
2. Fill in the form:
   - Name: `John Student`
   - Email: `john.student@college.edu`
   - Password: `password123`
3. Click "Create account"

**Expected Result**: ✅
- Redirected to `/dashboard`
- See blue/indigo gradient background
- Header shows "STUDENT" badge
- Navbar shows "Student Panel"
- See upload ID card section
- Welcome message: "Welcome back, John!"

### Step 2: Try Accessing Admin Panel
1. Manually navigate to: `http://localhost:5174/admin`

**Expected Result**: ✅
- Auto-redirected back to `/dashboard`
- URL changes to `/dashboard`
- Stay on student panel

### Step 3: Logout and Login
1. Click "Logout" button
2. Navigate to: `http://localhost:5174/login`
3. Enter credentials:
   - Email: `john.student@college.edu`
   - Password: `password123`
4. Click "Sign in"

**Expected Result**: ✅
- Redirected to `/dashboard`
- Same student panel interface

---

## Test Scenario 2: Admin User Journey

### Step 1: Create Admin User (via Database)
Since registration creates STUDENT by default, create admin via backend:

```powershell
$adminBody = @{
  name="Admin User"
  email="admin@college.edu"
  password="admin123"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:3000/auth/register -Method POST -Body $adminBody -ContentType "application/json"
```

Then update role in database:
```sql
UPDATE "User"
SET role = 'ADMIN'
WHERE email = 'admin@college.edu';
```

### Step 2: Login as Admin
1. Navigate to: `http://localhost:5174/login`
2. Enter credentials:
   - Email: `admin@college.edu`
   - Password: `admin123`
3. Click "Sign in"

**Expected Result**: ✅
- Redirected to `/admin`
- See purple/pink gradient background
- Header shows "ADMIN" badge
- Navbar shows "Admin Panel"
- See crown emoji 👑
- See pending requests table
- See approve/reject buttons

### Step 3: Try Accessing Student Dashboard
1. Manually navigate to: `http://localhost:5174/dashboard`

**Expected Result**: ✅
- Auto-redirected back to `/admin`
- URL changes to `/admin`
- Stay on admin panel

---

## Test Scenario 3: Visual Verification

### Student Panel Checklist
- [ ] Background: Blue-Indigo gradient
- [ ] Header card: Blue-Indigo (blue-500 to indigo-600)
- [ ] Badge text: "STUDENT"
- [ ] Navbar subtitle: "Student Panel"
- [ ] User avatar: First initial in white circle
- [ ] Upload section visible
- [ ] Request status table visible
- [ ] No approve/reject buttons

### Admin Panel Checklist
- [ ] Background: Purple-Pink gradient
- [ ] Header card: Purple-Pink (purple-600 to pink-600)
- [ ] Badge text: "ADMIN"
- [ ] Navbar subtitle: "Admin Panel"
- [ ] Crown emoji: 👑
- [ ] Pending requests table visible
- [ ] Approve/reject buttons visible
- [ ] No upload section

---

## Test Scenario 4: Role-Based Access Control

### Test 1: Direct URL Access (Student)
```
Login as student
Try accessing: /admin
Expected: Redirect to /dashboard
```

### Test 2: Direct URL Access (Admin)
```
Login as admin
Try accessing: /dashboard
Expected: Redirect to /admin
```

### Test 3: Logout and Login
```
Logout from student account
Login as admin
Expected: Redirect to /admin

Logout from admin account
Login as student
Expected: Redirect to /dashboard
```

---

## Browser Console Tests

### Check JWT Token
```javascript
// In browser console
const token = localStorage.getItem('accessToken');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('User Role:', payload.role);
// Should be either "STUDENT" or "ADMIN"
```

### Check Role Detection
```javascript
// Should match the decoded token role
import { getUserRole } from './lib/auth';
console.log('Detected Role:', getUserRole());
```

---

## API Testing (PowerShell)

### Test 1: Student Cannot Access Admin Endpoints
```powershell
# Login as student and get token
$loginBody = @{email="john.student@college.edu"; password="password123"} | ConvertTo-Json
$response = Invoke-RestMethod -Uri http://localhost:3000/auth/login -Method POST -Body $loginBody -ContentType "application/json"
$token = $response.accessToken

# Try to access admin endpoint (should fail)
$headers = @{Authorization = "Bearer $token"}
Invoke-RestMethod -Uri http://localhost:3000/email-request -Method GET -Headers $headers
# Expected: 403 Forbidden
```

### Test 2: Admin Can Access Admin Endpoints
```powershell
# Login as admin and get token
$adminLoginBody = @{email="admin@college.edu"; password="admin123"} | ConvertTo-Json
$adminResponse = Invoke-RestMethod -Uri http://localhost:3000/auth/login -Method POST -Body $adminLoginBody -ContentType "application/json"
$adminToken = $adminResponse.accessToken

# Access admin endpoint (should succeed)
$adminHeaders = @{Authorization = "Bearer $adminToken"}
Invoke-RestMethod -Uri http://localhost:3000/email-request -Method GET -Headers $adminHeaders
# Expected: 200 OK with list of requests
```

---

## Common Issues & Solutions

### Issue 1: Both panels look the same
**Solution**: Hard refresh browser (Ctrl+Shift+R) to clear CSS cache

### Issue 2: Redirects not working
**Solution**: Check browser console for JWT decode errors

### Issue 3: "Access denied" on admin panel
**Solution**: Verify user role in database is "ADMIN" not "STUDENT"

### Issue 4: Navbar shows wrong panel name
**Solution**: Clear localStorage and login again

---

## Success Criteria

✅ All tests pass
✅ Visual distinction clear
✅ No console errors
✅ Redirects work correctly
✅ Role badges display
✅ API calls succeed
✅ No unauthorized access

---

## Quick Commands

### Start Backend
```powershell
cd c:\Users\Lenovo\Downloads\college-email-saas\backend\backend-api
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'node dist/main.js' -WindowStyle Minimized
```

### Check Backend Health
```powershell
Invoke-RestMethod -Uri http://localhost:3000/health
```

### Frontend Should Already Be Running
Check: `http://localhost:5174`

---

**Ready to test!** 🚀
