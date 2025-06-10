const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test configuration
const testConfig = {
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
};

// Test endpoints
const endpoints = [
  // Critical Priority Endpoints
  { method: 'GET', url: '/categories/673b8b8b8b8b8b8b8b8b8b8b/complete', description: 'Get complete category data' },
  { method: 'GET', url: '/videos/popular', description: 'Get popular videos' },
  { method: 'GET', url: '/videos/new', description: 'Get new videos' },
  
  // High Priority Endpoints (require auth)
  { method: 'GET', url: '/users/watch-history', description: 'Get user watch history', requiresAuth: true },
  { method: 'GET', url: '/users/favorites', description: 'Get user favorites', requiresAuth: true },
  { method: 'GET', url: '/users/profile', description: 'Get user profile', requiresAuth: true },
  { method: 'GET', url: '/users/stats', description: 'Get user statistics', requiresAuth: true },
  
  // Medium Priority Endpoints
  { method: 'GET', url: '/users/bookmarks', description: 'Get user bookmarks', requiresAuth: true },
  { method: 'GET', url: '/videos/673b8b8b8b8b8b8b8b8b8b8b/related', description: 'Get related videos' },
  { method: 'GET', url: '/topics/673b8b8b8b8b8b8b8b8b8b8b/related', description: 'Get related topics' },
  
  // Low Priority Endpoints
  { method: 'GET', url: '/categories/673b8b8b8b8b8b8b8b8b8b8b/updates', description: 'Get category updates' },
  { method: 'GET', url: '/notifications', description: 'Get notifications', requiresAuth: true },
  { method: 'GET', url: '/notifications/unread-count', description: 'Get unread notification count', requiresAuth: true }
];

async function testEndpoint(endpoint) {
  try {
    const config = { ...testConfig };
    
    // Add auth header if required (you'll need to replace with actual token)
    if (endpoint.requiresAuth) {
      config.headers.Authorization = 'Bearer YOUR_JWT_TOKEN_HERE';
    }
    
    const response = await axios({
      method: endpoint.method,
      url: `${BASE_URL}${endpoint.url}`,
      ...config
    });
    
    console.log(`✅ ${endpoint.method} ${endpoint.url} - ${endpoint.description}`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.data).substring(0, 100)}...`);
    return true;
  } catch (error) {
    console.log(`❌ ${endpoint.method} ${endpoint.url} - ${endpoint.description}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${error.response.data.message || error.response.statusText}`);
    } else {
      console.log(`   Error: ${error.message}`);
    }
    return false;
  }
}

async function runTests() {
  console.log('🚀 Testing New API Endpoints\n');
  console.log('=' * 50);
  
  let passed = 0;
  let failed = 0;
  
  for (const endpoint of endpoints) {
    const success = await testEndpoint(endpoint);
    if (success) {
      passed++;
    } else {
      failed++;
    }
    console.log(''); // Empty line for readability
  }
  
  console.log('=' * 50);
  console.log(`\n📊 Test Results:`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('\n⚠️  Note: Some endpoints may fail due to:');
    console.log('   - Missing authentication token');
    console.log('   - Invalid ObjectIds in test URLs');
    console.log('   - Server not running');
    console.log('   - Database connection issues');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, testEndpoint };
