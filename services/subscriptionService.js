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

  // Create auto-recurring trial subscription (₹1 for 5 days, then ₹117/month)
  static async createAutoRecurringTrialSubscription(userId, customerData) {
    try {
      // Create auto-recurring trial subscription via PaymentService
      const result = await PaymentService.createAutoRecurringTrialSubscription(userId, customerData);

      if (!result.success) {
        throw new Error(result.error);
      }

      // Calculate dates
      const startDate = new Date();
      const trialEndDate = new Date();
      trialEndDate.setDate(startDate.getDate() + 5); // 5 days trial

      // Next billing date is 5 days from start (when trial ends)
      const nextBillingDate = new Date(trialEndDate);

      // Create subscription record in database
      const subscription = await Subscription.create({
        user: userId,
        plan: 'trial', // This will auto-convert to monthly
        status: 'active', // Active immediately after payment
        startDate,
        endDate: trialEndDate, // Trial ends after 5 days
        amount: 100, // Trial amount (₹1)
        currency: 'INR',
        paymentProvider: 'razorpay',
        paymentId: result.subscription.id,
        orderId: result.subscription.id,
        razorpaySubscriptionId: result.subscription.id,
        razorpayPlanId: result.plan.id,
        razorpayCustomerId: result.customer.id,
        subscriptionType: 'recurring',
        isRecurring: true,
        autoRenew: true,
        nextBillingDate,
        // Trial-specific fields
        isTrialSubscription: true,
        originalTrialEndDate: trialEndDate,
        trialWithMandate: false, // This is auto-recurring, not mandate-based
        metadata: {
          customerEmail: customerData.email,
          customerPhone: customerData.phone,
          trialAmount: 100, // ₹1
          monthlyAmount: 11700, // ₹117
          trialPeriod: 5, // 5 days
          autoRecurring: true
        }
      });

      // Update user's subscription reference
      await User.findByIdAndUpdate(userId, { subscription: subscription._id });

      return {
        success: true,
        subscription,
        razorpaySubscription: result.subscription,
        razorpayPlan: result.plan,
        razorpayCustomer: result.customer,
        trialAmount: result.trialAmount,
        monthlyAmount: result.monthlyAmount,
        trialPeriod: result.trialPeriod
      };
    } catch (error) {
      console.error('Auto-recurring trial subscription creation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Activate auto-recurring trial subscription after payment
  static async activateAutoRecurringTrialSubscription(userId, paymentData) {
    try {
      // Find the subscription by Razorpay subscription ID
      const subscription = await Subscription.findOne({
        user: userId,
        razorpaySubscriptionId: paymentData.subscriptionId,
        plan: 'trial',
        isTrialSubscription: true
      });

      if (!subscription) {
        throw new Error('Auto-recurring trial subscription not found');
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
      console.error('Auto-recurring trial activation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create trial subscription with UPI mandate for auto-conversion
  static async createTrialWithMandate(userId, customerData) {
    try {
      // Create Razorpay customer
      const customerResult = await PaymentService.createRazorpayCustomer(customerData);
      if (!customerResult.success) {
        throw new Error(`Customer creation failed: ${customerResult.error}`);
      }

      // Create monthly plan (₹117/month) - this will be the mandate amount
      const monthlyPlanResult = await PaymentService.createRazorpayPlan(
        `monthly_plan_${Date.now()}`,
        11700, // ₹117 in paise
        'monthly'
      );

      if (!monthlyPlanResult.success) {
        throw new Error(`Monthly plan creation failed: ${monthlyPlanResult.error}`);
      }

      // Create Razorpay subscription for ₹117/month
      // The first payment will be discounted to ₹1 using addons/discounts
      const subscriptionResult = await PaymentService.createRazorpaySubscription(
        monthlyPlanResult.plan.id,
        customerResult.customer.id,
        120 // 120 months total
      );

      if (!subscriptionResult.success) {
        throw new Error(`Subscription creation failed: ${subscriptionResult.error}`);
      }

      // Calculate dates
      const startDate = new Date();
      const trialEndDate = new Date();
      trialEndDate.setDate(startDate.getDate() + 5); // 5 days trial

      // Next billing should be immediately after trial ends (5 days from start)
      const nextBillingDate = new Date(trialEndDate);
      // No additional days - billing happens right after trial expires

      const subscription = await Subscription.create({
        user: userId,
        plan: 'trial', // This is a trial that will convert to monthly
        status: 'pending',
        startDate,
        endDate: trialEndDate, // Only 5 days access
        amount: 100, // Trial amount (what user actually pays)
        currency: 'INR',
        paymentProvider: 'razorpay',
        paymentId: subscriptionResult.subscription.id,
        orderId: subscriptionResult.subscription.id,
        razorpaySubscriptionId: subscriptionResult.subscription.id,
        razorpayPlanId: monthlyPlanResult.plan.id,
        razorpayCustomerId: customerResult.customer.id,
        subscriptionType: 'recurring',
        isRecurring: true,
        autoRenew: true,
        nextBillingDate, // Next billing after 5 days
        // Trial-specific fields
        isTrialSubscription: true,
        originalTrialEndDate: trialEndDate,
        trialWithMandate: true, // Flag to indicate this trial has UPI mandate
        metadata: {
          customerEmail: customerData.email,
          customerPhone: customerData.phone,
          trialAmount: 100, // What user pays initially
          monthlyAmount: 11700, // What mandate is set up for
          mandateAmount: 11700, // UPI mandate amount
          accessDuration: 5 // Only 5 days of access
        }
      });

      // Update user's subscription reference
      await User.findByIdAndUpdate(userId, { subscription: subscription._id });

      return {
        success: true,
        subscription,
        razorpaySubscription: subscriptionResult.subscription,
        mandateSetup: true,
        firstPaymentAmount: 100, // ₹1 (with discount)
        mandateAmount: 11700 // ₹117 (UPI mandate amount)
      };
    } catch (error) {
      console.error('Trial with mandate creation error:', error);
      return {
        success: false,
        error: error.message
      };
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

  // Handle webhook events
  static async handleWebhook(event, payload) {
    try {
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
          return {
            success: true,
            message: `Event ${event} acknowledged but not processed`
          };
      }
    } catch (error) {
      console.error('Webhook handling error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Handle subscription charged event (auto-billing)
  static async handleSubscriptionCharged(payload) {
    try {
      const { subscription, payment } = payload;

      // Find subscription in our database
      const dbSubscription = await Subscription.findOne({
        razorpaySubscriptionId: subscription.entity.id
      }).populate('user');

      if (!dbSubscription) {
        console.error(`Subscription not found: ${subscription.entity.id}`);
        return {
          success: false,
          error: `Subscription not found: ${subscription.entity.id}`
        };
      }

      // Check if this is a trial conversion (first auto-billing after trial)
      if (dbSubscription.isTrialSubscription && dbSubscription.plan === 'trial') {
        // Convert trial to monthly subscription
        await this.convertTrialToMonthlyWebhook(dbSubscription, payment.entity);
        return {
          success: true,
          message: `Trial converted to monthly: ${subscription.entity.id}`
        };
      } else {
        // Regular subscription renewal
        await this.renewSubscriptionWebhook(dbSubscription, payment.entity);
        return {
          success: true,
          message: `Subscription renewed: ${subscription.entity.id}`
        };
      }
    } catch (error) {
      console.error('Error handling subscription charged:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Convert trial subscription to monthly after auto-billing
  static async convertTrialToMonthlyWebhook(subscription, payment) {
    try {
      // Update subscription to monthly
      subscription.plan = 'monthly';
      subscription.isTrialSubscription = false;
      subscription.trialConvertedAt = new Date();
      subscription.amount = 11700; // ₹117 in paise

      // Extend subscription for 30 days from trial end date
      const newEndDate = new Date(subscription.endDate);
      newEndDate.setDate(newEndDate.getDate() + 30);
      subscription.endDate = newEndDate;

      // Set next billing date
      const nextBilling = new Date(newEndDate);
      nextBilling.setDate(nextBilling.getDate() + 30);
      subscription.nextBillingDate = nextBilling;

      // Update payment details
      subscription.paymentId = payment.id;
      subscription.lastSuccessfulPayment = new Date();
      subscription.failedPaymentCount = 0;

      await subscription.save();

      console.log(`Trial converted to monthly: ${subscription._id}`);
    } catch (error) {
      console.error('Error converting trial to monthly:', error);
      throw error;
    }
  }

  // Renew existing subscription
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

  // Handle subscription cancelled event
  static async handleSubscriptionCancelled(payload) {
    try {
      const { subscription } = payload;

      const dbSubscription = await Subscription.findOne({
        razorpaySubscriptionId: subscription.entity.id
      });

      if (!dbSubscription) {
        console.error(`Subscription not found: ${subscription.entity.id}`);
        return {
          success: false,
          error: `Subscription not found: ${subscription.entity.id}`
        };
      }

      dbSubscription.status = 'cancelled';
      dbSubscription.cancelledAt = new Date();
      dbSubscription.autoRenew = false;

      await dbSubscription.save();

      return {
        success: true,
        message: `Subscription cancelled: ${subscription.entity.id}`
      };
    } catch (error) {
      console.error('Error handling subscription cancelled:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Handle subscription completed event
  static async handleSubscriptionCompleted(payload) {
    try {
      const { subscription } = payload;

      const dbSubscription = await Subscription.findOne({
        razorpaySubscriptionId: subscription.entity.id
      });

      if (!dbSubscription) {
        console.error(`Subscription not found: ${subscription.entity.id}`);
        return {
          success: false,
          error: `Subscription not found: ${subscription.entity.id}`
        };
      }

      dbSubscription.status = 'expired';
      dbSubscription.autoRenew = false;

      await dbSubscription.save();

      return {
        success: true,
        message: `Subscription completed: ${subscription.entity.id}`
      };
    } catch (error) {
      console.error('Error handling subscription completed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Handle payment failed event
  static async handlePaymentFailed(payload) {
    try {
      const { payment } = payload;

      // Find subscription by payment details
      const dbSubscription = await Subscription.findOne({
        razorpaySubscriptionId: payment.entity.subscription_id
      });

      if (!dbSubscription) {
        console.error(`Subscription not found for failed payment: ${payment.entity.subscription_id}`);
        return {
          success: false,
          error: `Subscription not found for failed payment: ${payment.entity.subscription_id}`
        };
      }

      // Increment failed payment count
      dbSubscription.failedPaymentCount += 1;
      dbSubscription.lastRenewalAttempt = new Date();

      // If too many failures, mark as expired
      if (dbSubscription.failedPaymentCount >= 3) {
        dbSubscription.status = 'expired';
        dbSubscription.autoRenew = false;
        dbSubscription.cancelReason = 'Payment failed multiple times';
      }

      await dbSubscription.save();

      return {
        success: true,
        message: `Payment failed for subscription: ${payment.entity.subscription_id}`
      };
    } catch (error) {
      console.error('Error handling payment failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = SubscriptionService;
