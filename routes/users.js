const express = require('express');
const { protect } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validation');
const User = require('../models/User');
const Video = require('../models/Video');

const router = express.Router();

// @route   GET /api/users/me
// @desc    Get current user profile
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await req.user.populate('subscription');
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/users/me
// @desc    Update current user profile
// @access  Private
router.put('/me', protect, async (req, res) => {
  try {
    const { name, preferences } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (preferences) updateData.preferences = { ...req.user.preferences, ...preferences };

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

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
