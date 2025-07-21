const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
};

// User validation rules
const validateUser = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  handleValidationErrors
];

// Category validation rules
const validateCategory = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('color')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Please provide a valid hex color'),
  handleValidationErrors
];

// Topic validation rules
const validateTopic = [
  body('title')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Topic title must be between 2 and 200 characters'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('category')
    .isMongoId()
    .withMessage('Please provide a valid category ID'),
  body('difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Difficulty must be beginner, intermediate, or advanced'),
  handleValidationErrors
];

// Video validation rules
const validateVideo = [
  body('title')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Video title must be between 2 and 200 characters'),
  body('description')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  body('topic')
    .isMongoId()
    .withMessage('Please provide a valid topic ID'),
  body('videoUrl')
    .isURL()
    .withMessage('Please provide a valid video URL'),
  body('duration')
    .isInt({ min: 1 })
    .withMessage('Duration must be at least 1 second'),
  body('episodeNumber')
    .isInt({ min: 1 })
    .withMessage('Episode number must be at least 1'),
  body('quality')
    .optional()
    .isIn(['360p', '480p', '720p', '1080p'])
    .withMessage('Quality must be 360p, 480p, 720p, or 1080p'),
  handleValidationErrors
];

// Subscription validation rules
const validateSubscription = [
  body('plan')
    .isIn(['trial', 'monthly', 'yearly'])
    .withMessage('Plan must be trial, monthly, or yearly'),
  body('paymentProvider')
    .isIn(['razorpay', 'stripe'])
    .withMessage('Payment provider must be razorpay or stripe'),
  handleValidationErrors
];

// MongoDB ObjectId validation
const validateObjectId = (field = 'id') => [
  param(field)
    .isMongoId()
    .withMessage(`Please provide a valid ${field}`),
  handleValidationErrors
];

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

// Questionnaire validation rules
const validateQuestionnaire = [
  body('title')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Questionnaire title must be between 2 and 200 characters'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('topic')
    .isMongoId()
    .withMessage('Please provide a valid topic ID'),
  body('questions')
    .isArray({ min: 1 })
    .withMessage('At least one question is required'),
  body('questions.*.questionText')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Question text must be between 5 and 500 characters'),
  body('questions.*.questionType')
    .optional()
    .isIn(['short_answer', 'long_answer', 'essay'])
    .withMessage('Question type must be short_answer, long_answer, or essay'),
  body('questions.*.order')
    .isInt({ min: 0 })
    .withMessage('Question order must be a non-negative integer'),
  body('difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Difficulty must be beginner, intermediate, or advanced'),
  body('estimatedTime')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Estimated time must be at least 1 minute'),
  handleValidationErrors
];

// MCQ validation rules
const validateMCQ = [
  body('title')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('MCQ title must be between 2 and 200 characters'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('topic')
    .isMongoId()
    .withMessage('Please provide a valid topic ID'),
  body('questions')
    .isArray({ min: 1 })
    .withMessage('At least one question is required'),
  body('questions.*.questionText')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Question text must be between 5 and 500 characters'),
  body('questions.*.options')
    .isArray({ min: 4, max: 4 })
    .withMessage('Each question must have exactly 4 options'),
  body('questions.*.options.*.text')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Option text must be between 1 and 200 characters'),
  body('questions.*.order')
    .isInt({ min: 0 })
    .withMessage('Question order must be a non-negative integer'),
  body('difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Difficulty must be beginner, intermediate, or advanced'),
  body('estimatedTime')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Estimated time must be at least 1 minute'),
  body('passingScore')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Passing score must be between 0 and 100'),
  handleValidationErrors
];

// Learning Module validation rules
const validateLearningModule = [
  body('title')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Module title must be between 2 and 200 characters'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('topic')
    .isMongoId()
    .withMessage('Please provide a valid topic ID'),
  body('content')
    .optional()
    .isArray()
    .withMessage('Content must be an array'),
  body('content.*.contentType')
    .optional()
    .isIn(['video', 'questionnaire', 'mcq'])
    .withMessage('Content type must be video, questionnaire, or mcq'),
  body('content.*.contentId')
    .optional()
    .isMongoId()
    .withMessage('Content ID must be a valid MongoDB ObjectId'),
  body('content.*.order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Content order must be a non-negative integer'),
  body('difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Difficulty must be beginner, intermediate, or advanced'),
  handleValidationErrors
];

// Answer submission validation rules
const validateAnswerSubmission = [
  body('answers')
    .isArray({ min: 1 })
    .withMessage('At least one answer is required'),
  body('answers.*.questionIndex')
    .isInt({ min: 0 })
    .withMessage('Question index must be a non-negative integer'),
  body('answers.*.textAnswer')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Text answer cannot exceed 2000 characters'),
  body('answers.*.selectedOption')
    .optional()
    .isInt({ min: 0, max: 3 })
    .withMessage('Selected option must be between 0 and 3'),
  body('answers.*.timeSpent')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Time spent must be a non-negative integer'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUser,
  validateCategory,
  validateTopic,
  validateVideo,
  validateSubscription,
  validateObjectId,
  validatePagination,
  validateQuestionnaire,
  validateMCQ,
  validateLearningModule,
  validateAnswerSubmission
};
