const express = require('express');
const {
  getTopics,
  getTopic,
  getTopicVideos,
  getTopicProgress
} = require('../controllers/topicController');
const { protect, optionalAuth } = require('../middleware/auth');
const { validateObjectId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/topics
// @desc    Get all topics
// @access  Public
router.get('/', validatePagination, optionalAuth, getTopics);

// @route   GET /api/topics/:id
// @desc    Get single topic
// @access  Public
router.get('/:id', validateObjectId(), optionalAuth, getTopic);

// @route   GET /api/topics/:id/videos
// @desc    Get videos in a topic
// @access  Public
router.get('/:id/videos', validateObjectId(), validatePagination, optionalAuth, getTopicVideos);

// @route   GET /api/topics/:id/progress
// @desc    Get topic progress for user
// @access  Private
router.get('/:id/progress', validateObjectId(), protect, getTopicProgress);

module.exports = router;
