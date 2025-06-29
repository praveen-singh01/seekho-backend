const Category = require('../models/Category');
const Topic = require('../models/Topic');
const { getPackageFilter } = require('../config/packages');
const Video = require('../models/Video');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, sort = 'order' } = req.query;
    
    // Build query with package ID filter
    const packageFilter = getPackageFilter(req.packageId);
    const query = {
      ...packageFilter,
      isActive: true
    };

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
    // Get category with package ID validation
    const packageFilter = getPackageFilter(req.packageId);
    const category = await Category.findOne({
      _id: req.params.id,
      ...packageFilter
    }).populate({
      path: 'topics',
      match: { isActive: true, ...packageFilter },
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
    
    // Check if category exists with package ID validation
    const packageFilter = getPackageFilter(req.packageId);
    const category = await Category.findOne({
      _id: req.params.id,
      ...packageFilter
    });
    if (!category || !category.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Build query with package ID filter
    const query = {
      ...packageFilter,
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

// @desc    Get complete category data (topics, videos, stats) in single response
// @route   GET /api/categories/:id/complete
// @access  Public
const getCategoryComplete = async (req, res) => {
  try {
    // Get category
    const category = await Category.findById(req.params.id);
    if (!category || !category.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Get topics in this category
    const topics = await Topic.find({
      category: req.params.id,
      isActive: true
    })
    .sort({ order: 1, title: 1 })
    .select('-__v');

    const topicIds = topics.map(topic => topic._id);

    // Get videos in these topics
    const videos = await Video.find({
      topic: { $in: topicIds },
      isActive: true
    })
    .sort({ topic: 1, episodeNumber: 1 })
    .select('title topic duration episodeNumber isLocked isFree thumbnail')
    .populate('topic', 'title');

    // Calculate stats
    const stats = {
      totalVideos: videos.length,
      totalDuration: videos.reduce((sum, video) => sum + video.duration, 0),
      premiumVideos: videos.filter(v => v.isLocked && !v.isFree).length,
      freeVideos: videos.filter(v => v.isFree || !v.isLocked).length
    };

    // Add video count to each topic
    const topicsWithCounts = topics.map(topic => {
      const topicVideos = videos.filter(v => v.topic._id.toString() === topic._id.toString());
      return {
        ...topic.toObject(),
        videoCount: topicVideos.length,
        order: topic.order
      };
    });

    // Add access information if user is authenticated
    if (req.user) {
      for (let video of videos) {
        const hasAccess = await video.hasAccess(req.user);
        video._doc.hasAccess = hasAccess;

        // Hide video URL if no access
        if (!hasAccess) {
          video._doc.videoUrl = undefined;
        }
      }
    }

    res.status(200).json({
      success: true,
      data: {
        category: {
          id: category._id,
          name: category.name,
          description: category.description,
          thumbnail: category.thumbnail,
          isActive: category.isActive,
          videoCount: stats.totalVideos,
          topicCount: topics.length
        },
        topics: topicsWithCounts,
        videos,
        stats
      }
    });
  } catch (error) {
    console.error('Get category complete error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get category updates (new content)
// @route   GET /api/categories/:id/updates
// @access  Public
const getCategoryUpdates = async (req, res) => {
  try {
    const { since } = req.query;

    // Check if category exists
    const category = await Category.findById(req.params.id);
    if (!category || !category.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const sinceDate = since ? new Date(since) : (() => {
      const date = new Date();
      date.setDate(date.getDate() - 7); // Default to last 7 days
      return date;
    })();

    // Get topics in this category
    const topics = await Topic.find({
      category: req.params.id,
      isActive: true
    }).select('_id');

    const topicIds = topics.map(topic => topic._id);

    // Get new videos in these topics
    const newVideos = await Video.find({
      topic: { $in: topicIds },
      isActive: true,
      createdAt: { $gte: sinceDate }
    })
    .sort({ createdAt: -1 })
    .populate('topic', 'title')
    .select('title thumbnail duration episodeNumber createdAt topic');

    // Get new topics
    const newTopics = await Topic.find({
      category: req.params.id,
      isActive: true,
      createdAt: { $gte: sinceDate }
    })
    .sort({ createdAt: -1 })
    .select('title thumbnail difficulty estimatedDuration createdAt');

    res.status(200).json({
      success: true,
      data: {
        since: sinceDate,
        newVideos: {
          count: newVideos.length,
          videos: newVideos
        },
        newTopics: {
          count: newTopics.length,
          topics: newTopics
        }
      }
    });
  } catch (error) {
    console.error('Get category updates error:', error);
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
  getCategoryStats,
  getCategoryComplete,
  getCategoryUpdates
};
