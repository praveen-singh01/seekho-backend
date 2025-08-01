const mongoose = require('mongoose');

const userBookmarkSchema = new mongoose.Schema({
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
  note: {
    type: String,
    maxlength: [500, 'Note cannot exceed 500 characters'],
    default: null
  },
  timestamp: {
    type: Number, // Video position in seconds
    default: null,
    min: 0
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

// Compound index to ensure one bookmark record per user-video combination with multi-tenancy
userBookmarkSchema.index({ packageId: 1, user: 1, video: 1 }, { unique: true });
userBookmarkSchema.index({ packageId: 1, user: 1, addedAt: -1 });

// Static method to check if video is bookmarked by user
userBookmarkSchema.statics.isBookmarked = async function(userId, videoId, packageId = null) {
  const query = { user: userId, video: videoId };
  if (packageId) {
    query.packageId = packageId;
  }
  const bookmark = await this.findOne(query);
  return !!bookmark;
};

// Static method to get user's bookmark count
userBookmarkSchema.statics.getUserBookmarkCount = async function(userId, packageId = null) {
  const query = { user: userId };
  if (packageId) {
    query.packageId = packageId;
  }
  return await this.countDocuments(query);
};

module.exports = mongoose.model('UserBookmark', userBookmarkSchema);
