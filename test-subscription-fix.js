const mongoose = require('mongoose');
const Subscription = require('./models/Subscription');
const SubscriptionService = require('./services/subscriptionService');

// Test the subscription fix
async function testSubscriptionFix() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/seekho-app');
    console.log('Connected to database');

    // Test user ID (replace with actual user ID)
    const testUserId = '507f1f77bcf86cd799439011';

    console.log('\n1. Testing getUserSubscription for user with no subscription...');
    const noSubResult = await SubscriptionService.getUserSubscription(testUserId);
    console.log('Result:', {
      hasSubscription: !!noSubResult.subscription,
      isActive: noSubResult.isActive
    });

    console.log('\n2. Creating a pending subscription...');
    const pendingSubscription = await Subscription.create({
      user: testUserId,
      plan: 'monthly',
      status: 'pending',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      amount: 99,
      currency: 'INR',
      paymentProvider: 'razorpay',
      razorpaySubscriptionId: 'sub_test_123',
      subscriptionType: 'recurring',
      isRecurring: true,
      autoRenew: true
    });
    console.log('Pending subscription created:', pendingSubscription._id);

    console.log('\n3. Testing getUserSubscription with pending subscription...');
    const pendingResult = await SubscriptionService.getUserSubscription(testUserId);
    console.log('Result:', {
      hasSubscription: !!pendingResult.subscription,
      isActive: pendingResult.isActive
    });

    console.log('\n4. Activating the subscription...');
    const activateResult = await SubscriptionService.activateRecurringSubscription(
      testUserId,
      'sub_test_123',
      {
        paymentId: 'pay_test_123',
        orderId: 'order_test_123',
        signature: 'signature_test_123'
      }
    );
    console.log('Activation result:', activateResult.success ? 'SUCCESS' : 'FAILED');

    console.log('\n5. Testing getUserSubscription with active subscription...');
    const activeResult = await SubscriptionService.getUserSubscription(testUserId);
    console.log('Result:', {
      hasSubscription: !!activeResult.subscription,
      isActive: activeResult.isActive,
      status: activeResult.subscription?.status
    });

    console.log('\n6. Testing cleanup of pending subscriptions...');
    // Create an old pending subscription
    await Subscription.create({
      user: testUserId,
      plan: 'yearly',
      status: 'pending',
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      amount: 499,
      currency: 'INR',
      paymentProvider: 'razorpay',
      razorpaySubscriptionId: 'sub_test_old',
      subscriptionType: 'recurring',
      isRecurring: true,
      autoRenew: true,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    });

    const cleanupResult = await SubscriptionService.cleanupPendingSubscriptions();
    console.log('Cleanup result:', cleanupResult);

    console.log('\n7. Cleaning up test data...');
    await Subscription.deleteMany({ user: testUserId });
    console.log('Test data cleaned up');

    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

// Run the test
if (require.main === module) {
  require('dotenv').config();
  testSubscriptionFix();
}

module.exports = testSubscriptionFix;
