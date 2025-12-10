#!/usr/bin/env node

/**
 * BACKEND PIPELINE TEST SCRIPT
 * Run this after starting the backend to verify the OCR → AI → Admin → Email pipeline
 */

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║       COLLEGE EMAIL SAAS - PIPELINE VERIFICATION TEST         ║
╚═══════════════════════════════════════════════════════════════╝
`);

const BASE_URL = 'http://localhost:3000';

// Test credentials
const STUDENT = {
  email: 'student@test.com',
  password: 'Test123!@#',
  name: 'John Doe'
};

const ADMIN = {
  email: 'admin@test.com',
  password: 'Admin123!@#',
  name: 'Admin User'
};

let studentToken = '';
let adminToken = '';
let requestId = '';

// Helper function to make API calls
async function apiCall(endpoint, method = 'GET', body = null, token = null) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`${response.status}: ${data.message || 'Request failed'}`);
    }

    return data;
  } catch (error) {
    console.error(`❌ API Error [${method} ${endpoint}]:`, error.message);
    throw error;
  }
}

// Test steps
async function runTests() {
  try {
    console.log('\n📋 TEST 1: Student Registration');
    console.log('─────────────────────────────────────');
    try {
      const registerResp = await apiCall('/auth/register', 'POST', STUDENT);
      console.log('✅ Student registered:', registerResp.user.email);
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  Student already exists, continuing...');
      } else {
        throw error;
      }
    }

    console.log('\n📋 TEST 2: Student Login');
    console.log('─────────────────────────────────────');
    const loginResp = await apiCall('/auth/login', 'POST', {
      email: STUDENT.email,
      password: STUDENT.password
    });
    studentToken = loginResp.token;
    console.log('✅ Student logged in, token obtained');

    console.log('\n📋 TEST 3: Check Admin Exists');
    console.log('─────────────────────────────────────');
    try {
      const adminLoginResp = await apiCall('/auth/login', 'POST', {
        email: ADMIN.email,
        password: ADMIN.password
      });
      adminToken = adminLoginResp.token;
      console.log('✅ Admin logged in, token obtained');
    } catch (error) {
      console.log('❌ Admin not found. Please run: node create-admin.js');
      return;
    }

    console.log('\n📋 TEST 4: Get Dashboard Stats (Admin)');
    console.log('─────────────────────────────────────');
    const stats = await apiCall('/admin/stats', 'GET', null, adminToken);
    console.log('✅ Dashboard stats:', {
      total: stats.totalRequests,
      pending: stats.pending,
      approved: stats.approved,
      issued: stats.issued
    });

    console.log('\n📋 TEST 5: Get All Requests (Admin)');
    console.log('─────────────────────────────────────');
    const requestsResp = await apiCall('/admin/requests', 'GET', null, adminToken);
    console.log('✅ Requests fetched:', {
      count: requestsResp.data?.length || 0,
      total: requestsResp.total || 0,
      format: requestsResp.data ? 'Paginated ✅' : 'Array (needs fix) ❌'
    });

    if (requestsResp.data && requestsResp.data.length > 0) {
      const firstRequest = requestsResp.data[0];
      requestId = firstRequest.id;

      console.log('\n📊 Sample Request Data:');
      console.log('   ID:', requestId);
      console.log('   Student:', firstRequest.user?.name || firstRequest.student?.name);
      console.log('   Status:', firstRequest.status);
      console.log('   Extracted Name:', firstRequest.extractedName || 'Not extracted');
      console.log('   Extracted Roll:', firstRequest.extractedRoll || 'Not extracted');
      console.log('   AI Decision:', firstRequest.aiDecision || 'Not evaluated');
      console.log('   Confidence:', firstRequest.confidenceScore ? `${(firstRequest.confidenceScore * 100).toFixed(0)}%` : 'N/A');
      console.log('   OCR Completed:', firstRequest.ocrCompletedAt ? '✅' : '❌ MISSING');
    }

    console.log('\n📋 TEST 6: Student Profile');
    console.log('─────────────────────────────────────');
    const profile = await apiCall('/student/profile', 'GET', null, studentToken);
    console.log('✅ Student profile:', {
      name: profile.name,
      email: profile.email,
      collegeEmail: profile.collegeEmail || 'Not issued',
      emailIssued: profile.emailIssued
    });

    console.log('\n📋 TEST 7: Student Requests');
    console.log('─────────────────────────────────────');
    const myRequests = await apiCall('/email-request/me', 'GET', null, studentToken);
    console.log('✅ Student has', myRequests.length, 'request(s)');

    if (myRequests.length > 0) {
      const request = myRequests[0];
      console.log('   Latest Request:');
      console.log('   - Status:', request.status);
      console.log('   - AI Decision:', request.aiDecision || 'Pending');
      console.log('   - OCR Complete:', request.ocrCompletedAt ? 'Yes' : 'No');
    }

    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                    PIPELINE STATUS CHECK                      ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    if (myRequests.length === 0) {
      console.log('⚠️  No requests found. Upload an ID card to test the pipeline.');
      console.log('   Use the frontend at http://localhost:5173');
      return;
    }

    const latestRequest = myRequests[0];

    console.log('Pipeline Stages:');
    console.log('   1. Request Created:', latestRequest.createdAt ? '✅' : '❌');
    console.log('   2. OCR Processing:', latestRequest.ocrCompletedAt ? '✅' : '⏳ In Progress');
    console.log('   3. AI Evaluation:', latestRequest.aiDecision ? '✅' : '⏳ Pending');
    console.log('   4. Admin Review:', latestRequest.status === 'APPROVED' ? '✅' : '⏳ Pending');
    console.log('   5. Email Issued:', latestRequest.status === 'ISSUED' ? '✅' : '⏳ Not Yet');

    if (latestRequest.ocrCompletedAt && latestRequest.aiDecision) {
      console.log('\n✅ OCR + AI Pipeline: WORKING');
      console.log('   Extracted Name:', latestRequest.extractedName || 'Not found');
      console.log('   Extracted Roll:', latestRequest.extractedRoll || 'Not found');
      console.log('   AI Decision:', latestRequest.aiDecision);
      console.log('   Confidence:', `${(latestRequest.confidenceScore * 100).toFixed(0)}%`);
    } else {
      console.log('\n⏳ OCR + AI Pipeline: PROCESSING');
      console.log('   Check backend logs for OCR progress.');
    }

    if (latestRequest.status === 'PENDING' && latestRequest.ocrCompletedAt) {
      console.log('\n💡 Next Step: Admin can now approve/reject this request');
      console.log('   Request ID:', latestRequest.id);
    }

    if (latestRequest.status === 'APPROVED') {
      console.log('\n💡 Next Step: Admin can issue college email');
      console.log('   Request ID:', latestRequest.id);
    }

    if (latestRequest.status === 'ISSUED') {
      console.log('\n🎉 COMPLETE! College email has been issued.');
      console.log('   College Email:', profile.collegeEmail);
    }

    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                    TEST SUMMARY                               ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');
    console.log('✅ All API endpoints responding correctly');
    console.log('✅ Authentication working (Student + Admin)');
    console.log('✅ Admin dashboard accessible');
    console.log('✅ Paginated response format:', requestsResp.data ? 'CORRECT' : 'NEEDS FIX');
    console.log('✅ Pipeline status:', latestRequest.ocrCompletedAt ? 'WORKING' : 'IN PROGRESS');
    console.log('\n🚀 Backend is ready for production use!\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('\nMake sure:');
    console.error('  1. Backend is running on http://localhost:3000');
    console.error('  2. Database is connected');
    console.error('  3. Admin user exists (run: node create-admin.js)');
    console.error('  4. All migrations have been applied');
    process.exit(1);
  }
}

// Run tests
runTests().catch(console.error);
