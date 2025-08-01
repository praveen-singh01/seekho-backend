const UserProgress = require('../models/UserProgress');
const UserStats = require('../models/UserStats');
const Video = require('../models/Video');
const MCQ = require('../models/MCQ');
const Questionnaire = require('../models/Questionnaire');
const TextContent = require('../models/TextContent');
const LearningModule = require('../models/LearningModule');
const { getPackageFilter } = require('../utils/helpers');

// @desc    Record detailed content progress with metadata
// @route   POST /api/progress/record
// @access  Private
const recordProgress = async (req, res) => {
  try {
    const {
      contentId,
      contentType,
      progressPercentage = 0,
      timeSpent = 0,
      status = 'inProgress',
      metadata = {}
    } = req.body;

    // Validate required fields
    if (!contentId || !contentType) {
      return res.status(400).json({
        success: false,
        message: 'Content ID and content type are required'
      });
    }

    // Validate content type
    const validContentTypes = ['video', 'text', 'mcq', 'questionnaire'];
    if (!validContentTypes.includes(contentType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid content type'
      });
    }

    // Validate progress percentage
    if (progressPercentage < 0 || progressPercentage > 100) {
      return res.status(400).json({
        success: false,
        message: 'Progress percentage must be between 0 and 100'
      });
    }

    // Verify content exists and user has access
    const packageFilter = getPackageFilter(req.packageId);
    let content = null;
    let contentTitle = '';
    let duration = null;

    switch (contentType) {
      case 'video':
        content = await Video.findOne({ _id: contentId, ...packageFilter });
        if (content) {
          contentTitle = content.title;
          duration = content.duration;
          // Check access
          const hasAccess = await content.hasAccess(req.user);
          if (!hasAccess) {
            return res.status(403).json({
              success: false,
              message: 'Access denied to this content'
            });
          }
        }
        break;
      case 'text':
        content = await TextContent.findOne({ _id: contentId, ...packageFilter });
        if (content) contentTitle = content.title;
        break;
      case 'mcq':
        content = await MCQ.findOne({ _id: contentId, ...packageFilter });
        if (content) {
          contentTitle = content.title;
          duration = content.questions.length; // Number of questions
        }
        break;
      case 'questionnaire':
        content = await Questionnaire.findOne({ _id: contentId, ...packageFilter });
        if (content) {
          contentTitle = content.title;
          duration = content.questions.length; // Number of questions
        }
        break;
    }

    if (!content || !content.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Content not found or inactive'
      });
    }

    // Prepare progress data
    const progressData = {
      progressPercentage,
      timeSpent,
      status,
      metadata: {
        ...metadata,
        contentTitle,
        timestamp: new Date().toISOString()
      }
    };

    if (contentType === 'video') {
      progressData.progress = Math.round((progressPercentage / 100) * duration);
      progressData.duration = duration;
    }

    // Record progress
    const progressRecord = await UserProgress.recordProgress(
      req.user.id,
      contentId,
      contentType,
      progressData,
      req.packageId
    );

    // Update user stats
    let activityType = 'content_accessed';
    if (status === 'completed' || progressPercentage >= 90) {
      activityType = 'content_completed';
    } else if (contentType === 'video' && timeSpent > 0) {
      activityType = 'video_watched';
    }

    await UserStats.updateUserStats(req.user.id, req.packageId, activityType, {
      contentId,
      contentType,
      contentTitle,
      timeSpent,
      score: metadata.score,
      metadata
    });

    res.status(200).json({
      success: true,
      message: 'Progress recorded successfully',
      data: {
        progressId: progressRecord._id,
        updatedAt: progressRecord.updatedAt
      }
    });

  } catch (error) {
    console.error('Record progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error recording progress'
    });
  }
};

// @desc    Retrieve progress for multiple content items
// @route   GET /api/progress/bulk
// @access  Private
const getBulkProgress = async (req, res) => {
  try {
    const { contentIds, moduleId } = req.query;

    if (!contentIds) {
      return res.status(400).json({
        success: false,
        message: 'Content IDs are required'
      });
    }

    // Parse content IDs
    const contentIdArray = contentIds.split(',').map(id => id.trim()).filter(id => id);

    if (contentIdArray.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one valid content ID is required'
      });
    }

    // Get bulk progress
    const progressMap = await UserProgress.getBulkProgress(
      req.user.id,
      contentIdArray,
      req.packageId,
      moduleId
    );

    res.status(200).json({
      success: true,
      data: progressMap
    });

  } catch (error) {
    console.error('Get bulk progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving progress'
    });
  }
};

// @desc    Get user's overall progress summary
// @route   GET /api/progress/user
// @access  Private
const getUserProgress = async (req, res) => {
  try {
    // Get overall stats from UserProgress
    const stats = await UserProgress.getUserStats(req.user.id, req.packageId);

    // Get recent progress records
    const recentProgress = await UserProgress.find({
      packageId: req.packageId,
      user: req.user.id
    })
    .sort({ lastAccessedAt: -1 })
    .limit(10)
    .populate('contentId', 'title')
    .select('contentId contentType progressPercentage status lastAccessedAt timeSpent');

    res.status(200).json({
      success: true,
      data: {
        summary: stats,
        recentProgress
      }
    });

  } catch (error) {
    console.error('Get user progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving user progress'
    });
  }
};

// @desc    Get progress for a specific module
// @route   GET /api/progress/module/:moduleId
// @access  Private
const getModuleProgress = async (req, res) => {
  try {
    const { moduleId } = req.params;

    // Get module with package validation
    const packageFilter = getPackageFilter(req.packageId);
    const module = await LearningModule.findOne({ _id: moduleId, ...packageFilter });

    if (!module || !module.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    // Get progress for module content
    const contentIds = module.content.map(item => item.contentId);
    const progressMap = await UserProgress.getBulkProgress(
      req.user.id,
      contentIds,
      req.packageId,
      moduleId
    );

    // Calculate module completion
    const totalItems = module.content.length;
    let completedItems = 0;

    module.content.forEach(item => {
      const progress = progressMap[item.contentId.toString()];
      if (progress && progress.status === 'completed') {
        completedItems++;
      }
    });

    const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        moduleId,
        moduleName: module.title,
        totalItems,
        completedItems,
        completionPercentage,
        contentProgress: progressMap
      }
    });

  } catch (error) {
    console.error('Get module progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving module progress'
    });
  }
};

module.exports = {
  recordProgress,
  getBulkProgress,
  getUserProgress,
  getModuleProgress
};
