const express = require('express');
const {
  getVideos,
  getVideo,
  recordView,
  getRecommendations,
  searchVideos
} = require('../controllers/videoController');
const { optionalAuth } = require('../middleware/auth');
const { validateObjectId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/videos/search
// @desc    Search videos
// @access  Public
router.get('/search', validatePagination, optionalAuth, searchVideos);

// @route   GET /api/videos
// @desc    Get all videos
// @access  Public
router.get('/', validatePagination, optionalAuth, getVideos);

// @route   GET /api/videos/:id
// @desc    Get single video
// @access  Public
router.get('/:id', validateObjectId(), optionalAuth, getVideo);

// @route   POST /api/videos/:id/view
// @desc    Record video view
// @access  Public
router.post('/:id/view', validateObjectId(), optionalAuth, recordView);

// @route   GET /api/videos/:id/recommendations
// @desc    Get video recommendations
// @access  Public
router.get('/:id/recommendations', validateObjectId(), optionalAuth, getRecommendations);

module.exports = router;
