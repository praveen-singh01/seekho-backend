const Subscription = require('../models/Subscription');
const User = require('../models/User');
const SubscriptionService = require('../services/subscriptionService');
const PaymentService = require('../services/paymentService');
const { getPackageFilter } = require('../config/packages');
const paymentMicroserviceClient = require('../services/paymentMicroserviceClient');
const { isMicroserviceEnabled, getPlanConfig } = require('../config/paymentConfig');

// @desc    Get subscription plans
// @route   GET /api/subscriptions/plans
// @access  Public (but returns different data if authenticated)
const getPlans = async (req, res) => {
  try {
    let user = null;
    let activeSubscription = null;
    let hasEverPurchased = false;

    // Check if user is authenticated (optional)
    if (req.user && req.user.id) {
      try {
        // Validate package ID matches user's package
        const packageFilter = getPackageFilter(req.packageId);
        user = await User.findOne({ _id: req.user.id, ...packageFilter });
        if (user) {
          // Get user's active subscription with package filter
          const subscriptionResult = await SubscriptionService.getUserSubscription(req.user.id, req.packageId);
          if (subscriptionResult.success && subscriptionResult.subscription) {
            activeSubscription = subscriptionResult.subscription;
          }

          // Check if user has ever purchased (has any subscription record) with package filter
          const hasSubscriptionHistory = await Subscription.findOne({
            ...packageFilter,
            user: req.user.id
          });
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

    // Build subscription list - removed free trial, only monthly and yearly
    const subscriptionList = [
      {
        packageId: monthlyPackageId,
        label: "Monthly",
        price: 99, // Base price without GST
        priceAfterTax: 117, // Price with 18% GST
        strikePrice: 0, // No strike price for monthly
        freeTrial: false, // No free trial
        trialPrice: 0, // No trial price
        planId: process.env.RAZORPAY_MONTHLY_PLAN_ID,
        validityInDays: 30
      },
      {
        packageId: yearlyPackageId,
        label: "Annually",
        price: 499, // Base price without GST
        priceAfterTax: 587, // Price with 18% GST (499 + 88)
        strikePrice: 0, // No strike price for yearly
        freeTrial: false, // No free trial
        trialPrice: 0, // No trial price
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

        if (activeSubscription.autoRenew) {
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
    let { plan, recurring } = req.body;

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

    // Default recurring to true if not specified (backward compatibility)
    if (recurring === undefined) {
      recurring = true;
    }

    // Validate package ID
    const packageFilter = getPackageFilter(req.packageId);

    // Only allow monthly and yearly plans (no trial)
    if (!['monthly', 'yearly'].includes(plan)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription plan. Only monthly and yearly plans are available.'
      });
    }

    // Check if user already has an active subscription
    const existingSubscription = await SubscriptionService.getUserSubscription(req.user.id, req.packageId);

    if (existingSubscription.success && existingSubscription.isActive) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active subscription'
      });
    }

    // Clean up any pending subscriptions for this user with package filtering
    await Subscription.deleteMany({
      ...packageFilter,
      user: req.user.id,
      status: 'pending'
    });

    let result;

    // Check if Payment Microservice is enabled
    if (isMicroserviceEnabled()) {
      // Use Payment Microservice
      try {
        const planConfig = getPlanConfig(req.packageId, plan);

        const paymentContext = {
          subscriptionType: 'premium',
          billingCycle: plan,
          recurring: recurring,
          metadata: {
            userEmail: req.user.email,
            userPhone: req.user.phone || '',
            userId: req.user.id,
            packageId: req.packageId
          }
        };

        if (!recurring) {
          // Create one-time order via microservice
          const orderResponse = await paymentMicroserviceClient.createOrder(
            req.user.id,
            req.packageId,
            planConfig.amount,
            planConfig.currency,
            paymentContext
          );

          return res.status(200).json({
            success: true,
            data: {
              orderId: orderResponse.data.orderId,
              razorpayOrderId: orderResponse.data.razorpayOrderId,
              amount: orderResponse.data.amount,
              currency: orderResponse.data.currency,
              plan: plan,
              razorpayKeyId: process.env.RAZORPAY_KEY_ID,
              type: 'one-time-order',
              source: 'microservice',

              // Additional details
              orderDetails: {
                microserviceOrderId: orderResponse.data.orderId,
                razorpayOrderId: orderResponse.data.razorpayOrderId
              }
            }
          });
        } else {
          // Create recurring subscription via microservice
          const subscriptionResponse = await paymentMicroserviceClient.createSubscription(
            req.user.id,
            req.packageId,
            planConfig.planId,
            paymentContext
          );

          return res.status(200).json({
            success: true,
            data: {
              subscriptionId: subscriptionResponse.data.subscriptionId,
              razorpaySubscriptionId: subscriptionResponse.data.razorpaySubscriptionId,
              amount: planConfig.amount,
              currency: planConfig.currency,
              plan: plan,
              razorpayKeyId: process.env.RAZORPAY_KEY_ID,
              type: 'recurring-subscription',
              source: 'microservice',
              shortUrl: subscriptionResponse.data.shortUrl,

              // Additional details
              subscriptionDetails: {
                microserviceSubscriptionId: subscriptionResponse.data.subscriptionId,
                razorpaySubscriptionId: subscriptionResponse.data.razorpaySubscriptionId,
                status: subscriptionResponse.data.status
              }
            }
          });
        }
      } catch (error) {
        console.error('Payment microservice error:', error);
        return res.status(500).json({
          success: false,
          message: error.message || 'Payment service error'
        });
      }
    }

    // Fallback to legacy payment service
    // Handle based on recurring parameter
    if (!recurring) {
      // Create one-time order (recurring: false)
      result = await PaymentService.createSubscriptionOrder(req.user.id, plan);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.error
        });
      }

      // Response for one-time order
      res.status(200).json({
        success: true,
        data: {
          orderId: result.order.id,
          amount: result.order.amount,
          currency: result.order.currency,
          plan: plan,
          razorpayKeyId: process.env.RAZORPAY_KEY_ID,
          type: 'one-time-order',
          source: 'legacy',
          receipt: result.order.receipt,

          // Additional details
          orderDetails: {
            razorpayOrderId: result.order.id,
            subscriptionDetails: result.subscriptionDetails
          }
        }
      });
    } else if (['monthly', 'yearly'].includes(plan)) {
      // For monthly and yearly, create recurring subscription (recurring: true)
      const customerData = {
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone || ''
      };

      result = await SubscriptionService.createRecurringSubscription(req.user.id, plan, customerData, req.packageId);

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
          source: 'legacy',

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

    // Only allow monthly and yearly plans
    if (!['monthly', 'yearly'].includes(plan)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription plan. Only monthly and yearly plans are available.'
      });
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
    } else if (razorpay_order_id && razorpay_payment_id && razorpay_signature) {
      // Handle one-time payment (single payment without subscription)

      // Verify one-time payment signature
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

      // Get package ID from user's app context
      const packageId = req.user.packageId || 'com.gumbo.learning'; // Default to Seekho

      // Create one-time subscription
      subscriptionResult = await SubscriptionService.createOneTimeSubscription(
        req.user.id,
        plan,
        {
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          signature: razorpay_signature,
          email: req.user.email,
          phone: req.user.phone
        },
        packageId
      );
    } else {
      // Missing required payment details
      return res.status(400).json({
        success: false,
        message: 'Missing required payment details. Please provide either subscription details (razorpay_subscription_id) or order details (razorpay_order_id) along with payment_id and signature.'
      });
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
    const result = await SubscriptionService.getUserSubscription(req.user.id, req.packageId);

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

    // Get package filter for multi-tenant support
    const packageFilter = getPackageFilter(req.packageId);

    const subscriptions = await Subscription.find({ ...packageFilter, user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-signature -metadata');

    const total = await Subscription.countDocuments({ ...packageFilter, user: req.user.id });

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
    // Get package filter for multi-tenant support
    const packageFilter = getPackageFilter(req.packageId);

    const subscription = await Subscription.findOne({
      ...packageFilter,
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

// @desc    Convert trial to monthly subscription (DISABLED)
// @route   POST /api/subscriptions/convert-trial
// @access  Private
const convertTrial = async (req, res) => {
  return res.status(400).json({
    success: false,
    message: 'Trial subscriptions are no longer available. Please choose monthly or yearly subscription.'
  });
};

// @desc    Complete trial conversion after payment (DISABLED)
// @route   POST /api/subscriptions/complete-conversion
// @access  Private
const completeTrialConversion = async (req, res) => {
  return res.status(400).json({
    success: false,
    message: 'Trial subscriptions are no longer available. Please choose monthly or yearly subscription.'
  });
};

// @desc    Check trial eligibility (DISABLED)
// @route   GET /api/subscriptions/trial-eligibility
// @access  Private
const checkTrialEligibility = async (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      isTrialEligible: false,
      hasUsedTrial: true,
      trialUsedAt: new Date(),
      alternativeOptions: {
        monthlyPrice: 117,
        monthlyPriceInPaise: 11700,
        yearlyPrice: 587,
        yearlyPriceInPaise: 58700,
        description: 'Choose monthly (₹117/month) or yearly (₹587/year) subscription'
      }
    }
  });
};

// @desc    Create trial subscription with UPI mandate (DISABLED)
// @route   POST /api/subscriptions/create-trial-with-mandate
// @access  Private
const createTrialWithMandate = async (req, res) => {
  return res.status(400).json({
    success: false,
    message: 'Trial subscriptions are no longer available. Please choose monthly or yearly subscription.'
  });
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
