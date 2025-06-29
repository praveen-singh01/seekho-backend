const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
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
  title: {
    type: String,
    required: [true, 'Video title is required'],
    trim: true,
    maxlength: [200, 'Video title cannot exceed 200 characters']
  },
  slug: {
    type: String,
    lowercase: true
  },
  description: {
    type: String,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  topic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
    required: [true, 'Topic is required']
  },
  videoUrl: {
    type: String,
    required: [true, 'Video URL is required']
  },
  thumbnail: {
    type: String,
    default: null
  },
  duration: {
    type: Number, // in seconds
    required: [true, 'Video duration is required'],
    min: [1, 'Duration must be at least 1 second']
  },
  episodeNumber: {
    type: Number,
    required: [true, 'Episode number is required'],
    min: [1, 'Episode number must be at least 1']
  },
  isLocked: {
    type: Boolean,
    default: true
  },
  isFree: {
    type: Boolean,
    default: false
  },
  quality: {
    type: String,
    enum: ['360p', '480p', '720p', '1080p'],
    default: '720p'
  },
  fileSize: {
    type: Number, // in bytes
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  transcription: {
    type: String,
    default: null
  },
  subtitles: [{
    language: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    }
  }],
  resources: [{
    title: String,
    url: String,
    type: {
      type: String,
      enum: ['pdf', 'doc', 'link', 'image', 'other'],
      default: 'link'
    }
  }],
  metadata: {
    encoding: String,
    bitrate: Number,
    fps: Number,
    resolution: String
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

// Virtual for formatted duration
videoSchema.virtual('formattedDuration').get(function() {
  const hours = Math.floor(this.duration / 3600);
  const minutes = Math.floor((this.duration % 3600) / 60);
  const seconds = this.duration % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

// Compound indexes for topic, episode number, and multi-tenancy
videoSchema.index({ packageId: 1, topic: 1, episodeNumber: 1 }, { unique: true });
videoSchema.index({ packageId: 1, slug: 1 }, { unique: true });
videoSchema.index({ packageId: 1, isActive: 1, isLocked: 1 });
videoSchema.index({ packageId: 1, title: 'text', description: 'text' });
videoSchema.index({ packageId: 1, views: -1 });
videoSchema.index({ packageId: 1, createdAt: -1 });

// Generate slug before saving
videoSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Update topic metadata after save
videoSchema.post('save', async function() {
  const Topic = mongoose.model('Topic');
  const topic = await Topic.findById(this.topic);
  if (topic) {
    await topic.updateMetadata();
  }
});

// Check if user has access to this video
videoSchema.methods.hasAccess = async function(user) {
  // Free videos are accessible to everyone
  if (this.isFree || !this.isLocked) return true;
  
  // No user means no access to locked videos
  if (!user) return false;
  
  // Check if user has active subscription
  const subscription = await user.getActiveSubscription();
  return subscription !== null;
};

// Increment view count
videoSchema.methods.incrementViews = async function() {
  this.views += 1;
  await this.save();
};

module.exports = mongoose.model('Video', videoSchema);
