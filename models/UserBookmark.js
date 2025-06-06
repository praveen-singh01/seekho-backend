const mongoose = require('mongoose');

const userBookmarkSchema = new mongoose.Schema({
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
  note: {
    type: String,
    maxlength: [500, 'Note cannot exceed 500 characters'],
    default: null
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

// Compound index to ensure one bookmark record per user-video combination
userBookmarkSchema.index({ user: 1, video: 1 }, { unique: true });
userBookmarkSchema.index({ user: 1, addedAt: -1 });

// Static method to check if video is bookmarked by user
userBookmarkSchema.statics.isBookmarked = async function(userId, videoId) {
  const bookmark = await this.findOne({ user: userId, video: videoId });
  return !!bookmark;
};

// Static method to get user's bookmark count
userBookmarkSchema.statics.getUserBookmarkCount = async function(userId) {
  return await this.countDocuments({ user: userId });
};

module.exports = mongoose.model('UserBookmark', userBookmarkSchema);
