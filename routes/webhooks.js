const express = require('express');
const { handleRazorpayWebhook, testWebhook } = require('../controllers/webhookController');

const router = express.Router();

// @route   POST /api/webhooks/razorpay
// @desc    Handle Razorpay webhooks
// @access  Public (but verified)
router.post('/razorpay', handleRazorpayWebhook);

// @route   GET /api/webhooks/test
// @desc    Test webhook endpoint
// @access  Public
router.get('/test', testWebhook);

module.exports = router;
