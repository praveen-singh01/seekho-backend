const MCQ = require('../models/MCQ');
const UserAnswer = require('../models/UserAnswer');
const { getPackageFilter, getPackageName } = require('../config/packages');

// @desc    Get all MCQs
// @route   GET /api/mcqs
// @access  Public
const getMCQs = async (req, res) => {
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
        sortObj = { 'metadata.totalAttempts': -1 };
        break;
      default:
        sortObj = { order: 1, title: 1 };
    }

    const mcqs = await MCQ.find(query)
      .sort(sortObj)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('topic', 'title slug')
      .select('-questions.options.isCorrect -__v'); // Hide correct answers

    const total = await MCQ.countDocuments(query);

    // Add access information if user is authenticated
    if (req.user) {
      mcqs.forEach(mcq => {
        mcq._doc.hasAccess = mcq.hasAccess(req.user);
      });
    }

    res.status(200).json({
      success: true,
      count: mcqs.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      },
      data: mcqs
    });
  } catch (error) {
    console.error('Get MCQs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single MCQ
// @route   GET /api/mcqs/:id
// @access  Public
const getMCQ = async (req, res) => {
  try {
    // Get MCQ with package ID validation
    const packageFilter = getPackageFilter(req.packageId);
    const mcq = await MCQ.findOne({
      _id: req.params.id,
      ...packageFilter
    })
      .populate('topic', 'title slug')
      .populate('createdBy', 'name');

    if (!mcq || !mcq.isActive) {
      return res.status(404).json({
        success: false,
        message: 'MCQ not found'
      });
    }

    // Add access information
    const hasAccess = req.user ? mcq.hasAccess(req.user) : false;
    mcq._doc.hasAccess = hasAccess;

    // Hide correct answers from questions (for security)
    if (mcq.questions) {
      mcq.questions.forEach(question => {
        question.options.forEach(option => {
          option._doc.isCorrect = undefined;
        });
      });
    }

    // Get user's previous attempts if authenticated
    if (req.user) {
      const userAttempts = await UserAnswer.find({
        user: req.user._id,
        contentId: mcq._id,
        contentType: 'mcq',
        packageId: req.packageId
      }).sort({ createdAt: -1 }).limit(5);

      mcq._doc.userAttempts = userAttempts;
    }

    res.status(200).json({
      success: true,
      data: mcq
    });
  } catch (error) {
    console.error('Get MCQ error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Submit MCQ answers
// @route   POST /api/mcqs/:id/submit
// @access  Private
const submitAnswers = async (req, res) => {
  try {
    const { answers } = req.body;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: 'Answers array is required'
      });
    }

    // Get MCQ with package ID validation
    const packageFilter = getPackageFilter(req.packageId);
    const mcq = await MCQ.findOne({
      _id: req.params.id,
      ...packageFilter,
      isActive: true
    });

    if (!mcq) {
      return res.status(404).json({
        success: false,
        message: 'MCQ not found'
      });
    }

    // Check access
    if (!mcq.hasAccess(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Premium subscription required.'
      });
    }

    // Create new attempt
    const userAnswer = new UserAnswer({
      packageId: req.packageId,
      user: req.user._id,
      contentType: 'mcq',
      contentId: mcq._id,
      contentModel: 'MCQ',
      totalQuestions: mcq.questions.length,
      answers: []
    });

    // Process answers and calculate score
    for (let answer of answers) {
      const { questionIndex, selectedOption, timeSpent } = answer;
      
      if (questionIndex < 0 || questionIndex >= mcq.questions.length) {
        return res.status(400).json({
          success: false,
          message: `Invalid question index: ${questionIndex}`
        });
      }

      if (selectedOption < 0 || selectedOption > 3) {
        return res.status(400).json({
          success: false,
          message: `Invalid option selected: ${selectedOption}`
        });
      }

      const question = mcq.questions[questionIndex];
      const isCorrect = question.options[selectedOption].isCorrect;

      await userAnswer.addAnswer(questionIndex, {
        selectedOption,
        isCorrect,
        timeSpent: timeSpent || 0
      });
    }

    // Mark as completed
    await userAnswer.markCompleted();

    // Update MCQ metadata
    await mcq.updateMetadata();

    // Prepare response with results
    const results = {
      submissionId: userAnswer._id,
      score: userAnswer.score,
      correctAnswers: userAnswer.correctAnswers,
      totalQuestions: userAnswer.totalQuestions,
      passed: userAnswer.score >= mcq.passingScore,
      completionTime: userAnswer.completionTime,
      feedback: []
    };

    // Add detailed feedback for each question
    for (let i = 0; i < mcq.questions.length; i++) {
      const question = mcq.questions[i];
      const userAnswerItem = userAnswer.answers.find(a => a.questionIndex === i);
      
      if (userAnswerItem) {
        results.feedback.push({
          questionIndex: i,
          questionText: question.questionText,
          selectedOption: userAnswerItem.selectedOption,
          correctOption: question.options.findIndex(opt => opt.isCorrect),
          isCorrect: userAnswerItem.isCorrect,
          explanation: question.explanation || null
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'MCQ completed successfully',
      data: results
    });
  } catch (error) {
    console.error('Submit MCQ answers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get MCQs by topic
// @route   GET /api/topics/:topicId/mcqs
// @access  Public
const getMCQsByTopic = async (req, res) => {
  try {
    const { topicId } = req.params;
    const { limit = 10 } = req.query;

    // Build query with package ID filter
    const packageFilter = getPackageFilter(req.packageId);
    const mcqs = await MCQ.find({
      ...packageFilter,
      topic: topicId,
      isActive: true
    })
      .sort({ order: 1, title: 1 })
      .limit(parseInt(limit))
      .select('title slug description difficulty estimatedTime passingScore metadata isPremium order');

    // Add access information if user is authenticated
    if (req.user) {
      mcqs.forEach(mcq => {
        mcq._doc.hasAccess = mcq.hasAccess(req.user);
      });
    }

    res.status(200).json({
      success: true,
      count: mcqs.length,
      data: mcqs
    });
  } catch (error) {
    console.error('Get MCQs by topic error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getMCQs,
  getMCQ,
  submitAnswers,
  getMCQsByTopic
};
