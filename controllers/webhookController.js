const crypto = require('crypto');
const SubscriptionService = require('../services/subscriptionService');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const { getPackageFilter } = require('../config/packages');

// Helper function to check if webhook should be ignored
const checkIfShouldIgnoreWebhook = (payload) => {
  // Check for Suvichar app webhooks
  if (payload && payload.subscription && payload.subscription.entity && payload.subscription.entity.notes) {
    const notes = payload.subscription.entity.notes;

    // Check if this webhook is from Suvichar app
    if (notes.AppName && (notes.AppName === 'SUVICHAR' || notes.AppName === 'suvichar')) {
      return {
        ignore: true,
        reason: `Different app: ${notes.AppName}`
      };
    }

    // Check package name for Suvichar
    if (notes.packageName && notes.packageName.includes('suvichar')) {
      return {
        ignore: true,
        reason: `Different package: ${notes.packageName}`
      };
    }

    // Check for other non-Seekho packages
    if (notes.packageName &&
        !notes.packageName.includes('seekho') &&
        !notes.packageName.includes('learning') &&
        !notes.packageName.includes('gumbo')) {
      return {
        ignore: true,
        reason: `Unknown package: ${notes.packageName}`
      };
    }
  }

  // Check payment webhooks - look for order description or amount patterns
  if (payload && payload.payment && payload.payment.entity) {
    const payment = payload.payment.entity;

    // Check if payment is from a different app based on description
    if (payment.description && payment.description.includes('Suvichar')) {
      return {
        ignore: true,
        reason: `Payment from different app: ${payment.description}`
      };
    }

    // Specifically ignore ₹5 payments (500 paise) as they're likely from Suvichar
    if (payment.amount === 500) {
      return {
        ignore: true,
        reason: `₹5 payment likely from Suvichar app`
      };
    }

    // Check for specific amounts that don't match our plans
    // Our plans: ₹1 (100 paise), ₹117 (11700 paise), ₹587 (58700 paise)
    const validAmounts = [100, 11700, 58700]; // Updated to include ₹587 for yearly
    if (payment.amount && !validAmounts.includes(payment.amount)) {
      return {
        ignore: true,
        reason: `Payment amount ${payment.amount} paise (₹${payment.amount/100}) doesn't match our plans`
      };
    }

    // Check order_id patterns - Suvichar might have different order ID patterns
    if (payment.order_id && payment.order_id.includes('suvichar')) {
      return {
        ignore: true,
        reason: `Order from different app: ${payment.order_id}`
      };
    }
  }

  return { ignore: false };
};

// @desc    Handle Razorpay webhooks
// @route   POST /api/webhooks/razorpay
// @access  Public (but verified)
const handleRazorpayWebhook = async (req, res) => {
  try {
    const webhookSignature = req.headers['x-razorpay-signature'];
    const webhookBody = JSON.stringify(req.body);

    // Verify webhook signature (temporarily disabled for debugging)
    // TODO: Re-enable signature verification once webhook source is confirmed
    /*
    if (!verifyWebhookSignature(webhookBody, webhookSignature)) {
      console.error('Invalid webhook signature');
      return res.status(400).json({
        success: false,
        message: 'Invalid signature'
      });
    }
    */
    console.log('⚠️  Webhook signature verification temporarily disabled for debugging');

    const { event, payload } = req.body;

    console.log(`\n🔔 Received Razorpay webhook: ${event}`);

    // Log webhook details for debugging
    if (payload && payload.subscription && payload.subscription.entity) {
      const subscription = payload.subscription.entity;
      console.log(`📋 Subscription ID: ${subscription.id}`);

      if (subscription.notes) {
        console.log(`📝 Notes:`, {
          AppName: subscription.notes.AppName,
          packageName: subscription.notes.packageName,
          userId: subscription.notes.userId
        });
      }
    }

    // Log payment webhook details
    if (payload && payload.payment && payload.payment.entity) {
      const payment = payload.payment.entity;
      console.log(`💳 Payment ID: ${payment.id}`);
      console.log(`📋 Order ID: ${payment.order_id}`);
      console.log(`💰 Amount: ${payment.amount} paise (₹${payment.amount/100})`);
      console.log(`📝 Description: ${payment.description}`);
      console.log(`📧 Email: ${payment.email}`);
      console.log(`📱 Status: ${payment.status}`);
      if (payment.error_reason) {
        console.log(`❌ Error: ${payment.error_reason} - ${payment.error_description}`);
      }
    }

    // Filter webhooks by app - only process webhooks for our app
    const shouldIgnoreWebhook = checkIfShouldIgnoreWebhook(payload);
    if (shouldIgnoreWebhook.ignore) {
      console.log(`🚫 Ignoring webhook: ${shouldIgnoreWebhook.reason}`);
      return res.status(200).json({
        success: true,
        message: `Webhook ignored: ${shouldIgnoreWebhook.reason}`
      });
    }

    console.log(`✅ Processing webhook for Seekho app`);

    // Process the webhook event
    const result = await SubscriptionService.handleWebhook(event, payload);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message || 'Webhook processed successfully'
      });
    } else {
      console.error(`Webhook processing failed: ${result.error}`);
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Verify Razorpay webhook signature
const verifyWebhookSignature = (body, signature) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('RAZORPAY_WEBHOOK_SECRET not configured');
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'utf8'),
      Buffer.from(expectedSignature, 'utf8')
    );
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
};

// @desc    Test webhook endpoint
// @route   GET /api/webhooks/test
// @access  Public
const testWebhook = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Webhook endpoint is working',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Debug subscriptions
// @route   GET /api/webhooks/debug-subscriptions
// @access  Public
const debugSubscriptions = async (req, res) => {
  try {
    const Subscription = require('../models/Subscription');

    const subscriptions = await Subscription.find({}, 'razorpaySubscriptionId plan status createdAt').limit(10);

    res.status(200).json({
      success: true,
      count: subscriptions.length,
      subscriptions: subscriptions.map(s => ({
        id: s._id,
        razorpayId: s.razorpaySubscriptionId,
        plan: s.plan,
        status: s.status,
        createdAt: s.createdAt
      }))
    });
  } catch (error) {
    console.error('Debug subscriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Debug environment and pricing
// @route   GET /api/webhooks/debug-pricing
// @access  Public
const debugPricing = async (req, res) => {
  try {
    const PaymentService = require('../services/paymentService');

    res.status(200).json({
      success: true,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        TRIAL_PRICE: process.env.TRIAL_PRICE,
        MONTHLY_PRICE: process.env.MONTHLY_PRICE,
        YEARLY_PRICE: process.env.YEARLY_PRICE,
        TRIAL_DURATION_DAYS: process.env.TRIAL_DURATION_DAYS,
        RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID ? 'Set' : 'Not Set',
        RAZORPAY_MONTHLY_PLAN_ID: process.env.RAZORPAY_MONTHLY_PLAN_ID,
        RAZORPAY_YEARLY_PLAN_ID: process.env.RAZORPAY_YEARLY_PLAN_ID
      },
      calculatedPrices: {
        trial: PaymentService.calculateSubscriptionDates('trial'),
        monthly: PaymentService.calculateSubscriptionDates('monthly'),
        yearly: PaymentService.calculateSubscriptionDates('yearly')
      },
      plans: PaymentService.getSubscriptionPlans()
    });
  } catch (error) {
    console.error('Debug pricing error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ===== PAYMENT MICROSERVICE CALLBACK HANDLERS =====

/**
 * Handle Payment Microservice callback for Seekho (com.gumbo.learning)
 * @route POST /api/payment/callback/learning
 */
const handlePaymentCallbackLearning = async (req, res) => {
  try {
    console.log('Payment callback received for Seekho (com.gumbo.learning):', req.body);

    const { event, userId, sourceApp, data } = req.body;

    // Verify sourceApp matches expected package
    if (sourceApp !== 'com.gumbo.learning') {
      console.warn('Package ID mismatch in callback:', { expected: 'com.gumbo.learning', received: sourceApp });
      return res.status(400).json({
        success: false,
        message: 'Package ID mismatch'
      });
    }

    const packageFilter = getPackageFilter('com.gumbo.learning');

    // Handle different event types
    switch (event) {
      case 'payment.captured':
      case 'subscription.activated':
      case 'subscription.charged':
        await handlePaymentSuccess(userId, 'com.gumbo.learning', data, packageFilter);
        break;

      case 'payment.failed':
      case 'subscription.halted':
        await handlePaymentFailure(userId, 'com.gumbo.learning', data, packageFilter);
        break;

      case 'subscription.cancelled':
        await handleSubscriptionCancellation(userId, 'com.gumbo.learning', data, packageFilter);
        break;

      default:
        console.log('Unhandled event type:', event);
    }

    res.json({ success: true, message: 'Callback processed successfully' });
  } catch (error) {
    console.error('Payment callback error (learning):', error);
    res.status(500).json({
      success: false,
      message: 'Callback processing failed',
      error: error.message
    });
  }
};

/**
 * Handle Payment Microservice callback for Bolo (com.gumbo.english)
 * @route POST /api/payment/callback/english
 */
const handlePaymentCallbackEnglish = async (req, res) => {
  try {
    console.log('Payment callback received for Bolo (com.gumbo.english):', req.body);

    const { event, userId, sourceApp, data } = req.body;

    // Verify sourceApp matches expected package
    if (sourceApp !== 'com.gumbo.english') {
      console.warn('Package ID mismatch in callback:', { expected: 'com.gumbo.english', received: sourceApp });
      return res.status(400).json({
        success: false,
        message: 'Package ID mismatch'
      });
    }

    const packageFilter = getPackageFilter('com.gumbo.english');

    // Handle different event types
    switch (event) {
      case 'payment.captured':
      case 'subscription.activated':
      case 'subscription.charged':
        await handlePaymentSuccess(userId, 'com.gumbo.english', data, packageFilter);
        break;

      case 'payment.failed':
      case 'subscription.halted':
        await handlePaymentFailure(userId, 'com.gumbo.english', data, packageFilter);
        break;

      case 'subscription.cancelled':
        await handleSubscriptionCancellation(userId, 'com.gumbo.english', data, packageFilter);
        break;

      default:
        console.log('Unhandled event type:', event);
    }

    res.json({ success: true, message: 'Callback processed successfully' });
  } catch (error) {
    console.error('Payment callback error (english):', error);
    res.status(500).json({
      success: false,
      message: 'Callback processing failed',
      error: error.message
    });
  }
};

/**
 * Handle successful payment/subscription activation
 */
const handlePaymentSuccess = async (userId, packageId, data, packageFilter) => {
  try {
    console.log('Processing payment success:', { userId, packageId, data });

    // Find user
    const user = await User.findOne({ _id: userId, ...packageFilter });
    if (!user) {
      console.error('User not found for payment success:', userId);
      return;
    }

    // Create or update subscription record
    const subscriptionData = {
      ...packageFilter,
      user: userId,
      plan: data.planType || 'monthly',
      status: 'active',
      startDate: new Date(),
      endDate: new Date(data.endDate || Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days
      amount: data.amount || 0,
      currency: data.currency || 'INR',
      paymentProvider: 'razorpay',
      paymentId: data.razorpayPaymentId || data.paymentId,
      orderId: data.razorpayOrderId || data.orderId,
      razorpaySubscriptionId: data.razorpaySubscriptionId,
      autoRenew: data.isRecurring || false,
      isRecurring: data.isRecurring || false,
      subscriptionType: data.isRecurring ? 'recurring' : 'one-time',
      metadata: {
        customerEmail: user.email,
        customerPhone: user.phone,
        microserviceSubscriptionId: data.subscriptionId,
        microserviceOrderId: data.orderId,
        webhookEvents: [`payment.success:${new Date().toISOString()}`]
      }
    };

    // Update or create subscription
    await Subscription.findOneAndUpdate(
      { ...packageFilter, user: userId },
      subscriptionData,
      { upsert: true, new: true }
    );

    console.log('Subscription updated successfully for user:', userId);
  } catch (error) {
    console.error('Error handling payment success:', error);
    throw error;
  }
};

/**
 * Handle payment failure
 */
const handlePaymentFailure = async (userId, packageId, data, packageFilter) => {
  try {
    console.log('Processing payment failure:', { userId, packageId, data });

    // Find existing subscription and mark as failed or handle retry logic
    const subscription = await Subscription.findOne({
      ...packageFilter,
      user: userId,
      status: { $in: ['active', 'pending'] }
    });

    if (subscription) {
      await subscription.handleFailedPayment();
      console.log('Payment failure handled for subscription:', subscription._id);
    }
  } catch (error) {
    console.error('Error handling payment failure:', error);
    throw error;
  }
};

/**
 * Handle subscription cancellation
 */
const handleSubscriptionCancellation = async (userId, packageId, data, packageFilter) => {
  try {
    console.log('Processing subscription cancellation:', { userId, packageId, data });

    // Find and cancel subscription
    const subscription = await Subscription.findOne({
      ...packageFilter,
      user: userId,
      razorpaySubscriptionId: data.razorpaySubscriptionId
    });

    if (subscription) {
      await subscription.cancel('Cancelled via payment microservice');
      console.log('Subscription cancelled successfully:', subscription._id);
    }
  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
    throw error;
  }
};

module.exports = {
  handleRazorpayWebhook,
  testWebhook,
  debugSubscriptions,
  handlePaymentCallbackLearning,
  handlePaymentCallbackEnglish
};
