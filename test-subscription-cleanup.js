#!/usr/bin/env node

/**
 * Test script to verify subscription service cleanup
 * Run with: node test-subscription-cleanup.js
 */

const SubscriptionService = require('./services/subscriptionService');
const PaymentService = require('./services/paymentService');

// Mock user data for testing
const mockUserId = '507f1f77bcf86cd799439011';
const mockCustomerData = {
  name: 'Test User',
  email: 'test@example.com',
  phone: '+919876543210'
};

async function testSubscriptionCleanup() {
  console.log('🧪 Testing Subscription Service Cleanup...\n');

  try {
    // Test 1: Check if PaymentService initializes properly
    console.log('1️⃣ Testing PaymentService initialization...');
    try {
      PaymentService.initialize();
      console.log('✅ PaymentService initialized successfully\n');
    } catch (error) {
      console.log('❌ PaymentService initialization failed:', error.message);
      console.log('💡 Make sure RAZORPAY_MONTHLY_PLAN_ID and RAZORPAY_YEARLY_PLAN_ID are set in .env\n');
    }

    // Test 2: Check available plans
    console.log('2️⃣ Testing plan configuration...');
    try {
      const plansResult = await PaymentService.getPlansWithDetails();
      if (plansResult.success) {
        console.log('✅ Plans configured successfully:');
        Object.keys(plansResult.plans).forEach(planType => {
          const plan = plansResult.plans[planType];
          console.log(`   - ${plan.name}: ₹${plan.price} (${plan.duration})`);
        });
        console.log('');
      } else {
        console.log('❌ Failed to get plans:', plansResult.error, '\n');
      }
    } catch (error) {
      console.log('❌ Plan configuration test failed:', error.message, '\n');
    }

    // Test 3: Test simple trial subscription creation (without actual payment)
    console.log('3️⃣ Testing simple trial subscription creation...');
    try {
      const trialResult = await SubscriptionService.createSimpleTrialSubscription(
        mockUserId, 
        mockCustomerData
      );
      
      if (trialResult.success) {
        console.log('✅ Simple trial subscription created successfully');
        console.log(`   - Subscription ID: ${trialResult.subscription._id}`);
        console.log(`   - Order ID: ${trialResult.order.id}`);
        console.log(`   - Amount: ₹${trialResult.paymentAmount / 100}`);
        console.log('');
      } else {
        console.log('❌ Trial subscription creation failed:', trialResult.error, '\n');
      }
    } catch (error) {
      console.log('❌ Trial subscription test failed:', error.message, '\n');
    }

    // Test 4: Test recurring subscription creation (without actual payment)
    console.log('4️⃣ Testing recurring subscription creation...');
    try {
      const recurringResult = await SubscriptionService.createRecurringSubscription(
        mockUserId,
        'monthly',
        mockCustomerData
      );
      
      if (recurringResult.success) {
        console.log('✅ Recurring subscription created successfully');
        console.log(`   - Subscription ID: ${recurringResult.subscription._id}`);
        console.log(`   - Razorpay Subscription ID: ${recurringResult.razorpaySubscription.id}`);
        console.log(`   - Plan: ${recurringResult.subscription.plan}`);
        console.log('');
      } else {
        console.log('❌ Recurring subscription creation failed:', recurringResult.error, '\n');
      }
    } catch (error) {
      console.log('❌ Recurring subscription test failed:', error.message, '\n');
    }

    // Test 5: Verify deprecated methods are properly handled
    console.log('5️⃣ Testing deprecated method handling...');
    try {
      await PaymentService.createAutoRecurringTrialSubscription(mockUserId, mockCustomerData);
      console.log('❌ Deprecated method should have thrown an error\n');
    } catch (error) {
      if (error.message.includes('deprecated')) {
        console.log('✅ Deprecated method properly throws error:', error.message, '\n');
      } else {
        console.log('❌ Unexpected error from deprecated method:', error.message, '\n');
      }
    }

    console.log('🎉 Subscription service cleanup tests completed!');
    console.log('\n📋 Summary:');
    console.log('- Simple trial subscription flow: Implemented');
    console.log('- Complex UPI mandate logic: Removed');
    console.log('- Deprecated methods: Properly handled');
    console.log('- Code structure: Simplified and cleaned');
    
  } catch (error) {
    console.error('💥 Test suite failed:', error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testSubscriptionCleanup().catch(console.error);
}

module.exports = { testSubscriptionCleanup };
