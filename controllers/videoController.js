const Video = require('../models/Video');
const Topic = require('../models/Topic');
const Category = require('../models/Category');
const UserProgress = require('../models/UserProgress');
const WatchHistory = require('../models/WatchHistory');
const VideoComment = require('../models/VideoComment');
const VideoShare = require('../models/VideoShare');
const UserFavorite = require('../models/UserFavorite');
const UserBookmark = require('../models/UserBookmark');
const UserStats = require('../models/UserStats');
const { getPackageFilter } = require('../config/packages');

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
    
    // Build query with package ID filter
    const packageFilter = getPackageFilter(req.packageId);
    const query = {
      ...packageFilter,
      isActive: true
    };

    if (search) {
      query.$text = { $search: search };
    }

    if (topic) {
      query.topic = topic;
    }

    if (category) {
      // Find topics in the category first with package filter
      const topics = await Topic.find({
        ...packageFilter,
        category,
        isActive: true
      }).select('_id');
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
    const { convertS3ToCloudFront, isCloudFrontConfigured } = require('../services/cloudfrontService');

    for (let video of videos) {
      const hasAccess = await video.hasAccess(req.user);
      video._doc.hasAccess = hasAccess;

      // Convert thumbnail to CloudFront URL if configured (public URLs for thumbnails)
      if (video.thumbnail && isCloudFrontConfigured()) {
        video._doc.thumbnail = convertS3ToCloudFront(video.thumbnail, 86400, false); // 24 hours, public
      }

      // Hide video URL if no access, otherwise convert to CloudFront
      if (!hasAccess) {
        video._doc.videoUrl = undefined;
      } else if (isCloudFrontConfigured()) {
        // Use signed URLs for premium content, public for free content
        const needsSignedUrl = video.isLocked && !video.isFree;
        video._doc.videoUrl = convertS3ToCloudFront(video.videoUrl, 14400, needsSignedUrl); // 4 hours for videos
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
    // Get video with package ID validation
    const packageFilter = getPackageFilter(req.packageId);
    const video = await Video.findOne({
      _id: req.params.id,
      ...packageFilter
    })
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

// @desc    Get video streaming URL
// @route   GET /api/videos/:id/stream
// @access  Private (requires access to video)
const getVideoStream = async (req, res) => {
  try {
    const { generateSignedUrl, generateQualityUrls, convertS3ToCloudFront, isCloudFrontConfigured } = require('../services/cloudfrontService');

    const video = await Video.findById(req.params.id)
      .populate('topic', 'title category isPremium')
      .populate({
        path: 'topic',
        populate: {
          path: 'category',
          select: 'name'
        }
      });

    if (!video || !video.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Check access
    const hasAccess = await video.hasAccess(req.user);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Subscription required to access this video'
      });
    }

    // Generate CloudFront URL for video streaming
    let streamUrl;
    let qualityUrls = {};

    if (isCloudFrontConfigured()) {
      // Determine if we need signed URLs (for premium content)
      const needsSignedUrl = video.isLocked && !video.isFree;

      // Convert S3 URL to CloudFront URL (signed for premium, public for free)
      streamUrl = convertS3ToCloudFront(video.videoUrl, 14400, needsSignedUrl);

      // Extract S3 key from video URL for quality variants
      try {
        const url = new URL(video.videoUrl);
        const s3Key = url.pathname.substring(1); // Remove leading slash

        // Generate quality-specific URLs (if they exist)
        qualityUrls = generateQualityUrls(s3Key, ['1080p', '720p', '480p', '360p'], 14400);
      } catch (error) {
        console.error('Error generating quality URLs:', error);
      }
    } else {
      // Fallback to direct S3 URL
      streamUrl = video.videoUrl;
      console.warn('CloudFront not configured, using direct S3 URL');
    }

    // Get available qualities
    const qualities = Object.keys(qualityUrls).length > 0 ? Object.keys(qualityUrls) : ['720p', '480p', '360p'];

    // Generate CloudFront URL for thumbnail if available
    let thumbnailUrl = video.thumbnail;
    if (video.thumbnail && isCloudFrontConfigured()) {
      // Thumbnails can be public (no need for signed URLs)
      thumbnailUrl = convertS3ToCloudFront(video.thumbnail, 86400, false); // 24 hours, public
    }

    res.status(200).json({
      success: true,
      data: {
        streamUrl,
        qualityUrls: Object.keys(qualityUrls).length > 0 ? qualityUrls : { [video.quality || '720p']: streamUrl },
        qualities,
        duration: video.duration,
        subtitles: video.subtitles || [],
        thumbnail: thumbnailUrl,
        title: video.title,
        metadata: {
          isCloudFrontEnabled: isCloudFrontConfigured(),
          quality: video.quality,
          fileSize: video.fileSize,
          encoding: video.metadata?.encoding,
          resolution: video.metadata?.resolution
        }
      }
    });
  } catch (error) {
    console.error('Get video stream error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get popular videos
// @route   GET /api/videos/popular
// @access  Public
const getPopularVideos = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const videos = await Video.find({ isActive: true })
      .sort({ views: -1, likes: -1 })
      .limit(parseInt(limit))
      .populate('topic', 'title category')
      .populate({
        path: 'topic',
        populate: {
          path: 'category',
          select: 'name'
        }
      })
      .select('-__v');

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
      data: videos
    });
  } catch (error) {
    console.error('Get popular videos error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Record video progress
// @route   POST /api/videos/:id/progress
// @access  Private
const recordProgress = async (req, res) => {
  try {
    const { progress, duration, completed = false, deviceType = 'mobile' } = req.body;

    if (!progress || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Progress and duration are required'
      });
    }

    // Get video with package ID validation
    const packageFilter = getPackageFilter(req.packageId);
    const video = await Video.findOne({ _id: req.params.id, ...packageFilter });
    if (!video || !video.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Check access
    const hasAccess = await video.hasAccess(req.user);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update or create progress record with package ID
    const progressRecord = await UserProgress.findOneAndUpdate(
      { ...packageFilter, user: req.user.id, video: req.params.id },
      {
        packageId: req.packageId,
        progress: Math.max(progress, 0),
        duration,
        completed,
        topic: video.topic,
        lastWatchedAt: new Date(),
        deviceType,
        $inc: { watchCount: 1 }
      },
      { upsert: true, new: true }
    );

    // Add to watch history with package ID
    await WatchHistory.addWatchHistory(
      req.user.id,
      req.params.id,
      progress,
      completed,
      deviceType,
      Math.min(progress, duration), // session duration
      req.packageId
    );

    res.status(200).json({
      success: true,
      data: progressRecord
    });
  } catch (error) {
    console.error('Record progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get related videos
// @route   GET /api/videos/:id/related
// @access  Public
const getRelatedVideos = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const video = await Video.findById(req.params.id).populate('topic');
    if (!video || !video.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Get videos from the same topic (excluding current video)
    const relatedVideos = await Video.find({
      topic: video.topic._id,
      _id: { $ne: video._id },
      isActive: true
    })
    .sort({ episodeNumber: 1 })
    .limit(parseInt(limit))
    .populate('topic', 'title category')
    .select('-__v');

    // If not enough videos from same topic, get from same category
    if (relatedVideos.length < limit) {
      const remainingLimit = limit - relatedVideos.length;
      const categoryVideos = await Video.find({
        topic: { $ne: video.topic._id },
        _id: { $ne: video._id },
        isActive: true
      })
      .populate({
        path: 'topic',
        match: { category: video.topic.category },
        select: 'title category'
      })
      .sort({ views: -1 })
      .limit(remainingLimit)
      .select('-__v');

      relatedVideos.push(...categoryVideos.filter(v => v.topic));
    }

    // Add access information
    for (let relatedVideo of relatedVideos) {
      const hasAccess = await relatedVideo.hasAccess(req.user);
      relatedVideo._doc.hasAccess = hasAccess;

      if (!hasAccess) {
        relatedVideo._doc.videoUrl = undefined;
      }
    }

    res.status(200).json({
      success: true,
      count: relatedVideos.length,
      data: relatedVideos
    });
  } catch (error) {
    console.error('Get related videos error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get new videos
// @route   GET /api/videos/new
// @access  Public
const getNewVideos = async (req, res) => {
  try {
    const { since, limit = 20 } = req.query;

    const query = { isActive: true };

    if (since) {
      query.createdAt = { $gte: new Date(since) };
    } else {
      // Default to videos from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query.createdAt = { $gte: thirtyDaysAgo };
    }

    const videos = await Video.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('topic', 'title category')
      .populate({
        path: 'topic',
        populate: {
          path: 'category',
          select: 'name'
        }
      })
      .select('-__v');

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
      data: videos
    });
  } catch (error) {
    console.error('Get new videos error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ===== NEW SOCIAL FEATURES =====

// @desc    Share a video and generate shareable link
// @route   POST /api/videos/:id/share
// @access  Private
const shareVideo = async (req, res) => {
  try {
    const { platform = 'other', message = null } = req.body;

    // Get video with package ID validation
    const packageFilter = getPackageFilter(req.packageId);
    const video = await Video.findOne({ _id: req.params.id, ...packageFilter });
    if (!video || !video.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Check access
    const hasAccess = await video.hasAccess(req.user);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Create share record
    const VideoShare = require('../models/VideoShare');
    const share = await VideoShare.createShare(
      req.params.id,
      req.user.id,
      req.packageId,
      { platform, message }
    );

    // Update user stats
    const UserStats = require('../models/UserStats');
    await UserStats.updateUserStats(req.user.id, req.packageId, 'share_created', {
      contentId: req.params.id,
      contentType: 'video',
      contentTitle: video.title,
      metadata: { platform }
    });

    res.status(200).json({
      success: true,
      data: {
        shareUrl: share.shareUrl,
        shareId: share.shareId,
        expiresAt: share.expiresAt
      }
    });

  } catch (error) {
    console.error('Share video error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get comments for a video
// @route   GET /api/videos/:id/comments
// @access  Public
const getVideoComments = async (req, res) => {
  try {
    const { page = 1, limit = 20, sortBy = 'newest' } = req.query;

    // Get video with package ID validation
    const packageFilter = getPackageFilter(req.packageId);
    const video = await Video.findOne({ _id: req.params.id, ...packageFilter });
    if (!video || !video.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Get comments
    const VideoComment = require('../models/VideoComment');
    const result = await VideoComment.getVideoComments(
      req.params.id,
      req.packageId,
      { page, limit, sortBy }
    );

    // Add isLiked status for authenticated users
    if (req.user) {
      result.comments.forEach(comment => {
        comment._doc.isLiked = comment.likedBy.includes(req.user.id);
      });
    }

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get video comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Add a comment to a video
// @route   POST /api/videos/:id/comments
// @access  Private
const addVideoComment = async (req, res) => {
  try {
    const { content, parentCommentId = null } = req.body;

    // Get video with package ID validation
    const packageFilter = getPackageFilter(req.packageId);
    const video = await Video.findOne({ _id: req.params.id, ...packageFilter });
    if (!video || !video.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Check access
    const hasAccess = await video.hasAccess(req.user);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Add comment
    const VideoComment = require('../models/VideoComment');
    const comment = await VideoComment.addComment(
      req.params.id,
      req.user.id,
      content,
      req.packageId,
      parentCommentId
    );

    // Update user stats
    const UserStats = require('../models/UserStats');
    await UserStats.updateUserStats(req.user.id, req.packageId, 'comment_posted', {
      contentId: req.params.id,
      contentType: 'video',
      contentTitle: video.title
    });

    res.status(201).json({
      success: true,
      data: comment
    });

  } catch (error) {
    console.error('Add video comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Toggle video favorite status
// @route   POST /api/videos/:id/favorite
// @access  Private
const toggleVideoFavorite = async (req, res) => {
  try {
    // Get video with package ID validation
    const packageFilter = getPackageFilter(req.packageId);
    const video = await Video.findOne({ _id: req.params.id, ...packageFilter });
    if (!video || !video.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Check access
    const hasAccess = await video.hasAccess(req.user);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const UserFavorite = require('../models/UserFavorite');

    // Check if already favorited
    const existingFavorite = await UserFavorite.findOne({
      packageId: req.packageId,
      user: req.user.id,
      video: req.params.id
    });

    let isFavorite = false;
    let message = '';

    if (existingFavorite) {
      // Remove from favorites
      await existingFavorite.remove();
      message = 'Video removed from favorites';
      isFavorite = false;
    } else {
      // Add to favorites
      await UserFavorite.create({
        packageId: req.packageId,
        user: req.user.id,
        video: req.params.id
      });
      message = 'Video added to favorites';
      isFavorite = true;

      // Update user stats
      const UserStats = require('../models/UserStats');
      await UserStats.updateUserStats(req.user.id, req.packageId, 'favorite_added', {
        contentId: req.params.id,
        contentType: 'video',
        contentTitle: video.title
      });
    }

    // Get total favorites count for this video
    const totalFavorites = await UserFavorite.countDocuments({
      packageId: req.packageId,
      video: req.params.id
    });

    res.status(200).json({
      success: true,
      message,
      data: {
        isFavorite,
        totalFavorites
      }
    });

  } catch (error) {
    console.error('Toggle video favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Add video to bookmarks with optional timestamp
// @route   POST /api/videos/:id/bookmark
// @access  Private
const addVideoBookmark = async (req, res) => {
  try {
    const { note = null, timestamp = null } = req.body;

    // Get video with package ID validation
    const packageFilter = getPackageFilter(req.packageId);
    const video = await Video.findOne({ _id: req.params.id, ...packageFilter });
    if (!video || !video.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Check access
    const hasAccess = await video.hasAccess(req.user);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const UserBookmark = require('../models/UserBookmark');

    // Check if already bookmarked
    const existingBookmark = await UserBookmark.findOne({
      packageId: req.packageId,
      user: req.user.id,
      video: req.params.id
    });

    if (existingBookmark) {
      // Update existing bookmark
      existingBookmark.note = note;
      if (timestamp !== null) {
        existingBookmark.timestamp = timestamp;
      }
      await existingBookmark.save();

      return res.status(200).json({
        success: true,
        message: 'Bookmark updated',
        data: existingBookmark
      });
    }

    // Create new bookmark
    const bookmarkData = {
      packageId: req.packageId,
      user: req.user.id,
      video: req.params.id,
      note
    };

    if (timestamp !== null) {
      bookmarkData.timestamp = timestamp;
    }

    const bookmark = await UserBookmark.create(bookmarkData);

    // Update user stats
    const UserStats = require('../models/UserStats');
    await UserStats.updateUserStats(req.user.id, req.packageId, 'bookmark_added', {
      contentId: req.params.id,
      contentType: 'video',
      contentTitle: video.title
    });

    res.status(201).json({
      success: true,
      message: 'Video bookmarked successfully',
      data: bookmark
    });

  } catch (error) {
    console.error('Add video bookmark error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Remove video from bookmarks
// @route   DELETE /api/videos/:id/bookmark
// @access  Private
const removeVideoBookmark = async (req, res) => {
  try {
    const UserBookmark = require('../models/UserBookmark');

    const bookmark = await UserBookmark.findOne({
      packageId: req.packageId,
      user: req.user.id,
      video: req.params.id
    });

    if (!bookmark) {
      return res.status(404).json({
        success: false,
        message: 'Bookmark not found'
      });
    }

    await bookmark.remove();

    res.status(200).json({
      success: true,
      message: 'Bookmark removed successfully'
    });

  } catch (error) {
    console.error('Remove video bookmark error:', error);
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
};
