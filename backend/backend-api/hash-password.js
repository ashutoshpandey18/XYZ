#!/usr/bin/env node

/**
 * Password Hash Generator Utility
 *
 * @description Generates bcrypt password hashes for manual database updates
 * @usage node hash-password.js [password]
 *
 * Examples:
 *   node hash-password.js MySecurePassword123
 *   node hash-password.js
 *
 * @author College Email SaaS Team
 * @version 1.0.0
 */

const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 8;
const DEFAULT_PASSWORD = 'DefaultPassword123';

/**
 * Generates a bcrypt hash for the provided password
 */
async function generatePasswordHash() {
  const password = process.argv[2] || DEFAULT_PASSWORD;

  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    console.error(`\n[ERROR] Password must be at least ${MIN_PASSWORD_LENGTH} characters long\n`);
    process.exit(1);
  }

  try {
    console.log('\n[HASH GENERATOR] Bcrypt Password Hash Generator\n');
    console.log(`Password: ${password}`);
    console.log(`Generating hash (${SALT_ROUNDS} salt rounds)...\n`);

    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    console.log('[SUCCESS] Hash generated successfully\n');
    console.log('Copy this hash to your database:');
    console.log('─'.repeat(60));
    console.log(hash);
    console.log('─'.repeat(60));
    console.log('\nPrisma Studio Usage:');
    console.log(`   UPDATE "User" SET "passwordHash" = '${hash}'`);
    console.log(`   WHERE "email" = 'user@example.com';\n`);

  } catch (error) {
    console.error('\n[ERROR]', error.message, '\n');
    process.exit(1);
  }
}

generatePasswordHash();
