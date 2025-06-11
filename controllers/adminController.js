const User = require('../models/User');
const Category = require('../models/Category');
const Topic = require('../models/Topic');
const Video = require('../models/Video');
const Subscription = require('../models/Subscription');
const SubscriptionService = require('../services/subscriptionService');
const UserProgress = require('../models/UserProgress');
const UserFavorite = require('../models/UserFavorite');
const UserBookmark = require('../models/UserBookmark');
const WatchHistory = require('../models/WatchHistory');
const Notification = require('../models/Notification');
const { uploadToS3, deleteFile } = require('../services/uploadService');
const { convertS3ToCloudFront, invalidateCache, isCloudFrontConfigured, isSignedUrlConfigured, generateSignedUrl, generateCloudFrontUrl } = require('../services/cloudfrontService');

// @desc    Get admin dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private/Admin
const getDashboard = async (req, res) => {
  try {
    // Get basic counts
    const totalUsers = await User.countDocuments({ isActive: true });
    const totalCategories = await Category.countDocuments({ isActive: true });
    const totalTopics = await Topic.countDocuments({ isActive: true });
    const totalVideos = await Video.countDocuments({ isActive: true });
    
    // Get subscription analytics
    const subscriptionAnalytics = await SubscriptionService.getAnalytics();
    
    // Get recent users
    const recentUsers = await User.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email createdAt lastLogin')
      .populate('subscription', 'status plan endDate');

    // Get popular videos
    const popularVideos = await Video.find({ isActive: true })
      .sort({ views: -1 })
      .limit(5)
      .select('title views duration episodeNumber')
      .populate('topic', 'title');

    // Get revenue data
    const revenueData = await Subscription.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    const dashboard = {
      overview: {
        totalUsers,
        totalCategories,
        totalTopics,
        totalVideos,
        activeSubscriptions: subscriptionAnalytics.success ? subscriptionAnalytics.analytics.active : 0,
        totalRevenue: subscriptionAnalytics.success ? subscriptionAnalytics.analytics.revenue.total : 0
      },
      recentUsers,
      popularVideos,
      revenueData,
      subscriptionBreakdown: subscriptionAnalytics.success ? subscriptionAnalytics.analytics.byPlan : {}
    };

    res.status(200).json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all users with pagination
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status, hasSubscription } = req.query;
    
    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      query.isActive = status === 'active';
    }

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-password')
      .populate('subscription', 'status plan endDate amount');

    // Filter by subscription if needed
    let filteredUsers = users;
    if (hasSubscription !== undefined) {
      const hasSubFilter = hasSubscription === 'true';
      filteredUsers = users.filter(user => {
        const hasActiveSub = user.subscription && user.subscription.status === 'active';
        return hasSubFilter ? hasActiveSub : !hasActiveSub;
      });
    }

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: filteredUsers.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      data: filteredUsers
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create new category
// @route   POST /api/admin/categories
// @access  Private/Admin
const createCategory = async (req, res) => {
  try {
    const { name, description, color, thumbnail, icon, order } = req.body;

    // Check if category with same name already exists
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }

    // If no order specified, set it to the next available order
    let categoryOrder = order;
    if (!categoryOrder) {
      const lastCategory = await Category.findOne().sort({ order: -1 });
      categoryOrder = lastCategory ? lastCategory.order + 1 : 1;
    }

    const categoryData = {
      name,
      description,
      color: color || '#007bff',
      thumbnail,
      icon,
      order: categoryOrder,
      isActive: true
    };

    const category = await Category.create(categoryData);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    console.error('Create category error:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update category
// @route   PUT /api/admin/categories/:id
// @access  Private/Admin
const updateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create new topic
// @route   POST /api/admin/topics
// @access  Private/Admin
const createTopic = async (req, res) => {
  try {
    const topic = await Topic.create(req.body);
    await topic.populate('category', 'name slug');
    
    res.status(201).json({
      success: true,
      data: topic
    });
  } catch (error) {
    console.error('Create topic error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update topic
// @route   PUT /api/admin/topics/:id
// @access  Private/Admin
const updateTopic = async (req, res) => {
  try {
    const topic = await Topic.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('category', 'name slug');

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found'
      });
    }

    res.status(200).json({
      success: true,
      data: topic
    });
  } catch (error) {
    console.error('Update topic error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create new video
// @route   POST /api/admin/videos
// @access  Private/Admin
const createVideo = async (req, res) => {
  try {
    const videoData = {
      ...req.body,
      uploadedBy: req.user.id
    };
    
    const video = await Video.create(videoData);
    await video.populate('topic', 'title slug');
    
    res.status(201).json({
      success: true,
      data: video
    });
  } catch (error) {
    console.error('Create video error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update video
// @route   PUT /api/admin/videos/:id
// @access  Private/Admin
const updateVideo = async (req, res) => {
  try {
    const video = await Video.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('topic', 'title slug');

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    res.status(200).json({
      success: true,
      data: video
    });
  } catch (error) {
    console.error('Update video error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all categories for admin
// @route   GET /api/admin/categories
// @access  Private/Admin
const getCategories = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;

    // Build query
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (status !== undefined) {
      query.isActive = status === 'active';
    }

    const categories = await Category.find(query)
      .sort({ order: 1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

    const total = await Category.countDocuments(query);

    res.status(200).json({
      success: true,
      count: categories.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      data: categories
    });
  } catch (error) {
    console.error('Get admin categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Reorder categories
// @route   PUT /api/admin/categories/reorder
// @access  Private/Admin
const reorderCategories = async (req, res) => {
  try {
    const { categoryOrders } = req.body; // Array of { id, order }

    if (!Array.isArray(categoryOrders)) {
      return res.status(400).json({
        success: false,
        message: 'categoryOrders must be an array'
      });
    }

    // Update each category's order
    const updatePromises = categoryOrders.map(({ id, order }) =>
      Category.findByIdAndUpdate(id, { order }, { new: true })
    );

    await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: 'Categories reordered successfully'
    });
  } catch (error) {
    console.error('Reorder categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get category analytics
// @route   GET /api/admin/categories/:id/analytics
// @access  Private/Admin
const getCategoryAnalytics = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const topics = await Topic.find({ category: req.params.id });
    const topicIds = topics.map(topic => topic._id);

    const videos = await Video.find({ topic: { $in: topicIds } });

    // Calculate analytics
    const analytics = {
      totalTopics: topics.length,
      activeTopics: topics.filter(t => t.isActive).length,
      totalVideos: videos.length,
      activeVideos: videos.filter(v => v.isActive).length,
      totalViews: videos.reduce((sum, video) => sum + video.views, 0),
      totalDuration: videos.reduce((sum, video) => sum + video.duration, 0),
      premiumContent: {
        topics: topics.filter(t => t.isPremium).length,
        videos: videos.filter(v => v.isLocked).length
      },
      difficultyBreakdown: {
        beginner: topics.filter(t => t.difficulty === 'beginner').length,
        intermediate: topics.filter(t => t.difficulty === 'intermediate').length,
        advanced: topics.filter(t => t.difficulty === 'advanced').length
      }
    };

    res.status(200).json({
      success: true,
      data: {
        category,
        analytics
      }
    });
  } catch (error) {
    console.error('Get category analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user analytics for admin
// @route   GET /api/admin/users/:id/analytics
// @access  Private/Admin
const getUserAnalytics = async (req, res) => {
  try {
    const userId = req.params.id;

    // Get user
    const user = await User.findById(userId).populate('subscription');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user progress stats
    const progressStats = await UserProgress.getUserStats(userId);

    // Get favorite count
    const favoriteCount = await UserFavorite.getUserFavoriteCount(userId);

    // Get bookmark count
    const bookmarkCount = await UserBookmark.getUserBookmarkCount(userId);

    // Get watch history count
    const watchHistoryCount = await WatchHistory.countDocuments({ user: userId });

    // Get recent activity
    const recentActivity = await WatchHistory.find({ user: userId })
      .sort({ watchedAt: -1 })
      .limit(10)
      .populate('video', 'title thumbnail duration')
      .populate({
        path: 'video',
        populate: {
          path: 'topic',
          select: 'title category',
          populate: {
            path: 'category',
            select: 'name'
          }
        }
      });

    const analytics = {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        joinedDate: user.createdAt,
        lastLogin: user.lastLogin,
        isActive: user.isActive,
        subscription: user.subscription
      },
      stats: {
        videosWatched: progressStats.totalVideosWatched,
        totalWatchTime: progressStats.totalWatchTime,
        completedVideos: progressStats.completedVideos,
        favoriteVideos: favoriteCount,
        bookmarkedVideos: bookmarkCount,
        totalSessions: watchHistoryCount
      },
      recentActivity
    };

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get content performance analytics
// @route   GET /api/admin/analytics/content
// @access  Private/Admin
const getContentAnalytics = async (req, res) => {
  try {
    // Get popular videos
    const popularVideos = await Video.find({ isActive: true })
      .sort({ views: -1 })
      .limit(10)
      .populate('topic', 'title category')
      .populate({
        path: 'topic',
        populate: {
          path: 'category',
          select: 'name'
        }
      })
      .select('title views duration likes episodeNumber createdAt');

    // Get most favorited videos
    const favoritedVideos = await UserFavorite.aggregate([
      {
        $group: {
          _id: '$video',
          favoriteCount: { $sum: 1 }
        }
      },
      { $sort: { favoriteCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'videos',
          localField: '_id',
          foreignField: '_id',
          as: 'video'
        }
      },
      { $unwind: '$video' },
      {
        $lookup: {
          from: 'topics',
          localField: 'video.topic',
          foreignField: '_id',
          as: 'topic'
        }
      },
      { $unwind: '$topic' }
    ]);

    // Get most bookmarked videos
    const bookmarkedVideos = await UserBookmark.aggregate([
      {
        $group: {
          _id: '$video',
          bookmarkCount: { $sum: 1 }
        }
      },
      { $sort: { bookmarkCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'videos',
          localField: '_id',
          foreignField: '_id',
          as: 'video'
        }
      },
      { $unwind: '$video' }
    ]);

    // Get category performance
    const categoryPerformance = await Video.aggregate([
      {
        $lookup: {
          from: 'topics',
          localField: 'topic',
          foreignField: '_id',
          as: 'topic'
        }
      },
      { $unwind: '$topic' },
      {
        $lookup: {
          from: 'categories',
          localField: 'topic.category',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $group: {
          _id: '$category._id',
          categoryName: { $first: '$category.name' },
          totalVideos: { $sum: 1 },
          totalViews: { $sum: '$views' },
          totalLikes: { $sum: '$likes' },
          avgDuration: { $avg: '$duration' }
        }
      },
      { $sort: { totalViews: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        popularVideos,
        favoritedVideos,
        bookmarkedVideos,
        categoryPerformance
      }
    });
  } catch (error) {
    console.error('Get content analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user engagement analytics
// @route   GET /api/admin/analytics/engagement
// @access  Private/Admin
const getEngagementAnalytics = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Daily active users
    const dailyActiveUsers = await WatchHistory.aggregate([
      { $match: { watchedAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$watchedAt' } },
            user: '$user'
          }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          activeUsers: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Watch time trends
    const watchTimeTrends = await WatchHistory.aggregate([
      { $match: { watchedAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$watchedAt' } },
          totalWatchTime: { $sum: '$sessionDuration' },
          totalSessions: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // User retention (users who watched videos in multiple days)
    const userRetention = await WatchHistory.aggregate([
      { $match: { watchedAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$user',
          uniqueDays: {
            $addToSet: { $dateToString: { format: '%Y-%m-%d', date: '$watchedAt' } }
          }
        }
      },
      {
        $group: {
          _id: { $size: '$uniqueDays' },
          userCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        dailyActiveUsers,
        watchTimeTrends,
        userRetention,
        period: `${days} days`
      }
    });
  } catch (error) {
    console.error('Get engagement analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Send notification to users
// @route   POST /api/admin/notifications/send
// @access  Private/Admin
const sendNotification = async (req, res) => {
  try {
    const { title, message, type = 'info', userIds, sendToAll = false, priority = 'medium' } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }

    let targetUsers = [];

    if (sendToAll) {
      // Send to all active users
      const users = await User.find({ isActive: true }).select('_id');
      targetUsers = users.map(user => user._id);
    } else if (userIds && userIds.length > 0) {
      // Send to specific users
      targetUsers = userIds;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either specify userIds or set sendToAll to true'
      });
    }

    // Create notifications for all target users
    const notifications = targetUsers.map(userId => ({
      user: userId,
      title,
      message,
      type,
      priority
    }));

    const createdNotifications = await Notification.insertMany(notifications);

    res.status(201).json({
      success: true,
      message: `Notification sent to ${createdNotifications.length} users`,
      data: {
        notificationCount: createdNotifications.length,
        title,
        message,
        type
      }
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all notifications (admin view)
// @route   GET /api/admin/notifications
// @access  Private/Admin
const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, isRead } = req.query;

    const query = {};
    if (type) query.type = type;
    if (isRead !== undefined) query.isRead = isRead === 'true';

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('user', 'name email')
      .select('-__v');

    const total = await Notification.countDocuments(query);

    // Get notification stats
    const stats = await Notification.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          unread: { $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] } },
          byType: {
            $push: {
              type: '$type',
              isRead: '$isRead'
            }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      count: notifications.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      stats: stats[0] || { total: 0, unread: 0, byType: [] },
      data: notifications
    });
  } catch (error) {
    console.error('Get admin notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get notification analytics
// @route   GET /api/admin/notifications/analytics
// @access  Private/Admin
const getNotificationAnalytics = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Notification stats by type
    const notificationsByType = await Notification.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          readCount: { $sum: { $cond: ['$isRead', 1, 0] } },
          unreadCount: { $sum: { $cond: ['$isRead', 0, 1] } }
        }
      }
    ]);

    // Daily notification trends
    const dailyTrends = await Notification.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          sent: { $sum: 1 },
          read: { $sum: { $cond: ['$isRead', 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Read rate by priority
    const readRateByPriority = await Notification.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$priority',
          total: { $sum: 1 },
          read: { $sum: { $cond: ['$isRead', 1, 0] } }
        }
      },
      {
        $addFields: {
          readRate: { $multiply: [{ $divide: ['$read', '$total'] }, 100] }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        notificationsByType,
        dailyTrends,
        readRateByPriority,
        period: `${days} days`
      }
    });
  } catch (error) {
    console.error('Get notification analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get CloudFront configuration status
// @route   GET /api/admin/cloudfront/status
// @access  Private/Admin
const getCloudFrontStatus = async (req, res) => {
  try {
    const isConfigured = isCloudFrontConfigured();
    const canGenerateSignedUrls = isSignedUrlConfigured();

    // Test URL generation with your CloudFront domain
    let testUrls = {};
    if (isConfigured) {
      try {
        // Test with a sample file path like your example
        testUrls.publicUrl = generateCloudFrontUrl('categories/Cyberpunk city.mp4', 3600, false);
        if (canGenerateSignedUrls) {
          testUrls.signedUrl = generateCloudFrontUrl('categories/Cyberpunk city.mp4', 3600, true);
        }
      } catch (error) {
        console.error('Error generating test URLs:', error);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        isConfigured,
        canGenerateSignedUrls,
        distributionDomain: process.env.CLOUDFRONT_DISTRIBUTION_DOMAIN || null,
        keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID || null,
        hasPrivateKey: !!(process.env.CLOUDFRONT_PRIVATE_KEY_BASE64 || process.env.CLOUDFRONT_PRIVATE_KEY_PATH),
        testUrls,
        message: isConfigured ?
          (canGenerateSignedUrls ? 'CloudFront is fully configured with signed URLs' : 'CloudFront configured for public URLs only') :
          'CloudFront configuration incomplete'
      }
    });
  } catch (error) {
    console.error('Get CloudFront status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Test CloudFront signed URL generation
// @route   POST /api/admin/cloudfront/test-url
// @access  Private/Admin
const testCloudFrontUrl = async (req, res) => {
  try {
    const { s3Key, expiresIn = 3600 } = req.body;

    if (!s3Key) {
      return res.status(400).json({
        success: false,
        message: 'S3 key is required'
      });
    }

    if (!isCloudFrontConfigured()) {
      return res.status(400).json({
        success: false,
        message: 'CloudFront is not properly configured'
      });
    }

    const signedUrl = generateSignedUrl(s3Key, expiresIn);

    res.status(200).json({
      success: true,
      data: {
        s3Key,
        signedUrl,
        expiresIn,
        expiresAt: new Date(Date.now() + (expiresIn * 1000)).toISOString()
      }
    });
  } catch (error) {
    console.error('Test CloudFront URL error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Invalidate CloudFront cache for specific paths
// @route   POST /api/admin/cloudfront/invalidate
// @access  Private/Admin
const invalidateCloudFrontCache = async (req, res) => {
  try {
    const { paths } = req.body;

    if (!paths || !Array.isArray(paths) || paths.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Paths array is required'
      });
    }

    if (!isCloudFrontConfigured()) {
      return res.status(400).json({
        success: false,
        message: 'CloudFront is not properly configured'
      });
    }

    const result = await invalidateCache(paths);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Cache invalidation initiated',
        data: {
          invalidationId: result.invalidationId,
          paths
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message || 'Cache invalidation failed',
        error: result.error
      });
    }
  } catch (error) {
    console.error('CloudFront cache invalidation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Convert existing video URLs to CloudFront
// @route   POST /api/admin/videos/convert-to-cloudfront
// @access  Private/Admin
const convertVideosToCloudFront = async (req, res) => {
  try {
    if (!isCloudFrontConfigured()) {
      return res.status(400).json({
        success: false,
        message: 'CloudFront is not properly configured'
      });
    }

    const { videoIds, dryRun = false } = req.body;

    let query = {};
    if (videoIds && Array.isArray(videoIds)) {
      query._id = { $in: videoIds };
    }

    const videos = await Video.find(query).select('_id title videoUrl thumbnail');
    const results = [];

    for (const video of videos) {
      try {
        const originalVideoUrl = video.videoUrl;
        const originalThumbnailUrl = video.thumbnail;

        // Convert URLs to CloudFront
        const cloudFrontVideoUrl = convertS3ToCloudFront(originalVideoUrl, 14400);
        const cloudFrontThumbnailUrl = originalThumbnailUrl ?
          convertS3ToCloudFront(originalThumbnailUrl, 86400) : null;

        const result = {
          videoId: video._id,
          title: video.title,
          original: {
            videoUrl: originalVideoUrl,
            thumbnailUrl: originalThumbnailUrl
          },
          cloudfront: {
            videoUrl: cloudFrontVideoUrl,
            thumbnailUrl: cloudFrontThumbnailUrl
          }
        };

        if (!dryRun) {
          // Note: We don't actually update the database URLs since we convert them on-the-fly
          // This is just for testing the conversion process
          result.status = 'converted';
        } else {
          result.status = 'dry-run';
        }

        results.push(result);
      } catch (error) {
        results.push({
          videoId: video._id,
          title: video.title,
          status: 'error',
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `${dryRun ? 'Dry run completed' : 'Conversion completed'}`,
      data: {
        totalVideos: videos.length,
        results,
        summary: {
          successful: results.filter(r => r.status === 'converted' || r.status === 'dry-run').length,
          failed: results.filter(r => r.status === 'error').length
        }
      }
    });
  } catch (error) {
    console.error('Convert videos to CloudFront error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get subscription statistics and management
// @route   GET /api/admin/subscriptions/stats
// @access  Private/Admin
const getSubscriptionStats = async (req, res) => {
  try {
    const CronService = require('../services/cronService');
    const result = await CronService.getSubscriptionStats();

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error
      });
    }

    res.status(200).json({
      success: true,
      data: result.stats
    });
  } catch (error) {
    console.error('Get subscription stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Run subscription maintenance manually
// @route   POST /api/admin/subscriptions/maintenance
// @access  Private/Admin
const runSubscriptionMaintenance = async (req, res) => {
  try {
    const CronService = require('../services/cronService');
    await CronService.runMaintenanceNow();

    res.status(200).json({
      success: true,
      message: 'Subscription maintenance completed successfully'
    });
  } catch (error) {
    console.error('Run subscription maintenance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all subscriptions with filters
// @route   GET /api/admin/subscriptions
// @access  Private/Admin
const getAllSubscriptions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      plan,
      isRecurring,
      search
    } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (plan) filter.plan = plan;
    if (isRecurring !== undefined) filter.isRecurring = isRecurring === 'true';

    let query = Subscription.find(filter)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');

      const userIds = users.map(user => user._id);
      filter.user = { $in: userIds };
      query = Subscription.find(filter)
        .populate('user', 'name email phone')
        .sort({ createdAt: -1 });
    }

    const subscriptions = await query
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Subscription.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: subscriptions.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      data: subscriptions
    });
  } catch (error) {
    console.error('Get all subscriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get subscription analytics with historical data
// @route   GET /api/admin/subscriptions/analytics
// @access  Private/Admin
const getSubscriptionAnalytics = async (req, res) => {
  try {
    const { timeRange = '6months' } = req.query;

    // Calculate date range
    let months = 6;
    switch (timeRange) {
      case '3months':
        months = 3;
        break;
      case '12months':
        months = 12;
        break;
      default:
        months = 6;
    }

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Get monthly subscription data
    const monthlyData = await Subscription.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          newSubscriptions: { $sum: 1 },
          revenue: { $sum: '$amount' },
          plans: { $push: '$plan' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Get cancellation data
    const cancellationData = await Subscription.aggregate([
      {
        $match: {
          status: 'cancelled',
          updatedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$updatedAt' },
            month: { $month: '$updatedAt' }
          },
          cancelledSubscriptions: { $sum: 1 }
        }
      }
    ]);

    // Format monthly data
    const formattedMonthlyData = [];
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      const monthData = monthlyData.find(d => d._id.year === year && d._id.month === month);
      const cancelData = cancellationData.find(d => d._id.year === year && d._id.month === month);

      formattedMonthlyData.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        newSubscriptions: monthData?.newSubscriptions || 0,
        cancelledSubscriptions: cancelData?.cancelledSubscriptions || 0,
        revenue: monthData?.revenue || 0,
        activeSubscriptions: Math.max(0, (monthData?.newSubscriptions || 0) - (cancelData?.cancelledSubscriptions || 0))
      });
    }

    // Get current stats
    const CronService = require('../services/cronService');
    const currentStats = await CronService.getSubscriptionStats();

    res.status(200).json({
      success: true,
      data: {
        monthlyData: formattedMonthlyData,
        currentStats: currentStats.success ? currentStats.stats : null,
        timeRange
      }
    });
  } catch (error) {
    console.error('Get subscription analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getDashboard,
  getUsers,
  getCategories,
  createCategory,
  updateCategory,
  reorderCategories,
  getCategoryAnalytics,
  createTopic,
  updateTopic,
  createVideo,
  updateVideo,
  getUserAnalytics,
  getContentAnalytics,
  getEngagementAnalytics,
  sendNotification,
  getNotifications,
  getNotificationAnalytics,
  getCloudFrontStatus,
  testCloudFrontUrl,
  invalidateCloudFrontCache,
  convertVideosToCloudFront,
  getSubscriptionStats,
  runSubscriptionMaintenance,
  getAllSubscriptions,
  getSubscriptionAnalytics
};
