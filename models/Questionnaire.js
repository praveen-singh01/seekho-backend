const mongoose = require('mongoose');

const questionnaireSchema = new mongoose.Schema({
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
    required: [true, 'Questionnaire title is required'],
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
  questions: [{
    questionText: {
      type: String,
      required: [true, 'Question text is required'],
      maxlength: [500, 'Question text cannot exceed 500 characters']
    },
    questionType: {
      type: String,
      enum: ['short_answer', 'long_answer', 'essay'],
      default: 'short_answer'
    },
    isRequired: {
      type: Boolean,
      default: true
    },
    order: {
      type: Number,
      required: true
    },
    hints: [{
      type: String,
      maxlength: [200, 'Hint cannot exceed 200 characters']
    }],
    maxLength: {
      type: Number,
      default: 500 // Maximum characters for answer
    },
    // Optional: Expected answers for auto-scoring
    expectedAnswers: [{
      type: String,
      trim: true,
      lowercase: true
    }],
    // Points for this question (for scoring)
    points: {
      type: Number,
      default: 1,
      min: [1, 'Points must be at least 1']
    }
  }],
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  estimatedTime: {
    type: Number, // in minutes
    default: 10
  },
  passingScore: {
    type: Number,
    default: 70, // percentage
    min: [0, 'Passing score cannot be negative'],
    max: [100, 'Passing score cannot exceed 100']
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
  metadata: {
    totalQuestions: {
      type: Number,
      default: 0
    },
    totalResponses: {
      type: Number,
      default: 0
    },
    averageCompletionTime: {
      type: Number,
      default: 0 // in minutes
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
questionnaireSchema.index({ packageId: 1, topic: 1, order: 1 });
questionnaireSchema.index({ packageId: 1, slug: 1 }, { unique: true });
questionnaireSchema.index({ packageId: 1, isActive: 1, isPremium: 1 });
questionnaireSchema.index({ packageId: 1, title: 'text', description: 'text', tags: 'text' });
questionnaireSchema.index({ packageId: 1, difficulty: 1 });

// Generate slug before saving
questionnaireSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  
  // Update total questions count
  if (this.isModified('questions')) {
    this.metadata.totalQuestions = this.questions.length;
  }
  
  next();
});

// Check if user has access to this questionnaire
questionnaireSchema.methods.hasAccess = function(user) {
  if (!this.isPremium) return true;
  if (!user) return false;
  return user.isSubscribed;
};

// Update metadata
questionnaireSchema.methods.updateMetadata = async function() {
  const UserAnswer = mongoose.model('UserAnswer');
  
  const responses = await UserAnswer.find({ 
    contentId: this._id,
    contentType: 'questionnaire'
  });
  
  this.metadata.totalResponses = responses.length;
  
  if (responses.length > 0) {
    const totalTime = responses.reduce((sum, response) => {
      return sum + (response.completionTime || 0);
    }, 0);
    this.metadata.averageCompletionTime = Math.round(totalTime / responses.length);
  }
  
  await this.save();
};

module.exports = mongoose.model('Questionnaire', questionnaireSchema);
