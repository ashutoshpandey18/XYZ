// Script to fix admin user role via Railway API
// Run this locally - it connects to the production backend

const https = require('https');

const BACKEND_URL = 'https://xyz-production-b23d.up.railway.app';

async function makeRequest(path, method, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BACKEND_URL);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log('Testing backend connection...');

  const health = await makeRequest('/health', 'GET');
  console.log('Backend health:', health.data);

  if (health.data.status !== 'healthy') {
    console.error('Backend is not healthy!');
    process.exit(1);
  }

  console.log('\nBackend is connected to database.');
  console.log('\nTo fix the admin user, you need to:');
  console.log('1. Go to Railway Dashboard');
  console.log('2. Click on the PostgreSQL service');
  console.log('3. Go to "Data" tab');
  console.log('4. Run this SQL query:');
  console.log('\n   UPDATE "User" SET role = \'ADMIN\' WHERE email = \'admin@college.edu\';');
  console.log('\nAlternatively, add a one-time admin fix endpoint to the backend.');
}

main().catch(console.error);
