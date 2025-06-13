const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:8000/api';
let authToken = '';

// Test user credentials
const testUser = {
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User'
};

// Helper function to make authenticated requests
const makeRequest = async (method, url, data = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      data
    };
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`❌ ${method.toUpperCase()} ${url} failed:`, error.response?.data || error.message);
    return null;
  }
};

// Test functions
async function registerAndLogin() {
  console.log('🔐 Testing user registration and login...');
  
  // Try to register
  const registerResult = await makeRequest('POST', '/auth/register', testUser);
  if (registerResult) {
    console.log('✅ User registered successfully');
  }
  
  // Login
  const loginResult = await makeRequest('POST', '/auth/login', {
    email: testUser.email,
    password: testUser.password
  });
  
  if (loginResult && loginResult.token) {
    authToken = loginResult.token;
    console.log('✅ User logged in successfully');
    return true;
  }
  
  console.log('❌ Login failed');
  return false;
}

async function testTrialEligibility() {
  console.log('\n🔍 Testing trial eligibility...');
  
  const result = await makeRequest('GET', '/subscriptions/trial-eligibility');
  if (result) {
    console.log('✅ Trial eligibility check:', result.data);
    return result.data.isTrialEligible;
  }
  
  return false;
}

async function testSubscriptionPlans() {
  console.log('\n📋 Testing subscription plans...');
  
  const result = await makeRequest('GET', '/subscriptions/plans');
  if (result) {
    console.log('✅ Subscription plans:', JSON.stringify(result.data, null, 2));
    return true;
  }
  
  return false;
}

async function testTrialSubscription() {
  console.log('\n💰 Testing trial subscription creation...');
  
  // Create trial order
  const orderResult = await makeRequest('POST', '/subscriptions/create-order', {
    plan: 'trial',
    subscriptionType: 'one-time'
  });
  
  if (!orderResult) {
    console.log('❌ Failed to create trial order');
    return false;
  }
  
  console.log('✅ Trial order created:', {
    orderId: orderResult.data.orderId,
    amount: orderResult.data.amount,
    plan: orderResult.data.plan
  });
  
  // Simulate payment verification (in real scenario, this would come from Razorpay)
  const mockPaymentData = {
    razorpay_order_id: orderResult.data.orderId,
    razorpay_payment_id: 'pay_mock_' + Date.now(),
    razorpay_signature: 'mock_signature_' + Date.now(),
    plan: 'trial'
  };
  
  console.log('🔄 Simulating payment verification...');
  console.log('⚠️  Note: This will fail signature verification in real scenario');
  
  const verifyResult = await makeRequest('POST', '/subscriptions/verify-payment', mockPaymentData);
  if (verifyResult) {
    console.log('✅ Trial subscription created successfully');
    return verifyResult.data;
  }
  
  console.log('❌ Payment verification failed (expected with mock data)');
  return null;
}

async function testMonthlySubscriptionForUsedTrial() {
  console.log('\n🔄 Testing monthly subscription for user who used trial...');
  
  // Try to create trial order again (should fail)
  const trialResult = await makeRequest('POST', '/subscriptions/create-order', {
    plan: 'trial',
    subscriptionType: 'one-time'
  });
  
  if (!trialResult) {
    console.log('✅ Trial order correctly rejected for user who already used trial');
  }
  
  // Create monthly order
  const monthlyResult = await makeRequest('POST', '/subscriptions/create-order', {
    plan: 'monthly',
    subscriptionType: 'recurring'
  });
  
  if (monthlyResult) {
    console.log('✅ Monthly subscription order created:', {
      orderId: monthlyResult.data.orderId,
      amount: monthlyResult.data.amount,
      plan: monthlyResult.data.plan
    });
    return true;
  }
  
  return false;
}

async function testSubscriptionStatus() {
  console.log('\n📊 Testing subscription status...');
  
  const result = await makeRequest('GET', '/subscriptions/status');
  if (result) {
    console.log('✅ Subscription status:', result.data);
    return true;
  }
  
  return false;
}

// Main test runner
async function runTrialSystemTests() {
  console.log('🚀 Starting Trial-Based Subscription System Tests\n');
  console.log('='.repeat(60));
  
  const results = {
    login: false,
    eligibility: false,
    plans: false,
    trial: false,
    monthlyAfterTrial: false,
    status: false
  };
  
  // Test login
  results.login = await registerAndLogin();
  if (!results.login) {
    console.log('\n❌ Cannot proceed without authentication');
    return;
  }
  
  // Test trial eligibility
  results.eligibility = await testTrialEligibility();
  
  // Test subscription plans
  results.plans = await testSubscriptionPlans();
  
  // Test trial subscription
  results.trial = !!(await testTrialSubscription());
  
  // Test monthly subscription for used trial
  results.monthlyAfterTrial = await testMonthlySubscriptionForUsedTrial();
  
  // Test subscription status
  results.status = await testSubscriptionStatus();
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS SUMMARY:');
  console.log('='.repeat(60));
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test.toUpperCase()}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n📈 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Trial system is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the implementation.');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTrialSystemTests().catch(console.error);
}

module.exports = {
  runTrialSystemTests,
  testTrialEligibility,
  testSubscriptionPlans,
  testTrialSubscription
};
