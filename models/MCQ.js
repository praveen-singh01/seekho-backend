const mongoose = require('mongoose');

const mcqSchema = new mongoose.Schema({
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
    required: [true, 'MCQ title is required'],
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
    options: [{
      text: {
        type: String,
        required: [true, 'Option text is required'],
        maxlength: [200, 'Option text cannot exceed 200 characters']
      },
      isCorrect: {
        type: Boolean,
        default: false
      }
    }],
    explanation: {
      type: String,
      maxlength: [500, 'Explanation cannot exceed 500 characters']
    },
    hints: [{
      type: String,
      maxlength: [200, 'Hint cannot exceed 200 characters']
    }],
    order: {
      type: Number,
      required: true
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
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
    default: 15
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
    totalAttempts: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0 // percentage
    },
    averageCompletionTime: {
      type: Number,
      default: 0 // in minutes
    },
    passRate: {
      type: Number,
      default: 0 // percentage
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
mcqSchema.index({ packageId: 1, topic: 1, order: 1 });
mcqSchema.index({ packageId: 1, slug: 1 }, { unique: true });
mcqSchema.index({ packageId: 1, isActive: 1, isPremium: 1 });
mcqSchema.index({ packageId: 1, title: 'text', description: 'text', tags: 'text' });
mcqSchema.index({ packageId: 1, difficulty: 1 });

// Validation: Ensure exactly 4 options per question and exactly 1 correct answer
mcqSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  
  // Validate questions
  for (let question of this.questions) {
    if (question.options.length !== 4) {
      return next(new Error('Each question must have exactly 4 options'));
    }
    
    const correctOptions = question.options.filter(option => option.isCorrect);
    if (correctOptions.length !== 1) {
      return next(new Error('Each question must have exactly 1 correct answer'));
    }
  }
  
  // Update total questions count
  if (this.isModified('questions')) {
    this.metadata.totalQuestions = this.questions.length;
  }
  
  next();
});

// Check if user has access to this MCQ
mcqSchema.methods.hasAccess = function(user) {
  if (!this.isPremium) return true;
  if (!user) return false;
  return user.isSubscribed;
};

// Update metadata
mcqSchema.methods.updateMetadata = async function() {
  const UserAnswer = mongoose.model('UserAnswer');
  
  const attempts = await UserAnswer.find({ 
    contentId: this._id,
    contentType: 'mcq'
  });
  
  this.metadata.totalAttempts = attempts.length;
  
  if (attempts.length > 0) {
    const totalScore = attempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0);
    this.metadata.averageScore = Math.round(totalScore / attempts.length);
    
    const totalTime = attempts.reduce((sum, attempt) => sum + (attempt.completionTime || 0), 0);
    this.metadata.averageCompletionTime = Math.round(totalTime / attempts.length);
    
    const passedAttempts = attempts.filter(attempt => (attempt.score || 0) >= this.passingScore);
    this.metadata.passRate = Math.round((passedAttempts.length / attempts.length) * 100);
  }
  
  await this.save();
};

module.exports = mongoose.model('MCQ', mcqSchema);
