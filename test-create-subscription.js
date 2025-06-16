const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Subscription = require('./models/Subscription');
const User = require('./models/User');

async function createTestSubscription() {
  try {
    console.log('Creating test subscription...');
    
    // Create a test user first
    const testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      googleId: 'test-google-id-123',
      avatar: 'https://example.com/avatar.jpg'
    });
    
    console.log('Test user created:', testUser._id);
    
    // Create a test subscription with the subscription ID from the webhook
    const testSubscription = await Subscription.create({
      user: testUser._id,
      plan: 'yearly',
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      amount: 49900, // ₹499 in paise
      currency: 'INR',
      paymentProvider: 'razorpay',
      paymentId: 'pay_QhJEIvSCmH7LCt', // From the webhook
      orderId: 'order_QhJEIB1rGKcUly', // From the webhook
      razorpaySubscriptionId: 'sub_Qfj43an8dihBeV', // From the webhook - this should match
      razorpayPlanId: 'plan_QOi9FOoj9yBeoX', // From the webhook
      razorpayCustomerId: 'cust_test_123',
      subscriptionType: 'recurring',
      isRecurring: true,
      autoRenew: true,
      nextBillingDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      metadata: {
        customerEmail: 'test@example.com',
        customerPhone: '+916306433585'
      }
    });
    
    console.log('Test subscription created:', testSubscription._id);
    console.log('Razorpay Subscription ID:', testSubscription.razorpaySubscriptionId);
    
    // Update user with subscription reference
    await User.findByIdAndUpdate(testUser._id, { subscription: testSubscription._id });
    
    console.log('✅ Test subscription created successfully!');
    console.log('Now the webhook should be able to find this subscription.');
    
  } catch (error) {
    console.error('Error creating test subscription:', error);
  } finally {
    mongoose.connection.close();
  }
}

createTestSubscription();
