const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    index: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email'
    ]
  },
  username: {
    type: String,
    sparse: true, // Allow multiple null values
    unique: true,
    lowercase: true,
    index: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [50, 'Username cannot exceed 50 characters']
  },
  password: {
    type: String,
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  googleId: {
    type: String,
    sparse: true, // Allow multiple null values
    index: true
  },
  profilePicture: {
    type: String,
    default: null
  },
  provider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    default: null
  },
  preferences: {
    language: {
      type: String,
      default: 'en'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      }
    }
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  emailVerificationToken: String,
  emailVerificationExpire: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for subscription status
userSchema.virtual('isSubscribed').get(function() {
  return this.subscription && this.subscription.status === 'active';
});

// Method to get active subscription
userSchema.methods.getActiveSubscription = async function() {
  if (!this.subscription) return null;

  const Subscription = mongoose.model('Subscription');
  const subscription = await Subscription.findById(this.subscription);

  if (!subscription || subscription.status !== 'active' || subscription.endDate < new Date()) {
    return null;
  }

  return subscription;
};

// Additional indexes for better performance
userSchema.index({ createdAt: -1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get user's active subscription
userSchema.methods.getActiveSubscription = async function() {
  await this.populate('subscription');
  return this.subscription && this.subscription.isActive() ? this.subscription : null;
};

module.exports = mongoose.model('User', userSchema);
