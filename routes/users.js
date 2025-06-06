const express = require('express');
const { protect } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validation');
const {
  getWatchHistory,
  addFavorite,
  removeFavorite,
  getFavorites,
  getProfile,
  updateProfile,
  getUserStats,
  addBookmark,
  removeBookmark,
  getBookmarks
} = require('../controllers/userController');
const User = require('../models/User');
const Video = require('../models/Video');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, getProfile);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, updateProfile);

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', protect, getUserStats);

// @route   GET /api/users/watch-history
// @desc    Get user watch history
// @access  Private
router.get('/watch-history', protect, getWatchHistory);

// @route   POST /api/users/favorites
// @desc    Add video to favorites
// @access  Private
router.post('/favorites', protect, addFavorite);

// @route   DELETE /api/users/favorites/:videoId
// @desc    Remove video from favorites
// @access  Private
router.delete('/favorites/:videoId', protect, validateObjectId('videoId'), removeFavorite);

// @route   GET /api/users/favorites
// @desc    Get user favorites
// @access  Private
router.get('/favorites', protect, getFavorites);

// @route   POST /api/users/bookmarks
// @desc    Add video to bookmarks
// @access  Private
router.post('/bookmarks', protect, addBookmark);

// @route   DELETE /api/users/bookmarks/:videoId
// @desc    Remove video from bookmarks
// @access  Private
router.delete('/bookmarks/:videoId', protect, validateObjectId('videoId'), removeBookmark);

// @route   GET /api/users/bookmarks
// @desc    Get user bookmarks
// @access  Private
router.get('/bookmarks', protect, getBookmarks);

// @route   GET /api/users/me
// @desc    Get current user profile (legacy endpoint)
// @access  Private
router.get('/me', protect, getProfile);

// @route   PUT /api/users/me
// @desc    Update current user profile (legacy endpoint)
// @access  Private
router.put('/me', protect, updateProfile);

// @route   GET /api/users/me/videos/:videoId/unlock
// @desc    Check if user can access a specific video
// @access  Private
router.get('/me/videos/:videoId/unlock', protect, validateObjectId('videoId'), async (req, res) => {
  try {
    const video = await Video.findById(req.params.videoId);
    
    if (!video || !video.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    const hasAccess = await video.hasAccess(req.user);
    
    res.status(200).json({
      success: true,
      data: {
        videoId: video._id,
        hasAccess,
        isLocked: video.isLocked,
        isFree: video.isFree,
        requiresSubscription: video.isLocked && !video.isFree,
        userSubscriptionStatus: req.user.subscription ? req.user.subscription.status : null
      }
    });
  } catch (error) {
    console.error('Check video access error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/users/me/watchlist
// @desc    Get user's watchlist (placeholder for future implementation)
// @access  Private
router.get('/me/watchlist', protect, async (req, res) => {
  try {
    // This would require a separate UserWatchlist model
    // For now, return empty array
    res.status(200).json({
      success: true,
      data: [],
      message: 'Watchlist feature coming soon'
    });
  } catch (error) {
    console.error('Get watchlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/users/me/progress
// @desc    Get user's learning progress (placeholder for future implementation)
// @access  Private
router.get('/me/progress', protect, async (req, res) => {
  try {
    // This would require a separate UserProgress model
    // For now, return basic stats
    const stats = {
      totalVideosWatched: 0,
      totalWatchTime: 0,
      completedTopics: 0,
      currentStreak: 0,
      achievements: []
    };

    res.status(200).json({
      success: true,
      data: stats,
      message: 'Progress tracking feature coming soon'
    });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
