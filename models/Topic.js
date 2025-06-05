const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Topic title is required'],
    trim: true,
    maxlength: [200, 'Topic title cannot exceed 200 characters']
  },
  slug: {
    type: String,
    lowercase: true
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  thumbnail: {
    type: String,
    default: null
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  estimatedDuration: {
    type: Number, // in minutes
    default: 0
  },
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic'
  }],
  tags: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  },
  metadata: {
    totalVideos: {
      type: Number,
      default: 0
    },
    totalDuration: {
      type: Number,
      default: 0 // in seconds
    },
    completionRate: {
      type: Number,
      default: 0 // percentage
    }
  },
  seo: {
    title: String,
    description: String,
    keywords: [String]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual populate for videos
topicSchema.virtual('videos', {
  ref: 'Video',
  localField: '_id',
  foreignField: 'topic',
  options: { sort: { episodeNumber: 1 } }
});

// Compound index for category and order
topicSchema.index({ category: 1, order: 1 });
topicSchema.index({ slug: 1 });
topicSchema.index({ isActive: 1, isPremium: 1 });
topicSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Generate slug before saving
topicSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Update metadata when videos change
topicSchema.methods.updateMetadata = async function() {
  const Video = mongoose.model('Video');
  
  const videos = await Video.find({ topic: this._id });
  
  this.metadata.totalVideos = videos.length;
  this.metadata.totalDuration = videos.reduce((total, video) => total + (video.duration || 0), 0);
  
  await this.save();
  
  // Update parent category metadata
  const Category = mongoose.model('Category');
  const category = await Category.findById(this.category);
  if (category) {
    await category.updateMetadata();
  }
};

// Check if user has access to this topic
topicSchema.methods.hasAccess = function(user) {
  if (!this.isPremium) return true;
  if (!user) return false;
  return user.isSubscribed;
};

module.exports = mongoose.model('Topic', topicSchema);
