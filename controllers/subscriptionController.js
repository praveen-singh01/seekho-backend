const SubscriptionService = require('../services/subscriptionService');
const PaymentService = require('../services/paymentService');
const Subscription = require('../models/Subscription');

// @desc    Get subscription plans
// @route   GET /api/subscriptions/plans
// @access  Public
const getPlans = async (req, res) => {
  try {
    const plans = PaymentService.getSubscriptionPlans();
    
    res.status(200).json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create subscription order
// @route   POST /api/subscriptions/create-order
// @access  Private
const createOrder = async (req, res) => {
  try {
    const { plan } = req.body;
    
    if (!['trial', 'monthly', 'yearly'].includes(plan)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription plan'
      });
    }

    // Check if user already has an active subscription
    const existingSubscription = await SubscriptionService.getUserSubscription(req.user.id);
    
    if (existingSubscription.success && existingSubscription.isActive) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active subscription'
      });
    }

    // Create payment order
    const orderResult = await PaymentService.createSubscriptionOrder(req.user.id, plan);
    
    if (!orderResult.success) {
      return res.status(400).json({
        success: false,
        message: orderResult.error
      });
    }

    res.status(200).json({
      success: true,
      data: {
        orderId: orderResult.order.id,
        amount: orderResult.order.amount,
        currency: orderResult.order.currency,
        plan: plan,
        subscriptionDetails: orderResult.subscriptionDetails
      }
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Verify payment and create subscription
// @route   POST /api/subscriptions/verify-payment
// @access  Private
const verifyPayment = async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      plan 
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !plan) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment details'
      });
    }

    // Verify payment signature
    const isValidSignature = PaymentService.verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValidSignature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Get payment details from Razorpay
    const paymentResult = await PaymentService.getPaymentDetails(razorpay_payment_id);
    
    if (!paymentResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    // Create subscription
    const subscriptionResult = await SubscriptionService.createSubscription(
      req.user.id,
      plan,
      {
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        signature: razorpay_signature,
        email: req.user.email
      }
    );

    if (!subscriptionResult.success) {
      return res.status(400).json({
        success: false,
        message: subscriptionResult.error
      });
    }

    res.status(200).json({
      success: true,
      message: 'Subscription created successfully',
      data: subscriptionResult.subscription
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user's subscription status
// @route   GET /api/subscriptions/status
// @access  Private
const getStatus = async (req, res) => {
  try {
    const result = await SubscriptionService.getUserSubscription(req.user.id);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error
      });
    }

    const response = {
      hasSubscription: !!result.subscription,
      isActive: result.isActive,
      subscription: result.subscription
    };

    if (result.subscription) {
      response.daysRemaining = result.subscription.daysRemaining;
      response.autoRenew = result.subscription.autoRenew;
    }

    res.status(200).json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Cancel subscription
// @route   POST /api/subscriptions/cancel
// @access  Private
const cancelSubscription = async (req, res) => {
  try {
    const { reason } = req.body;
    
    const result = await SubscriptionService.cancelSubscription(req.user.id, reason);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.subscription
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get subscription history
// @route   GET /api/subscriptions/history
// @access  Private
const getHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const subscriptions = await Subscription.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-signature -metadata');

    const total = await Subscription.countDocuments({ user: req.user.id });

    res.status(200).json({
      success: true,
      count: subscriptions.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      data: subscriptions
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Reactivate subscription
// @route   POST /api/subscriptions/reactivate
// @access  Private
const reactivateSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      user: req.user.id,
      status: 'cancelled'
    }).sort({ createdAt: -1 });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No cancelled subscription found'
      });
    }

    // Check if subscription is still within the paid period
    if (subscription.endDate < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Subscription period has expired. Please create a new subscription.'
      });
    }

    subscription.status = 'active';
    subscription.autoRenew = true;
    subscription.cancelledAt = null;
    subscription.cancelReason = null;
    await subscription.save();

    res.status(200).json({
      success: true,
      message: 'Subscription reactivated successfully',
      data: subscription
    });
  } catch (error) {
    console.error('Reactivate subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getPlans,
  createOrder,
  verifyPayment,
  getStatus,
  cancelSubscription,
  getHistory,
  reactivateSubscription
};
