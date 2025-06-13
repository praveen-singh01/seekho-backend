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

      // Create Razorpay plan
      const interval = plan === 'monthly' ? 'monthly' : 'yearly';

      const planResult = await PaymentService.createRazorpayPlan(null, amount, interval);

      if (!planResult.success) {
        throw new Error(`Plan creation failed: ${planResult.error}`);
      }

      // Create Razorpay subscription with appropriate total_count
      const totalCount = plan === 'yearly' ? 50 : 120; // 50 years for yearly, 120 months for monthly
      const subscriptionResult = await PaymentService.createRazorpaySubscription(
        planResult.plan.id,
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
        razorpayPlanId: planResult.plan.id,
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
      const subscriptionId = payload.subscription.entity.id;
      const subscription = await Subscription.findOne({ razorpaySubscriptionId: subscriptionId });

      if (!subscription) {
        console.log(`Subscription not found for Razorpay ID: ${subscriptionId}`);
        return { success: false, error: 'Subscription not found' };
      }

      // Update subscription with successful payment
      const { endDate } = PaymentService.calculateSubscriptionDates(subscription.plan);
      await subscription.renew(endDate, payload.payment.entity.id, payload.payment.entity.order_id);
      await subscription.updateFromWebhook({ event: 'subscription.charged' });

      console.log(`Subscription ${subscription._id} renewed successfully via webhook`);
      return { success: true, message: 'Subscription renewed' };
    } catch (error) {
      console.error('Handle subscription charged error:', error);
      return { success: false, error: error.message };
    }
  }

  // Handle subscription cancelled webhook
  static async handleSubscriptionCancelled(payload) {
    try {
      const subscriptionId = payload.subscription.entity.id;
      const subscription = await Subscription.findOne({ razorpaySubscriptionId: subscriptionId });

      if (!subscription) {
        console.log(`Subscription not found for Razorpay ID: ${subscriptionId}`);
        return { success: false, error: 'Subscription not found' };
      }

      await subscription.cancel('Cancelled via Razorpay webhook');
      await subscription.updateFromWebhook({ event: 'subscription.cancelled' });

      console.log(`Subscription ${subscription._id} cancelled via webhook`);
      return { success: true, message: 'Subscription cancelled' };
    } catch (error) {
      console.error('Handle subscription cancelled error:', error);
      return { success: false, error: error.message };
    }
  }

  // Handle subscription completed webhook
  static async handleSubscriptionCompleted(payload) {
    try {
      const subscriptionId = payload.subscription.entity.id;
      const subscription = await Subscription.findOne({ razorpaySubscriptionId: subscriptionId });

      if (!subscription) {
        console.log(`Subscription not found for Razorpay ID: ${subscriptionId}`);
        return { success: false, error: 'Subscription not found' };
      }

      subscription.status = 'expired';
      subscription.autoRenew = false;
      await subscription.save();
      await subscription.updateFromWebhook({ event: 'subscription.completed' });

      console.log(`Subscription ${subscription._id} completed via webhook`);
      return { success: true, message: 'Subscription completed' };
    } catch (error) {
      console.error('Handle subscription completed error:', error);
      return { success: false, error: error.message };
    }
  }

  // Handle payment failed webhook
  static async handlePaymentFailed(payload) {
    try {
      // Find subscription by payment details
      const subscription = await Subscription.findOne({
        $or: [
          { paymentId: payload.payment.entity.id },
          { razorpaySubscriptionId: payload.subscription?.entity?.id }
        ]
      });

      if (!subscription) {
        console.log(`Subscription not found for failed payment`);
        return { success: false, error: 'Subscription not found' };
      }

      await subscription.handleFailedPayment();
      await subscription.updateFromWebhook({ event: 'payment.failed' });

      console.log(`Payment failed handled for subscription ${subscription._id}`);
      return { success: true, message: 'Payment failure handled' };
    } catch (error) {
      console.error('Handle payment failed error:', error);
      return { success: false, error: error.message };
    }
  }

  // Handle trial to monthly conversion
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

      // Convert trial to monthly
      await subscription.convertTrialToMonthly(
        paymentData.paymentId,
        paymentData.orderId,
        paymentData.signature
      );

      return {
        success: true,
        subscription: subscription
      };
    } catch (error) {
      console.error('Trial conversion completion error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Process expired trials for automatic conversion
  static async processExpiredTrials() {
    try {
      const expiredTrials = await Subscription.findTrialsForConversion();
      const results = [];

      for (const subscription of expiredTrials) {
        try {
          // Create automatic conversion order
          const conversionResult = await this.handleTrialConversion(subscription._id);

          if (conversionResult.success) {
            // Here you would typically integrate with your payment processor
            // to automatically charge the user's saved payment method
            // For now, we'll mark the trial as expired and notify the user

            subscription.status = 'expired';
            subscription.cancelReason = 'Trial expired - conversion required';
            await subscription.save();

            results.push({
              subscriptionId: subscription._id,
              userId: subscription.user._id,
              status: 'conversion_required',
              orderId: conversionResult.order.id
            });
          }
        } catch (error) {
          console.error(`Failed to process trial ${subscription._id}:`, error);
          results.push({
            subscriptionId: subscription._id,
            userId: subscription.user._id,
            status: 'error',
            error: error.message
          });
        }
      }

      return {
        success: true,
        processedTrials: results.length,
        results: results
      };
    } catch (error) {
      console.error('Process expired trials error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = SubscriptionService;
