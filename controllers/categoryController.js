const Category = require('../models/Category');
const Topic = require('../models/Topic');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, sort = 'order' } = req.query;
    
    // Build query
    const query = { isActive: true };
    
    if (search) {
      query.$text = { $search: search };
    }

    // Build sort object
    let sortObj = {};
    switch (sort) {
      case 'name':
        sortObj = { name: 1 };
        break;
      case 'newest':
        sortObj = { createdAt: -1 };
        break;
      case 'popular':
        sortObj = { 'metadata.totalVideos': -1 };
        break;
      default:
        sortObj = { order: 1, name: 1 };
    }

    const categories = await Category.find(query)
      .sort(sortObj)
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
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
const getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate({
        path: 'topics',
        match: { isActive: true },
        select: 'title slug description difficulty estimatedDuration metadata isPremium order'
      });

    if (!category || !category.isActive) {
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
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get topics in a category
// @route   GET /api/categories/:id/topics
// @access  Public
const getCategoryTopics = async (req, res) => {
  try {
    const { page = 1, limit = 10, difficulty, sort = 'order' } = req.query;
    
    // Check if category exists
    const category = await Category.findById(req.params.id);
    if (!category || !category.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Build query
    const query = { 
      category: req.params.id, 
      isActive: true 
    };
    
    if (difficulty) {
      query.difficulty = difficulty;
    }

    // Build sort object
    let sortObj = {};
    switch (sort) {
      case 'title':
        sortObj = { title: 1 };
        break;
      case 'newest':
        sortObj = { createdAt: -1 };
        break;
      case 'duration':
        sortObj = { estimatedDuration: -1 };
        break;
      default:
        sortObj = { order: 1, title: 1 };
    }

    const topics = await Topic.find(query)
      .sort(sortObj)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v')
      .populate('category', 'name slug');

    const total = await Topic.countDocuments(query);

    // Add access information if user is authenticated
    if (req.user) {
      topics.forEach(topic => {
        topic._doc.hasAccess = topic.hasAccess(req.user);
      });
    }

    res.status(200).json({
      success: true,
      count: topics.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      data: topics
    });
  } catch (error) {
    console.error('Get category topics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get category statistics
// @route   GET /api/categories/:id/stats
// @access  Public
const getCategoryStats = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category || !category.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const topics = await Topic.find({ category: req.params.id, isActive: true });
    const topicIds = topics.map(topic => topic._id);
    
    const Video = require('../models/Video');
    const videos = await Video.find({ topic: { $in: topicIds }, isActive: true });

    const stats = {
      totalTopics: topics.length,
      totalVideos: videos.length,
      totalDuration: videos.reduce((sum, video) => sum + video.duration, 0),
      difficultyBreakdown: {
        beginner: topics.filter(t => t.difficulty === 'beginner').length,
        intermediate: topics.filter(t => t.difficulty === 'intermediate').length,
        advanced: topics.filter(t => t.difficulty === 'advanced').length
      },
      premiumContent: {
        topics: topics.filter(t => t.isPremium).length,
        videos: videos.filter(v => v.isLocked).length
      }
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get category stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getCategories,
  getCategory,
  getCategoryTopics,
  getCategoryStats
};
