const mongoose = require('mongoose');

const learningModuleSchema = new mongoose.Schema({
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
    required: [true, 'Module title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  slug: {
    type: String,
    lowercase: true
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  topic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
    required: [true, 'Topic is required']
  },
  // Content items in this module (ordered) - Teachers can add ANY type of content
  content: [{
    contentType: {
      type: String,
      enum: ['video', 'questionnaire', 'mcq', 'text', 'summary', 'reading', 'instructions', 'notes', 'explanation'],
      required: true
    },
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'content.contentModel'
    },
    contentModel: {
      type: String,
      enum: ['Video', 'Questionnaire', 'MCQ', 'TextContent'],
      required: true
    },
    order: {
      type: Number,
      required: true
    },
    isRequired: {
      type: Boolean,
      default: true
    },
    unlockAfter: {
      type: mongoose.Schema.Types.ObjectId,
      default: null // Reference to previous content item that must be completed
    },
    // Additional metadata for flexible content
    customTitle: {
      type: String,
      maxlength: [200, 'Custom title cannot exceed 200 characters']
    },
    customDescription: {
      type: String,
      maxlength: [500, 'Custom description cannot exceed 500 characters']
    }
  }],
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  // Class number for class-based filtering (Bolo app)
  classNumber: {
    type: Number,
    validate: {
      validator: function(v) {
        // Only validate if classNumber is provided
        if (v === null || v === undefined) return true;
        return Number.isInteger(v) && v >= 1 && v <= 9;
      },
      message: 'Class number must be an integer between 1 and 9'
    },
    index: true
  },
  estimatedDuration: {
    type: Number, // in minutes
    default: 0
  },
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LearningModule'
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
  tags: [{
    type: String,
    trim: true
  }],
  thumbnail: {
    type: String,
    default: null
  },
  metadata: {
    totalContent: {
      type: Number,
      default: 0
    },
    totalVideos: {
      type: Number,
      default: 0
    },
    totalQuestionnaires: {
      type: Number,
      default: 0
    },
    totalMCQs: {
      type: Number,
      default: 0
    },
    totalTextContent: {
      type: Number,
      default: 0
    },
    totalEnrollments: {
      type: Number,
      default: 0
    },
    averageCompletionRate: {
      type: Number,
      default: 0 // percentage
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
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

// Virtual populate for content items
learningModuleSchema.virtual('populatedContent', {
  ref: function(doc) {
    // This will be handled in the controller with manual population
    return null;
  },
  localField: 'content.contentId',
  foreignField: '_id'
});

// Compound indexes for multi-tenancy and performance
learningModuleSchema.index({ packageId: 1, topic: 1, order: 1 });
learningModuleSchema.index({ packageId: 1, slug: 1 }, { unique: true });
learningModuleSchema.index({ packageId: 1, isActive: 1, isPremium: 1 });
learningModuleSchema.index({ packageId: 1, title: 'text', description: 'text', tags: 'text' });
learningModuleSchema.index({ packageId: 1, difficulty: 1 });
// Index for class-based filtering (Bolo app)
learningModuleSchema.index({ packageId: 1, classNumber: 1 });

// Generate slug before saving
learningModuleSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  
  // Update metadata counts
  if (this.isModified('content')) {
    this.metadata.totalContent = this.content.length;
    this.metadata.totalVideos = this.content.filter(c => c.contentType === 'video').length;
    this.metadata.totalQuestionnaires = this.content.filter(c => c.contentType === 'questionnaire').length;
    this.metadata.totalMCQs = this.content.filter(c => c.contentType === 'mcq').length;

    // Count all text-based content types
    const textContentTypes = ['text', 'summary', 'reading', 'instructions', 'notes', 'explanation'];
    this.metadata.totalTextContent = this.content.filter(c => textContentTypes.includes(c.contentType)).length;

    // Calculate estimated duration (this would need to be enhanced to fetch actual durations)
    this.estimatedDuration = this.content.length * 10; // Rough estimate: 10 minutes per content item
  }
  
  next();
});

// Check if user has access to this module
learningModuleSchema.methods.hasAccess = function(user) {
  if (!this.isPremium) return true;
  if (!user) return false;
  return user.isSubscribed;
};

// Get user's progress in this module
learningModuleSchema.methods.getUserProgress = async function(userId) {
  // Import models safely
  let UserAnswer, WatchHistory;
  try {
    UserAnswer = mongoose.model('UserAnswer');
  } catch (error) {
    UserAnswer = require('./UserAnswer');
  }

  try {
    WatchHistory = mongoose.model('WatchHistory');
  } catch (error) {
    WatchHistory = require('./WatchHistory');
  }
  
  const progress = {
    totalItems: this.content.length,
    completedItems: 0,
    completionPercentage: 0,
    contentProgress: []
  };
  
  for (let contentItem of this.content) {
    let isCompleted = false;
    
    if (contentItem.contentType === 'video') {
      const watchHistory = await WatchHistory.findOne({
        user: userId,
        video: contentItem.contentId,
        completed: true
      });
      isCompleted = !!watchHistory;
    } else {
      const userAnswer = await UserAnswer.findOne({
        user: userId,
        contentId: contentItem.contentId,
        isCompleted: true
      });
      isCompleted = !!userAnswer;
    }
    
    progress.contentProgress.push({
      contentId: contentItem.contentId,
      contentType: contentItem.contentType,
      order: contentItem.order,
      isCompleted
    });
    
    if (isCompleted) {
      progress.completedItems++;
    }
  }
  
  progress.completionPercentage = progress.totalItems > 0 
    ? Math.round((progress.completedItems / progress.totalItems) * 100) 
    : 0;
  
  return progress;
};

// Update metadata
learningModuleSchema.methods.updateMetadata = async function() {
  // This would involve complex queries to calculate enrollment and completion rates
  // Implementation would depend on how enrollment is tracked
  await this.save();
};

module.exports = mongoose.model('LearningModule', learningModuleSchema);
