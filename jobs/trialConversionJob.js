const cron = require('node-cron');
const SubscriptionService = require('../services/subscriptionService');
const Subscription = require('../models/Subscription');

class TrialConversionJob {
  constructor() {
    this.isRunning = false;
  }

  // Start the cron job to check for expired trials every hour
  start() {
    console.log('🔄 Starting Trial Conversion Job...');

    // Run every hour at minute 0
    cron.schedule('0 * * * *', async () => {
      if (this.isRunning) {
        console.log('⏳ Trial conversion job already running, skipping...');
        return;
      }

      console.log('🔍 Checking for expired trials...');
      await this.processExpiredTrials();
    });

    // Also run immediately on startup
    setTimeout(() => {
      this.processExpiredTrials();
    }, 5000); // Wait 5 seconds after startup
  }

  // Process expired trials
  async processExpiredTrials() {
    this.isRunning = true;

    try {
      console.log('📋 Processing expired trials...');

      // Find trials with mandate that can auto-convert
      const trialsWithMandate = await Subscription.findTrialsWithMandateForConversion();

      // Find regular trials that need manual conversion
      const regularTrials = await Subscription.findTrialsForConversion();

      if (trialsWithMandate.length === 0 && regularTrials.length === 0) {
        console.log('✅ No expired trials found');
        return;
      }

      console.log(`📊 Found ${trialsWithMandate.length} trials with mandate and ${regularTrials.length} regular trials to process`);

      const results = {
        autoConverted: 0,
        manualConversion: 0,
        errors: 0,
        notifications: []
      };

      // Process trials with mandate (auto-convert)
      for (const subscription of trialsWithMandate) {
        try {
          console.log(`🔄 Auto-converting trial with mandate ${subscription._id} for user ${subscription.user.email}`);

          // Auto-convert to monthly (UPI mandate already set up)
          await subscription.autoConvertTrialWithMandate();

          results.autoConverted++;
          console.log(`✅ Auto-converted trial ${subscription._id} to monthly subscription`);

        } catch (error) {
          console.error(`❌ Error auto-converting trial ${subscription._id}:`, error);
          results.errors++;
        }
      }

      // Process regular trials (require manual conversion)
      for (const subscription of regularTrials) {
        try {
          console.log(`🔄 Processing regular trial ${subscription._id} for user ${subscription.user.email}`);

          // Mark trial as expired and requiring conversion
          subscription.status = 'expired';
          subscription.cancelReason = 'Trial expired - conversion to monthly required';
          await subscription.save();

          // Here you could add notification logic to inform the user
          // about trial expiration and the need to convert to monthly
          results.notifications.push({
            userId: subscription.user._id,
            email: subscription.user.email,
            subscriptionId: subscription._id,
            message: 'Trial expired - conversion required'
          });

          results.manualConversion++;
          console.log(`✅ Processed regular trial ${subscription._id}`);

        } catch (error) {
          console.error(`❌ Error processing trial ${subscription._id}:`, error);
          results.errors++;
        }
      }

      console.log(`📈 Trial conversion job completed:`);
      console.log(`   - Auto-converted: ${results.autoConverted}`);
      console.log(`   - Manual conversion required: ${results.manualConversion}`);
      console.log(`   - Errors: ${results.errors}`);
      console.log(`   - Notifications: ${results.notifications.length}`);

      // Here you could send notifications to users about trial expiration
      if (results.notifications.length > 0) {
        await this.sendTrialExpirationNotifications(results.notifications);
      }

    } catch (error) {
      console.error('❌ Trial conversion job error:', error);
    } finally {
      this.isRunning = false;
    }
  }

  // Send notifications to users about trial expiration
  async sendTrialExpirationNotifications(notifications) {
    console.log(`📧 Sending ${notifications.length} trial expiration notifications...`);

    // Here you would integrate with your notification service
    // For now, we'll just log the notifications
    for (const notification of notifications) {
      console.log(`📧 Notification for ${notification.email}: ${notification.message}`);

      // Example: Send email notification
      // await EmailService.sendTrialExpirationEmail(notification.email, {
      //   subscriptionId: notification.subscriptionId,
      //   conversionUrl: `${process.env.FRONTEND_URL}/subscription/convert/${notification.subscriptionId}`
      // });
    }
  }

  // Manual trigger for testing
  async triggerManually() {
    console.log('🔧 Manually triggering trial conversion job...');
    await this.processExpiredTrials();
  }

  // Get job status
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastRun: new Date().toISOString()
    };
  }
}

// Create singleton instance
const trialConversionJob = new TrialConversionJob();

module.exports = trialConversionJob;
