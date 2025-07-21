const mongoose = require('mongoose');

const userAnswerSchema = new mongoose.Schema({
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
    required: [true, 'User is required']
  },
  contentType: {
    type: String,
    enum: ['questionnaire', 'mcq'],
    required: [true, 'Content type is required']
  },
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Content ID is required'],
    refPath: 'contentModel'
  },
  contentModel: {
    type: String,
    enum: ['Questionnaire', 'MCQ'],
    required: [true, 'Content model is required']
  },
  answers: [{
    questionIndex: {
      type: Number,
      required: true
    },
    // For questionnaires (text answers)
    textAnswer: {
      type: String,
      maxlength: [2000, 'Answer cannot exceed 2000 characters']
    },
    // For MCQs (selected option index)
    selectedOption: {
      type: Number,
      min: [0, 'Selected option must be 0 or greater'],
      max: [3, 'Selected option must be 3 or less']
    },
    isCorrect: {
      type: Boolean,
      default: null // null for questionnaires, true/false for MCQs
    },
    timeSpent: {
      type: Number, // in seconds
      default: 0
    },
    answeredAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Overall attempt information
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  },
  completionTime: {
    type: Number, // in minutes
    default: 0
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  // For MCQs
  score: {
    type: Number, // percentage
    default: null,
    min: [0, 'Score cannot be negative'],
    max: [100, 'Score cannot exceed 100']
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  correctAnswers: {
    type: Number,
    default: 0
  },
  // Attempt metadata
  deviceType: {
    type: String,
    enum: ['mobile', 'tablet', 'desktop'],
    default: 'mobile'
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for multi-tenancy and performance
userAnswerSchema.index({ packageId: 1, user: 1, contentType: 1, contentId: 1 });
userAnswerSchema.index({ packageId: 1, user: 1, createdAt: -1 });
userAnswerSchema.index({ packageId: 1, contentId: 1, isCompleted: 1 });
userAnswerSchema.index({ packageId: 1, contentType: 1, score: -1 });

// Virtual for pass/fail status (for MCQs)
userAnswerSchema.virtual('isPassed').get(function() {
  if (this.contentType !== 'mcq' || this.score === null) return null;
  
  // We'll need to get the passing score from the MCQ document
  // This is a simplified version - in practice, you'd populate the content
  return this.score >= 70; // Default passing score
});

// Pre-save middleware to calculate completion time and score
userAnswerSchema.pre('save', function(next) {
  // Calculate completion time if completed
  if (this.isCompleted && this.completedAt && this.startedAt) {
    const timeDiff = this.completedAt - this.startedAt;
    this.completionTime = Math.round(timeDiff / (1000 * 60)); // Convert to minutes
  }
  
  // Calculate score for MCQs
  if (this.contentType === 'mcq' && this.isCompleted) {
    const correctCount = this.answers.filter(answer => answer.isCorrect === true).length;
    this.correctAnswers = correctCount;
    this.score = this.totalQuestions > 0 ? Math.round((correctCount / this.totalQuestions) * 100) : 0;
  }
  
  next();
});

// Method to mark as completed
userAnswerSchema.methods.markCompleted = function() {
  this.isCompleted = true;
  this.completedAt = new Date();
  return this.save();
};

// Method to add/update an answer
userAnswerSchema.methods.addAnswer = function(questionIndex, answerData) {
  const existingAnswerIndex = this.answers.findIndex(a => a.questionIndex === questionIndex);
  
  const answerObj = {
    questionIndex,
    answeredAt: new Date(),
    ...answerData
  };
  
  if (existingAnswerIndex >= 0) {
    this.answers[existingAnswerIndex] = answerObj;
  } else {
    this.answers.push(answerObj);
  }
  
  return this.save();
};

// Static method to get user's progress for content
userAnswerSchema.statics.getUserProgress = async function(userId, contentId, packageId) {
  return await this.findOne({
    user: userId,
    contentId: contentId,
    packageId: packageId
  }).sort({ createdAt: -1 });
};

// Static method to get user's performance analytics
userAnswerSchema.statics.getUserAnalytics = async function(userId, packageId) {
  const pipeline = [
    { $match: { user: mongoose.Types.ObjectId(userId), packageId: packageId } },
    {
      $group: {
        _id: '$contentType',
        totalAttempts: { $sum: 1 },
        completedAttempts: { $sum: { $cond: ['$isCompleted', 1, 0] } },
        averageScore: { $avg: '$score' },
        averageTime: { $avg: '$completionTime' }
      }
    }
  ];
  
  return await this.aggregate(pipeline);
};

module.exports = mongoose.model('UserAnswer', userAnswerSchema);
