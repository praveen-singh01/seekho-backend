const Subscription = require('../models/Subscription');
const User = require('../models/User');
const PaymentService = require('./paymentService');

class SubscriptionService {
  // Create new subscription (one-time payment for trial)
  static async createOneTimeSubscription(userId, plan, paymentData) {
    try {
      const { startDate, endDate, amount } = PaymentService.calculateSubscriptionDates(plan);

      const subscription = await Subscription.create({
        user: userId,
        plan,
        status: 'active',
        startDate,
        endDate,
        amount,
        currency: 'INR',
        paymentProvider: 'razorpay',
        paymentId: paymentData.paymentId,
        orderId: paymentData.orderId,
        signature: paymentData.signature,
        subscriptionType: 'one-time',
        isRecurring: false,
        autoRenew: false,
        // Trial-specific fields
        isTrialSubscription: plan === 'trial',
        originalTrialEndDate: plan === 'trial' ? endDate : null,
        metadata: {
          customerEmail: paymentData.email,
          customerPhone: paymentData.phone
        }
      });

      // Update user's subscription reference
      await User.findByIdAndUpdate(userId, { subscription: subscription._id });

      return {
        success: true,
        subscription
      };
    } catch (error) {
      console.error('One-time subscription creation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create recurring subscription with Razorpay
  static async createRecurringSubscription(userId, plan, customerData) {
    try {
      const { startDate, endDate, amount } = PaymentService.calculateSubscriptionDates(plan);

      // Create Razorpay customer
      const customerResult = await PaymentService.createRazorpayCustomer(customerData);
      if (!customerResult.success) {
        throw new Error(`Customer creation failed: ${customerResult.error}`);
      }

      // Use pre-created plan from Razorpay Dashboard
      let razorpayPlanId;
      if (plan === 'monthly') {
        razorpayPlanId = process.env.RAZORPAY_MONTHLY_PLAN_ID;
      } else if (plan === 'yearly') {
        razorpayPlanId = process.env.RAZORPAY_YEARLY_PLAN_ID;
      } else {
        throw new Error(`Invalid plan: ${plan}`);
      }

      if (!razorpayPlanId) {
        throw new Error(`Plan ID not configured for ${plan} plan`);
      }

      // Create Razorpay subscription with appropriate total_count
      const totalCount = plan === 'yearly' ? 50 : 120; // 50 years for yearly, 120 months for monthly
      const subscriptionResult = await PaymentService.createRazorpaySubscription(
        razorpayPlanId,
        customerResult.customer.id,
        totalCount
      );

      if (!subscriptionResult.success) {
        throw new Error(`Subscription creation failed: ${subscriptionResult.error}`);
      }

      // Calculate next billing date
      const nextBillingDate = new Date(endDate);
      if (plan === 'monthly') {
        nextBillingDate.setDate(nextBillingDate.getDate() + 30);
      } else if (plan === 'yearly') {
        nextBillingDate.setDate(nextBillingDate.getDate() + 365);
      }

      const subscription = await Subscription.create({
        user: userId,
        plan,
        status: 'pending',
        startDate,
        endDate,
        amount,
        currency: 'INR',
        paymentProvider: 'razorpay',
        paymentId: subscriptionResult.subscription.id,
        orderId: subscriptionResult.subscription.id,
        razorpaySubscriptionId: subscriptionResult.subscription.id,
        razorpayPlanId: razorpayPlanId,
        razorpayCustomerId: customerResult.customer.id,
        subscriptionType: 'recurring',
        isRecurring: true,
        autoRenew: true,
        nextBillingDate,
        metadata: {
          customerEmail: customerData.email,
          customerPhone: customerData.phone
        }
      });

      // Update user's subscription reference
      await User.findByIdAndUpdate(userId, { subscription: subscription._id });

      return {
        success: true,
        subscription,
        razorpaySubscription: subscriptionResult.subscription
      };
    } catch (error) {
      console.error('Recurring subscription creation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Activate pending recurring subscription after payment
  static async activateRecurringSubscription(userId, razorpaySubscriptionId, paymentData) {
    try {
      const subscription = await Subscription.findOne({
        user: userId,
        razorpaySubscriptionId: razorpaySubscriptionId,
        status: 'pending'
      });

      if (!subscription) {
        return {
          success: false,
          error: 'Pending subscription not found'
        };
      }

      // Update subscription to active
      subscription.status = 'active';
      subscription.lastSuccessfulPayment = new Date();
      if (paymentData.paymentId) {
        subscription.paymentId = paymentData.paymentId;
      }
      if (paymentData.orderId) {
        subscription.orderId = paymentData.orderId;
      }
      if (paymentData.signature) {
        subscription.signature = paymentData.signature;
      }

      await subscription.save();

      // Update user's subscription reference
      await User.findByIdAndUpdate(userId, { subscription: subscription._id });

      return {
        success: true,
        subscription
      };
    } catch (error) {
      console.error('Activate recurring subscription error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get user's active subscription
  static async getUserSubscription(userId) {
    try {
      const subscription = await Subscription.findOne({
        user: userId,
        status: 'active'
      }).sort({ createdAt: -1 });

      return {
        success: true,
        subscription,
        isActive: subscription ? subscription.isActive() : false
      };
    } catch (error) {
      console.error('Get subscription error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Clean up pending subscriptions (for maintenance)
  static async cleanupPendingSubscriptions() {
    try {
      // Remove pending subscriptions older than 1 hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      const result = await Subscription.deleteMany({
        status: 'pending',
        createdAt: { $lt: oneHourAgo }
      });

      return {
        success: true,
        deletedCount: result.deletedCount
      };
    } catch (error) {
      console.error('Cleanup pending subscriptions error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Cancel subscription
  static async cancelSubscription(userId, reason = null) {
    try {
      const subscription = await Subscription.findOne({
        user: userId,
        status: 'active'
      });

      if (!subscription) {
        return {
          success: false,
          error: 'No active subscription found'
        };
      }

      await subscription.cancel(reason);

      return {
        success: true,
        message: 'Subscription cancelled successfully',
        subscription
      };
    } catch (error) {
      console.error('Cancel subscription error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Check if user has access to premium content
  static async hasAccess(userId) {
    try {
      const result = await this.getUserSubscription(userId);
      return result.success && result.isActive;
    } catch (error) {
      console.error('Access check error:', error);
      return false;
    }
  }

  // Get subscription analytics
  static async getAnalytics() {
    try {
      const totalSubscriptions = await Subscription.countDocuments();
      const activeSubscriptions = await Subscription.countDocuments({ status: 'active' });
      const trialSubscriptions = await Subscription.countDocuments({ plan: 'trial', status: 'active' });
      const monthlySubscriptions = await Subscription.countDocuments({ plan: 'monthly', status: 'active' });
      const yearlySubscriptions = await Subscription.countDocuments({ plan: 'yearly', status: 'active' });

      // Revenue calculation
      const revenueData = await Subscription.aggregate([
        { $match: { status: 'active' } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$amount' },
            averageRevenue: { $avg: '$amount' }
          }
        }
      ]);

      // Monthly growth
      const monthlyGrowth = await Subscription.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 12)) }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 },
            revenue: { $sum: '$amount' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]);

      return {
        success: true,
        analytics: {
          total: totalSubscriptions,
          active: activeSubscriptions,
          byPlan: {
            trial: trialSubscriptions,
            monthly: monthlySubscriptions,
            yearly: yearlySubscriptions
          },
          revenue: {
            total: revenueData[0]?.totalRevenue || 0,
            average: revenueData[0]?.averageRevenue || 0
          },
          monthlyGrowth
        }
      };
    } catch (error) {
      console.error('Analytics error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Find expiring subscriptions
  static async findExpiringSubscriptions(days = 3) {
    try {
      const subscriptions = await Subscription.findExpiring(days);
      return {
        success: true,
        subscriptions
      };
    } catch (error) {
      console.error('Find expiring subscriptions error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Process expired subscriptions
  static async processExpiredSubscriptions() {
    try {
      const expiredSubscriptions = await Subscription.findExpired();

      for (const subscription of expiredSubscriptions) {
        subscription.status = 'expired';
        await subscription.save();

        // Update user's subscription reference
        await User.findByIdAndUpdate(subscription.user, { subscription: null });
      }

      return {
        success: true,
        processed: expiredSubscriptions.length
      };
    } catch (error) {
      console.error('Process expired subscriptions error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Extend subscription (for admin use)
  static async extendSubscription(subscriptionId, days) {
    try {
      const subscription = await Subscription.findById(subscriptionId);

      if (!subscription) {
        return {
          success: false,
          error: 'Subscription not found'
        };
      }

      await subscription.extend(days);

      return {
        success: true,
        message: `Subscription extended by ${days} days`,
        subscription
      };
    } catch (error) {
      console.error('Extend subscription error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Process subscription renewal
  static async processRenewal(subscriptionId) {
    try {
      const subscription = await Subscription.findById(subscriptionId).populate('user');

      if (!subscription) {
        return {
          success: false,
          error: 'Subscription not found'
        };
      }

      if (!subscription.isRecurring || !subscription.autoRenew) {
        return {
          success: false,
          error: 'Subscription is not set for auto-renewal'
        };
      }

      // Get current Razorpay subscription status
      const razorpayResult = await PaymentService.getRazorpaySubscription(subscription.razorpaySubscriptionId);

      if (!razorpayResult.success) {
        await subscription.handleFailedPayment();
        return {
          success: false,
          error: `Failed to fetch subscription status: ${razorpayResult.error}`
        };
      }

      const razorpaySubscription = razorpayResult.subscription;

      // Check if subscription is active in Razorpay
      if (razorpaySubscription.status === 'active') {
        // Update local subscription
        const { endDate } = PaymentService.calculateSubscriptionDates(subscription.plan);
        await subscription.renew(endDate, razorpaySubscription.id, razorpaySubscription.id);

        return {
          success: true,
          message: 'Subscription renewed successfully',
          subscription
        };
      } else {
        // Handle failed or cancelled subscription
        await subscription.handleFailedPayment();
        return {
          success: false,
          error: `Razorpay subscription status: ${razorpaySubscription.status}`
        };
      }
    } catch (error) {
      console.error('Process renewal error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Handle webhook events
  static async handleWebhook(event, payload) {
    try {
      console.log(`Processing webhook event: ${event}`);
      console.log('Webhook payload structure:', JSON.stringify(payload, null, 2));

      switch (event) {
        case 'subscription.charged':
          return await this.handleSubscriptionCharged(payload);

        case 'subscription.cancelled':
          return await this.handleSubscriptionCancelled(payload);

        case 'subscription.completed':
          return await this.handleSubscriptionCompleted(payload);

        case 'payment.failed':
          return await this.handlePaymentFailed(payload);

        default:
          console.log(`Unhandled webhook event: ${event}`);
          return { success: true, message: 'Event ignored' };
      }
    } catch (error) {
      console.error('Webhook handling error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Handle subscription charged webhook
  static async handleSubscriptionCharged(payload) {
    try {
      // Handle different payload structures
      let subscriptionId;
      let paymentData;

      if (payload.subscription && payload.subscription.entity) {
        // New payload structure
        subscriptionId = payload.subscription.entity.id;
        paymentData = payload.payment ? payload.payment.entity : null;
      } else if (payload.entity && payload.entity.subscription_id) {
        // Alternative payload structure
        subscriptionId = payload.entity.subscription_id;
        paymentData = payload.entity;
      } else {
        console.error('Unknown payload structure for subscription.charged:', payload);
        return { success: false, error: 'Invalid payload structure' };
      }

      console.log(`Looking for subscription with Razorpay ID: ${subscriptionId}`);

      const subscription = await Subscription.findOne({ razorpaySubscriptionId: subscriptionId });

      if (!subscription) {
        console.error(`Subscription not found: ${subscriptionId}`);
        // Log all subscriptions for debugging
        const allSubscriptions = await Subscription.find({}, 'razorpaySubscriptionId plan status').limit(10);
        console.log('Available subscriptions:', allSubscriptions.map(s => ({
          id: s._id,
          razorpayId: s.razorpaySubscriptionId,
          plan: s.plan,
          status: s.status
        })));
        return { success: false, error: `Subscription not found: ${subscriptionId}` };
      }

      // Handle subscription renewal (trials are one-time payments, so this should only be for recurring subscriptions)
      if (subscription.isRecurring) {
        await this.renewSubscriptionWebhook(subscription, paymentData);
        return {
          success: true,
          message: `Subscription renewed: ${subscriptionId}`
        };
      } else {
        console.log(`Non-recurring subscription charged: ${subscriptionId}`);
        return {
          success: true,
          message: `One-time subscription payment processed: ${subscriptionId}`
        };
      }
    } catch (error) {
      console.error('Handle subscription charged error:', error);
      return { success: false, error: error.message };
    }
  }

  // Handle subscription cancelled webhook
  static async handleSubscriptionCancelled(payload) {
    try {
      // Handle different payload structures
      let subscriptionId;

      if (payload.subscription && payload.subscription.entity) {
        subscriptionId = payload.subscription.entity.id;
      } else if (payload.entity && payload.entity.id) {
        subscriptionId = payload.entity.id;
      } else {
        console.error('Unknown payload structure for subscription.cancelled:', payload);
        return { success: false, error: 'Invalid payload structure' };
      }

      console.log(`Looking for subscription to cancel with Razorpay ID: ${subscriptionId}`);

      const subscription = await Subscription.findOne({ razorpaySubscriptionId: subscriptionId });

      if (!subscription) {
        console.error(`Subscription not found: ${subscriptionId}`);
        return { success: false, error: `Subscription not found: ${subscriptionId}` };
      }

      subscription.status = 'cancelled';
      subscription.cancelledAt = new Date();
      subscription.autoRenew = false;
      subscription.cancelReason = 'Cancelled via Razorpay webhook';

      await subscription.save();

      console.log(`Subscription ${subscription._id} cancelled via webhook`);
      return { success: true, message: `Subscription cancelled: ${subscriptionId}` };
    } catch (error) {
      console.error('Handle subscription cancelled error:', error);
      return { success: false, error: error.message };
    }
  }

  // Handle subscription completed webhook
  static async handleSubscriptionCompleted(payload) {
    try {
      // Handle different payload structures
      let subscriptionId;

      if (payload.subscription && payload.subscription.entity) {
        subscriptionId = payload.subscription.entity.id;
      } else if (payload.entity && payload.entity.id) {
        subscriptionId = payload.entity.id;
      } else {
        console.error('Unknown payload structure for subscription.completed:', payload);
        return { success: false, error: 'Invalid payload structure' };
      }

      console.log(`Looking for subscription to complete with Razorpay ID: ${subscriptionId}`);

      const subscription = await Subscription.findOne({ razorpaySubscriptionId: subscriptionId });

      if (!subscription) {
        console.error(`Subscription not found: ${subscriptionId}`);
        return { success: false, error: `Subscription not found: ${subscriptionId}` };
      }

      subscription.status = 'expired';
      subscription.autoRenew = false;

      await subscription.save();

      console.log(`Subscription ${subscription._id} completed via webhook`);
      return { success: true, message: `Subscription completed: ${subscriptionId}` };
    } catch (error) {
      console.error('Handle subscription completed error:', error);
      return { success: false, error: error.message };
    }
  }

  // Handle payment failed webhook
  static async handlePaymentFailed(payload) {
    try {
      // Handle different payload structures
      let subscriptionId;
      let paymentId;

      if (payload.payment && payload.payment.entity) {
        paymentId = payload.payment.entity.id;
        subscriptionId = payload.payment.entity.subscription_id;
      } else if (payload.entity) {
        paymentId = payload.entity.id;
        subscriptionId = payload.entity.subscription_id;
      } else {
        console.error('Unknown payload structure for payment.failed:', payload);
        return { success: false, error: 'Invalid payload structure' };
      }

      console.log(`Looking for subscription for failed payment. Subscription ID: ${subscriptionId}, Payment ID: ${paymentId}`);

      // Find subscription by payment details
      const subscription = await Subscription.findOne({
        $or: [
          { paymentId: paymentId },
          { razorpaySubscriptionId: subscriptionId }
        ]
      });

      if (!subscription) {
        console.error(`Subscription not found for failed payment: ${subscriptionId}`);
        return { success: false, error: `Subscription not found for failed payment: ${subscriptionId}` };
      }

      // Increment failed payment count
      subscription.failedPaymentCount = (subscription.failedPaymentCount || 0) + 1;
      subscription.lastRenewalAttempt = new Date();

      // If too many failures, mark as expired
      if (subscription.failedPaymentCount >= 3) {
        subscription.status = 'expired';
        subscription.autoRenew = false;
        subscription.cancelReason = 'Payment failed multiple times';
      }

      await subscription.save();

      console.log(`Payment failed handled for subscription ${subscription._id}`);
      return { success: true, message: `Payment failed for subscription: ${subscriptionId}` };
    } catch (error) {
      console.error('Handle payment failed error:', error);
      return { success: false, error: error.message };
    }
  }

  // Activate trial subscription after payment
  static async activateTrialSubscription(userId, paymentData) {
    try {
      // Find the pending trial subscription
      const subscription = await Subscription.findOne({
        user: userId,
        orderId: paymentData.orderId,
        plan: 'trial',
        status: 'pending',
        isTrialSubscription: true
      });

      if (!subscription) {
        throw new Error('Pending trial subscription not found');
      }

      // Update subscription with payment details
      subscription.status = 'active';
      subscription.paymentId = paymentData.paymentId;
      subscription.signature = paymentData.signature;
      subscription.lastSuccessfulPayment = new Date();

      await subscription.save();

      return {
        success: true,
        subscription
      };
    } catch (error) {
      console.error('Trial activation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create simple trial subscription (₹1 for 5 days, no auto-renewal)
  static async createSimpleTrialSubscription(userId, customerData) {
    try {
      // For trial, create a simple one-time payment order
      const trialAmount = parseInt(process.env.TRIAL_PRICE || 100); // ₹1 in paise
      const orderResult = await PaymentService.createRazorpayOrder(
        trialAmount,
        'INR',
        `trial_${userId}_${Date.now()}`
      );

      if (!orderResult.success) {
        throw new Error(`Order creation failed: ${orderResult.error}`);
      }

      // Calculate dates
      const startDate = new Date();
      const trialEndDate = new Date();
      trialEndDate.setDate(startDate.getDate() + 5); // 5 days trial

      const subscription = await Subscription.create({
        user: userId,
        plan: 'trial',
        status: 'pending', // Will be activated after payment
        startDate,
        endDate: trialEndDate,
        amount: trialAmount,
        currency: 'INR',
        paymentProvider: 'razorpay',
        orderId: orderResult.order.id,
        subscriptionType: 'one-time',
        isRecurring: false,
        autoRenew: false,
        // Trial-specific fields
        isTrialSubscription: true,
        originalTrialEndDate: trialEndDate,
        trialWithMandate: false, // Simple trial, no mandate
        metadata: {
          customerEmail: customerData.email,
          customerPhone: customerData.phone,
          trialAmount: trialAmount,
          accessDuration: 5 // 5 days of access
        }
      });

      // Update user's subscription reference
      await User.findByIdAndUpdate(userId, { subscription: subscription._id });

      return {
        success: true,
        subscription,
        order: orderResult.order,
        paymentAmount: trialAmount
      };
    } catch (error) {
      console.error('Simple trial subscription creation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Handle trial to monthly conversion (simplified)
  static async handleTrialConversion(subscriptionId) {
    try {
      const subscription = await Subscription.findById(subscriptionId).populate('user');

      if (!subscription || subscription.plan !== 'trial' || !subscription.isTrialSubscription) {
        throw new Error('Invalid trial subscription');
      }

      // Create Razorpay order for monthly payment
      const monthlyAmount = parseInt(process.env.MONTHLY_PRICE || 11700); // ₹117 in paise
      const orderResult = await PaymentService.createRazorpayOrder(
        monthlyAmount,
        'INR',
        `monthly_conversion_${Date.now()}`
      );

      if (!orderResult.success) {
        throw new Error(`Failed to create conversion order: ${orderResult.error}`);
      }

      return {
        success: true,
        order: orderResult.order,
        subscription: subscription,
        conversionAmount: monthlyAmount
      };
    } catch (error) {
      console.error('Trial conversion error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Complete trial to monthly conversion after payment
  static async completeTrialConversion(subscriptionId, paymentData) {
    try {
      const subscription = await Subscription.findById(subscriptionId).populate('user');

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Convert trial to monthly (simplified - just create new monthly subscription)
      const monthlyResult = await this.createOneTimeSubscription(
        subscription.user._id,
        'monthly',
        paymentData
      );

      if (!monthlyResult.success) {
        throw new Error(`Failed to create monthly subscription: ${monthlyResult.error}`);
      }

      // Mark old trial as expired
      subscription.status = 'expired';
      subscription.cancelReason = 'Converted to monthly subscription';
      await subscription.save();

      return {
        success: true,
        subscription: monthlyResult.subscription
      };
    } catch (error) {
      console.error('Trial conversion completion error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }



  // Renew existing subscription (simplified)
  static async renewSubscriptionWebhook(subscription, payment) {
    try {
      // Extend subscription period
      const currentEndDate = new Date(subscription.endDate);
      const newEndDate = new Date(currentEndDate);

      if (subscription.plan === 'monthly') {
        newEndDate.setDate(newEndDate.getDate() + 30);
      } else if (subscription.plan === 'yearly') {
        newEndDate.setDate(newEndDate.getDate() + 365);
      }

      subscription.endDate = newEndDate;

      // Set next billing date
      const nextBilling = new Date(newEndDate);
      if (subscription.plan === 'monthly') {
        nextBilling.setDate(nextBilling.getDate() + 30);
      } else if (subscription.plan === 'yearly') {
        nextBilling.setDate(nextBilling.getDate() + 365);
      }
      subscription.nextBillingDate = nextBilling;

      // Update payment details
      subscription.paymentId = payment.id;
      subscription.lastSuccessfulPayment = new Date();
      subscription.failedPaymentCount = 0;
      subscription.status = 'active';

      await subscription.save();

      console.log(`Subscription renewed: ${subscription._id}`);
    } catch (error) {
      console.error('Error renewing subscription:', error);
      throw error;
    }
  }


}

module.exports = SubscriptionService;
