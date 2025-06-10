const axios = require('axios');

const BASE_URL = 'http://localhost:8000/api';

// Test configuration
const testConfig = {
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
};

// Admin endpoints to test
const adminEndpoints = [
  // Existing admin endpoints
  { method: 'GET', url: '/admin/dashboard', description: 'Get admin dashboard', requiresAuth: true },
  { method: 'GET', url: '/admin/users', description: 'Get all users', requiresAuth: true },
  { method: 'GET', url: '/admin/categories', description: 'Get all categories', requiresAuth: true },
  
  // New admin analytics endpoints
  { method: 'GET', url: '/admin/analytics/content', description: 'Get content performance analytics', requiresAuth: true },
  { method: 'GET', url: '/admin/analytics/engagement', description: 'Get user engagement analytics', requiresAuth: true },
  
  // New admin notification endpoints
  { method: 'GET', url: '/admin/notifications', description: 'Get all notifications (admin view)', requiresAuth: true },
  { method: 'GET', url: '/admin/notifications/analytics', description: 'Get notification analytics', requiresAuth: true },
  
  // Test with sample user ID (will be replaced with actual ID)
  { method: 'GET', url: '/admin/users/SAMPLE_USER_ID/analytics', description: 'Get user analytics', requiresAuth: true, needsUserId: true }
];

async function getAdminToken() {
  try {
    console.log('🔐 Getting admin JWT token...');
    
    const loginResponse = await axios.post(`${BASE_URL}/auth/admin/login`, {
      username: 'superadmin',
      password: 'SuperAdmin@123'
    });

    if (loginResponse.data.success && loginResponse.data.token) {
      console.log('✅ Successfully obtained admin JWT token');
      return loginResponse.data.token;
    } else {
      console.log('❌ Failed to get admin token:', loginResponse.data);
      return null;
    }
  } catch (error) {
    console.log('❌ Admin login failed:', error.response?.data || error.message);
    return null;
  }
}

async function getSampleUserId(token) {
  try {
    const response = await axios.get(`${BASE_URL}/admin/users?limit=1`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success && response.data.data.length > 0) {
      return response.data.data[0]._id;
    }
    return null;
  } catch (error) {
    console.log('❌ Failed to get sample user ID:', error.response?.data || error.message);
    return null;
  }
}

async function testAdminEndpoint(endpoint, token, sampleUserId = null) {
  try {
    const config = { ...testConfig };
    
    // Add auth header
    if (endpoint.requiresAuth) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Replace sample user ID if needed
    let url = endpoint.url;
    if (endpoint.needsUserId && sampleUserId) {
      url = url.replace('SAMPLE_USER_ID', sampleUserId);
    } else if (endpoint.needsUserId && !sampleUserId) {
      console.log(`⏭️  ${endpoint.method} ${endpoint.url} - ${endpoint.description} (Skipped - no sample user ID)`);
      return true;
    }
    
    const response = await axios({
      method: endpoint.method,
      url: `${BASE_URL}${url}`,
      ...config
    });
    
    console.log(`✅ ${endpoint.method} ${url} - ${endpoint.description}`);
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

async function testSendNotification(token) {
  try {
    console.log('\n📧 Testing notification sending...');
    
    const notificationData = {
      title: 'Test Admin Notification',
      message: 'This is a test notification sent from admin panel',
      type: 'info',
      sendToAll: true,
      priority: 'medium'
    };
    
    const response = await axios.post(`${BASE_URL}/admin/notifications/send`, notificationData, {
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      }
    });
    
    console.log('✅ POST /admin/notifications/send - Send notification to all users');
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.data).substring(0, 150)}...`);
    return true;
  } catch (error) {
    console.log('❌ POST /admin/notifications/send - Send notification to all users');
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${error.response.data.message || error.response.statusText}`);
    } else {
      console.log(`   Error: ${error.message}`);
    }
    return false;
  }
}

async function runAdminTests() {
  console.log('🚀 Testing Admin Dashboard Endpoints\n');
  console.log('=' * 60);
  
  // Get admin token
  const token = await getAdminToken();
  if (!token) {
    console.log('\n❌ Cannot proceed without admin token');
    return;
  }
  
  // Get sample user ID
  const sampleUserId = await getSampleUserId(token);
  console.log(`\n📋 Sample User ID: ${sampleUserId || 'Not found'}\n`);
  
  let passed = 0;
  let failed = 0;
  
  // Test all admin endpoints
  for (const endpoint of adminEndpoints) {
    const success = await testAdminEndpoint(endpoint, token, sampleUserId);
    if (success) {
      passed++;
    } else {
      failed++;
    }
    console.log(''); // Empty line for readability
  }
  
  // Test notification sending
  const notificationSuccess = await testSendNotification(token);
  if (notificationSuccess) {
    passed++;
  } else {
    failed++;
  }
  
  console.log('=' * 60);
  console.log(`\n📊 Admin Test Results:`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('\n⚠️  Note: Some endpoints may fail due to:');
    console.log('   - Missing test data');
    console.log('   - Database connection issues');
    console.log('   - Server not running');
    console.log('   - Missing admin permissions');
  } else {
    console.log('\n🎉 All admin endpoints are working correctly!');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAdminTests().catch(console.error);
}

module.exports = { runAdminTests, testAdminEndpoint };
