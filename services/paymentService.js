const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

class PaymentService {
  // Create Razorpay order
  static async createRazorpayOrder(amount, currency = 'INR', receipt = null) {
    try {
      const options = {
        amount: amount, // amount in paise
        currency: currency,
        receipt: receipt || `receipt_${Date.now()}`,
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
        endDate.setDate(startDate.getDate() + parseInt(process.env.TRIAL_DURATION_DAYS || 7));
        amount = parseInt(process.env.TRIAL_PRICE || 100); // ₹1 in paise
        break;
      case 'monthly':
        endDate.setDate(startDate.getDate() + 30); // 30 days for monthly
        amount = parseInt(process.env.MONTHLY_PRICE || 9900); // ₹99 in paise
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

  // Get subscription plans
  static getSubscriptionPlans() {
    return {
      trial: {
        name: 'Trial',
        duration: '7 days',
        price: 1,
        currency: 'INR',
        features: ['Access to all videos', 'HD quality', 'Mobile & web access'],
        billingCycle: 'one-time'
      },
      monthly: {
        name: 'Monthly Subscription',
        duration: '30 days',
        price: 99,
        currency: 'INR',
        features: ['Access to all videos', 'HD quality', 'Mobile & web access', 'Download for offline viewing', 'Auto-renewal'],
        billingCycle: 'monthly',
        autoRenew: true
      },
      yearly: {
        name: 'Yearly Subscription',
        duration: '365 days',
        price: 499,
        currency: 'INR',
        features: ['Access to all videos', 'HD quality', 'Mobile & web access', 'Download for offline viewing', 'Priority support', 'Auto-renewal'],
        billingCycle: 'yearly',
        autoRenew: true,
        savings: 'Save ₹689 compared to monthly'
      }
    };
  }

  // Create subscription order
  static async createSubscriptionOrder(userId, plan) {
    try {
      const { startDate, endDate, amount } = this.calculateSubscriptionDates(plan);
      const receipt = `sub_${plan}_${Date.now().toString().slice(-8)}`;

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

  // Create Razorpay subscription plan
  static async createRazorpayPlan(planId, amount, interval, intervalCount = 1) {
    try {
      const planData = {
        period: interval, // 'daily', 'weekly', 'monthly', 'yearly'
        interval: intervalCount,
        item: {
          name: `Seekho ${interval} Plan`,
          amount: amount, // amount in paise
          currency: 'INR'
        }
      };

      const plan = await razorpay.plans.create(planData);
      return {
        success: true,
        plan
      };
    } catch (error) {
      console.error('Razorpay plan creation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

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
  static async createRazorpaySubscription(planId, customerId, totalCount = 120) {
    try {
      const subscriptionData = {
        plan_id: planId,
        customer_id: customerId,
        quantity: 1,
        total_count: totalCount // Default to 120 cycles (10 years for monthly, 120 years for yearly)
      };

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
