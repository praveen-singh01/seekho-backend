const express = require('express');
const {
  getVideos,
  getVideo,
  recordView,
  getRecommendations,
  searchVideos,
  getVideoStream,
  getPopularVideos,
  recordProgress,
  getRelatedVideos,
  getNewVideos,
  // New social features
  shareVideo,
  getVideoComments,
  addVideoComment,
  toggleVideoFavorite,
  addVideoBookmark,
  removeVideoBookmark
} = require('../controllers/videoController');
const { protect, optionalAuth } = require('../middleware/auth');
const { validateObjectId, validatePagination, validateCommentData, validateShareData, validateBookmarkData } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/videos/search
// @desc    Search videos
// @access  Public
router.get('/search', validatePagination, optionalAuth, searchVideos);

// @route   GET /api/videos/popular
// @desc    Get popular videos
// @access  Public
router.get('/popular', optionalAuth, getPopularVideos);

// @route   GET /api/videos/new
// @desc    Get new videos
// @access  Public
router.get('/new', optionalAuth, getNewVideos);

// @route   GET /api/videos
// @desc    Get all videos
// @access  Public
router.get('/', validatePagination, optionalAuth, getVideos);

// @route   GET /api/videos/:id/stream
// @desc    Get video streaming URL
// @access  Private
router.get('/:id/stream', validateObjectId(), protect, getVideoStream);

// @route   GET /api/videos/:id/related
// @desc    Get related videos
// @access  Public
router.get('/:id/related', validateObjectId(), optionalAuth, getRelatedVideos);

// @route   POST /api/videos/:id/progress
// @desc    Record video progress
// @access  Private
router.post('/:id/progress', validateObjectId(), protect, recordProgress);

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

// ===== NEW SOCIAL FEATURES ROUTES =====

// @route   POST /api/videos/:id/share
// @desc    Share a video and generate shareable link
// @access  Private
router.post('/:id/share', validateObjectId(), protect, validateShareData, shareVideo);

// @route   GET /api/videos/:id/comments
// @desc    Get comments for a video
// @access  Public
router.get('/:id/comments', validateObjectId(), optionalAuth, getVideoComments);

// @route   POST /api/videos/:id/comments
// @desc    Add a comment to a video
// @access  Private
router.post('/:id/comments', validateObjectId(), protect, validateCommentData, addVideoComment);

// @route   POST /api/videos/:id/favorite
// @desc    Toggle video favorite status
// @access  Private
router.post('/:id/favorite', validateObjectId(), protect, toggleVideoFavorite);

// @route   POST /api/videos/:id/bookmark
// @desc    Add video to bookmarks with optional timestamp
// @access  Private
router.post('/:id/bookmark', validateObjectId(), protect, validateBookmarkData, addVideoBookmark);

// @route   DELETE /api/videos/:id/bookmark
// @desc    Remove video from bookmarks
// @access  Private
router.delete('/:id/bookmark', validateObjectId(), protect, removeVideoBookmark);

module.exports = router;
