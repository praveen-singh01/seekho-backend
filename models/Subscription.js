const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plan: {
    type: String,
    enum: ['trial', 'monthly', 'yearly'],
    required: true
  },
  // Trial-specific fields
  isTrialSubscription: {
    type: Boolean,
    default: false
  },
  trialConvertedAt: {
    type: Date,
    default: null
  },
  originalTrialEndDate: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'expired', 'pending'],
    default: 'pending'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  amount: {
    type: Number,
    required: true // Amount in paise (for Razorpay) or cents (for Stripe)
  },
  currency: {
    type: String,
    default: 'INR'
  },
  paymentProvider: {
    type: String,
    enum: ['razorpay', 'stripe'],
    required: true
  },
  paymentId: {
    type: String,
    required: true
  },
  orderId: {
    type: String,
    required: true
  },
  signature: {
    type: String // For Razorpay signature verification
  },
  // Razorpay Subscription specific fields
  razorpaySubscriptionId: {
    type: String,
    default: null // For auto-renewal subscriptions
  },
  razorpayPlanId: {
    type: String,
    default: null // Razorpay plan ID
  },
  razorpayCustomerId: {
    type: String,
    default: null // Razorpay customer ID
  },
  autoRenew: {
    type: Boolean,
    default: true
  },
  isRecurring: {
    type: Boolean,
    default: false // True for auto-renewal subscriptions
  },
  cancelledAt: {
    type: Date,
    default: null
  },
  cancelReason: {
    type: String,
    default: null
  },
  renewalAttempts: {
    type: Number,
    default: 0
  },
  lastRenewalAttempt: {
    type: Date,
    default: null
  },
  nextBillingDate: {
    type: Date,
    default: null // For recurring subscriptions
  },
  failedPaymentCount: {
    type: Number,
    default: 0
  },
  lastSuccessfulPayment: {
    type: Date,
    default: null
  },
  subscriptionType: {
    type: String,
    enum: ['one-time', 'recurring'],
    default: 'one-time'
  },
  metadata: {
    customerEmail: String,
    customerPhone: String,
    promoCode: String,
    discount: Number,
    originalAmount: Number,
    webhookEvents: [String] // Track webhook events
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for checking if subscription is active
subscriptionSchema.virtual('isActiveSubscription').get(function() {
  return this.status === 'active' && this.endDate > new Date();
});

// Virtual for days remaining
subscriptionSchema.virtual('daysRemaining').get(function() {
  if (this.status !== 'active') return 0;
  const now = new Date();
  const diffTime = this.endDate - now;
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
});

// Index for better performance
subscriptionSchema.index({ user: 1 });
subscriptionSchema.index({ status: 1, endDate: 1 });
subscriptionSchema.index({ paymentId: 1 });
subscriptionSchema.index({ orderId: 1 });
subscriptionSchema.index({ endDate: 1 }); // For finding expiring subscriptions
subscriptionSchema.index({ razorpaySubscriptionId: 1 });
subscriptionSchema.index({ nextBillingDate: 1 });
subscriptionSchema.index({ isRecurring: 1, autoRenew: 1 });

// Check if subscription is active
subscriptionSchema.methods.isActive = function() {
  return this.status === 'active' && this.endDate > new Date();
};

// Cancel subscription
subscriptionSchema.methods.cancel = async function(reason = null) {
  this.status = 'cancelled';
  this.autoRenew = false;
  this.cancelledAt = new Date();
  this.cancelReason = reason;
  await this.save();
};

// Extend subscription
subscriptionSchema.methods.extend = async function(days) {
  this.endDate = new Date(this.endDate.getTime() + (days * 24 * 60 * 60 * 1000));
  await this.save();
};

// Renew subscription
subscriptionSchema.methods.renew = async function(newEndDate, paymentId, orderId) {
  this.endDate = newEndDate;
  this.status = 'active';
  this.paymentId = paymentId;
  this.orderId = orderId;
  this.renewalAttempts = 0;
  this.lastRenewalAttempt = new Date();
  this.lastSuccessfulPayment = new Date();
  this.failedPaymentCount = 0;

  // Update next billing date for recurring subscriptions
  if (this.isRecurring) {
    const nextBilling = new Date(newEndDate);
    if (this.plan === 'monthly') {
      nextBilling.setMonth(nextBilling.getMonth() + 1);
    } else if (this.plan === 'yearly') {
      nextBilling.setFullYear(nextBilling.getFullYear() + 1);
    }
    this.nextBillingDate = nextBilling;
  }

  await this.save();
};

// Handle failed payment
subscriptionSchema.methods.handleFailedPayment = async function() {
  this.failedPaymentCount += 1;
  this.renewalAttempts += 1;
  this.lastRenewalAttempt = new Date();

  // Cancel subscription after 3 failed attempts
  if (this.failedPaymentCount >= 3) {
    this.status = 'cancelled';
    this.autoRenew = false;
    this.cancelReason = 'Payment failed multiple times';
    this.cancelledAt = new Date();
  }

  await this.save();
};

// Update subscription from webhook
subscriptionSchema.methods.updateFromWebhook = async function(webhookData) {
  if (webhookData.event) {
    if (!this.metadata.webhookEvents) {
      this.metadata.webhookEvents = [];
    }
    this.metadata.webhookEvents.push(`${webhookData.event}:${new Date().toISOString()}`);
  }

  await this.save();
};

// Static method to find expiring subscriptions
subscriptionSchema.statics.findExpiring = function(days = 3) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  return this.find({
    status: 'active',
    autoRenew: true,
    endDate: { $lte: futureDate, $gt: new Date() }
  }).populate('user');
};

// Static method to find expired subscriptions
subscriptionSchema.statics.findExpired = function() {
  return this.find({
    status: 'active',
    endDate: { $lt: new Date() }
  }).populate('user');
};

// Static method to find subscriptions due for renewal
subscriptionSchema.statics.findDueForRenewal = function() {
  const now = new Date();
  return this.find({
    status: 'active',
    isRecurring: true,
    autoRenew: true,
    nextBillingDate: { $lte: now },
    failedPaymentCount: { $lt: 3 }
  }).populate('user');
};

// Static method to find failed recurring payments to retry
subscriptionSchema.statics.findFailedRenewals = function() {
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  return this.find({
    status: 'active',
    isRecurring: true,
    autoRenew: true,
    failedPaymentCount: { $gt: 0, $lt: 3 },
    lastRenewalAttempt: { $lt: oneDayAgo }
  }).populate('user');
};

// Static method to find trials ready for conversion
subscriptionSchema.statics.findTrialsForConversion = function() {
  const now = new Date();
  return this.find({
    plan: 'trial',
    status: 'active',
    isTrialSubscription: true,
    trialConvertedAt: null,
    endDate: { $lte: now }
  }).populate('user');
};

// Convert trial to monthly subscription
subscriptionSchema.methods.convertTrialToMonthly = async function(paymentId, orderId, signature) {
  this.plan = 'monthly';
  this.isTrialSubscription = false;
  this.trialConvertedAt = new Date();
  this.originalTrialEndDate = this.endDate;

  // Set new end date to 30 days from conversion
  const newEndDate = new Date();
  newEndDate.setDate(newEndDate.getDate() + 30);
  this.endDate = newEndDate;

  // Update payment details
  this.paymentId = paymentId;
  this.orderId = orderId;
  this.signature = signature;
  this.amount = 11700; // ₹117 in paise (₹99 + 18% GST)

  // Set up for recurring billing
  this.isRecurring = true;
  this.autoRenew = true;
  this.subscriptionType = 'recurring';

  // Set next billing date
  const nextBilling = new Date(newEndDate);
  nextBilling.setDate(nextBilling.getDate() + 30);
  this.nextBillingDate = nextBilling;

  this.lastSuccessfulPayment = new Date();
  this.failedPaymentCount = 0;

  await this.save();
};

// Update user's subscription reference after save
subscriptionSchema.post('save', async function() {
  const User = mongoose.model('User');
  await User.findByIdAndUpdate(this.user, { subscription: this._id });
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
