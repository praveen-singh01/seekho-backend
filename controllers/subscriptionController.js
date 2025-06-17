const Subscription = require('../models/Subscription');
const User = require('../models/User');
const SubscriptionService = require('../services/subscriptionService');
const PaymentService = require('../services/paymentService');

// @desc    Get subscription plans
// @route   GET /api/subscriptions/plans
// @access  Public (but returns different data if authenticated)
const getPlans = async (req, res) => {
  try {
    let user = null;
    let isTrialEligible = true;
    let activeSubscription = null;
    let hasEverPurchased = false;

    // Check if user is authenticated (optional)
    if (req.user && req.user.id) {
      try {
        user = await User.findById(req.user.id);
        if (user) {
          isTrialEligible = user.isTrialEligible();

          // Get user's active subscription
          const subscriptionResult = await SubscriptionService.getUserSubscription(req.user.id);
          if (subscriptionResult.success && subscriptionResult.subscription) {
            activeSubscription = subscriptionResult.subscription;
          }

          // Check if user has ever purchased (has any subscription record)
          const hasSubscriptionHistory = await Subscription.findOne({ user: req.user.id });
          hasEverPurchased = !!hasSubscriptionHistory;
        }
      } catch (error) {
        console.warn('Error fetching user data for plans:', error.message);
        // Continue with default values if user fetch fails
      }
    }

    // Generate unique package IDs (you can use UUIDs or any consistent ID generation)
    const monthlyPackageId = "05bd18be-6d18-421b-898e-8148e185f0ce";
    const yearlyPackageId = "a7b7e439-56b1-7e2b-b5a8-9820d3b54136";

    // Build subscription list
    const subscriptionList = [
      {
        packageId: monthlyPackageId,
        label: "Monthly",
        price: 99, // Base price without GST
        priceAfterTax: 117, // Price with 18% GST
        strikePrice: 0, // No strike price for monthly
        freeTrial: isTrialEligible,
        trialPrice: isTrialEligible ? 1 : 0, // ₹1 if eligible, ₹0 if not
        planId: process.env.RAZORPAY_MONTHLY_PLAN_ID,
        validityInDays: 30
      },
      {
        packageId: yearlyPackageId,
        label: "Annually",
        price: 499, // Base price without GST
        priceAfterTax: 587, // Price with 18% GST (499 + 88)
        strikePrice: 0, // No strike price for yearly
        freeTrial: false, // Yearly plan doesn't have trial
        trialPrice: 0,
        planId: process.env.RAZORPAY_YEARLY_PLAN_ID,
        validityInDays: 365
      }
    ];

    // Determine subscription status
    let subscriptionStatus = "NO_ACTIVE_SUBSCRIPTIONS";
    let premiumUser = false;
    let premiumTill = 0;

    if (activeSubscription) {
      if (activeSubscription.status === 'active' && activeSubscription.endDate > new Date()) {
        premiumUser = true;
        premiumTill = Math.floor(activeSubscription.endDate.getTime() / 1000); // Unix timestamp

        if (activeSubscription.plan === 'trial') {
          subscriptionStatus = "TRIAL_ACTIVE";
        } else if (activeSubscription.autoRenew) {
          subscriptionStatus = "ACTIVE_RECURRING";
        } else {
          subscriptionStatus = "ACTIVE_NON_RECURRING";
        }
      } else if (activeSubscription.status === 'cancelled') {
        subscriptionStatus = "CANCELLED";
      } else if (activeSubscription.status === 'expired') {
        subscriptionStatus = "EXPIRED";
      }
    }

    // Response in the format you specified
    const response = {
      subscriptionList,
      premiumUser,
      premiumTill,
      subscriptionStatus,
      previouslyPurchased: hasEverPurchased,
      apiKey: process.env.RAZORPAY_KEY_ID
    };

    res.status(200).json(response);
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
    let { plan } = req.body;

    // Map Razorpay plan IDs to plan types if needed
    const planMapping = {
      [process.env.RAZORPAY_MONTHLY_PLAN_ID]: 'monthly',
      [process.env.RAZORPAY_YEARLY_PLAN_ID]: 'yearly'
    };

    // If plan is a Razorpay plan ID, convert it to plan type
    if (planMapping[plan]) {
      plan = planMapping[plan];
    }

    if (!['trial', 'monthly', 'yearly'].includes(plan)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription plan'
      });
    }

    // Get user for trial eligibility check
    const user = await User.findById(req.user.id);

    // For trial, frontend might send the monthly plan ID but with freeTrial=true
    // We need to check if this should be treated as trial based on user eligibility
    if (plan === 'monthly' && user.isTrialEligible()) {
      // If user is trial eligible and selecting monthly, treat as trial
      plan = 'trial';
    }

    // Check trial eligibility
    if (plan === 'trial') {
      if (!user.isTrialEligible()) {
        return res.status(400).json({
          success: false,
          message: 'Trial already used. Please choose monthly subscription.',
          showMonthlyOnly: true,
          monthlyPrice: 117,
          monthlyPriceInPaise: 11700
        });
      }
    }

    // Check if user already has an active subscription
    const existingSubscription = await SubscriptionService.getUserSubscription(req.user.id);

    if (existingSubscription.success && existingSubscription.isActive) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active subscription'
      });
    }

    // Clean up any pending subscriptions for this user
    await Subscription.deleteMany({
      user: req.user.id,
      status: 'pending'
    });

    let result;

    if (plan === 'trial') {
      // Create trial subscription with addon approach (₹1 immediate + ₹117 after 5 days)
      const customerData = {
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone || ''
      };

      result = await SubscriptionService.createTrialWithMandate(req.user.id, customerData);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.error
        });
      }

      res.status(200).json({
        success: true,
        data: {
          // Standardized fields for frontend
          subscriptionId: result.razorpaySubscription.id, // Razorpay subscription ID for payment
          orderId: null, // No order ID for subscription-based payments
          amount: result.firstPaymentAmount, // ₹1 charged immediately via addon
          mandateAmount: result.mandateAmount, // ₹117 UPI mandate for future billing
          currency: 'INR',
          plan: plan,
          razorpayKeyId: process.env.RAZORPAY_KEY_ID,
          type: 'recurring-subscription', // Trial via subscription with mandate

          // Additional details
          subscriptionDetails: {
            dbSubscriptionId: result.subscription._id, // Our database subscription ID
            razorpaySubscriptionId: result.razorpaySubscription.id, // Razorpay subscription ID
            customerId: result.subscription.razorpayCustomerId,
            trialPeriod: 5,
            trialAmount: 100,
            monthlyAmount: 11700,
            nextBillingDate: result.subscription.nextBillingDate
          }
        }
      });
    } else {
      // For monthly and yearly, create recurring subscription
      const customerData = {
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone || ''
      };

      result = await SubscriptionService.createRecurringSubscription(req.user.id, plan, customerData);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: result.error
        });
      }

      // Standardized response format
      res.status(200).json({
        success: true,
        data: {
          subscriptionId: result.razorpaySubscription?.id || result.subscription.razorpaySubscriptionId,
          amount: result.subscription.amount,
          currency: result.subscription.currency,
          plan: result.subscription.plan,
          razorpayKeyId: process.env.RAZORPAY_KEY_ID,
          type: 'recurring-subscription',

          // Additional details
          subscriptionDetails: {
            dbSubscriptionId: result.subscription._id, // Our database subscription ID
            razorpaySubscriptionId: result.razorpaySubscription?.id || result.subscription.razorpaySubscriptionId,
            customerId: result.subscription.razorpayCustomerId
          }
        }
      });
    }
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
    let {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      razorpay_subscription_id,
      plan
    } = req.body;

    if (!plan) {
      return res.status(400).json({
        success: false,
        message: 'Plan is required'
      });
    }

    // Map Razorpay plan IDs to plan types if needed
    const planMapping = {
      [process.env.RAZORPAY_MONTHLY_PLAN_ID]: 'monthly',
      [process.env.RAZORPAY_YEARLY_PLAN_ID]: 'yearly'
    };

    // If plan is a Razorpay plan ID, convert it to plan type
    if (planMapping[plan]) {
      plan = planMapping[plan];
    }

    // For trial, check if this should be treated as trial
    if (plan === 'monthly') {
      const user = await User.findById(req.user.id);
      if (user.isTrialEligible()) {
        plan = 'trial';
      }
    }

    let subscriptionResult;

    // Handle subscription payment (auto-recurring trial or regular subscription)
    if (razorpay_subscription_id) {
      // For subscription payments, verify the subscription signature
      if (!razorpay_subscription_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({
          success: false,
          message: 'Missing required payment details for subscription'
        });
      }

      // Verify subscription signature
      const isValidSignature = PaymentService.verifyRazorpaySubscriptionSignature(
        razorpay_subscription_id,
        razorpay_payment_id,
        razorpay_signature
      );

      if (!isValidSignature) {
        return res.status(400).json({
          success: false,
          message: 'Invalid subscription payment signature'
        });
      }

      if (plan === 'trial') {
        // Handle trial subscription activation
        subscriptionResult = await SubscriptionService.activateTrialSubscription(
          req.user.id,
          {
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            signature: razorpay_signature
          }
        );

        // Mark trial as used if activation is successful
        if (subscriptionResult.success) {
          const user = await User.findById(req.user.id);
          await user.markTrialUsed();
        }
      } else {
        // Handle regular recurring subscription payment
        subscriptionResult = await SubscriptionService.activateRecurringSubscription(
          req.user.id,
          razorpay_subscription_id,
          {
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
            signature: razorpay_signature
          }
        );
      }
    } else {
      // Handle one-time payment (trial)
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({
          success: false,
          message: 'Missing required payment details for one-time payment'
        });
      }

      // Verify payment signature for one-time payments
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

      // Create subscription (one-time payment for trial)
      subscriptionResult = await SubscriptionService.createOneTimeSubscription(
        req.user.id,
        plan,
        {
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          signature: razorpay_signature,
          email: req.user.email
        }
      );

      // Mark trial as used if this is a trial subscription
      if (plan === 'trial' && subscriptionResult.success) {
        const user = await User.findById(req.user.id);
        await user.markTrialUsed();
      }
    }

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

// @desc    Convert trial to monthly subscription
// @route   POST /api/subscriptions/convert-trial
// @access  Private
const convertTrial = async (req, res) => {
  try {
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({
        success: false,
        message: 'Subscription ID is required'
      });
    }

    const result = await SubscriptionService.handleTrialConversion(subscriptionId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    res.status(200).json({
      success: true,
      data: {
        orderId: result.order.id,
        amount: result.order.amount,
        currency: result.order.currency,
        conversionAmount: result.conversionAmount,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        subscription: result.subscription
      }
    });
  } catch (error) {
    console.error('Convert trial error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Complete trial conversion after payment
// @route   POST /api/subscriptions/complete-conversion
// @access  Private
const completeTrialConversion = async (req, res) => {
  try {
    const {
      subscriptionId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    if (!subscriptionId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
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

    const result = await SubscriptionService.completeTrialConversion(subscriptionId, {
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      signature: razorpay_signature
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    res.status(200).json({
      success: true,
      message: 'Trial converted to monthly subscription successfully',
      data: result.subscription
    });
  } catch (error) {
    console.error('Complete trial conversion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Check trial eligibility
// @route   GET /api/subscriptions/trial-eligibility
// @access  Private
const checkTrialEligibility = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const isEligible = user.isTrialEligible();

    res.status(200).json({
      success: true,
      data: {
        isTrialEligible: isEligible,
        hasUsedTrial: user.hasUsedTrial,
        trialUsedAt: user.trialUsedAt,
        alternativeOptions: !isEligible ? {
          monthlyPrice: 117,
          monthlyPriceInPaise: 11700,
          description: '₹99 + 18% GST = ₹117/month'
        } : null
      }
    });
  } catch (error) {
    console.error('Check trial eligibility error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create trial subscription with UPI mandate
// @route   POST /api/subscriptions/create-trial-with-mandate
// @access  Private
const createTrialWithMandate = async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    // Check trial eligibility
    const user = await User.findById(req.user.id);
    if (!user.isTrialEligible()) {
      return res.status(400).json({
        success: false,
        message: 'Trial already used. Please choose monthly subscription.',
        showMonthlyOnly: true,
        monthlyPrice: 117,
        monthlyPriceInPaise: 11700
      });
    }

    // Check if user already has an active subscription
    const existingSubscription = await user.getActiveSubscription();
    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active subscription'
      });
    }

    const customerData = {
      name: name || user.name,
      email: email || user.email,
      phone: phone || user.phone
    };

    const result = await SubscriptionService.createSimpleTrialSubscription(req.user.id, customerData);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    // Mark trial as used
    await user.markTrialUsed();

    res.status(200).json({
      success: true,
      message: 'Trial subscription created successfully',
      data: {
        subscriptionId: result.subscription._id,
        orderId: result.order.id,
        amount: result.order.amount,
        currency: result.order.currency,
        paymentAmount: result.paymentAmount, // ₹1 in paise
        trialPeriod: 5, // days
        description: '₹1 for 5 days trial access',
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        instructions: 'Complete the payment to activate your trial'
      }
    });
  } catch (error) {
    console.error('Create trial with mandate error:', error);
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
  reactivateSubscription,
  convertTrial,
  completeTrialConversion,
  checkTrialEligibility,
  createTrialWithMandate
};
