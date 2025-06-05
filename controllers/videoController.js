const Video = require('../models/Video');
const Topic = require('../models/Topic');

// @desc    Get all videos
// @route   GET /api/videos
// @access  Public
const getVideos = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      topic, 
      category,
      isLocked,
      quality,
      sort = 'episodeNumber' 
    } = req.query;
    
    // Build query
    const query = { isActive: true };
    
    if (search) {
      query.$text = { $search: search };
    }
    
    if (topic) {
      query.topic = topic;
    }
    
    if (category) {
      // Find topics in the category first
      const topics = await Topic.find({ category, isActive: true }).select('_id');
      query.topic = { $in: topics.map(t => t._id) };
    }
    
    if (isLocked !== undefined) {
      query.isLocked = isLocked === 'true';
    }
    
    if (quality) {
      query.quality = quality;
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
      case 'likes':
        sortObj = { likes: -1 };
        break;
      default:
        sortObj = { episodeNumber: 1 };
    }

    const videos = await Video.find(query)
      .sort(sortObj)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('topic', 'title slug category')
      .populate({
        path: 'topic',
        populate: {
          path: 'category',
          select: 'name slug'
        }
      })
      .select('-__v');

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
    console.error('Get videos error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single video
// @route   GET /api/videos/:id
// @access  Public
const getVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)
      .populate('topic', 'title slug category isPremium')
      .populate({
        path: 'topic',
        populate: {
          path: 'category',
          select: 'name slug'
        }
      })
      .populate('uploadedBy', 'name');

    if (!video || !video.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Check access
    const hasAccess = await video.hasAccess(req.user);
    video._doc.hasAccess = hasAccess;

    // Hide video URL if no access
    if (!hasAccess) {
      video._doc.videoUrl = undefined;
      
      return res.status(403).json({
        success: false,
        message: 'Subscription required to access this video',
        data: {
          video: {
            _id: video._id,
            title: video.title,
            description: video.description,
            thumbnail: video.thumbnail,
            duration: video.duration,
            episodeNumber: video.episodeNumber,
            isLocked: video.isLocked,
            hasAccess: false
          }
        }
      });
    }

    res.status(200).json({
      success: true,
      data: video
    });
  } catch (error) {
    console.error('Get video error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Record video view
// @route   POST /api/videos/:id/view
// @access  Public (but tracks user if authenticated)
const recordView = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    
    if (!video || !video.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Check if user has access
    const hasAccess = await video.hasAccess(req.user);
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Increment view count
    await video.incrementViews();

    // Here you could also track individual user views in a separate model
    // for analytics and progress tracking

    res.status(200).json({
      success: true,
      message: 'View recorded',
      data: {
        views: video.views + 1
      }
    });
  } catch (error) {
    console.error('Record view error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get video recommendations
// @route   GET /api/videos/:id/recommendations
// @access  Public
const getRecommendations = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id).populate('topic');
    
    if (!video || !video.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Get other videos from the same topic
    const sameTopicVideos = await Video.find({
      topic: video.topic._id,
      _id: { $ne: video._id },
      isActive: true
    })
    .sort({ episodeNumber: 1 })
    .limit(5)
    .populate('topic', 'title slug');

    // Get videos from the same category
    const sameCategoryTopics = await Topic.find({
      category: video.topic.category,
      _id: { $ne: video.topic._id },
      isActive: true
    }).select('_id');

    const sameCategoryVideos = await Video.find({
      topic: { $in: sameCategoryTopics.map(t => t._id) },
      isActive: true
    })
    .sort({ views: -1 })
    .limit(5)
    .populate('topic', 'title slug');

    // Add access information
    const allRecommendations = [...sameTopicVideos, ...sameCategoryVideos];
    for (let recVideo of allRecommendations) {
      const hasAccess = await recVideo.hasAccess(req.user);
      recVideo._doc.hasAccess = hasAccess;
      
      if (!hasAccess) {
        recVideo._doc.videoUrl = undefined;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        sameTopicVideos,
        sameCategoryVideos
      }
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Search videos
// @route   GET /api/videos/search
// @access  Public
const searchVideos = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const query = {
      $text: { $search: q },
      isActive: true
    };

    const videos = await Video.find(query)
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('topic', 'title slug category')
      .select('-__v');

    const total = await Video.countDocuments(query);

    // Add access information
    for (let video of videos) {
      const hasAccess = await video.hasAccess(req.user);
      video._doc.hasAccess = hasAccess;
      
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
    console.error('Search videos error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getVideos,
  getVideo,
  recordView,
  getRecommendations,
  searchVideos
};
