const mongoose = require('mongoose');

const userProgressSchema = new mongoose.Schema({
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
  // Enhanced to support multiple content types
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  contentType: {
    type: String,
    enum: ['video', 'text', 'mcq', 'questionnaire'],
    required: true,
    index: true
  },
  // Legacy video field for backward compatibility
  video: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
    required: false
  },
  topic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
    required: false
  },
  // Enhanced progress tracking
  progressPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  progress: {
    type: Number, // in seconds for videos, percentage for other content
    required: true,
    min: 0
  },
  duration: {
    type: Number, // total duration/questions
    required: false,
    min: 0
  },
  timeSpent: {
    type: Number, // in seconds
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['notStarted', 'inProgress', 'completed'],
    default: 'notStarted'
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date,
    default: null
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  // Legacy field for backward compatibility
  lastWatchedAt: {
    type: Date,
    default: Date.now
  },
  watchCount: {
    type: Number,
    default: 1
  },
  deviceType: {
    type: String,
    enum: ['mobile', 'tablet', 'desktop', 'tv'],
    default: 'mobile'
  },
  // Enhanced metadata for different content types
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Enhanced compound indexes for multi-content support and multi-tenancy
userProgressSchema.index({ packageId: 1, user: 1, contentId: 1, contentType: 1 }, { unique: true });
userProgressSchema.index({ packageId: 1, user: 1, video: 1 }, { unique: true, sparse: true }); // Legacy support
userProgressSchema.index({ packageId: 1, user: 1, lastAccessedAt: -1 });
userProgressSchema.index({ packageId: 1, user: 1, status: 1 });
userProgressSchema.index({ packageId: 1, user: 1, contentType: 1 });
userProgressSchema.index({ packageId: 1, topic: 1, user: 1 });

// Pre-save middleware for enhanced progress tracking
userProgressSchema.pre('save', function(next) {
  // Update legacy fields for backward compatibility
  if (this.contentType === 'video' && this.contentId) {
    this.video = this.contentId;
    this.lastWatchedAt = this.lastAccessedAt;
  }

  // Auto-calculate progress percentage for videos
  if (this.contentType === 'video' && this.duration && this.progress) {
    this.progressPercentage = Math.min(Math.round((this.progress / this.duration) * 100), 100);
  }

  // Auto-mark as completed based on progress
  const completionThreshold = this.contentType === 'video' ? 90 : 100;

  if (this.progressPercentage >= completionThreshold && this.status !== 'completed') {
    this.status = 'completed';
    this.completed = true;
    this.completedAt = new Date();
  } else if (this.progressPercentage < completionThreshold && this.status === 'completed') {
    this.status = this.progressPercentage > 0 ? 'inProgress' : 'notStarted';
    this.completed = false;
    this.completedAt = null;
  }

  next();
});

// Static method to get user's progress for a topic
userProgressSchema.statics.getTopicProgress = async function(userId, topicId, packageId = null) {
  const Video = mongoose.model('Video');

  // Build query with package filtering
  const videoQuery = { topic: topicId, isActive: true };
  if (packageId) {
    videoQuery.packageId = packageId;
  }

  const videos = await Video.find(videoQuery);
  const videoIds = videos.map(v => v._id);

  // Build progress query with package filtering
  const progressQuery = {
    user: userId,
    video: { $in: videoIds }
  };
  if (packageId) {
    progressQuery.packageId = packageId;
  }

  const progress = await this.find(progressQuery)
    .populate('video', 'title episodeNumber duration');

  const totalVideos = videos.length;
  const completedVideos = progress.filter(p => p.completed).length;
  const progressPercentage = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;

  return {
    totalVideos,
    completedVideos,
    progressPercentage,
    videos: progress
  };
};

// Enhanced static method to get user's overall statistics
userProgressSchema.statics.getUserStats = async function(userId, packageId = null) {
  const matchQuery = { user: new mongoose.Types.ObjectId(userId) };
  if (packageId) {
    matchQuery.packageId = packageId;
  }

  const stats = await this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalContent: { $sum: 1 },
        totalVideosWatched: {
          $sum: { $cond: [{ $eq: ['$contentType', 'video'] }, 1, 0] }
        },
        totalWatchTime: { $sum: '$timeSpent' },
        completedContent: {
          $sum: { $cond: ['$completed', 1, 0] }
        },
        completedVideos: {
          $sum: { $cond: [{ $and: ['$completed', { $eq: ['$contentType', 'video'] }] }, 1, 0] }
        },
        averageProgress: { $avg: '$progressPercentage' }
      }
    }
  ]);

  return stats[0] || {
    totalContent: 0,
    totalVideosWatched: 0,
    totalWatchTime: 0,
    completedContent: 0,
    completedVideos: 0,
    averageProgress: 0
  };
};

// Static method to record enhanced progress
userProgressSchema.statics.recordProgress = async function(userId, contentId, contentType, progressData, packageId) {
  const updateData = {
    packageId,
    user: userId,
    contentId,
    contentType,
    progressPercentage: progressData.progressPercentage || 0,
    timeSpent: progressData.timeSpent || 0,
    lastAccessedAt: new Date(),
    metadata: progressData.metadata || {},
    $inc: { watchCount: 1 }
  };

  // Add content-specific fields
  if (contentType === 'video') {
    updateData.progress = progressData.progress || 0;
    updateData.duration = progressData.duration;
  }

  // Set status based on progress
  if (progressData.status) {
    updateData.status = progressData.status;
  } else if (progressData.progressPercentage >= 90) {
    updateData.status = 'completed';
  } else if (progressData.progressPercentage > 0) {
    updateData.status = 'inProgress';
  }

  return await this.findOneAndUpdate(
    { packageId, user: userId, contentId, contentType },
    updateData,
    { upsert: true, new: true }
  );
};

// Static method to get bulk progress
userProgressSchema.statics.getBulkProgress = async function(userId, contentIds, packageId, moduleId = null) {
  const query = {
    packageId,
    user: userId,
    contentId: { $in: contentIds }
  };

  if (moduleId) {
    // Add module filter if needed - would require additional logic based on content relationships
  }

  const progressRecords = await this.find(query);

  // Convert to object with contentId as key
  const progressMap = {};
  progressRecords.forEach(record => {
    progressMap[record.contentId.toString()] = {
      progressPercentage: record.progressPercentage,
      status: record.status,
      timeSpent: record.timeSpent,
      lastAccessed: record.lastAccessedAt,
      metadata: record.metadata
    };
  });

  return progressMap;
};

module.exports = mongoose.model('UserProgress', userProgressSchema);
