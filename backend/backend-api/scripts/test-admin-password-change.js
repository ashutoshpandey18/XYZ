#!/usr/bin/env node

/**
 * Test Admin Password Change API
 *
 * Prerequisites:
 * 1. Backend server running on http://localhost:3000
 * 2. Admin user exists in database
 *
 * Usage: node test-admin-password-change.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Test configuration
const ADMIN_EMAIL = 'admin@college.edu';
const OLD_PASSWORD = 'admin123'; // Change this to your actual admin password
const NEW_PASSWORD = 'NewSecurePassword456';

async function testPasswordChange() {
  console.log('\n🧪 ===== TESTING ADMIN PASSWORD CHANGE API =====\n');

  try {
    // Step 1: Login as admin to get JWT token
    console.log('Step 1: Logging in as admin...');
    console.log(`📧 Email: ${ADMIN_EMAIL}`);
    console.log(`🔑 Password: ${OLD_PASSWORD}\n`);

    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: OLD_PASSWORD,
    });

    const accessToken = loginResponse.data.accessToken;
    const adminRole = loginResponse.data.user.role;

    console.log('✅ Login successful!');
    console.log(`👤 User: ${loginResponse.data.user.name}`);
    console.log(`📧 Email: ${loginResponse.data.user.email}`);
    console.log(`🎭 Role: ${adminRole}`);
    console.log(`🔐 Token: ${accessToken.substring(0, 30)}...\n`);

    if (adminRole !== 'ADMIN') {
      console.error('❌ ERROR: User is not an admin!');
      process.exit(1);
    }

    // Step 2: Change password
    console.log('Step 2: Changing admin password...');
    console.log(`🔑 Old Password: ${OLD_PASSWORD}`);
    console.log(`🔑 New Password: ${NEW_PASSWORD}\n`);

    const changePasswordResponse = await axios.put(
      `${BASE_URL}/admin/change-password`,
      {
        oldPassword: OLD_PASSWORD,
        newPassword: NEW_PASSWORD,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ Password changed successfully!');
    console.log(`📋 Response:`, changePasswordResponse.data);
    console.log('');

    // Step 3: Verify new password works
    console.log('Step 3: Verifying new password...');
    console.log(`🔑 Attempting login with new password: ${NEW_PASSWORD}\n`);

    const verifyLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: NEW_PASSWORD,
    });

    console.log('✅ Login with new password successful!');
    console.log(`👤 User: ${verifyLoginResponse.data.user.name}`);
    console.log(`📧 Email: ${verifyLoginResponse.data.user.email}\n`);

    // Step 4: Change password back to original (cleanup)
    console.log('Step 4: Restoring original password...');
    const newToken = verifyLoginResponse.data.accessToken;

    const restoreResponse = await axios.put(
      `${BASE_URL}/admin/change-password`,
      {
        oldPassword: NEW_PASSWORD,
        newPassword: OLD_PASSWORD,
      },
      {
        headers: {
          Authorization: `Bearer ${newToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ Password restored to original!');
    console.log(`📋 Response:`, restoreResponse.data);
    console.log('');

    console.log('🎉 ===== ALL TESTS PASSED! =====\n');
    console.log('✅ Admin can login with old password');
    console.log('✅ Admin can change password');
    console.log('✅ New password works correctly');
    console.log('✅ Password successfully restored');
    console.log('');

  } catch (error) {
    console.error('\n❌ ===== TEST FAILED! =====\n');

    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Error:`, error.response.data);
    } else {
      console.error('Error:', error.message);
    }

    console.error('\n💡 Possible issues:');
    console.error('- Backend server not running on http://localhost:3000');
    console.error('- Incorrect admin credentials in this script');
    console.error('- Admin user does not exist in database');
    console.error('- Network connectivity issues\n');

    process.exit(1);
  }
}

// Run tests
testPasswordChange();
