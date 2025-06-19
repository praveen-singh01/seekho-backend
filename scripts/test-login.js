#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:8000/api';

// Test user credentials
const testUser = {
  email: 'testuser@gmail.com',
  password: 'praveen@123'
};

// Test login function
const testLogin = async () => {
  try {
    console.log('🔐 Testing user login...');
    console.log(`📧 Email: ${testUser.email}`);
    console.log(`🔑 Password: ${testUser.password}\n`);

    const response = await axios.post(`${BASE_URL}/auth/login`, testUser);

    if (response.data.success) {
      console.log('✅ Login successful!');
      console.log('📋 Response data:');
      console.log(`   - Token: ${response.data.data.token.substring(0, 50)}...`);
      console.log(`   - User ID: ${response.data.data.user._id}`);
      console.log(`   - Name: ${response.data.data.user.name}`);
      console.log(`   - Email: ${response.data.data.user.email}`);
      console.log(`   - Role: ${response.data.data.user.role}`);
      console.log(`   - Provider: ${response.data.data.user.provider}`);
      console.log(`   - Verified: ${response.data.data.user.isVerified}`);
      console.log(`   - Last Login: ${response.data.data.user.lastLogin}`);
      console.log(`   - Has Subscription: ${response.data.data.subscription.hasSubscription}`);

      // Test the token by calling /me endpoint
      console.log('\n🔍 Testing token by calling /me endpoint...');
      
      const meResponse = await axios.get(`${BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${response.data.data.token}`
        }
      });

      if (meResponse.data.success) {
        console.log('✅ Token validation successful!');
        console.log(`   - User authenticated as: ${meResponse.data.data.user.name}`);
        console.log(`   - Email: ${meResponse.data.data.user.email}`);
      } else {
        console.log('❌ Token validation failed');
      }

      return response.data.data.token;
    } else {
      console.log('❌ Login failed:', response.data.message);
      return null;
    }

  } catch (error) {
    console.error('❌ Login error:', error.response?.data?.message || error.message);
    return null;
  }
};

// Main function
const main = async () => {
  console.log('🚀 Starting login test...\n');
  
  const token = await testLogin();
  
  if (token) {
    console.log('\n🎉 Login test completed successfully!');
    console.log('\n📝 You can now use this endpoint to login:');
    console.log('   POST /api/auth/login');
    console.log('   Content-Type: application/json');
    console.log('   Body: {');
    console.log('     "email": "testuser@gmail.com",');
    console.log('     "password": "praveen@123"');
    console.log('   }');
    console.log('\n🔑 Use the returned token in Authorization header:');
    console.log('   Authorization: Bearer <token>');
  } else {
    console.log('\n❌ Login test failed!');
  }
};

// Run the test
if (require.main === module) {
  main();
}

module.exports = { testLogin };
