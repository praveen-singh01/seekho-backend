const express = require('express');
const {
  getTextContent,
  getSingleTextContent,
  getTextContentByTopic,
  getContentTypes
} = require('../controllers/textContentController');
const { optionalAuth } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validation');
const { optionalPackageId } = require('../middleware/packageId');

const router = express.Router();

// Apply package ID middleware to all routes
router.use(optionalPackageId);

// @route   GET /api/text-content/types
// @desc    Get available content types
// @access  Public
router.get('/types', getContentTypes);

// @route   GET /api/text-content
// @desc    Get all text content
// @access  Public
router.get('/', optionalAuth, getTextContent);

// @route   GET /api/text-content/:id
// @desc    Get single text content
// @access  Public
router.get('/:id', validateObjectId(), optionalAuth, getSingleTextContent);

// Note: The route for getting text content by topic is handled in topics.js
// @route   GET /api/topics/:topicId/text-content

module.exports = router;
