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
  autoRenew: {
    type: Boolean,
    default: true
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
  metadata: {
    customerEmail: String,
    customerPhone: String,
    promoCode: String,
    discount: Number,
    originalAmount: Number
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

// Update user's subscription reference after save
subscriptionSchema.post('save', async function() {
  const User = mongoose.model('User');
  await User.findByIdAndUpdate(this.user, { subscription: this._id });
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
