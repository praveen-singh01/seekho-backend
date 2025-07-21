#!/usr/bin/env node

/**
 * Multi-Tenant Validation Test for Seekho Backend
 * 
 * This script validates that both Gumbo applications work independently:
 * - com.gumbo.learning (Seekho app)
 * - com.gumbo.english (Bolo app)
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');

// Configuration
const SEEKHO_BACKEND_URL = 'http://localhost:8000';
const PAYMENT_MICROSERVICE_URL = 'https://payments.netaapp.in';

// Test data for both applications
const TEST_APPS = {
  'com.gumbo.learning': {
    name: 'Seekho Learning',
    planId: 'plan_QkkDaTp9Hje6uC',
    testUser: {
      userId: 'seekho_user_001',
      email: 'user@seekho.app',
      phone: '9999999001'
    }
  },
  'com.gumbo.english': {
    name: 'Bolo English',
    planId: 'plan_QkkDaTp9Hje6uC', // Same plan ID for both apps
    testUser: {
      userId: 'bolo_user_001',
      email: 'user@bolo.app',
      phone: '9999999002'
    }
  }
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Generate JWT token for testing
 */
function generateTestToken(userId, packageId) {
  const secret = 'hdjdjkolso12339nfhf@1!u'; // Backend A JWT secret
  return jwt.sign(
    { userId, appId: packageId },
    secret,
    { expiresIn: '1h' }
  );
}

/**
 * Test subscription plans for each package
 */
async function testSubscriptionPlans(packageId) {
  log(`\n=== Testing Subscription Plans for ${packageId} ===`, colors.blue);
  
  try {
    const response = await axios.get(`${SEEKHO_BACKEND_URL}/api/subscriptions/plans`, {
      headers: {
        'x-package-id': packageId
      }
    });
    
    log('✅ Plans fetched successfully', colors.green);
    log(`   Plans available: ${response.data.subscriptionList.length}`, colors.yellow);
    
    response.data.subscriptionList.forEach(plan => {
      log(`   - ${plan.label}: ₹${plan.priceAfterTax} (${plan.validityInDays} days)`, colors.yellow);
    });
    
    return {
      success: true,
      plans: response.data.subscriptionList
    };
  } catch (error) {
    log('❌ Failed to fetch subscription plans', colors.red);
    log(`   Error: ${error.response?.data?.message || error.message}`, colors.red);
    return { success: false, error: error.message };
  }
}

/**
 * Test direct Payment Microservice subscription creation
 */
async function testDirectMicroserviceSubscription(packageId) {
  log(`\n=== Testing Direct Microservice Subscription for ${packageId} ===`, colors.blue);
  
  const appData = TEST_APPS[packageId];
  const token = generateTestToken(appData.testUser.userId, packageId);
  
  try {
    const response = await axios.post(`${PAYMENT_MICROSERVICE_URL}/api/payment/subscription`, {
      userId: appData.testUser.userId,
      planId: appData.planId,
      paymentContext: {
        subscriptionType: 'premium',
        billingCycle: 'monthly',
        metadata: {
          userEmail: appData.testUser.email,
          userPhone: appData.testUser.phone,
          userId: appData.testUser.userId,
          packageId: packageId
        }
      }
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-app-id': packageId,
        'Content-Type': 'application/json'
      }
    });
    
    log('✅ Subscription created successfully', colors.green);
    log(`   Subscription ID: ${response.data.data.subscriptionId}`, colors.yellow);
    log(`   Razorpay Subscription ID: ${response.data.data.razorpaySubscriptionId}`, colors.yellow);
    log(`   Payment URL: ${response.data.data.shortUrl}`, colors.yellow);
    
    return {
      success: true,
      subscription: response.data.data
    };
  } catch (error) {
    log('❌ Subscription creation failed', colors.red);
    log(`   Error: ${error.response?.data?.error?.message || error.message}`, colors.red);
    return { success: false, error: error.message };
  }
}

/**
 * Test callback URL functionality
 */
async function testCallbackUrl(packageId) {
  log(`\n=== Testing Callback URL for ${packageId} ===`, colors.blue);
  
  const callbackUrl = packageId === 'com.gumbo.learning' 
    ? '/api/payment/callback/learning'
    : '/api/payment/callback/english';
  
  const testPayload = {
    event: 'payment.captured',
    userId: TEST_APPS[packageId].testUser.userId,
    sourceApp: packageId,
    data: {
      subscriptionId: 'test_sub_123',
      razorpaySubscriptionId: 'sub_test_123',
      razorpayPaymentId: 'pay_test_123',
      amount: 11700,
      currency: 'INR',
      planType: 'monthly',
      isRecurring: true
    }
  };
  
  try {
    const response = await axios.post(`${SEEKHO_BACKEND_URL}${callbackUrl}`, testPayload, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    log('✅ Callback URL processed successfully', colors.green);
    log(`   Response: ${response.data.message}`, colors.yellow);
    
    return { success: true, response: response.data };
  } catch (error) {
    log('❌ Callback URL test failed', colors.red);
    log(`   Error: ${error.response?.data?.message || error.message}`, colors.red);
    return { success: false, error: error.message };
  }
}

/**
 * Test package isolation
 */
async function testPackageIsolation() {
  log('\n=== Testing Package Isolation ===', colors.blue);
  
  // Test that com.gumbo.learning token cannot access com.gumbo.english resources
  const learningToken = generateTestToken('test_user_learning', 'com.gumbo.learning');
  
  try {
    // Try to create subscription for English app using Learning app token
    const response = await axios.post(`${PAYMENT_MICROSERVICE_URL}/api/payment/subscription`, {
      userId: 'test_user_learning',
      planId: 'plan_QkkDaTp9Hje6uC',
      paymentContext: {
        subscriptionType: 'premium',
        billingCycle: 'monthly'
      }
    }, {
      headers: {
        'Authorization': `Bearer ${learningToken}`,
        'x-app-id': 'com.gumbo.english', // Different app ID than token
        'Content-Type': 'application/json'
      }
    });
    
    log('❌ Package isolation failed - cross-app access allowed', colors.red);
    return { success: false, error: 'Cross-app access should be blocked' };
  } catch (error) {
    if (error.response?.status === 403 || error.response?.data?.error?.code === 'FORBIDDEN') {
      log('✅ Package isolation working - cross-app access blocked', colors.green);
      return { success: true };
    } else {
      log('⚠️  Unexpected error during isolation test', colors.yellow);
      log(`   Error: ${error.response?.data?.error?.message || error.message}`, colors.yellow);
      return { success: false, error: error.message };
    }
  }
}

/**
 * Test configuration validation
 */
async function testConfiguration() {
  log('\n=== Testing Configuration ===', colors.blue);
  
  const requiredConfig = {
    'USE_PAYMENT_MICROSERVICE': process.env.USE_PAYMENT_MICROSERVICE,
    'PAYMENT_MICROSERVICE_URL': process.env.PAYMENT_MICROSERVICE_URL,
    'PAYMENT_JWT_SECRET_BACKEND_A': process.env.PAYMENT_JWT_SECRET_BACKEND_A,
    'RAZORPAY_MONTHLY_PLAN_ID': process.env.RAZORPAY_MONTHLY_PLAN_ID,
    'RAZORPAY_YEARLY_PLAN_ID': process.env.RAZORPAY_YEARLY_PLAN_ID
  };
  
  let configValid = true;
  
  for (const [key, value] of Object.entries(requiredConfig)) {
    if (value) {
      log(`✅ ${key}: ${value}`, colors.green);
    } else {
      log(`❌ Missing: ${key}`, colors.red);
      configValid = false;
    }
  }
  
  // Test callback URLs
  const callbackUrls = {
    'com.gumbo.learning': process.env.CALLBACK_URL_COM_GUMBO_LEARNING || 'https://learner.netaapp.in/api/payment/callback/learning',
    'com.gumbo.english': process.env.CALLBACK_URL_COM_GUMBO_ENGLISH || 'https://learner.netaapp.in/api/payment/callback/english'
  };
  
  log('\n📋 Callback URLs:', colors.blue);
  for (const [packageId, url] of Object.entries(callbackUrls)) {
    log(`   ${packageId}: ${url}`, colors.yellow);
  }
  
  return { success: configValid };
}

/**
 * Main test runner
 */
async function runMultiTenantValidation() {
  log('🚀 Starting Multi-Tenant Validation Tests', colors.blue);
  log('Testing both com.gumbo.learning and com.gumbo.english applications', colors.blue);
  
  const results = {
    configuration: false,
    plans: {},
    directSubscriptions: {},
    callbacks: {},
    packageIsolation: false
  };
  
  // Test configuration
  const configResult = await testConfiguration();
  results.configuration = configResult.success;
  
  // Test for both packages
  for (const packageId of Object.keys(TEST_APPS)) {
    log(`\n🔍 Testing ${TEST_APPS[packageId].name} (${packageId})`, colors.blue);
    
    // Test subscription plans
    const plansResult = await testSubscriptionPlans(packageId);
    results.plans[packageId] = plansResult.success;
    
    // Test direct microservice integration
    const subscriptionResult = await testDirectMicroserviceSubscription(packageId);
    results.directSubscriptions[packageId] = subscriptionResult.success;
    
    // Test callback URLs
    const callbackResult = await testCallbackUrl(packageId);
    results.callbacks[packageId] = callbackResult.success;
  }
  
  // Test package isolation
  const isolationResult = await testPackageIsolation();
  results.packageIsolation = isolationResult.success;
  
  // Summary
  log('\n=== Multi-Tenant Validation Summary ===', colors.blue);
  log(`Configuration: ${results.configuration ? '✅ PASS' : '❌ FAIL'}`, results.configuration ? colors.green : colors.red);
  log(`Package Isolation: ${results.packageIsolation ? '✅ PASS' : '❌ FAIL'}`, results.packageIsolation ? colors.green : colors.red);
  
  for (const packageId of Object.keys(TEST_APPS)) {
    const appName = TEST_APPS[packageId].name;
    log(`\n${appName} (${packageId}):`, colors.blue);
    log(`  Plans: ${results.plans[packageId] ? '✅ PASS' : '❌ FAIL'}`, results.plans[packageId] ? colors.green : colors.red);
    log(`  Direct Subscription: ${results.directSubscriptions[packageId] ? '✅ PASS' : '❌ FAIL'}`, results.directSubscriptions[packageId] ? colors.green : colors.red);
    log(`  Callback URL: ${results.callbacks[packageId] ? '✅ PASS' : '❌ FAIL'}`, results.callbacks[packageId] ? colors.green : colors.red);
  }
  
  const overallSuccess = results.configuration && 
                         results.packageIsolation &&
                         Object.values(results.plans).every(Boolean) &&
                         Object.values(results.directSubscriptions).every(Boolean) &&
                         Object.values(results.callbacks).every(Boolean);
  
  if (overallSuccess) {
    log('\n🎉 Multi-tenant integration is working perfectly!', colors.green);
    log('✅ Both Gumbo applications are properly isolated', colors.green);
    log('✅ Payment Microservice integration working for both apps', colors.green);
    log('✅ Callback URLs configured correctly', colors.green);
    log('✅ Package isolation enforced', colors.green);
  } else {
    log('\n⚠️  Some multi-tenant tests failed. Please check the configuration.', colors.yellow);
  }
  
  return overallSuccess;
}

// Handle command line execution
if (require.main === module) {
  runMultiTenantValidation().catch(error => {
    log(`\n💥 Test execution failed: ${error.message}`, colors.red);
    process.exit(1);
  });
}

module.exports = { runMultiTenantValidation };
