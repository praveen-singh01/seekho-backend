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

// Onboarding validation rules (Bolo app)
const validateOnboarding = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('number')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please provide a valid 10-digit Indian phone number starting with 6, 7, 8, or 9'),
  body('class')
    .isInt({ min: 1, max: 9 })
    .withMessage('Class must be an integer between 1 and 9'),
  body('parentAge')
    .isInt({ min: 18, max: 80 })
    .withMessage('Parent age must be an integer between 18 and 80'),
  handleValidationErrors
];

// Module query validation rules (Bolo app)
const validateModuleQuery = [
  query('class')
    .isInt({ min: 1, max: 5 })
    .withMessage('Class must be an integer between 1 and 5'),
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
    .isIn(['video', 'questionnaire', 'mcq', 'text', 'summary', 'reading', 'instructions', 'notes', 'explanation'])
    .withMessage('Content type must be video, questionnaire, mcq, or text content type'),
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

// ===== NEW VALIDATION RULES FOR ENHANCED FEATURES =====

// Progress data validation
const validateProgressData = [
  body('contentId')
    .isMongoId()
    .withMessage('Valid content ID is required'),
  body('contentType')
    .isIn(['video', 'text', 'mcq', 'questionnaire'])
    .withMessage('Content type must be one of: video, text, mcq, questionnaire'),
  body('progressPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Progress percentage must be between 0 and 100'),
  body('timeSpent')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Time spent must be a non-negative integer'),
  body('status')
    .optional()
    .isIn(['notStarted', 'inProgress', 'completed'])
    .withMessage('Status must be one of: notStarted, inProgress, completed'),
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object'),
  handleValidationErrors
];

// Comment data validation
const validateCommentData = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment content must be between 1 and 1000 characters'),
  body('parentCommentId')
    .optional()
    .isMongoId()
    .withMessage('Parent comment ID must be a valid MongoDB ObjectId'),
  handleValidationErrors
];

// Share data validation
const validateShareData = [
  body('platform')
    .optional()
    .isIn(['whatsapp', 'telegram', 'facebook', 'twitter', 'instagram', 'email', 'sms', 'copy', 'other'])
    .withMessage('Invalid platform'),
  body('message')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Share message cannot exceed 500 characters'),
  handleValidationErrors
];

// Bookmark data validation
const validateBookmarkData = [
  body('note')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bookmark note cannot exceed 500 characters'),
  body('timestamp')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Timestamp must be a non-negative integer'),
  handleValidationErrors
];

// User stats update validation
const validateStatsUpdate = [
  body('activityType')
    .isIn(['video_watched', 'content_completed', 'test_passed', 'login', 'favorite_added', 'bookmark_added', 'comment_posted', 'share_created'])
    .withMessage('Invalid activity type'),
  body('contentId')
    .optional()
    .isMongoId()
    .withMessage('Content ID must be a valid MongoDB ObjectId'),
  body('contentType')
    .optional()
    .isIn(['video', 'text', 'mcq', 'questionnaire'])
    .withMessage('Content type must be one of: video, text, mcq, questionnaire'),
  body('timeSpent')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Time spent must be a non-negative integer'),
  body('score')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Score must be between 0 and 100'),
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
  validateAnswerSubmission,
  validateOnboarding,
  validateModuleQuery,
  // New validation functions
  validateProgressData,
  validateCommentData,
  validateShareData,
  validateBookmarkData,
  validateStatsUpdate
};
