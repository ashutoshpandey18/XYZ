const axios = require('axios');

const API_URL = 'https://xyz-production-b23d.up.railway.app';

async function createAdmin() {
  try {
    console.log('Creating admin user...');
    const response = await axios.post(`${API_URL}/auth/register`, {
      name: 'Super Admin',
      email: 'admin@college.edu',
      password: 'ashutoshajita20232025',
      role: 'ADMIN'
    });

    console.log('✅ Admin created successfully!');
    console.log('Email:', 'admin@college.edu');
    console.log('Password:', 'ashutoshajita20232025');
  } catch (error) {
    if (error.response) {
      console.log('Error:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
  }
}

createAdmin();
