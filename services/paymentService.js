const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

class PaymentService {
  // Initialize and validate configuration
  static initialize() {
    try {
      this.validatePlanConfiguration();
      console.log('✅ PaymentService initialized with predefined plan IDs');
    } catch (error) {
      console.error('❌ PaymentService initialization failed:', error.message);
      throw error;
    }
  }

  // Create Razorpay order
  static async createRazorpayOrder(amount, currency = 'INR', receipt = null) {
    try {
      const options = {
        amount: amount, // amount in paise
        currency: currency,
        receipt: receipt || `rcpt_${Date.now().toString().slice(-8)}`, // Keep under 40 chars
        payment_capture: 1
      };

      const order = await razorpay.orders.create(options);
      return {
        success: true,
        order
      };
    } catch (error) {
      console.error('Razorpay order creation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Verify Razorpay payment signature
  static verifyRazorpaySignature(orderId, paymentId, signature) {
    try {
      const body = orderId + '|' + paymentId;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

      return expectedSignature === signature;
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  // Verify Razorpay subscription signature
  static verifyRazorpaySubscriptionSignature(subscriptionId, paymentId, signature) {
    try {
      const body = subscriptionId + '|' + paymentId;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

      return expectedSignature === signature;
    } catch (error) {
      console.error('Subscription signature verification error:', error);
      return false;
    }
  }

  // Get payment details from Razorpay
  static async getPaymentDetails(paymentId) {
    try {
      const payment = await razorpay.payments.fetch(paymentId);
      return {
        success: true,
        payment
      };
    } catch (error) {
      console.error('Error fetching payment details:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Refund payment
  static async refundPayment(paymentId, amount = null) {
    try {
      const refundData = {
        payment_id: paymentId
      };

      if (amount) {
        refundData.amount = amount;
      }

      const refund = await razorpay.payments.refund(paymentId, refundData);
      return {
        success: true,
        refund
      };
    } catch (error) {
      console.error('Refund error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Calculate subscription dates
  static calculateSubscriptionDates(plan) {
    const startDate = new Date();
    let endDate = new Date();
    let amount;

    switch (plan) {
      case 'trial':
        endDate.setDate(startDate.getDate() + parseInt(process.env.TRIAL_DURATION_DAYS || 5));
        amount = parseInt(process.env.TRIAL_PRICE || 100); // ₹1 in paise
        break;
      case 'monthly':
        endDate.setDate(startDate.getDate() + 30); // 30 days for monthly
        amount = parseInt(process.env.MONTHLY_PRICE || 11700); // ₹117 in paise (₹99 + 18% GST)
        break;
      case 'yearly':
        endDate.setDate(startDate.getDate() + 365); // 365 days for yearly
        amount = parseInt(process.env.YEARLY_PRICE || 49900); // ₹499 in paise
        break;
      default:
        throw new Error('Invalid subscription plan');
    }

    return {
      startDate,
      endDate,
      amount
    };
  }

  // Get subscription plans with actual Razorpay plan IDs
  static getSubscriptionPlans() {
    // Get predefined plan IDs from environment variables
    const monthlyPlanId = process.env.RAZORPAY_MONTHLY_PLAN_ID;
    const yearlyPlanId = process.env.RAZORPAY_YEARLY_PLAN_ID;

    return {
      trial: {
        name: 'Trial',
        duration: '5 days',
        price: parseInt(process.env.TRIAL_PRICE || 100) / 100, // Convert paise to rupees
        priceInPaise: parseInt(process.env.TRIAL_PRICE || 100),
        currency: 'INR',
        features: ['Access to all videos', 'HD quality', 'Mobile & web access'],
        billingCycle: 'one-time',
        description: `Try ${process.env.TRIAL_DURATION_DAYS || 5} days for ₹${parseInt(process.env.TRIAL_PRICE || 100) / 100}, then ₹${parseInt(process.env.MONTHLY_PRICE || 11700) / 100}/month`,
        razorpayPlanId: null, // Trial doesn't use Razorpay plan ID - handled as one-time payment
        durationDays: parseInt(process.env.TRIAL_DURATION_DAYS || 5)
      },
      monthly: {
        name: 'Monthly Subscription',
        duration: '30 days',
        price: parseInt(process.env.MONTHLY_PRICE || 11700) / 100, // Convert paise to rupees
        priceInPaise: parseInt(process.env.MONTHLY_PRICE || 11700),
        basePrice: parseInt(process.env.MONTHLY_BASE_PRICE || 9900) / 100, // ₹99 base price
        gst: 18,
        currency: 'INR',
        features: ['Access to all videos', 'HD quality', 'Mobile & web access', 'Download for offline viewing', 'Auto-renewal'],
        billingCycle: 'monthly',
        autoRenew: true,
        description: `₹${parseInt(process.env.MONTHLY_BASE_PRICE || 9900) / 100} + 18% GST = ₹${parseInt(process.env.MONTHLY_PRICE || 11700) / 100}/month`,
        razorpayPlanId: monthlyPlanId, // Actual Razorpay plan ID from .env
        durationDays: 30
      },
      yearly: {
        name: 'Yearly Subscription',
        duration: '365 days',
        price: parseInt(process.env.YEARLY_PRICE || 49900) / 100, // Convert paise to rupees
        priceInPaise: parseInt(process.env.YEARLY_PRICE || 49900),
        currency: 'INR',
        features: ['Access to all videos', 'HD quality', 'Mobile & web access', 'Download for offline viewing', 'Priority support', 'Auto-renewal'],
        billingCycle: 'yearly',
        autoRenew: true,
        savings: `Save ₹${((parseInt(process.env.MONTHLY_PRICE || 11700) * 12) - parseInt(process.env.YEARLY_PRICE || 49900)) / 100} compared to monthly`,
        razorpayPlanId: yearlyPlanId, // Actual Razorpay plan ID from .env
        durationDays: 365
      }
    };
  }

  // Get subscription plans with Razorpay plan details (async version)
  static async getSubscriptionPlansWithDetails() {
    try {
      const plans = this.getSubscriptionPlans();

      // Fetch actual plan details from Razorpay for monthly and yearly plans
      const planDetails = {};

      for (const [planType, planInfo] of Object.entries(plans)) {
        planDetails[planType] = { ...planInfo };

        // Fetch Razorpay plan details if plan ID exists
        if (planInfo.razorpayPlanId) {
          try {
            const razorpayPlan = await razorpay.plans.fetch(planInfo.razorpayPlanId);
            planDetails[planType].razorpayApiDetails = {
              id: razorpayPlan.id,
              period: razorpayPlan.period,
              interval: razorpayPlan.interval,
              item: razorpayPlan.item,
              status: razorpayPlan.status,
              created_at: razorpayPlan.created_at
            };
          } catch (error) {
            console.warn(`Failed to fetch Razorpay plan details for ${planType}:`, error.message);
            planDetails[planType].razorpayApiDetails = null;
          }
        }
      }

      return {
        success: true,
        plans: planDetails
      };
    } catch (error) {
      console.error('Error fetching subscription plans with details:', error);
      return {
        success: false,
        error: error.message,
        plans: this.getSubscriptionPlans() // Fallback to basic plans
      };
    }
  }

  // Create subscription order
  static async createSubscriptionOrder(userId, plan) {
    try {
      const { startDate, endDate, amount } = this.calculateSubscriptionDates(plan);
      const receipt = `sub_${plan}_${Date.now().toString().slice(-6)}`; // Keep under 40 chars

      const orderResult = await this.createRazorpayOrder(amount, 'INR', receipt);

      if (!orderResult.success) {
        throw new Error(orderResult.error);
      }

      return {
        success: true,
        order: orderResult.order,
        subscriptionDetails: {
          plan,
          startDate,
          endDate,
          amount
        }
      };
    } catch (error) {
      console.error('Subscription order creation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get predefined Razorpay plan ID from environment variables
  static getPredefinedPlanId(plan) {
    switch (plan) {
      case 'monthly':
        return process.env.RAZORPAY_MONTHLY_PLAN_ID;
      case 'yearly':
        return process.env.RAZORPAY_YEARLY_PLAN_ID;
      default:
        throw new Error(`No predefined plan ID found for plan: ${plan}`);
    }
  }

  // Validate that required plan IDs are configured
  static validatePlanConfiguration() {
    const monthlyPlanId = process.env.RAZORPAY_MONTHLY_PLAN_ID;
    const yearlyPlanId = process.env.RAZORPAY_YEARLY_PLAN_ID;

    if (!monthlyPlanId) {
      throw new Error('RAZORPAY_MONTHLY_PLAN_ID is not configured in environment variables');
    }
    if (!yearlyPlanId) {
      throw new Error('RAZORPAY_YEARLY_PLAN_ID is not configured in environment variables');
    }

    return {
      monthly: monthlyPlanId,
      yearly: yearlyPlanId
    };
  }

  // DEPRECATED: Use getPredefinedPlanId instead
  // This method should not be used as it creates plans programmatically
  // static async createRazorpayPlan(planId, amount, interval, intervalCount = 1) {
  //   console.warn('⚠️  DEPRECATED: createRazorpayPlan method should not be used. Use predefined plan IDs instead.');
  //   throw new Error('Plan creation is disabled. Use predefined plan IDs from Razorpay Dashboard instead.');
  // }

  // Create Razorpay customer
  static async createRazorpayCustomer(customerData) {
    try {
      const customer = await razorpay.customers.create({
        name: customerData.name,
        email: customerData.email,
        contact: customerData.phone || '',
        fail_existing: '0' // Don't fail if customer already exists
      });

      return {
        success: true,
        customer
      };
    } catch (error) {
      console.error('Razorpay customer creation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create Razorpay subscription
  static async createRazorpaySubscription(planId, customerId, totalCount = 120, trialOptions = null) {
    try {
      const subscriptionData = {
        plan_id: planId,
        customer_id: customerId,
        quantity: 1,
        total_count: totalCount // Default to 120 cycles (10 years for monthly, 120 years for yearly)
      };

      // Add trial options if provided
      if (trialOptions) {
        if (trialOptions.trial_period) {
          subscriptionData.trial_period = trialOptions.trial_period;
        }
        if (trialOptions.trial_amount !== undefined) {
          subscriptionData.trial_amount = trialOptions.trial_amount;
        }
      }

      const subscription = await razorpay.subscriptions.create(subscriptionData);
      return {
        success: true,
        subscription
      };
    } catch (error) {
      console.error('Razorpay subscription creation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create Razorpay subscription with addons/discounts
  static async createRazorpaySubscriptionWithAddons(subscriptionData) {
    try {
      const subscription = await razorpay.subscriptions.create(subscriptionData);
      return {
        success: true,
        subscription
      };
    } catch (error) {
      console.error('Razorpay subscription with addons creation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // DEPRECATED: Use predefined monthly plan ID instead
  // static async createTrialToMonthlyPlan() {
  //   console.warn('⚠️  DEPRECATED: createTrialToMonthlyPlan method should not be used. Use predefined monthly plan ID instead.');

  //   // Return the predefined monthly plan ID instead of creating a new plan
  //   const monthlyPlanId = process.env.RAZORPAY_MONTHLY_PLAN_ID;

  //   if (!monthlyPlanId) {
  //     return {
  //       success: false,
  //       error: 'RAZORPAY_MONTHLY_PLAN_ID is not configured in environment variables'
  //     };
  //   }

  //   return {
  //     success: true,
  //     plan: {
  //       id: monthlyPlanId,
  //       // Note: This is a compatibility response. The actual plan details are in Razorpay Dashboard
  //       item: {
  //         name: 'Seekho Monthly Plan',
  //         amount: 11700,
  //         currency: 'INR'
  //       }
  //     }
  //   };
  // }

  // DEPRECATED: This method has been removed to simplify subscription flow
  // Use simple one-time payment for trials instead of complex UPI mandate setup
  static async createAutoRecurringTrialSubscription(userId, customerData) {
    console.warn('⚠️  DEPRECATED: createAutoRecurringTrialSubscription method is deprecated. Use simple trial subscription instead.');
    throw new Error('This method is deprecated. Use createSimpleTrialSubscription instead.');
  }

  // Cancel Razorpay subscription
  static async cancelRazorpaySubscription(subscriptionId, cancelAtCycleEnd = true) {
    try {
      const subscription = await razorpay.subscriptions.cancel(subscriptionId, {
        cancel_at_cycle_end: cancelAtCycleEnd ? 1 : 0
      });

      return {
        success: true,
        subscription
      };
    } catch (error) {
      console.error('Razorpay subscription cancellation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get Razorpay subscription details
  static async getRazorpaySubscription(subscriptionId) {
    try {
      const subscription = await razorpay.subscriptions.fetch(subscriptionId);
      return {
        success: true,
        subscription
      };
    } catch (error) {
      console.error('Error fetching Razorpay subscription:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = PaymentService;
