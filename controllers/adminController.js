const User = require('../models/User');
const Category = require('../models/Category');
const Topic = require('../models/Topic');
const Video = require('../models/Video');
const Subscription = require('../models/Subscription');
const SubscriptionService = require('../services/subscriptionService');

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
  updateVideo
};
