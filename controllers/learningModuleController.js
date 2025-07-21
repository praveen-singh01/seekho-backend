const LearningModule = require('../models/LearningModule');
const Video = require('../models/Video');
const Questionnaire = require('../models/Questionnaire');
const MCQ = require('../models/MCQ');
const TextContent = require('../models/TextContent');
const { getPackageFilter, getPackageName } = require('../config/packages');

// @desc    Get all learning modules
// @route   GET /api/learning-modules
// @access  Public
const getLearningModules = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      topic, 
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

    if (topic) {
      query.topic = topic;
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
      case 'difficulty':
        sortObj = { difficulty: 1, order: 1 };
        break;
      case 'popular':
        sortObj = { 'metadata.totalEnrollments': -1 };
        break;
      default:
        sortObj = { order: 1, title: 1 };
    }

    const modules = await LearningModule.find(query)
      .sort(sortObj)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('topic', 'title slug')
      .select('-__v');

    const total = await LearningModule.countDocuments(query);

    // Add access information if user is authenticated
    if (req.user) {
      for (let module of modules) {
        module._doc.hasAccess = module.hasAccess(req.user);
        
        // Get user progress for this module
        const progress = await module.getUserProgress(req.user._id);
        module._doc.userProgress = progress;
      }
    }

    res.status(200).json({
      success: true,
      count: modules.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      },
      data: modules
    });
  } catch (error) {
    console.error('Get learning modules error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single learning module with populated content
// @route   GET /api/learning-modules/:id
// @access  Public
const getLearningModule = async (req, res) => {
  try {
    // Get module with package ID validation
    const packageFilter = getPackageFilter(req.packageId);
    const module = await LearningModule.findOne({
      _id: req.params.id,
      ...packageFilter
    })
      .populate('topic', 'title slug')
      .populate('prerequisites', 'title slug')
      .populate('createdBy', 'name');

    if (!module || !module.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Learning module not found'
      });
    }

    // Add access information
    const hasAccess = req.user ? module.hasAccess(req.user) : false;
    module._doc.hasAccess = hasAccess;

    // Populate content items manually - Teachers can add ANY type of content
    const populatedContent = [];
    for (let contentItem of module.content) {
      let contentData = null;

      try {
        switch (contentItem.contentType) {
          case 'video':
            contentData = await Video.findOne({
              _id: contentItem.contentId,
              ...packageFilter,
              isActive: true
            }).select('title slug duration thumbnail isLocked isFree');
            break;
          case 'questionnaire':
            contentData = await Questionnaire.findOne({
              _id: contentItem.contentId,
              ...packageFilter,
              isActive: true
            }).select('title slug estimatedTime isPremium metadata');
            break;
          case 'mcq':
            contentData = await MCQ.findOne({
              _id: contentItem.contentId,
              ...packageFilter,
              isActive: true
            }).select('title slug estimatedTime passingScore isPremium metadata');
            break;
          case 'text':
          case 'summary':
          case 'reading':
          case 'instructions':
          case 'notes':
          case 'explanation':
            contentData = await TextContent.findOne({
              _id: contentItem.contentId,
              ...packageFilter,
              isActive: true
            }).select('title slug contentType estimatedReadingTime isPremium metadata contentPreview wordCount');
            break;
        }

        if (contentData) {
          populatedContent.push({
            ...contentItem.toObject(),
            contentData
          });
        }
      } catch (err) {
        console.error(`Error populating content ${contentItem.contentId}:`, err);
      }
    }
    
    module._doc.populatedContent = populatedContent;

    // Get user progress if authenticated
    if (req.user) {
      const progress = await module.getUserProgress(req.user._id);
      module._doc.userProgress = progress;
    }

    res.status(200).json({
      success: true,
      data: module
    });
  } catch (error) {
    console.error('Get learning module error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get learning modules by topic
// @route   GET /api/topics/:topicId/learning-modules
// @access  Public
const getLearningModulesByTopic = async (req, res) => {
  try {
    const { topicId } = req.params;
    const { limit = 10 } = req.query;

    // Build query with package ID filter
    const packageFilter = getPackageFilter(req.packageId);
    const modules = await LearningModule.find({
      ...packageFilter,
      topic: topicId,
      isActive: true
    })
      .sort({ order: 1, title: 1 })
      .limit(parseInt(limit))
      .select('title slug description difficulty estimatedDuration metadata isPremium order thumbnail');

    // Add access information if user is authenticated
    if (req.user) {
      for (let module of modules) {
        module._doc.hasAccess = module.hasAccess(req.user);
        
        // Get user progress for this module
        const progress = await module.getUserProgress(req.user._id);
        module._doc.userProgress = progress;
      }
    }

    res.status(200).json({
      success: true,
      count: modules.length,
      data: modules
    });
  } catch (error) {
    console.error('Get learning modules by topic error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getLearningModules,
  getLearningModule,
  getLearningModulesByTopic
};
