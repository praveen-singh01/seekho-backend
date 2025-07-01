const mongoose = require('mongoose');

// Minimal User model for payment service
// This is a simplified version that only contains fields needed for payment processing
const userSchema = new mongoose.Schema({
  // Multi-tenant package ID for app segregation
  packageId: {
    type: String,
    required: [true, 'Package ID is required'],
    index: true,
    validate: {
      validator: function(v) {
        const { SUPPORTED_PACKAGES } = require('../config/packages');
        return SUPPORTED_PACKAGES.includes(v);
      },
      message: 'Invalid package ID'
    }
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true
  },
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    default: null
  },
  // Basic user info for payment processing
  name: {
    type: String,
    required: [true, 'Name is required']
  },
  phone: {
    type: String,
    default: null
  },
  // Payment-related fields
  razorpayCustomerId: {
    type: String,
    default: null
  },
  stripeCustomerId: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index for multi-tenant support
userSchema.index({ packageId: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);
