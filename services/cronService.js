const cron = require('node-cron');
const SubscriptionService = require('./subscriptionService');
const Subscription = require('../models/Subscription');

class CronService {
  static init() {
    console.log('🕐 Initializing cron jobs...');
    
    // Run every day at 2 AM to process renewals and cleanup
    cron.schedule('0 2 * * *', async () => {
      console.log('🔄 Running daily subscription maintenance...');
      await this.dailySubscriptionMaintenance();
    });

    // Run every hour to check for immediate renewals
    cron.schedule('0 * * * *', async () => {
      console.log('⏰ Checking for subscription renewals...');
      await this.processSubscriptionRenewals();
    });

    // Run every 6 hours to retry failed payments
    cron.schedule('0 */6 * * *', async () => {
      console.log('🔁 Retrying failed subscription renewals...');
      await this.retryFailedRenewals();
    });

    console.log('✅ Cron jobs initialized successfully');
  }

  // Daily maintenance tasks
  static async dailySubscriptionMaintenance() {
    try {
      console.log('Starting daily subscription maintenance...');
      
      // Process expired subscriptions
      const expiredResult = await SubscriptionService.processExpiredSubscriptions();
      console.log(`Processed ${expiredResult.processed || 0} expired subscriptions`);
      
      // Find and notify about expiring subscriptions
      const expiringResult = await SubscriptionService.findExpiringSubscriptions(3);
      if (expiringResult.success && expiringResult.subscriptions.length > 0) {
        console.log(`Found ${expiringResult.subscriptions.length} subscriptions expiring in 3 days`);
        // TODO: Send notification emails
      }
      
      // Clean up old webhook events from metadata
      await this.cleanupOldWebhookEvents();
      
      console.log('Daily subscription maintenance completed');
    } catch (error) {
      console.error('Daily maintenance error:', error);
    }
  }

  // Process subscription renewals
  static async processSubscriptionRenewals() {
    try {
      const subscriptions = await Subscription.findDueForRenewal();
      
      if (subscriptions.length === 0) {
        console.log('No subscriptions due for renewal');
        return;
      }

      console.log(`Processing ${subscriptions.length} subscriptions due for renewal`);
      
      for (const subscription of subscriptions) {
        try {
          const result = await SubscriptionService.processRenewal(subscription._id);
          if (result.success) {
            console.log(`✅ Renewed subscription ${subscription._id} for user ${subscription.user.email}`);
          } else {
            console.log(`❌ Failed to renew subscription ${subscription._id}: ${result.error}`);
          }
        } catch (error) {
          console.error(`Error processing renewal for subscription ${subscription._id}:`, error);
        }
      }
    } catch (error) {
      console.error('Process renewals error:', error);
    }
  }

  // Retry failed renewals
  static async retryFailedRenewals() {
    try {
      const subscriptions = await Subscription.findFailedRenewals();
      
      if (subscriptions.length === 0) {
        console.log('No failed renewals to retry');
        return;
      }

      console.log(`Retrying ${subscriptions.length} failed renewals`);
      
      for (const subscription of subscriptions) {
        try {
          const result = await SubscriptionService.processRenewal(subscription._id);
          if (result.success) {
            console.log(`✅ Retry successful for subscription ${subscription._id}`);
          } else {
            console.log(`❌ Retry failed for subscription ${subscription._id}: ${result.error}`);
          }
        } catch (error) {
          console.error(`Error retrying renewal for subscription ${subscription._id}:`, error);
        }
      }
    } catch (error) {
      console.error('Retry failed renewals error:', error);
    }
  }

  // Clean up old webhook events from metadata
  static async cleanupOldWebhookEvents() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const subscriptions = await Subscription.find({
        'metadata.webhookEvents': { $exists: true, $ne: [] }
      });

      let cleanedCount = 0;
      
      for (const subscription of subscriptions) {
        if (subscription.metadata.webhookEvents && subscription.metadata.webhookEvents.length > 10) {
          // Keep only the last 10 webhook events
          subscription.metadata.webhookEvents = subscription.metadata.webhookEvents.slice(-10);
          await subscription.save();
          cleanedCount++;
        }
      }
      
      if (cleanedCount > 0) {
        console.log(`Cleaned up webhook events for ${cleanedCount} subscriptions`);
      }
    } catch (error) {
      console.error('Cleanup webhook events error:', error);
    }
  }

  // Manual trigger for testing
  static async runMaintenanceNow() {
    console.log('🔧 Running manual subscription maintenance...');
    await this.dailySubscriptionMaintenance();
    await this.processSubscriptionRenewals();
    await this.retryFailedRenewals();
    console.log('✅ Manual maintenance completed');
  }

  // Get subscription statistics
  static async getSubscriptionStats() {
    try {
      const stats = {
        total: await Subscription.countDocuments(),
        active: await Subscription.countDocuments({ status: 'active' }),
        recurring: await Subscription.countDocuments({ isRecurring: true, status: 'active' }),
        dueForRenewal: (await Subscription.findDueForRenewal()).length,
        failedRenewals: (await Subscription.findFailedRenewals()).length,
        expiring: (await Subscription.findExpiring(7)).length
      };

      return {
        success: true,
        stats
      };
    } catch (error) {
      console.error('Get subscription stats error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = CronService;
