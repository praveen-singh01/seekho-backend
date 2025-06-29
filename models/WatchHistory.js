const mongoose = require('mongoose');

const watchHistorySchema = new mongoose.Schema({
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
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  video: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
    required: true
  },
  watchedAt: {
    type: Date,
    default: Date.now
  },
  progress: {
    type: Number, // in seconds
    default: 0,
    min: 0
  },
  completed: {
    type: Boolean,
    default: false
  },
  deviceType: {
    type: String,
    enum: ['mobile', 'tablet', 'desktop', 'tv'],
    default: 'mobile'
  },
  sessionDuration: {
    type: Number, // in seconds
    default: 0,
    min: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries with multi-tenancy
watchHistorySchema.index({ packageId: 1, user: 1, watchedAt: -1 });
watchHistorySchema.index({ packageId: 1, user: 1, video: 1, watchedAt: -1 });
watchHistorySchema.index({ packageId: 1, video: 1, watchedAt: -1 });

// Static method to add or update watch history
watchHistorySchema.statics.addWatchHistory = async function(userId, videoId, progress, completed, deviceType = 'mobile', sessionDuration = 0, packageId) {
  // Check if there's already a history entry for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const existingHistory = await this.findOne({
    packageId,
    user: userId,
    video: videoId,
    watchedAt: { $gte: today, $lt: tomorrow }
  });
  
  if (existingHistory) {
    // Update existing entry
    existingHistory.progress = Math.max(existingHistory.progress, progress);
    existingHistory.completed = completed || existingHistory.completed;
    existingHistory.watchedAt = new Date();
    existingHistory.sessionDuration += sessionDuration;
    await existingHistory.save();
    return existingHistory;
  } else {
    // Create new entry
    return await this.create({
      packageId,
      user: userId,
      video: videoId,
      progress,
      completed,
      deviceType,
      sessionDuration
    });
  }
};

// Static method to get user's watch history with pagination
watchHistorySchema.statics.getUserWatchHistory = async function(userId, page = 1, limit = 20, packageId) {
  const skip = (page - 1) * limit;

  const query = { user: userId };
  if (packageId) {
    query.packageId = packageId;
  }

  const history = await this.find(query)
    .sort({ watchedAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate({
      path: 'video',
      select: 'title thumbnail duration episodeNumber topic',
      populate: {
        path: 'topic',
        select: 'title category',
        populate: {
          path: 'category',
          select: 'name'
        }
      }
    });

  const total = await this.countDocuments(query);
  
  return {
    history,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

module.exports = mongoose.model('WatchHistory', watchHistorySchema);
