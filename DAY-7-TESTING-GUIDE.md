# 🧪 Day-7 Testing Guide

## ✅ System Status

**Backend**: ✅ Running on http://localhost:3000
**Frontend**: ✅ Running on http://localhost:5173
**Database**: ✅ PostgreSQL on port 5432

All Day-7 routes verified and mapped:
```
✅ GET    /admin/requests
✅ GET    /admin/requests/:id
✅ PATCH  /admin/requests/:id/approve
✅ PATCH  /admin/requests/:id/reject
✅ POST   /admin/requests/:id/issue-email
✅ GET    /admin/issued-emails
✅ GET    /admin/stats
```

---

## 🎯 Quick Testing Flow

### Step 1: Admin Login

1. Open browser: http://localhost:5173/login
2. Login with admin credentials:
   - **Email**: `admin@college.edu`
   - **Password**: `Admin@123`
3. Should redirect to: http://localhost:5173/admin

### Step 2: View Dashboard

**Expected UI**:
- ✅ Dashboard title "Admin Dashboard"
- ✅ Logout button (top right)
- ✅ 6 stats cards (all showing 0 on fresh DB):
  - Total Requests (gray)
  - Pending (yellow)
  - Approved (green)
  - Rejected (red)
  - Issued (blue)
  - Total Emails (purple)
- ✅ Search input
- ✅ Status filter dropdown
- ✅ Sort controls
- ✅ Empty state message (no requests yet)

### Step 3: Create Test Data

#### Option A: Via Student Flow
1. Logout from admin account
2. Click "Register" → Create student account
3. Login as student
4. Go to Dashboard → Upload ID card (must have 15-digit roll number)
5. Wait for OCR extraction
6. Logout → Login as admin

#### Option B: Via Prisma Studio (Quick)
```bash
# Open new terminal
cd backend\backend-api
npx prisma studio
```

Then create test data manually:
1. Create User (role: STUDENT)
2. Create EmailRequest (studentId: user.id, status: PENDING)
3. Refresh admin dashboard

### Step 4: Test Admin Actions

**On a PENDING Request**:

1. **Approve Request**:
   - Click "Approve ✓" button
   - Request status changes to APPROVED (green badge)
   - Stats update: Pending -1, Approved +1
   - Backend logs: `✅ Request abc-123 approved by admin xyz-456`

2. **Reject Request**:
   - Click "Reject ✗" button
   - Request status changes to REJECTED (red badge)
   - Stats update: Pending -1, Rejected +1
   - Backend logs: `❌ Request abc-123 rejected by admin xyz-456`

**On an APPROVED Request**:

3. **Issue College Email**:
   - Click "Issue Email 📧" button
   - Request status changes to ISSUED (blue badge)
   - Stats update: Approved -1, Issued +1
   - Backend console shows:
     ```
     🔐 TEMP PASSWORD for john@student.edu: Xy9k2Lp4Zm1Q
     📧 College email generated: john45@college.edu
     ✅ College email john45@college.edu issued for John Smith
     ```
   - **Important**: No actual email sent (Day-8 feature)

### Step 5: Test Filtering & Search

1. **Search**:
   - Type student name in search box
   - Table filters in real-time

2. **Status Filter**:
   - Select "Pending" → Shows only PENDING requests
   - Select "Approved" → Shows only APPROVED requests
   - Select "All" → Shows all requests

3. **Sort**:
   - Sort by "Created Date" → Orders by createdAt
   - Sort by "Confidence Score" → Orders by AI confidence
   - Change order: Ascending ↔ Descending

### Step 6: View Request Details

1. Click "View Details 👁️" button on any request
2. **Modal should show**:
   - Student Information (name, email)
   - OCR Extracted Data (name, roll number)
   - AI Analysis (decision, confidence score)
   - Admin Notes (if any)
   - Uploaded Document (image)
3. Click "Close" or click outside modal to dismiss

### Step 7: Verify Database Changes

```bash
# Open Prisma Studio
cd backend\backend-api
npx prisma studio
```

**Check Tables**:

1. **EmailRequest**:
   - Status changed (PENDING → APPROVED → ISSUED)
   - `adminNotes` field populated
   - `processedAt` timestamp set
   - `updatedAt` automatically updated

2. **User** (for issued emails):
   - `collegeEmail` = "john45@college.edu"
   - `emailIssued` = true
   - `emailIssuedAt` = timestamp
   - `emailPassword` = "$2b$10$...hashed..." (bcrypt hash)

3. **IssuedEmailHistory**:
   - New record created
   - Contains issuedEmail, issuedPassword (hashed)

4. **AuditLog**:
   - APPROVE_REQUEST action logged
   - REJECT_REQUEST action logged
   - ISSUE_EMAIL action logged
   - Each with adminId, requestId, createdAt

---

## 🔍 API Testing (Optional)

If you want to test API endpoints directly:

### 1. Get Admin JWT Token

```bash
# Login as admin
curl -X POST http://localhost:3000/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@college.edu\",\"password\":\"Admin@123\"}"

# Copy the "access_token" from response
```

### 2. Test Endpoints

Replace `<TOKEN>` with your JWT token:

```bash
# Get all requests
curl http://localhost:3000/admin/requests ^
  -H "Authorization: Bearer <TOKEN>"

# Get dashboard stats
curl http://localhost:3000/admin/stats ^
  -H "Authorization: Bearer <TOKEN>"

# Get single request details
curl http://localhost:3000/admin/requests/<REQUEST_ID> ^
  -H "Authorization: Bearer <TOKEN>"

# Approve request
curl -X PATCH http://localhost:3000/admin/requests/<REQUEST_ID>/approve ^
  -H "Authorization: Bearer <TOKEN>" ^
  -H "Content-Type: application/json" ^
  -d "{\"adminNotes\":\"Looks good\"}"

# Reject request
curl -X PATCH http://localhost:3000/admin/requests/<REQUEST_ID>/reject ^
  -H "Authorization: Bearer <TOKEN>" ^
  -H "Content-Type: application/json" ^
  -d "{\"adminNotes\":\"Suspicious document\"}"

# Issue college email (DB only)
curl -X POST http://localhost:3000/admin/requests/<REQUEST_ID>/issue-email ^
  -H "Authorization: Bearer <TOKEN>" ^
  -H "Content-Type: application/json" ^
  -d "{\"adminNotes\":\"Email issued successfully\"}"

# Get issued emails history
curl http://localhost:3000/admin/issued-emails ^
  -H "Authorization: Bearer <TOKEN>"
```

---

## 🐛 Troubleshooting

### Issue: "Cannot find admin route"
**Solution**: Make sure backend is running on port 3000

### Issue: "401 Unauthorized"
**Solution**:
- Clear browser localStorage
- Login again to get fresh JWT token
- Check token expiration

### Issue: "Stats showing incorrect counts"
**Solution**:
- Hard refresh browser (Ctrl + Shift + R)
- Check React Query devtools
- Verify database with Prisma Studio

### Issue: "Issue Email button doesn't work"
**Checklist**:
1. ✅ Request status must be APPROVED
2. ✅ Extracted roll number must exist
3. ✅ Email not already issued
4. ✅ Check backend console for logs

### Issue: "Modal doesn't open"
**Solution**:
- Check browser console for errors
- Verify request has all required fields
- Try different request

---

## 📋 Validation Checklist

### UI Features
- [ ] Dashboard loads successfully
- [ ] All 6 stats cards visible
- [ ] Search input works
- [ ] Status filter dropdown works
- [ ] Sort controls work
- [ ] Requests table displays data
- [ ] Status badges color-coded correctly
- [ ] Confidence badges show High/Medium/Low
- [ ] Action buttons appear based on status
- [ ] Modal opens and closes
- [ ] Logout button works

### Admin Actions
- [ ] Can approve PENDING request
- [ ] Can reject PENDING request
- [ ] Can issue email for APPROVED request
- [ ] Cannot issue email for PENDING request
- [ ] Cannot approve already APPROVED request
- [ ] Stats update in real-time after actions
- [ ] Table updates after mutations

### Backend Logs
- [ ] Approval logged: `✅ Request approved`
- [ ] Rejection logged: `❌ Request rejected`
- [ ] Email issuance logged with password
- [ ] College email format correct: `firstname##@college.edu`
- [ ] Audit logs created for all actions

### Database Integrity
- [ ] EmailRequest status updated correctly
- [ ] adminNotes saved
- [ ] processedAt timestamp set
- [ ] User collegeEmail populated (for issued)
- [ ] User emailPassword hashed (bcrypt)
- [ ] IssuedEmailHistory record created
- [ ] AuditLog entries created
- [ ] All foreign keys valid

### Security
- [ ] Admin routes require authentication
- [ ] Non-admin users cannot access /admin
- [ ] JWT token validated on all requests
- [ ] Password hashed with bcrypt (not plain text)
- [ ] Temp password logged to backend only (not API response)

---

## ✅ Expected Results

**After successful Day-7 testing**:

1. ✅ Admin can login and access dashboard
2. ✅ Dashboard shows accurate statistics
3. ✅ Can search, filter, and sort requests
4. ✅ Can approve/reject pending requests
5. ✅ Can issue college email (DB only, no sending)
6. ✅ All actions create audit logs
7. ✅ Database reflects all changes correctly
8. ✅ Frontend UI is responsive and user-friendly
9. ✅ Backend logs provide clear visibility
10. ✅ **No email actually sent** (deferred to Day-8)

---

## 🎯 What's Working

✅ **Complete request management workflow**
✅ **Full CRUD on email requests**
✅ **Database-only email issuance**
✅ **Audit trail for compliance**
✅ **SaaS-level admin dashboard**
✅ **Real-time stats and filtering**
✅ **Role-based access control**
✅ **Password hashing and security**

---

## ⚠️ What's NOT Working (Intentionally)

❌ **Email Sending**: Not implemented (Day-8 feature)
- College email credentials generated
- Saved to database
- Logged to backend console
- But NOT sent via email

**This is by design!** Day-7 focuses on admin dashboard and DB operations.

---

## 🚀 Ready for Day-8

**Preparation**:
1. All credentials stored in database
2. IssuedEmailHistory ready for email sending
3. Audit logs ready for delivery tracking
4. Frontend dashboard complete

**Day-8 Will Add**:
- Nodemailer SMTP configuration
- Email template for credentials
- Delivery status tracking
- Resend credentials feature

---

**Happy Testing! 🎉**

For issues, check:
1. Backend console logs (Terminal 2)
2. Frontend browser console (F12)
3. Database via Prisma Studio
4. Network tab in browser DevTools
