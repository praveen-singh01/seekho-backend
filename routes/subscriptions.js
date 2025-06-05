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

module.exports = router;
