const mongoose = require('mongoose');

const videoCommentSchema = new mongoose.Schema({
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
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    trim: true,
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VideoComment',
    default: null,
    index: true
  },
  likes: {
    type: Number,
    default: 0,
    min: 0
  },
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  replies: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isReported: {
    type: Boolean,
    default: false
  },
  reportCount: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for efficient queries
videoCommentSchema.index({ packageId: 1, video: 1, createdAt: -1 });
videoCommentSchema.index({ packageId: 1, video: 1, parentComment: 1, createdAt: -1 });
videoCommentSchema.index({ packageId: 1, user: 1, createdAt: -1 });

// Virtual to check if user liked the comment
videoCommentSchema.virtual('isLiked').get(function() {
  return this.likedBy && this.likedBy.length > 0;
});

// Method to toggle like
videoCommentSchema.methods.toggleLike = async function(userId) {
  const userIndex = this.likedBy.indexOf(userId);
  
  if (userIndex > -1) {
    // Unlike
    this.likedBy.splice(userIndex, 1);
    this.likes = Math.max(0, this.likes - 1);
  } else {
    // Like
    this.likedBy.push(userId);
    this.likes += 1;
  }
  
  return await this.save();
};

// Static method to get comments for a video
videoCommentSchema.statics.getVideoComments = async function(videoId, packageId, options = {}) {
  const {
    page = 1,
    limit = 20,
    sortBy = 'newest',
    parentCommentId = null
  } = options;

  const skip = (page - 1) * limit;
  
  // Build sort criteria
  let sortCriteria = {};
  switch (sortBy) {
    case 'oldest':
      sortCriteria = { createdAt: 1 };
      break;
    case 'popular':
      sortCriteria = { likes: -1, createdAt: -1 };
      break;
    case 'newest':
    default:
      sortCriteria = { createdAt: -1 };
      break;
  }

  const query = {
    packageId,
    video: videoId,
    parentComment: parentCommentId,
    isActive: true
  };

  const comments = await this.find(query)
    .populate('user', 'name profilePicture')
    .sort(sortCriteria)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await this.countDocuments(query);

  return {
    comments,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalComments: total,
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  };
};

// Static method to add comment
videoCommentSchema.statics.addComment = async function(videoId, userId, content, packageId, parentCommentId = null) {
  const comment = await this.create({
    packageId,
    video: videoId,
    user: userId,
    content: content.trim(),
    parentComment: parentCommentId
  });

  // If this is a reply, increment parent comment's reply count
  if (parentCommentId) {
    await this.findByIdAndUpdate(parentCommentId, {
      $inc: { replies: 1 }
    });
  }

  // Populate user data before returning
  await comment.populate('user', 'name profilePicture');
  
  return comment;
};

// Pre-remove middleware to handle reply count
videoCommentSchema.pre('remove', async function(next) {
  if (this.parentComment) {
    await this.constructor.findByIdAndUpdate(this.parentComment, {
      $inc: { replies: -1 }
    });
  }
  next();
});

module.exports = mongoose.model('VideoComment', videoCommentSchema);
