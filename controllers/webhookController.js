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

module.exports = {
  handleRazorpayWebhook,
  testWebhook,
  debugSubscriptions
};
