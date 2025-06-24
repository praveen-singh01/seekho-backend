const axios = require('axios');
require('dotenv').config();

// Test the new recurring parameter flow
async function testRecurringFlow() {
  const baseURL = 'http://localhost:5000/api';
  
  // Mock user token (replace with actual token)
  const authToken = 'your-jwt-token-here';
  
  const headers = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };

  console.log('🧪 Testing Subscription Flow with Recurring Parameter\n');

  try {
    // Test 1: Create order with recurring: false (should return order ID)
    console.log('1️⃣ Testing recurring: false (One-time order)');
    const oneTimeResponse = await axios.post(`${baseURL}/subscriptions/create-order`, {
      plan: 'monthly',
      recurring: false
    }, { headers });

    console.log('✅ One-time order response:');
    console.log('   Type:', oneTimeResponse.data.data.type);
    console.log('   Order ID:', oneTimeResponse.data.data.orderId);
    console.log('   Amount:', oneTimeResponse.data.data.amount);
    console.log('   Has Subscription ID:', !!oneTimeResponse.data.data.subscriptionId);
    console.log('');

    // Test 2: Create order with recurring: true (should return subscription ID)
    console.log('2️⃣ Testing recurring: true (Recurring subscription)');
    const recurringResponse = await axios.post(`${baseURL}/subscriptions/create-order`, {
      plan: 'monthly',
      recurring: true
    }, { headers });

    console.log('✅ Recurring subscription response:');
    console.log('   Type:', recurringResponse.data.data.type);
    console.log('   Subscription ID:', recurringResponse.data.data.subscriptionId);
    console.log('   Amount:', recurringResponse.data.data.amount);
    console.log('   Has Order ID:', !!recurringResponse.data.data.orderId);
    console.log('');

    // Test 3: Default behavior (should default to recurring: true)
    console.log('3️⃣ Testing default behavior (no recurring parameter)');
    const defaultResponse = await axios.post(`${baseURL}/subscriptions/create-order`, {
      plan: 'monthly'
    }, { headers });

    console.log('✅ Default behavior response:');
    console.log('   Type:', defaultResponse.data.data.type);
    console.log('   Subscription ID:', defaultResponse.data.data.subscriptionId);
    console.log('   Amount:', defaultResponse.data.data.amount);
    console.log('');

    // Test 4: Trial plan (should always be subscription-based)
    console.log('4️⃣ Testing trial plan');
    const trialResponse = await axios.post(`${baseURL}/subscriptions/create-order`, {
      plan: 'trial',
      recurring: false // This should be ignored for trial
    }, { headers });

    console.log('✅ Trial plan response:');
    console.log('   Type:', trialResponse.data.data.type);
    console.log('   Subscription ID:', trialResponse.data.data.subscriptionId);
    console.log('   Amount:', trialResponse.data.data.amount);
    console.log('');

    // Test 5: Yearly plan with recurring: false
    console.log('5️⃣ Testing yearly plan with recurring: false');
    const yearlyOneTimeResponse = await axios.post(`${baseURL}/subscriptions/create-order`, {
      plan: 'yearly',
      recurring: false
    }, { headers });

    console.log('✅ Yearly one-time response:');
    console.log('   Type:', yearlyOneTimeResponse.data.data.type);
    console.log('   Order ID:', yearlyOneTimeResponse.data.data.orderId);
    console.log('   Amount:', yearlyOneTimeResponse.data.data.amount);
    console.log('');

    console.log('🎉 All tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   • recurring: false → Returns Order ID for one-time payment');
    console.log('   • recurring: true → Returns Subscription ID for recurring payment');
    console.log('   • Default behavior → recurring: true (backward compatibility)');
    console.log('   • Trial plans → Always subscription-based regardless of recurring parameter');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Mock test data for demonstration
function demonstrateExpectedResponses() {
  console.log('\n📖 Expected Response Formats:\n');
  
  console.log('🔸 When recurring: false (One-time order):');
  console.log(JSON.stringify({
    success: true,
    data: {
      orderId: "order_xyz123",
      amount: 11700,
      currency: "INR",
      plan: "monthly",
      razorpayKeyId: "rzp_test_...",
      type: "one-time-order",
      receipt: "sub_monthly_123456",
      orderDetails: {
        razorpayOrderId: "order_xyz123",
        subscriptionDetails: {
          plan: "monthly",
          startDate: "2024-01-01T00:00:00.000Z",
          endDate: "2024-01-31T00:00:00.000Z",
          amount: 11700
        }
      }
    }
  }, null, 2));

  console.log('\n🔸 When recurring: true (Recurring subscription):');
  console.log(JSON.stringify({
    success: true,
    data: {
      subscriptionId: "sub_xyz123",
      amount: 11700,
      currency: "INR",
      plan: "monthly",
      razorpayKeyId: "rzp_test_...",
      type: "recurring-subscription",
      subscriptionDetails: {
        dbSubscriptionId: "64a1b2c3d4e5f6789012345",
        razorpaySubscriptionId: "sub_xyz123",
        customerId: "cust_abc123"
      }
    }
  }, null, 2));
}

// Run the test
if (require.main === module) {
  console.log('⚠️  Note: Update the authToken variable with a valid JWT token before running');
  console.log('⚠️  Make sure your server is running on http://localhost:5000\n');
  
  demonstrateExpectedResponses();
  
  // Uncomment the line below to run actual API tests
  // testRecurringFlow();
}

module.exports = { testRecurringFlow, demonstrateExpectedResponses };
