const TextContent = require('../models/TextContent');
const { getPackageFilter, getPackageName } = require('../config/packages');

// @desc    Get all text content
// @route   GET /api/text-content
// @access  Public
const getTextContent = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      topic, 
      difficulty,
      contentType,
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

    if (topic) {
      query.topic = topic;
    }

    if (difficulty) {
      query.difficulty = difficulty;
    }

    if (contentType) {
      query.contentType = contentType;
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
      case 'difficulty':
        sortObj = { difficulty: 1, order: 1 };
        break;
      case 'popular':
        sortObj = { 'metadata.totalViews': -1 };
        break;
      case 'reading-time':
        sortObj = { estimatedReadingTime: 1 };
        break;
      default:
        sortObj = { order: 1, title: 1 };
    }

    const textContent = await TextContent.find(query)
      .sort(sortObj)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('topic', 'title slug')
      .select('-__v');

    const total = await TextContent.countDocuments(query);

    // Add access information if user is authenticated
    if (req.user) {
      textContent.forEach(content => {
        content._doc.hasAccess = content.hasAccess(req.user);
      });
    }

    res.status(200).json({
      success: true,
      count: textContent.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      },
      data: textContent
    });
  } catch (error) {
    console.error('Get text content error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single text content
// @route   GET /api/text-content/:id
// @access  Public
const getSingleTextContent = async (req, res) => {
  try {
    // Get text content with package ID validation
    const packageFilter = getPackageFilter(req.packageId);
    const textContent = await TextContent.findOne({
      _id: req.params.id,
      ...packageFilter
    })
      .populate('topic', 'title slug')
      .populate('createdBy', 'name');

    if (!textContent || !textContent.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    // Add access information
    const hasAccess = textContent.hasAccess(req.user);
    textContent._doc.hasAccess = hasAccess;

    // Increment view count if user has access
    if (hasAccess || !textContent.isPremium) {
      textContent.metadata.totalViews += 1;
      await textContent.save();
    }

    res.status(200).json({
      success: true,
      data: textContent
    });
  } catch (error) {
    console.error('Get single text content error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get text content by topic
// @route   GET /api/topics/:topicId/text-content
// @access  Public
const getTextContentByTopic = async (req, res) => {
  try {
    const { topicId } = req.params;
    const { limit = 10, contentType } = req.query;

    // Build query with package ID filter
    const packageFilter = getPackageFilter(req.packageId);
    const query = {
      ...packageFilter,
      topic: topicId,
      isActive: true
    };

    if (contentType) {
      query.contentType = contentType;
    }

    const textContent = await TextContent.find(query)
      .sort({ order: 1, title: 1 })
      .limit(parseInt(limit))
      .select('title slug description contentType estimatedReadingTime difficulty metadata isPremium order contentPreview');

    // Add access information if user is authenticated
    if (req.user) {
      textContent.forEach(content => {
        content._doc.hasAccess = content.hasAccess(req.user);
      });
    }

    res.status(200).json({
      success: true,
      count: textContent.length,
      data: textContent
    });
  } catch (error) {
    console.error('Get text content by topic error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get content types available
// @route   GET /api/text-content/types
// @access  Public
const getContentTypes = async (req, res) => {
  try {
    const contentTypes = [
      { value: 'summary', label: 'Summary', description: 'Brief overview or summary of a topic' },
      { value: 'reading', label: 'Reading Material', description: 'Detailed reading content' },
      { value: 'instructions', label: 'Instructions', description: 'Step-by-step instructions' },
      { value: 'notes', label: 'Notes', description: 'Study notes and key points' },
      { value: 'explanation', label: 'Explanation', description: 'Detailed explanation of concepts' },
      { value: 'other', label: 'Other', description: 'Other types of text content' }
    ];

    res.status(200).json({
      success: true,
      data: contentTypes
    });
  } catch (error) {
    console.error('Get content types error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getTextContent,
  getSingleTextContent,
  getTextContentByTopic,
  getContentTypes
};
