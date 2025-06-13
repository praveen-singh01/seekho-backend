const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000/api';
let authToken = '';

// Test user credentials (update these)
const testUser = {
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User'
};

// Helper function to make authenticated requests
async function makeRequest(method, endpoint, data = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` })
      },
      ...(data && { data })
    };

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`❌ Request failed: ${method} ${endpoint}`);
    if (error.response) {
      console.error('Response:', error.response.data);
      return error.response.data;
    } else {
      console.error('Error:', error.message);
      return null;
    }
  }
}

// Test functions
async function testLogin() {
  console.log('\n🔐 Testing user login...');
  
  const result = await makeRequest('POST', '/auth/login', {
    email: testUser.email,
    password: testUser.password
  });
  
  if (result && result.success && result.token) {
    authToken = result.token;
    console.log('✅ Login successful');
    return true;
  } else {
    console.log('❌ Login failed');
    return false;
  }
}

async function testTrialEligibility() {
  console.log('\n🎯 Testing trial eligibility...');
  
  const result = await makeRequest('GET', '/subscriptions/trial-eligibility');
  
  if (result && result.success) {
    console.log('✅ Trial eligibility check successful:', {
      isTrialEligible: result.data.isTrialEligible,
      hasUsedTrial: result.data.hasUsedTrial
    });
    return result.data.isTrialEligible;
  } else {
    console.log('❌ Trial eligibility check failed');
    return false;
  }
}

async function testAutoRecurringTrialCreation() {
  console.log('\n💰 Testing auto-recurring trial subscription creation...');
  
  const result = await makeRequest('POST', '/subscriptions/create-order', {
    plan: 'trial'
  });
  
  if (result && result.success) {
    console.log('✅ Auto-recurring trial subscription created:', {
      subscriptionId: result.data.subscription_id,
      orderId: result.data.orderId,
      amount: result.data.amount,
      type: result.data.type,
      trialPeriod: result.data.subscriptionDetails?.trialPeriod,
      trialAmount: result.data.subscriptionDetails?.trialAmount,
      monthlyAmount: result.data.subscriptionDetails?.monthlyAmount
    });
    return result.data;
  } else {
    console.log('❌ Auto-recurring trial subscription creation failed');
    return null;
  }
}

async function testPaymentVerification(subscriptionData) {
  console.log('\n✅ Testing payment verification (mock)...');
  
  // Mock payment data (in real scenario, this comes from Razorpay)
  const mockPaymentData = {
    razorpay_subscription_id: subscriptionData.subscription_id,
    razorpay_payment_id: 'pay_mock_' + Date.now(),
    razorpay_signature: 'mock_signature_' + Date.now(),
    plan: 'trial'
  };
  
  console.log('📝 Mock payment data:', mockPaymentData);
  
  const result = await makeRequest('POST', '/subscriptions/verify-payment', mockPaymentData);
  
  if (result && result.success) {
    console.log('✅ Payment verification successful:', {
      subscriptionId: result.data._id,
      plan: result.data.plan,
      status: result.data.status,
      isTrialSubscription: result.data.isTrialSubscription,
      autoRecurring: result.data.metadata?.autoRecurring
    });
    return result.data;
  } else {
    console.log('❌ Payment verification failed');
    return null;
  }
}

async function testSubscriptionStatus() {
  console.log('\n📊 Testing subscription status...');
  
  const result = await makeRequest('GET', '/subscriptions/status');
  
  if (result && result.success) {
    console.log('✅ Subscription status retrieved:', {
      hasSubscription: result.data.hasSubscription,
      isActive: result.data.isActive,
      plan: result.data.subscription?.plan,
      daysRemaining: result.data.daysRemaining,
      autoRenew: result.data.autoRenew
    });
    return result.data;
  } else {
    console.log('❌ Subscription status check failed');
    return null;
  }
}

async function testWebhookSimulation(subscriptionId) {
  console.log('\n🔄 Testing webhook simulation (trial conversion)...');
  
  // Simulate subscription.charged webhook for trial conversion
  const webhookPayload = {
    event: 'subscription.charged',
    payload: {
      subscription: {
        entity: {
          id: subscriptionId
        }
      },
      payment: {
        entity: {
          id: 'pay_webhook_' + Date.now(),
          amount: 11700, // ₹117 in paise
          status: 'captured'
        }
      }
    }
  };
  
  console.log('📝 Simulating webhook payload for trial conversion');
  
  // Note: This would normally be called by Razorpay, but we can test the logic
  const SubscriptionService = require('./services/subscriptionService');
  
  try {
    const result = await SubscriptionService.handleWebhook(
      webhookPayload.event,
      webhookPayload.payload
    );
    
    if (result.success) {
      console.log('✅ Webhook simulation successful:', result.message);
      return true;
    } else {
      console.log('❌ Webhook simulation failed:', result.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Webhook simulation error:', error.message);
    return false;
  }
}

// Main test function
async function runAutoRecurringTrialTests() {
  console.log('🚀 Starting Auto-Recurring Trial Subscription Tests');
  console.log('=' .repeat(60));
  
  try {
    // Step 1: Login
    const loginSuccess = await testLogin();
    if (!loginSuccess) {
      console.log('\n❌ Cannot proceed without authentication');
      return;
    }
    
    // Step 2: Check trial eligibility
    const isEligible = await testTrialEligibility();
    if (!isEligible) {
      console.log('\n⚠️  User is not eligible for trial. Test may still proceed for verification.');
    }
    
    // Step 3: Create auto-recurring trial subscription
    const subscriptionData = await testAutoRecurringTrialCreation();
    if (!subscriptionData) {
      console.log('\n❌ Cannot proceed without subscription creation');
      return;
    }
    
    // Step 4: Verify payment (mock)
    const verifiedSubscription = await testPaymentVerification(subscriptionData);
    if (!verifiedSubscription) {
      console.log('\n❌ Cannot proceed without payment verification');
      return;
    }
    
    // Step 5: Check subscription status
    await testSubscriptionStatus();
    
    // Step 6: Simulate webhook for trial conversion
    if (verifiedSubscription.razorpaySubscriptionId) {
      await testWebhookSimulation(verifiedSubscription.razorpaySubscriptionId);
    }
    
    // Step 7: Check subscription status after conversion
    console.log('\n📊 Checking subscription status after conversion...');
    await testSubscriptionStatus();
    
    console.log('\n🎉 Auto-Recurring Trial Tests Completed!');
    console.log('=' .repeat(60));
    
  } catch (error) {
    console.error('\n💥 Test execution failed:', error.message);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAutoRecurringTrialTests();
}

module.exports = {
  runAutoRecurringTrialTests,
  testLogin,
  testTrialEligibility,
  testAutoRecurringTrialCreation,
  testPaymentVerification,
  testSubscriptionStatus
};
