const mongoose = require('mongoose');

const userProgressSchema = new mongoose.Schema({
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
  topic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
    required: true
  },
  progress: {
    type: Number, // in seconds
    required: true,
    min: 0
  },
  duration: {
    type: Number, // total video duration in seconds
    required: true,
    min: 1
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date,
    default: null
  },
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
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for progress percentage
userProgressSchema.virtual('progressPercentage').get(function() {
  return Math.round((this.progress / this.duration) * 100);
});

// Compound index to ensure one progress record per user-video combination
userProgressSchema.index({ user: 1, video: 1 }, { unique: true });
userProgressSchema.index({ user: 1, lastWatchedAt: -1 });
userProgressSchema.index({ user: 1, completed: 1 });
userProgressSchema.index({ topic: 1, user: 1 });

// Auto-mark as completed if progress >= 90%
userProgressSchema.pre('save', function(next) {
  const progressPercentage = (this.progress / this.duration) * 100;
  
  if (progressPercentage >= 90 && !this.completed) {
    this.completed = true;
    this.completedAt = new Date();
  } else if (progressPercentage < 90 && this.completed) {
    this.completed = false;
    this.completedAt = null;
  }
  
  next();
});

// Static method to get user's progress for a topic
userProgressSchema.statics.getTopicProgress = async function(userId, topicId) {
  const Video = mongoose.model('Video');
  const videos = await Video.find({ topic: topicId, isActive: true });
  const videoIds = videos.map(v => v._id);
  
  const progress = await this.find({ 
    user: userId, 
    video: { $in: videoIds } 
  }).populate('video', 'title episodeNumber duration');
  
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

// Static method to get user's overall statistics
userProgressSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalVideosWatched: { $sum: 1 },
        totalWatchTime: { $sum: '$progress' },
        completedVideos: {
          $sum: { $cond: ['$completed', 1, 0] }
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalVideosWatched: 0,
    totalWatchTime: 0,
    completedVideos: 0
  };
};

module.exports = mongoose.model('UserProgress', userProgressSchema);
