/**
 * Test script for payment verification
 * This script demonstrates how to test both single-time and recurring payment verification
 */

const crypto = require('crypto');

// Mock Razorpay credentials (use your actual test credentials)
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'your_test_secret_key';

/**
 * Generate test signature for single-time payment
 */
function generateOrderSignature(orderId, paymentId) {
  const body = orderId + '|' + paymentId;
  return crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex');
}

/**
 * Generate test signature for subscription payment
 */
function generateSubscriptionSignature(subscriptionId, paymentId) {
  const body = subscriptionId + '|' + paymentId;
  return crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex');
}

/**
 * Test data for single-time payment verification
 */
function getSingleTimePaymentTestData() {
  const orderId = 'order_test_' + Date.now();
  const paymentId = 'pay_test_' + Date.now();
  const signature = generateOrderSignature(orderId, paymentId);
  
  return {
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: signature,
    plan: 'monthly'
  };
}

/**
 * Test data for recurring subscription payment verification
 */
function getRecurringPaymentTestData() {
  const subscriptionId = 'sub_test_' + Date.now();
  const paymentId = 'pay_test_' + Date.now();
  const signature = generateSubscriptionSignature(subscriptionId, paymentId);
  
  return {
    razorpay_subscription_id: subscriptionId,
    razorpay_payment_id: paymentId,
    razorpay_signature: signature,
    plan: 'monthly'
  };
}

/**
 * Test payment verification API
 */
async function testPaymentVerification(baseUrl, authToken) {
  const axios = require('axios');
  
  console.log('🧪 Testing Payment Verification API\n');
  
  // Test 1: Single-time payment
  console.log('📝 Test 1: Single-time Payment Verification');
  try {
    const singleTimeData = getSingleTimePaymentTestData();
    console.log('Request Data:', JSON.stringify(singleTimeData, null, 2));
    
    const response1 = await axios.post(
      `${baseUrl}/api/subscriptions/verify-payment`,
      singleTimeData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Single-time payment verification successful');
    console.log('Response:', JSON.stringify(response1.data, null, 2));
  } catch (error) {
    console.log('❌ Single-time payment verification failed');
    console.log('Error:', error.response?.data || error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 2: Recurring subscription payment
  console.log('📝 Test 2: Recurring Subscription Payment Verification');
  try {
    const recurringData = getRecurringPaymentTestData();
    console.log('Request Data:', JSON.stringify(recurringData, null, 2));
    
    const response2 = await axios.post(
      `${baseUrl}/api/subscriptions/verify-payment`,
      recurringData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Recurring payment verification successful');
    console.log('Response:', JSON.stringify(response2.data, null, 2));
  } catch (error) {
    console.log('❌ Recurring payment verification failed');
    console.log('Error:', error.response?.data || error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 3: Invalid signature
  console.log('📝 Test 3: Invalid Signature Test');
  try {
    const invalidData = {
      razorpay_order_id: 'order_test_invalid',
      razorpay_payment_id: 'pay_test_invalid',
      razorpay_signature: 'invalid_signature',
      plan: 'monthly'
    };
    
    const response3 = await axios.post(
      `${baseUrl}/api/subscriptions/verify-payment`,
      invalidData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('❌ Invalid signature test should have failed');
  } catch (error) {
    console.log('✅ Invalid signature correctly rejected');
    console.log('Error:', error.response?.data || error.message);
  }
}

// Example usage
if (require.main === module) {
  console.log('Payment Verification Test Script');
  console.log('=================================\n');
  
  // Example test data
  console.log('📋 Example Single-time Payment Data:');
  console.log(JSON.stringify(getSingleTimePaymentTestData(), null, 2));
  
  console.log('\n📋 Example Recurring Payment Data:');
  console.log(JSON.stringify(getRecurringPaymentTestData(), null, 2));
  
  console.log('\n💡 To run actual API tests:');
  console.log('testPaymentVerification("http://localhost:5000", "your_jwt_token");');
}

module.exports = {
  generateOrderSignature,
  generateSubscriptionSignature,
  getSingleTimePaymentTestData,
  getRecurringPaymentTestData,
  testPaymentVerification
};
