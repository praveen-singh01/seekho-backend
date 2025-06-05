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
        endDate.setMonth(startDate.getMonth() + 1);
        amount = parseInt(process.env.MONTHLY_PRICE || 19900); // ₹199 in paise
        break;
      case 'yearly':
        endDate.setFullYear(startDate.getFullYear() + 1);
        amount = parseInt(process.env.MONTHLY_PRICE || 19900) * 12 * 0.8; // 20% discount
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
        features: ['Access to all videos', 'HD quality', 'Mobile & web access']
      },
      monthly: {
        name: 'Monthly',
        duration: '1 month',
        price: 199,
        currency: 'INR',
        features: ['Access to all videos', 'HD quality', 'Mobile & web access', 'Download for offline viewing']
      },
      yearly: {
        name: 'Yearly',
        duration: '12 months',
        price: 1912, // 20% discount
        currency: 'INR',
        originalPrice: 2388,
        discount: '20%',
        features: ['Access to all videos', 'HD quality', 'Mobile & web access', 'Download for offline viewing', 'Priority support']
      }
    };
  }

  // Create subscription order
  static async createSubscriptionOrder(userId, plan) {
    try {
      const { startDate, endDate, amount } = this.calculateSubscriptionDates(plan);
      const receipt = `sub_${userId}_${plan}_${Date.now()}`;

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
}

module.exports = PaymentService;
