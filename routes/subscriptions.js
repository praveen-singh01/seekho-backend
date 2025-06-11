const express = require('express');
const {
  getPlans,
  createOrder,
  verifyPayment,
  getStatus,
  cancelSubscription,
  getHistory,
  reactivateSubscription
} = require('../controllers/subscriptionController');
const { protect } = require('../middleware/auth');
const { validateSubscription, validatePagination } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/subscriptions/plans
// @desc    Get subscription plans
// @access  Public
router.get('/plans', getPlans);

// @route   POST /api/subscriptions/create-order
// @desc    Create subscription order
// @access  Private
router.post('/create-order', protect, createOrder);

// @route   POST /api/subscriptions/verify-payment
// @desc    Verify payment and create subscription
// @access  Private
router.post('/verify-payment', protect, verifyPayment);

// @route   GET /api/subscriptions/status
// @desc    Get user's subscription status
// @access  Private
router.get('/status', protect, getStatus);

// @route   POST /api/subscriptions/cancel
// @desc    Cancel subscription
// @access  Private
router.post('/cancel', protect, cancelSubscription);

// @route   GET /api/subscriptions/history
// @desc    Get subscription history
// @access  Private
router.get('/history', protect, validatePagination, getHistory);

// @route   POST /api/subscriptions/reactivate
// @desc    Reactivate subscription
// @access  Private
router.post('/reactivate', protect, reactivateSubscription);

// @route   POST /api/subscriptions/cancel-razorpay
// @desc    Cancel Razorpay subscription
// @access  Private
router.post('/cancel-razorpay', protect, async (req, res) => {
  try {
    const subscription = await require('../models/Subscription').findOne({
      user: req.user.id,
      status: 'active',
      isRecurring: true
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No active recurring subscription found'
      });
    }

    const PaymentService = require('../services/paymentService');
    const result = await PaymentService.cancelRazorpaySubscription(subscription.razorpaySubscriptionId);

    if (result.success) {
      await subscription.cancel('Cancelled by user');
      res.status(200).json({
        success: true,
        message: 'Subscription cancelled successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Cancel Razorpay subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
