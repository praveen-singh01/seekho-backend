const mongoose = require('mongoose');
const crypto = require('crypto');

const videoShareSchema = new mongoose.Schema({
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
  video: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  shareId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  shareUrl: {
    type: String,
    required: true
  },
  platform: {
    type: String,
    enum: ['whatsapp', 'telegram', 'facebook', 'twitter', 'instagram', 'email', 'sms', 'copy', 'other'],
    default: 'other'
  },
  message: {
    type: String,
    maxlength: [500, 'Share message cannot exceed 500 characters'],
    default: null
  },
  clickCount: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    default: null // null means no expiration
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for efficient queries
videoShareSchema.index({ packageId: 1, video: 1, createdAt: -1 });
videoShareSchema.index({ packageId: 1, user: 1, createdAt: -1 });
videoShareSchema.index({ shareId: 1, isActive: 1 });
videoShareSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Virtual to check if share is expired
videoShareSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

// Pre-save middleware to generate share ID and URL
videoShareSchema.pre('save', function(next) {
  if (!this.shareId) {
    this.shareId = crypto.randomBytes(16).toString('hex');
  }
  
  if (!this.shareUrl) {
    const baseUrl = process.env.FRONTEND_URL || 'https://app.seekho.com';
    this.shareUrl = `${baseUrl}/shared/video/${this.shareId}`;
  }
  
  next();
});

// Method to increment click count
videoShareSchema.methods.recordClick = async function() {
  this.clickCount += 1;
  return await this.save();
};

// Static method to create share
videoShareSchema.statics.createShare = async function(videoId, userId, packageId, options = {}) {
  const { platform = 'other', message = null, expiresInDays = null } = options;
  
  const shareData = {
    packageId,
    video: videoId,
    user: userId,
    platform,
    message
  };

  // Set expiration if specified
  if (expiresInDays && expiresInDays > 0) {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + expiresInDays);
    shareData.expiresAt = expirationDate;
  }

  const share = await this.create(shareData);
  
  // Populate video data
  await share.populate('video', 'title thumbnail duration');
  
  return share;
};

// Static method to get share by ID
videoShareSchema.statics.getShareById = async function(shareId) {
  const share = await this.findOne({
    shareId,
    isActive: true,
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  }).populate('video', 'title thumbnail duration description topic')
    .populate('user', 'name profilePicture');

  return share;
};

// Static method to get user's shares
videoShareSchema.statics.getUserShares = async function(userId, packageId, options = {}) {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  const query = {
    packageId,
    user: userId,
    isActive: true
  };

  const shares = await this.find(query)
    .populate('video', 'title thumbnail duration')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await this.countDocuments(query);

  return {
    shares,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalShares: total,
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  };
};

// Static method to get share analytics
videoShareSchema.statics.getShareAnalytics = async function(videoId, packageId) {
  const analytics = await this.aggregate([
    {
      $match: {
        packageId,
        video: mongoose.Types.ObjectId(videoId),
        isActive: true
      }
    },
    {
      $group: {
        _id: '$platform',
        shareCount: { $sum: 1 },
        totalClicks: { $sum: '$clickCount' }
      }
    },
    {
      $sort: { shareCount: -1 }
    }
  ]);

  const totalShares = await this.countDocuments({
    packageId,
    video: videoId,
    isActive: true
  });

  const totalClicks = await this.aggregate([
    {
      $match: {
        packageId,
        video: mongoose.Types.ObjectId(videoId),
        isActive: true
      }
    },
    {
      $group: {
        _id: null,
        totalClicks: { $sum: '$clickCount' }
      }
    }
  ]);

  return {
    totalShares,
    totalClicks: totalClicks[0]?.totalClicks || 0,
    platformBreakdown: analytics
  };
};

module.exports = mongoose.model('VideoShare', videoShareSchema);
