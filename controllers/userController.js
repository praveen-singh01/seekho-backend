const User = require('../models/User');
const Video = require('../models/Video');
const UserProgress = require('../models/UserProgress');
const UserFavorite = require('../models/UserFavorite');
const UserBookmark = require('../models/UserBookmark');
const WatchHistory = require('../models/WatchHistory');
const Notification = require('../models/Notification');
const { getPackageFilter } = require('../config/packages');

// @desc    Get user watch history
// @route   GET /api/users/watch-history
// @access  Private
const getWatchHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const result = await WatchHistory.getUserWatchHistory(
      req.user.id,
      parseInt(page),
      parseInt(limit),
      req.packageId
    );

    res.status(200).json({
      success: true,
      count: result.history.length,
      pagination: result.pagination,
      data: result.history
    });
  } catch (error) {
    console.error('Get watch history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Add video to favorites
// @route   POST /api/users/favorites
// @access  Private
const addFavorite = async (req, res) => {
  try {
    const { videoId } = req.body;
    
    if (!videoId) {
      return res.status(400).json({
        success: false,
        message: 'Video ID is required'
      });
    }

    // Check if video exists with package ID validation
    const packageFilter = getPackageFilter(req.packageId);
    const video = await Video.findOne({
      _id: videoId,
      ...packageFilter
    });
    if (!video || !video.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Check if already favorited
    const existingFavorite = await UserFavorite.findOne({
      ...packageFilter,
      user: req.user.id,
      video: videoId
    });

    if (existingFavorite) {
      return res.status(400).json({
        success: false,
        message: 'Video already in favorites'
      });
    }

    const favorite = await UserFavorite.create({
      packageId: req.packageId,
      user: req.user.id,
      video: videoId
    });

    res.status(201).json({
      success: true,
      data: favorite
    });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Remove video from favorites
// @route   DELETE /api/users/favorites/:videoId
// @access  Private
const removeFavorite = async (req, res) => {
  try {
    const packageFilter = getPackageFilter(req.packageId);
    const favorite = await UserFavorite.findOneAndDelete({
      ...packageFilter,
      user: req.user.id,
      video: req.params.videoId
    });

    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: 'Favorite not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Video removed from favorites'
    });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user favorites
// @route   GET /api/users/favorites
// @access  Private
const getFavorites = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const packageFilter = getPackageFilter(req.packageId);
    const favorites = await UserFavorite.find({ ...packageFilter, user: req.user.id })
      .sort({ addedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate({
        path: 'video',
        select: 'title thumbnail duration episodeNumber topic isLocked isFree',
        populate: {
          path: 'topic',
          select: 'title category',
          populate: {
            path: 'category',
            select: 'name'
          }
        }
      });

    const total = await UserFavorite.countDocuments({ ...packageFilter, user: req.user.id });

    // Add access information
    for (let favorite of favorites) {
      if (favorite.video) {
        const hasAccess = await favorite.video.hasAccess(req.user);
        favorite.video._doc.hasAccess = hasAccess;
        
        // Hide video URL if no access
        if (!hasAccess) {
          favorite.video._doc.videoUrl = undefined;
        }
      }
    }

    res.status(200).json({
      success: true,
      count: favorites.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      data: favorites
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await req.user.populate('subscription');
    
    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        profilePicture: user.profilePicture,
        provider: user.provider,
        isVerified: user.isVerified,
        subscription: user.subscription,
        preferences: user.preferences,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, username, preferences } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (username) updateData.username = username;
    if (preferences) updateData.preferences = { ...req.user.preferences, ...preferences };

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('subscription');

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        profilePicture: user.profilePicture,
        provider: user.provider,
        isVerified: user.isVerified,
        subscription: user.subscription,
        preferences: user.preferences,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private
const getUserStats = async (req, res) => {
  try {
    // Get progress stats
    const progressStats = await UserProgress.getUserStats(req.user.id);

    // Get favorite count
    const favoriteCount = await UserFavorite.getUserFavoriteCount(req.user.id);

    // Get bookmark count
    const bookmarkCount = await UserBookmark.getUserBookmarkCount(req.user.id);

    // Get completed courses count (topics with 100% completion)
    const completedTopics = await UserProgress.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: '$topic', completedVideos: { $sum: { $cond: ['$completed', 1, 0] } } } },
      {
        $lookup: {
          from: 'videos',
          localField: '_id',
          foreignField: 'topic',
          as: 'topicVideos'
        }
      },
      {
        $addFields: {
          totalVideos: { $size: '$topicVideos' },
          completionRate: { $divide: ['$completedVideos', { $size: '$topicVideos' }] }
        }
      },
      { $match: { completionRate: 1 } },
      { $count: 'completedCourses' }
    ]);

    const stats = {
      videosWatched: progressStats.totalVideosWatched,
      totalWatchTime: progressStats.totalWatchTime,
      completedVideos: progressStats.completedVideos,
      completedCourses: completedTopics[0]?.completedCourses || 0,
      favoriteVideos: favoriteCount,
      bookmarkedVideos: bookmarkCount,
      joinedDate: req.user.createdAt
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Add video to bookmarks
// @route   POST /api/users/bookmarks
// @access  Private
const addBookmark = async (req, res) => {
  try {
    const { videoId, note } = req.body;

    if (!videoId) {
      return res.status(400).json({
        success: false,
        message: 'Video ID is required'
      });
    }

    // Check if video exists with package validation
    const packageFilter = getPackageFilter(req.packageId);
    const video = await Video.findOne({ _id: videoId, ...packageFilter });
    if (!video || !video.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Check if already bookmarked
    const existingBookmark = await UserBookmark.findOne({
      ...packageFilter,
      user: req.user.id,
      video: videoId
    });

    if (existingBookmark) {
      return res.status(400).json({
        success: false,
        message: 'Video already bookmarked'
      });
    }

    const bookmark = await UserBookmark.create({
      packageId: req.packageId,
      user: req.user.id,
      video: videoId,
      note: note || null
    });

    res.status(201).json({
      success: true,
      data: bookmark
    });
  } catch (error) {
    console.error('Add bookmark error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Remove video from bookmarks
// @route   DELETE /api/users/bookmarks/:videoId
// @access  Private
const removeBookmark = async (req, res) => {
  try {
    const bookmark = await UserBookmark.findOneAndDelete({
      user: req.user.id,
      video: req.params.videoId
    });

    if (!bookmark) {
      return res.status(404).json({
        success: false,
        message: 'Bookmark not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Video removed from bookmarks'
    });
  } catch (error) {
    console.error('Remove bookmark error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user bookmarks
// @route   GET /api/users/bookmarks
// @access  Private
const getBookmarks = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const bookmarks = await UserBookmark.find({ user: req.user.id })
      .sort({ addedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate({
        path: 'video',
        select: 'title thumbnail duration episodeNumber topic isLocked isFree',
        populate: {
          path: 'topic',
          select: 'title category',
          populate: {
            path: 'category',
            select: 'name'
          }
        }
      });

    const total = await UserBookmark.countDocuments({ user: req.user.id });

    // Add access information
    for (let bookmark of bookmarks) {
      if (bookmark.video) {
        const hasAccess = await bookmark.video.hasAccess(req.user);
        bookmark.video._doc.hasAccess = hasAccess;

        // Hide video URL if no access
        if (!hasAccess) {
          bookmark.video._doc.videoUrl = undefined;
        }
      }
    }

    res.status(200).json({
      success: true,
      count: bookmarks.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      data: bookmarks
    });
  } catch (error) {
    console.error('Get bookmarks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
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
};
