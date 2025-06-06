const mongoose = require('mongoose');

const userFavoriteSchema = new mongoose.Schema({
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
  addedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index to ensure one favorite record per user-video combination
userFavoriteSchema.index({ user: 1, video: 1 }, { unique: true });
userFavoriteSchema.index({ user: 1, addedAt: -1 });

// Static method to check if video is favorited by user
userFavoriteSchema.statics.isFavorited = async function(userId, videoId) {
  const favorite = await this.findOne({ user: userId, video: videoId });
  return !!favorite;
};

// Static method to get user's favorite count
userFavoriteSchema.statics.getUserFavoriteCount = async function(userId) {
  return await this.countDocuments({ user: userId });
};

module.exports = mongoose.model('UserFavorite', userFavoriteSchema);
