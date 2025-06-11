const crypto = require('crypto');
const SubscriptionService = require('../services/subscriptionService');

// @desc    Handle Razorpay webhooks
// @route   POST /api/webhooks/razorpay
// @access  Public (but verified)
const handleRazorpayWebhook = async (req, res) => {
  try {
    const webhookSignature = req.headers['x-razorpay-signature'];
    const webhookBody = JSON.stringify(req.body);
    
    // Verify webhook signature
    if (!verifyWebhookSignature(webhookBody, webhookSignature)) {
      console.error('Invalid webhook signature');
      return res.status(400).json({
        success: false,
        message: 'Invalid signature'
      });
    }

    const { event, payload } = req.body;
    
    console.log(`Received Razorpay webhook: ${event}`);
    
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

module.exports = {
  handleRazorpayWebhook,
  testWebhook
};
