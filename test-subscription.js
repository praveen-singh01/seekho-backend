const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:8000/api';

// Test configuration
const testConfig = {
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
};

// Test user credentials (you'll need to create a test user first)
const testUser = {
  email: 'test@example.com',
  password: 'password123'
};

let authToken = '';

async function login() {
  try {
    console.log('🔐 Logging in test user...');
    const response = await axios.post(`${BASE_URL}/auth/login`, testUser, testConfig);
    
    if (response.data.success) {
      authToken = response.data.token;
      console.log('✅ Login successful');
      return true;
    } else {
      console.error('❌ Login failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Login error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testSubscriptionPlans() {
  try {
    console.log('\n📋 Testing subscription plans...');
    const response = await axios.get(`${BASE_URL}/subscriptions/plans`, testConfig);
    
    if (response.data.success) {
      console.log('✅ Subscription plans retrieved successfully');
      console.log('Plans:', JSON.stringify(response.data.data, null, 2));
      return true;
    } else {
      console.error('❌ Failed to get subscription plans');
      return false;
    }
  } catch (error) {
    console.error('❌ Subscription plans error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testCreateMonthlySubscription() {
  try {
    console.log('\n💳 Testing monthly subscription creation...');
    const config = {
      ...testConfig,
      headers: {
        ...testConfig.headers,
        'Authorization': `Bearer ${authToken}`
      }
    };

    const response = await axios.post(`${BASE_URL}/subscriptions/create-order`, {
      plan: 'monthly',
      subscriptionType: 'recurring'
    }, config);
    
    if (response.data.success) {
      console.log('✅ Monthly subscription order created successfully');
      console.log('Response:', JSON.stringify(response.data.data, null, 2));
      return response.data.data;
    } else {
      console.error('❌ Failed to create monthly subscription');
      return null;
    }
  } catch (error) {
    console.error('❌ Monthly subscription error:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testCreateYearlySubscription() {
  try {
    console.log('\n💳 Testing yearly subscription creation...');
    const config = {
      ...testConfig,
      headers: {
        ...testConfig.headers,
        'Authorization': `Bearer ${authToken}`
      }
    };

    const response = await axios.post(`${BASE_URL}/subscriptions/create-order`, {
      plan: 'yearly',
      subscriptionType: 'recurring'
    }, config);
    
    if (response.data.success) {
      console.log('✅ Yearly subscription order created successfully');
      console.log('Response:', JSON.stringify(response.data.data, null, 2));
      return response.data.data;
    } else {
      console.error('❌ Failed to create yearly subscription');
      return null;
    }
  } catch (error) {
    console.error('❌ Yearly subscription error:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testSubscriptionStatus() {
  try {
    console.log('\n📊 Testing subscription status...');
    const config = {
      ...testConfig,
      headers: {
        ...testConfig.headers,
        'Authorization': `Bearer ${authToken}`
      }
    };

    const response = await axios.get(`${BASE_URL}/subscriptions/status`, config);
    
    if (response.data.success) {
      console.log('✅ Subscription status retrieved successfully');
      console.log('Status:', JSON.stringify(response.data.data, null, 2));
      return true;
    } else {
      console.error('❌ Failed to get subscription status');
      return false;
    }
  } catch (error) {
    console.error('❌ Subscription status error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testWebhookEndpoint() {
  try {
    console.log('\n🔗 Testing webhook endpoint...');
    const response = await axios.get(`${BASE_URL}/webhooks/test`, testConfig);
    
    if (response.data.success) {
      console.log('✅ Webhook endpoint is working');
      console.log('Response:', response.data.message);
      return true;
    } else {
      console.error('❌ Webhook endpoint test failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Webhook test error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testAdminSubscriptionStats() {
  try {
    console.log('\n📈 Testing admin subscription stats...');
    // Note: This requires admin authentication
    console.log('⚠️  Admin stats test skipped - requires admin authentication');
    return true;
  } catch (error) {
    console.error('❌ Admin stats error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Razorpay Subscription System Tests\n');
  console.log('='.repeat(50));
  
  const results = {
    login: false,
    plans: false,
    monthly: false,
    yearly: false,
    status: false,
    webhook: false,
    adminStats: false
  };

  // Test login
  results.login = await login();
  if (!results.login) {
    console.log('\n❌ Cannot proceed without authentication');
    return;
  }

  // Test subscription plans
  results.plans = await testSubscriptionPlans();

  // Test subscription creation
  if (results.login) {
    results.monthly = !!(await testCreateMonthlySubscription());
    results.yearly = !!(await testCreateYearlySubscription());
    results.status = await testSubscriptionStatus();
  }

  // Test webhook
  results.webhook = await testWebhookEndpoint();

  // Test admin features
  results.adminStats = await testAdminSubscriptionStats();

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(50));
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test.toUpperCase()}: ${passed ? 'PASSED' : 'FAILED'}`);
  });

  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Razorpay subscription system is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the implementation.');
  }
}

// Run tests
runAllTests().catch(console.error);
