const mongoose = require('mongoose');

const userFavoriteSchema = new mongoose.Schema({
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
  addedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index to ensure one favorite record per user-video combination with multi-tenancy
userFavoriteSchema.index({ packageId: 1, user: 1, video: 1 }, { unique: true });
userFavoriteSchema.index({ packageId: 1, user: 1, addedAt: -1 });

// Static method to check if video is favorited by user
userFavoriteSchema.statics.isFavorited = async function(userId, videoId, packageId = null) {
  const query = { user: userId, video: videoId };
  if (packageId) {
    query.packageId = packageId;
  }
  const favorite = await this.findOne(query);
  return !!favorite;
};

// Static method to get user's favorite count
userFavoriteSchema.statics.getUserFavoriteCount = async function(userId, packageId = null) {
  const query = { user: userId };
  if (packageId) {
    query.packageId = packageId;
  }
  return await this.countDocuments(query);
};

module.exports = mongoose.model('UserFavorite', userFavoriteSchema);
