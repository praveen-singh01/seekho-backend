#!/usr/bin/env node

/**
 * Complete End-to-End Subscription Flow Test
 * Tests all endpoints from authentication to subscription creation
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:8000';
const TEST_USER = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123',
  phone: '+919876543210'
};

let authToken = '';
let userId = '';

// Helper function to make API requests
async function makeRequest(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}/api${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return {
      success: true,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 500,
      error: error.response?.data || error.message
    };
  }
}

// Test 1: Health Check
async function testHealthCheck() {
  console.log('🏥 Testing Health Check...');
  
  const result = await makeRequest('GET', '/../health');
  
  if (result.success) {
    console.log('✅ Health check passed');
    return true;
  } else {
    console.log('❌ Health check failed:', result.error);
    return false;
  }
}

// Test 2: User Registration
async function testUserRegistration() {
  console.log('\n👤 Testing User Registration...');
  
  const result = await makeRequest('POST', '/auth/register', TEST_USER);
  
  if (result.success) {
    console.log('✅ User registration successful');
    console.log(`   - User ID: ${result.data.user?._id || 'N/A'}`);
    userId = result.data.user?._id;
    return true;
  } else if (result.status === 400 && result.error.message?.includes('already exists')) {
    console.log('ℹ️  User already exists, proceeding with login');
    return true;
  } else {
    console.log('❌ User registration failed:', result.error);
    return false;
  }
}

// Test 3: User Login
async function testUserLogin() {
  console.log('\n🔐 Testing User Login...');
  
  const result = await makeRequest('POST', '/auth/login', {
    email: TEST_USER.email,
    password: TEST_USER.password
  });
  
  if (result.success) {
    authToken = result.data.token;
    userId = result.data.user._id;
    console.log('✅ User login successful');
    console.log(`   - Token: ${authToken.substring(0, 20)}...`);
    console.log(`   - User ID: ${userId}`);
    return true;
  } else {
    console.log('❌ User login failed:', result.error);
    return false;
  }
}

// Test 4: Get Subscription Plans
async function testGetPlans() {
  console.log('\n📋 Testing Get Subscription Plans...');
  
  const result = await makeRequest('GET', '/subscriptions/plans', null, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (result.success) {
    console.log('✅ Plans retrieved successfully');
    const plans = result.data.subscriptionList || [];
    plans.forEach(plan => {
      console.log(`   - ${plan.label}: ₹${plan.priceAfterTax} (${plan.validityInDays} days)`);
    });
    return { success: true, plans };
  } else {
    console.log('❌ Failed to get plans:', result.error);
    return { success: false };
  }
}

// Test 5: Check Trial Eligibility
async function testTrialEligibility() {
  console.log('\n🎯 Testing Trial Eligibility...');
  
  const result = await makeRequest('GET', '/subscriptions/trial-eligibility', null, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (result.success) {
    console.log('✅ Trial eligibility checked');
    console.log(`   - Eligible: ${result.data.eligible}`);
    console.log(`   - Message: ${result.data.message || 'N/A'}`);
    return { success: true, eligible: result.data.eligible };
  } else {
    console.log('❌ Failed to check trial eligibility:', result.error);
    return { success: false, eligible: false };
  }
}

// Test 6: Create Auto-Converting Trial Subscription
async function testCreateAutoConvertingTrial() {
  console.log('\n🔄 Testing Auto-Converting Trial Creation...');
  
  const result = await makeRequest('POST', '/subscriptions/create-trial-with-mandate', {
    name: TEST_USER.name,
    email: TEST_USER.email,
    phone: TEST_USER.phone
  }, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (result.success) {
    console.log('✅ Auto-converting trial created successfully');
    console.log(`   - Subscription ID: ${result.data.subscriptionId}`);
    console.log(`   - Razorpay Subscription ID: ${result.data.razorpaySubscriptionId}`);
    console.log(`   - Trial Amount: ₹${result.data.trialAmount / 100}`);
    console.log(`   - Main Amount: ₹${result.data.mainAmount / 100}`);
    console.log(`   - Trial Period: ${result.data.trialPeriod} days`);
    console.log(`   - Auto Conversion: ${result.data.autoConversion}`);
    console.log(`   - Type: ${result.data.type}`);
    
    return {
      success: true,
      subscriptionData: result.data
    };
  } else {
    console.log('❌ Auto-converting trial creation failed:', result.error);
    return { success: false };
  }
}

// Test 7: Create Monthly Subscription Order
async function testCreateMonthlyOrder() {
  console.log('\n💰 Testing Monthly Subscription Order...');
  
  const result = await makeRequest('POST', '/subscriptions/create-order', {
    plan: 'monthly',
    subscriptionType: 'recurring'
  }, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (result.success) {
    console.log('✅ Monthly subscription order created');
    console.log(`   - Subscription ID: ${result.data.subscriptionId}`);
    console.log(`   - Amount: ₹${result.data.amount / 100}`);
    console.log(`   - Plan: ${result.data.plan}`);
    console.log(`   - Type: ${result.data.type}`);
    
    return {
      success: true,
      orderData: result.data
    };
  } else {
    console.log('❌ Monthly subscription order failed:', result.error);
    return { success: false };
  }
}

// Test 8: Create Yearly Subscription Order
async function testCreateYearlyOrder() {
  console.log('\n🗓️ Testing Yearly Subscription Order...');
  
  const result = await makeRequest('POST', '/subscriptions/create-order', {
    plan: 'yearly',
    subscriptionType: 'recurring'
  }, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (result.success) {
    console.log('✅ Yearly subscription order created');
    console.log(`   - Subscription ID: ${result.data.subscriptionId}`);
    console.log(`   - Amount: ₹${result.data.amount / 100}`);
    console.log(`   - Plan: ${result.data.plan}`);
    console.log(`   - Type: ${result.data.type}`);
    
    return {
      success: true,
      orderData: result.data
    };
  } else {
    console.log('❌ Yearly subscription order failed:', result.error);
    return { success: false };
  }
}

// Test 9: Check Subscription Status
async function testSubscriptionStatus() {
  console.log('\n📊 Testing Subscription Status...');
  
  const result = await makeRequest('GET', '/subscriptions/status', null, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (result.success) {
    console.log('✅ Subscription status retrieved');
    console.log(`   - Has Subscription: ${result.data.hasSubscription}`);
    console.log(`   - Is Active: ${result.data.isActive}`);
    if (result.data.subscription) {
      console.log(`   - Plan: ${result.data.subscription.plan}`);
      console.log(`   - Status: ${result.data.subscription.status}`);
      console.log(`   - End Date: ${result.data.subscription.endDate}`);
    }
    return { success: true, status: result.data };
  } else {
    console.log('❌ Failed to get subscription status:', result.error);
    return { success: false };
  }
}

// Main test runner
async function runCompleteTest() {
  console.log('🚀 Starting Complete Subscription Flow Test\n');
  console.log('=' .repeat(60));
  
  const results = {
    healthCheck: false,
    userRegistration: false,
    userLogin: false,
    getPlans: false,
    trialEligibility: false,
    autoConvertingTrial: false,
    monthlyOrder: false,
    yearlyOrder: false,
    subscriptionStatus: false
  };
  
  try {
    // Test 1: Health Check
    results.healthCheck = await testHealthCheck();
    if (!results.healthCheck) {
      console.log('\n❌ Server is not running. Please start the server first.');
      return;
    }
    
    // Test 2: User Registration
    results.userRegistration = await testUserRegistration();
    
    // Test 3: User Login
    results.userLogin = await testUserLogin();
    if (!results.userLogin) {
      console.log('\n❌ Cannot proceed without authentication');
      return;
    }
    
    // Test 4: Get Plans
    const plansResult = await testGetPlans();
    results.getPlans = plansResult.success;
    
    // Test 5: Trial Eligibility
    const eligibilityResult = await testTrialEligibility();
    results.trialEligibility = eligibilityResult.success;
    
    // Test 6: Auto-Converting Trial (if eligible)
    if (eligibilityResult.eligible) {
      const trialResult = await testCreateAutoConvertingTrial();
      results.autoConvertingTrial = trialResult.success;
    } else {
      console.log('\nℹ️  Skipping trial creation - user not eligible');
    }
    
    // Test 7: Monthly Order
    const monthlyResult = await testCreateMonthlyOrder();
    results.monthlyOrder = monthlyResult.success;
    
    // Test 8: Yearly Order
    const yearlyResult = await testCreateYearlyOrder();
    results.yearlyOrder = yearlyResult.success;
    
    // Test 9: Subscription Status
    const statusResult = await testSubscriptionStatus();
    results.subscriptionStatus = statusResult.success;
    
  } catch (error) {
    console.error('\n💥 Test suite failed with error:', error.message);
  }
  
  // Print Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📋 TEST SUMMARY');
  console.log('=' .repeat(60));
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const testName = test.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    console.log(`${status} - ${testName}`);
  });
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log('\n' + '=' .repeat(60));
  console.log(`🎯 OVERALL RESULT: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED! System is ready for production.');
  } else {
    console.log('⚠️  Some tests failed. Please review and fix issues before production.');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runCompleteTest().catch(console.error);
}

module.exports = { runCompleteTest };
