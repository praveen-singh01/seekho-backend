const Topic = require('../models/Topic');
const Video = require('../models/Video');
const Category = require('../models/Category');
const { getPackageFilter } = require('../config/packages');

// @desc    Get all topics
// @route   GET /api/topics
// @access  Public
const getTopics = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      category, 
      difficulty, 
      isPremium,
      sort = 'order' 
    } = req.query;
    
    // Build query with package ID filter
    const packageFilter = getPackageFilter(req.packageId);
    const query = {
      ...packageFilter,
      isActive: true
    };

    if (search) {
      query.$text = { $search: search };
    }

    if (category) {
      query.category = category;
    }

    if (difficulty) {
      query.difficulty = difficulty;
    }

    if (isPremium !== undefined) {
      query.isPremium = isPremium === 'true';
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
      case 'popular':
        sortObj = { 'metadata.totalVideos': -1 };
        break;
      default:
        sortObj = { order: 1, title: 1 };
    }

    const topics = await Topic.find(query)
      .sort(sortObj)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('category', 'name slug color')
      .select('-__v');

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
    console.error('Get topics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single topic
// @route   GET /api/topics/:id
// @access  Public
const getTopic = async (req, res) => {
  try {
    // Get topic with package ID validation
    const packageFilter = getPackageFilter(req.packageId);
    const topic = await Topic.findOne({
      _id: req.params.id,
      ...packageFilter
    })
      .populate('category', 'name slug color')
      .populate('prerequisites', 'title slug')
      .populate({
        path: 'videos',
        match: { isActive: true, ...packageFilter },
        select: 'title slug duration episodeNumber isLocked isFree thumbnail views'
      });

    if (!topic || !topic.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found'
      });
    }

    // Add access information
    const hasAccess = req.user ? topic.hasAccess(req.user) : false;
    topic._doc.hasAccess = hasAccess;

    // Filter videos based on access
    if (topic.videos) {
      for (let video of topic.videos) {
        const videoHasAccess = await video.hasAccess(req.user);
        video._doc.hasAccess = videoHasAccess;
        
        // Hide video URL if no access
        if (!videoHasAccess) {
          video._doc.videoUrl = undefined;
        }
      }
    }

    res.status(200).json({
      success: true,
      data: topic
    });
  } catch (error) {
    console.error('Get topic error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get videos in a topic
// @route   GET /api/topics/:id/videos
// @access  Public
const getTopicVideos = async (req, res) => {
  try {
    const { page = 1, limit = 20, sort = 'episodeNumber' } = req.query;
    
    // Check if topic exists with package ID validation
    const packageFilter = getPackageFilter(req.packageId);
    const topic = await Topic.findOne({
      _id: req.params.id,
      ...packageFilter
    });
    if (!topic || !topic.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found'
      });
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
        sortObj = { duration: -1 };
        break;
      case 'views':
        sortObj = { views: -1 };
        break;
      default:
        sortObj = { episodeNumber: 1 };
    }

    const query = {
      ...packageFilter,
      topic: req.params.id,
      isActive: true
    };

    const videos = await Video.find(query)
      .sort(sortObj)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v')
      .populate('topic', 'title slug');

    const total = await Video.countDocuments(query);

    // Add access information and filter sensitive data
    for (let video of videos) {
      const hasAccess = await video.hasAccess(req.user);
      video._doc.hasAccess = hasAccess;
      
      // Hide video URL if no access
      if (!hasAccess) {
        video._doc.videoUrl = undefined;
      }
    }

    res.status(200).json({
      success: true,
      count: videos.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      data: videos
    });
  } catch (error) {
    console.error('Get topic videos error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get topic progress for user
// @route   GET /api/topics/:id/progress
// @access  Private
const getTopicProgress = async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);
    
    if (!topic || !topic.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found'
      });
    }

    const videos = await Video.find({ 
      topic: req.params.id, 
      isActive: true 
    }).sort({ episodeNumber: 1 });

    // This would require a separate UserProgress model to track actual progress
    // For now, we'll return basic information
    const progress = {
      topicId: topic._id,
      totalVideos: videos.length,
      completedVideos: 0, // Would come from UserProgress model
      progressPercentage: 0,
      lastWatchedVideo: null,
      hasAccess: topic.hasAccess(req.user),
      videos: videos.map(video => ({
        _id: video._id,
        title: video.title,
        episodeNumber: video.episodeNumber,
        duration: video.duration,
        isCompleted: false, // Would come from UserProgress model
        hasAccess: video.isFree || !video.isLocked || req.user.isSubscribed
      }))
    };

    res.status(200).json({
      success: true,
      data: progress
    });
  } catch (error) {
    console.error('Get topic progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get related topics
// @route   GET /api/topics/:id/related
// @access  Public
const getRelatedTopics = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const topic = await Topic.findById(req.params.id);
    if (!topic || !topic.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found'
      });
    }

    // Get topics from the same category (excluding current topic)
    const relatedTopics = await Topic.find({
      category: topic.category,
      _id: { $ne: topic._id },
      isActive: true
    })
    .sort({ order: 1, 'metadata.totalVideos': -1 })
    .limit(parseInt(limit))
    .populate('category', 'name')
    .select('-__v');

    // Add access information if user is authenticated
    if (req.user) {
      relatedTopics.forEach(relatedTopic => {
        relatedTopic._doc.hasAccess = relatedTopic.hasAccess(req.user);
      });
    }

    res.status(200).json({
      success: true,
      count: relatedTopics.length,
      data: relatedTopics
    });
  } catch (error) {
    console.error('Get related topics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getTopics,
  getTopic,
  getTopicVideos,
  getTopicProgress,
  getRelatedTopics
};
