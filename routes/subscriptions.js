const express = require('express');
const {
  getPlans,
  createOrder,
  verifyPayment,
  getStatus,
  cancelSubscription,
  getHistory,
  reactivateSubscription,
  convertTrial,
  completeTrialConversion,
  checkTrialEligibility,
  createTrialWithMandate
} = require('../controllers/subscriptionController');
const { protect } = require('../middleware/auth');
const { validateSubscription, validatePagination } = require('../middleware/validation');
const Subscription = require('../models/Subscription');
const PaymentService = require('../services/paymentService');

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

// @route   GET /api/subscriptions/trial-eligibility
// @desc    Check trial eligibility
// @access  Private
router.get('/trial-eligibility', protect, checkTrialEligibility);

// @route   POST /api/subscriptions/convert-trial
// @desc    Convert trial to monthly subscription
// @access  Private
router.post('/convert-trial', protect, convertTrial);

// @route   POST /api/subscriptions/complete-conversion
// @desc    Complete trial conversion after payment
// @access  Private
router.post('/complete-conversion', protect, completeTrialConversion);

// @route   POST /api/subscriptions/create-trial-with-mandate
// @desc    Create trial subscription with UPI mandate for auto-conversion
// @access  Private
router.post('/create-trial-with-mandate', protect, createTrialWithMandate);

// @route   POST /api/subscriptions/cancel-razorpay
// @desc    Cancel Razorpay subscription
// @access  Private
router.post('/cancel-razorpay', protect, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
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
