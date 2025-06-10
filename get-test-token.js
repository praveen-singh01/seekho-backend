const axios = require('axios');

const BASE_URL = 'http://localhost:8000/api';

async function getTestToken() {
  try {
    console.log('🔐 Getting test JWT token...');

    // Create a mock JWT token for testing (base64 encoded JSON)
    const mockPayload = {
      sub: 'sample_google_id',
      email: 'john@example.com',
      name: 'John Doe',
      picture: 'https://example.com/avatar.jpg',
      iss: 'accounts.google.com',
      aud: 'test-client-id',
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      iat: Math.floor(Date.now() / 1000)
    };

    // Create a mock JWT token (header.payload.signature)
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64');
    const payload = Buffer.from(JSON.stringify(mockPayload)).toString('base64');
    const signature = 'mock_signature';
    const mockIdToken = `${header}.${payload}.${signature}`;

    // Login with the sample user (Google OAuth simulation)
    const loginResponse = await axios.post(`${BASE_URL}/auth/android/google`, {
      idToken: mockIdToken
    });

    if (loginResponse.data.success && loginResponse.data.token) {
      console.log('✅ Successfully obtained JWT token');
      console.log('🔑 Token:', loginResponse.data.token);
      console.log('\n📋 User Info:');
      console.log('   Name:', loginResponse.data.data.user.name);
      console.log('   Email:', loginResponse.data.data.user.email);
      console.log('   ID:', loginResponse.data.data.user.id);
      
      return loginResponse.data.token;
    } else {
      console.log('❌ Failed to get token:', loginResponse.data);
      return null;
    }
  } catch (error) {
    console.log('❌ Login failed:', error.response?.data || error.message);
    
    // Try alternative login method - regular email/password
    try {
      console.log('\n🔄 Trying alternative login method...');
      
      // First, let's try to create a test user with email/password
      const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
      
      if (registerResponse.data.success) {
        console.log('✅ Created test user, now logging in...');
        
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
          email: 'test@example.com',
          password: 'password123'
        });
        
        if (loginResponse.data.success && loginResponse.data.token) {
          console.log('✅ Successfully obtained JWT token via email/password');
          console.log('🔑 Token:', loginResponse.data.token);
          return loginResponse.data.token;
        }
      }
    } catch (altError) {
      console.log('❌ Alternative login also failed:', altError.response?.data || altError.message);
    }
    
    return null;
  }
}

// Run if this file is executed directly
if (require.main === module) {
  getTestToken().then(token => {
    if (token) {
      console.log('\n🎉 Ready to test endpoints!');
      console.log('💡 Copy this token and use it in your API tests:');
      console.log(`   Authorization: Bearer ${token}`);
    } else {
      console.log('\n❌ Could not obtain test token');
    }
  });
}

module.exports = { getTestToken };
