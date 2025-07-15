const express = require('express');
const {
  handleRazorpayWebhook,
  testWebhook,
  debugSubscriptions,
  handlePaymentCallbackLearning,
  handlePaymentCallbackEnglish
} = require('../controllers/webhookController');

const router = express.Router();

// @route   POST /api/webhooks/razorpay
// @desc    Handle Razorpay webhooks
// @access  Public (but verified)
router.post('/razorpay', handleRazorpayWebhook);

// @route   GET /api/webhooks/test
// @desc    Test webhook endpoint
// @access  Public
router.get('/test', testWebhook);

// @route   GET /api/webhooks/debug-subscriptions
// @desc    Debug subscriptions
// @access  Public
router.get('/debug-subscriptions', debugSubscriptions);

// ===== PAYMENT MICROSERVICE CALLBACK ROUTES =====

// @route   POST /api/payment/callback/learning
// @desc    Handle Payment Microservice callback for Seekho (com.gumbo.learning)
// @access  Public (verified by microservice)
router.post('/payment/callback/learning', handlePaymentCallbackLearning);

// @route   POST /api/payment/callback/english
// @desc    Handle Payment Microservice callback for Bolo (com.gumbo.english)
// @access  Public (verified by microservice)
router.post('/payment/callback/english', handlePaymentCallbackEnglish);

module.exports = router;
