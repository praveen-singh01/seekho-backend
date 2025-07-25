const express = require('express');
const {
  getQuestionnaires,
  getQuestionnaire,
  submitAnswers,
  getQuestionnaireResults
} = require('../controllers/questionnaireController');
const { protect, optionalAuth } = require('../middleware/auth');
const { validateObjectId, validateAnswerSubmission } = require('../middleware/validation');
const { optionalPackageId } = require('../middleware/packageId');

const router = express.Router();

// Apply package ID middleware to all routes
router.use(optionalPackageId);

// @route   GET /api/questionnaires
// @desc    Get all questionnaires
// @access  Public
router.get('/', optionalAuth, getQuestionnaires);

// @route   GET /api/questionnaires/:id
// @desc    Get single questionnaire
// @access  Public
router.get('/:id', validateObjectId(), optionalAuth, getQuestionnaire);

// @route   POST /api/questionnaires/:id/submit
// @desc    Submit questionnaire answers
// @access  Private
router.post('/:id/submit', validateObjectId(), validateAnswerSubmission, protect, submitAnswers);

// @route   GET /api/questionnaires/:id/results
// @desc    Get questionnaire results
// @access  Private
router.get('/:id/results', validateObjectId(), protect, getQuestionnaireResults);

// Note: The route for getting questionnaires by topic is handled in topics.js
// @route   GET /api/topics/:topicId/questionnaires

module.exports = router;
