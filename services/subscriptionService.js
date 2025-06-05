const Subscription = require('../models/Subscription');
const User = require('../models/User');
const PaymentService = require('./paymentService');

class SubscriptionService {
  // Create new subscription
  static async createSubscription(userId, plan, paymentData) {
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
      console.error('Subscription creation error:', error);
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
}

module.exports = SubscriptionService;
