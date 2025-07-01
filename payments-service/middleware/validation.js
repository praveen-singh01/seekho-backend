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

module.exports = {
  handleValidationErrors,
  validateUser,
  validateCategory,
  validateTopic,
  validateVideo,
  validateSubscription,
  validateObjectId,
  validatePagination
};
