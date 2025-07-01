const crypto = require('crypto');
const SubscriptionService = require('../services/subscriptionService');

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

module.exports = {
  handleRazorpayWebhook,
  testWebhook,
  debugSubscriptions
};
