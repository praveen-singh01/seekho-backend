const express = require('express');
const {
  getMCQs,
  getMCQ,
  submitAnswers
} = require('../controllers/mcqController');
const { protect, optionalAuth } = require('../middleware/auth');
const { validateObjectId, validateAnswerSubmission } = require('../middleware/validation');
const { optionalPackageId } = require('../middleware/packageId');

const router = express.Router();

// Apply package ID middleware to all routes
router.use(optionalPackageId);

// @route   GET /api/mcqs
// @desc    Get all MCQs
// @access  Public
router.get('/', optionalAuth, getMCQs);

// @route   GET /api/mcqs/:id
// @desc    Get single MCQ
// @access  Public
router.get('/:id', validateObjectId(), optionalAuth, getMCQ);

// @route   POST /api/mcqs/:id/submit
// @desc    Submit MCQ answers
// @access  Private
router.post('/:id/submit', validateObjectId(), validateAnswerSubmission, protect, submitAnswers);

// Note: The route for getting MCQs by topic is handled in topics.js
// @route   GET /api/topics/:topicId/mcqs

module.exports = router;
