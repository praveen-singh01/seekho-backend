const mongoose = require('mongoose');

const userStatsSchema = new mongoose.Schema({
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
    required: true,
    unique: true,
    index: true
  },
  // Video statistics
  videosWatched: {
    type: Number,
    default: 0,
    min: 0
  },
  totalWatchTime: {
    type: Number, // in seconds
    default: 0,
    min: 0
  },
  completedVideos: {
    type: Number,
    default: 0,
    min: 0
  },
  // Course/Module statistics
  completedCourses: {
    type: Number,
    default: 0,
    min: 0
  },
  completedModules: {
    type: Number,
    default: 0,
    min: 0
  },
  // Social features statistics
  favoriteVideos: {
    type: Number,
    default: 0,
    min: 0
  },
  totalBookmarks: {
    type: Number,
    default: 0,
    min: 0
  },
  totalShares: {
    type: Number,
    default: 0,
    min: 0
  },
  totalComments: {
    type: Number,
    default: 0,
    min: 0
  },
  // Learning streak
  currentStreak: {
    type: Number,
    default: 0,
    min: 0
  },
  longestStreak: {
    type: Number,
    default: 0,
    min: 0
  },
  lastActivityDate: {
    type: Date,
    default: null
  },
  // Progress statistics
  averageProgress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  totalContentAccessed: {
    type: Number,
    default: 0,
    min: 0
  },
  // Test/Assessment statistics
  testsCompleted: {
    type: Number,
    default: 0,
    min: 0
  },
  averageTestScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  // Activity tracking
  lastActivityAt: {
    type: Date,
    default: Date.now
  },
  // Achievement tracking
  achievements: [{
    id: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    unlockedAt: {
      type: Date,
      default: Date.now
    },
    category: {
      type: String,
      enum: ['learning', 'social', 'streak', 'completion', 'special'],
      default: 'learning'
    }
  }],
  // Recent activity log (last 10 activities)
  recentActivity: [{
    type: {
      type: String,
      enum: ['video_watched', 'content_completed', 'test_passed', 'login', 'favorite_added', 'bookmark_added', 'comment_posted', 'share_created'],
      required: true
    },
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    contentTitle: {
      type: String,
      default: ''
    },
    contentType: {
      type: String,
      enum: ['video', 'text', 'mcq', 'questionnaire'],
      default: null
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes
userStatsSchema.index({ packageId: 1, user: 1 }, { unique: true });
userStatsSchema.index({ packageId: 1, currentStreak: -1 });
userStatsSchema.index({ packageId: 1, totalWatchTime: -1 });

// Virtual for total learning time in hours
userStatsSchema.virtual('totalWatchTimeHours').get(function() {
  return Math.round((this.totalWatchTime / 3600) * 10) / 10; // Round to 1 decimal
});

// Method to update streak
userStatsSchema.methods.updateStreak = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastActivity = this.lastActivityDate ? new Date(this.lastActivityDate) : null;
  
  if (lastActivity) {
    lastActivity.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) {
      // Consecutive day
      this.currentStreak += 1;
      this.longestStreak = Math.max(this.longestStreak, this.currentStreak);
    } else if (daysDiff > 1) {
      // Streak broken
      this.currentStreak = 1;
    }
    // If daysDiff === 0, same day, no change to streak
  } else {
    // First activity
    this.currentStreak = 1;
    this.longestStreak = 1;
  }
  
  this.lastActivityDate = today;
  this.lastActivityAt = new Date();
};

// Method to add recent activity
userStatsSchema.methods.addRecentActivity = function(activityType, contentId = null, contentTitle = '', contentType = null, metadata = {}) {
  const activity = {
    type: activityType,
    contentId,
    contentTitle,
    contentType,
    timestamp: new Date(),
    metadata
  };
  
  this.recentActivity.unshift(activity);
  
  // Keep only last 10 activities
  if (this.recentActivity.length > 10) {
    this.recentActivity = this.recentActivity.slice(0, 10);
  }
};

// Method to add achievement
userStatsSchema.methods.addAchievement = function(achievementId, title, description = '', category = 'learning') {
  // Check if achievement already exists
  const existingAchievement = this.achievements.find(a => a.id === achievementId);
  if (existingAchievement) {
    return false; // Achievement already unlocked
  }
  
  this.achievements.push({
    id: achievementId,
    title,
    description,
    category,
    unlockedAt: new Date()
  });
  
  return true; // New achievement added
};

// Static method to get or create user stats
userStatsSchema.statics.getOrCreateUserStats = async function(userId, packageId) {
  let stats = await this.findOne({ user: userId, packageId });
  
  if (!stats) {
    stats = await this.create({
      user: userId,
      packageId
    });
  }
  
  return stats;
};

// Static method to update stats based on activity
userStatsSchema.statics.updateUserStats = async function(userId, packageId, activityType, data = {}) {
  const stats = await this.getOrCreateUserStats(userId, packageId);
  
  // Update streak
  stats.updateStreak();
  
  // Update specific stats based on activity type
  switch (activityType) {
    case 'video_watched':
      stats.videosWatched += 1;
      stats.totalWatchTime += data.timeSpent || 0;
      stats.totalContentAccessed += 1;
      break;
      
    case 'content_completed':
      if (data.contentType === 'video') {
        stats.completedVideos += 1;
      }
      if (data.contentType === 'mcq' || data.contentType === 'questionnaire') {
        stats.testsCompleted += 1;
        if (data.score) {
          // Update average test score
          const totalScore = stats.averageTestScore * (stats.testsCompleted - 1) + data.score;
          stats.averageTestScore = Math.round(totalScore / stats.testsCompleted);
        }
      }
      break;
      
    case 'favorite_added':
      stats.favoriteVideos += 1;
      break;
      
    case 'bookmark_added':
      stats.totalBookmarks += 1;
      break;
      
    case 'share_created':
      stats.totalShares += 1;
      break;
      
    case 'comment_posted':
      stats.totalComments += 1;
      break;
  }
  
  // Add to recent activity
  stats.addRecentActivity(
    activityType,
    data.contentId,
    data.contentTitle || '',
    data.contentType,
    data.metadata || {}
  );
  
  // Check for achievements
  await stats.checkAndUnlockAchievements();
  
  return await stats.save();
};

// Method to check and unlock achievements
userStatsSchema.methods.checkAndUnlockAchievements = async function() {
  const achievements = [
    { id: 'first_video', title: 'First Video Watched', condition: () => this.videosWatched >= 1 },
    { id: 'video_marathon', title: 'Video Marathon', condition: () => this.videosWatched >= 10 },
    { id: 'learning_streak_7', title: '7-Day Learning Streak', condition: () => this.currentStreak >= 7 },
    { id: 'learning_streak_30', title: '30-Day Learning Streak', condition: () => this.currentStreak >= 30 },
    { id: 'first_completion', title: 'First Completion', condition: () => this.completedVideos >= 1 },
    { id: 'social_butterfly', title: 'Social Butterfly', condition: () => this.totalComments >= 5 },
    { id: 'bookworm', title: 'Bookworm', condition: () => this.totalBookmarks >= 10 }
  ];
  
  for (const achievement of achievements) {
    if (achievement.condition() && !this.achievements.find(a => a.id === achievement.id)) {
      this.addAchievement(achievement.id, achievement.title);
    }
  }
};

module.exports = mongoose.model('UserStats', userStatsSchema);
