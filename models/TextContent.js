const mongoose = require('mongoose');

const textContentSchema = new mongoose.Schema({
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
    required: [true, 'Content title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  slug: {
    type: String,
    lowercase: true
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  topic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
    required: [true, 'Topic is required']
  },
  contentType: {
    type: String,
    enum: ['summary', 'reading', 'instructions', 'notes', 'explanation', 'other'],
    default: 'summary'
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    maxlength: [10000, 'Content cannot exceed 10000 characters']
  },
  // Rich text formatting support
  contentFormat: {
    type: String,
    enum: ['plain', 'markdown', 'html'],
    default: 'plain'
  },
  // Estimated reading time in minutes
  estimatedReadingTime: {
    type: Number,
    default: 5,
    min: [1, 'Reading time must be at least 1 minute']
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
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
  tags: [{
    type: String,
    trim: true
  }],
  // Additional resources or links
  resources: [{
    title: {
      type: String,
      required: true,
      maxlength: [100, 'Resource title cannot exceed 100 characters']
    },
    url: {
      type: String,
      required: true,
      maxlength: [500, 'URL cannot exceed 500 characters']
    },
    type: {
      type: String,
      enum: ['link', 'document', 'image', 'audio'],
      default: 'link'
    }
  }],
  metadata: {
    totalViews: {
      type: Number,
      default: 0
    },
    averageReadingTime: {
      type: Number,
      default: 0 // in minutes
    },
    totalBookmarks: {
      type: Number,
      default: 0
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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

// Compound indexes for multi-tenancy and performance
textContentSchema.index({ packageId: 1, topic: 1, order: 1 });
textContentSchema.index({ packageId: 1, slug: 1 }, { unique: true });
textContentSchema.index({ packageId: 1, isActive: 1, isPremium: 1 });
textContentSchema.index({ packageId: 1, title: 'text', content: 'text', tags: 'text' });
textContentSchema.index({ packageId: 1, difficulty: 1 });
textContentSchema.index({ packageId: 1, contentType: 1 });

// Generate slug before saving
textContentSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  
  // Auto-calculate estimated reading time (average 200 words per minute)
  if (this.isModified('content')) {
    const wordCount = this.content.split(/\s+/).length;
    this.estimatedReadingTime = Math.max(1, Math.ceil(wordCount / 200));
  }
  
  next();
});

// Check if user has access to this content
textContentSchema.methods.hasAccess = function(user) {
  if (!this.isPremium) return true;
  if (!user) return false;
  return user.isSubscribed;
};

// Update metadata
textContentSchema.methods.updateMetadata = async function() {
  // This would be implemented when we add view tracking
  // For now, just save the document
  await this.save();
};

// Virtual for content preview (first 200 characters)
textContentSchema.virtual('contentPreview').get(function() {
  if (this.content.length <= 200) return this.content;
  return this.content.substring(0, 200) + '...';
});

// Virtual for word count
textContentSchema.virtual('wordCount').get(function() {
  return this.content.split(/\s+/).length;
});

module.exports = mongoose.model('TextContent', textContentSchema);
