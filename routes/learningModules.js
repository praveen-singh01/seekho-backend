const express = require('express');
const {
  getLearningModules,
  getLearningModule
} = require('../controllers/learningModuleController');
const { optionalAuth } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validation');
const { optionalPackageId } = require('../middleware/packageId');

const router = express.Router();

// Apply package ID middleware to all routes
router.use(optionalPackageId);

// @route   GET /api/learning-modules
// @desc    Get all learning modules
// @access  Public
router.get('/', optionalAuth, getLearningModules);

// @route   GET /api/learning-modules/:id
// @desc    Get single learning module
// @access  Public
router.get('/:id', validateObjectId(), optionalAuth, getLearningModule);

// Note: The route for getting learning modules by topic is handled in topics.js
// @route   GET /api/topics/:topicId/learning-modules

module.exports = router;
