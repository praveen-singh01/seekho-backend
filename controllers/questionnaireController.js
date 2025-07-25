const Questionnaire = require('../models/Questionnaire');
const UserAnswer = require('../models/UserAnswer');
const { getPackageFilter, getPackageName } = require('../config/packages');

// @desc    Get all questionnaires
// @route   GET /api/questionnaires
// @access  Public
const getQuestionnaires = async (req, res) => {
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
        sortObj = { 'metadata.totalResponses': -1 };
        break;
      default:
        sortObj = { order: 1, title: 1 };
    }

    const questionnaires = await Questionnaire.find(query)
      .sort(sortObj)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('topic', 'title slug')
      .select('-__v');

    const total = await Questionnaire.countDocuments(query);

    // Add access information if user is authenticated
    if (req.user) {
      questionnaires.forEach(questionnaire => {
        questionnaire._doc.hasAccess = questionnaire.hasAccess(req.user);
      });
    }

    res.status(200).json({
      success: true,
      count: questionnaires.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      },
      data: questionnaires
    });
  } catch (error) {
    console.error('Get questionnaires error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single questionnaire
// @route   GET /api/questionnaires/:id
// @access  Public
const getQuestionnaire = async (req, res) => {
  try {
    // Get questionnaire with package ID validation
    const packageFilter = getPackageFilter(req.packageId);
    const questionnaire = await Questionnaire.findOne({
      _id: req.params.id,
      ...packageFilter
    })
      .populate('topic', 'title slug')
      .populate('createdBy', 'name');

    if (!questionnaire || !questionnaire.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Questionnaire not found'
      });
    }

    // Add access information
    const hasAccess = req.user ? questionnaire.hasAccess(req.user) : false;
    questionnaire._doc.hasAccess = hasAccess;

    // Get user's previous answers if authenticated
    if (req.user) {
      const userAnswer = await UserAnswer.findOne({
        user: req.user._id,
        contentId: questionnaire._id,
        contentType: 'questionnaire',
        packageId: req.packageId
      }).sort({ createdAt: -1 });

      questionnaire._doc.userProgress = userAnswer;
    }

    res.status(200).json({
      success: true,
      data: questionnaire
    });
  } catch (error) {
    console.error('Get questionnaire error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Submit questionnaire answers
// @route   POST /api/questionnaires/:id/submit
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

    // Get questionnaire with package ID validation
    const packageFilter = getPackageFilter(req.packageId);
    const questionnaire = await Questionnaire.findOne({
      _id: req.params.id,
      ...packageFilter,
      isActive: true
    });

    if (!questionnaire) {
      return res.status(404).json({
        success: false,
        message: 'Questionnaire not found'
      });
    }

    // Check access
    if (!questionnaire.hasAccess(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Premium subscription required.'
      });
    }

    // Find existing attempt or create new one
    let userAnswer = await UserAnswer.findOne({
      user: req.user._id,
      contentId: questionnaire._id,
      contentType: 'questionnaire',
      packageId: req.packageId,
      isCompleted: false
    });

    if (!userAnswer) {
      userAnswer = new UserAnswer({
        packageId: req.packageId,
        user: req.user._id,
        contentType: 'questionnaire',
        contentId: questionnaire._id,
        contentModel: 'Questionnaire',
        totalQuestions: questionnaire.questions.length,
        answers: []
      });
    }

    // Process answers and calculate score if expected answers are provided
    let totalPoints = 0;
    let earnedPoints = 0;

    for (let answer of answers) {
      const { questionIndex, textAnswer, timeSpent } = answer;

      if (questionIndex < 0 || questionIndex >= questionnaire.questions.length) {
        return res.status(400).json({
          success: false,
          message: `Invalid question index: ${questionIndex}`
        });
      }

      const question = questionnaire.questions[questionIndex];
      totalPoints += question.points || 1;

      // Check if answer is correct (if expected answers are provided)
      let isCorrect = null;
      if (question.expectedAnswers && question.expectedAnswers.length > 0) {
        const userAnswerNormalized = (textAnswer || '').toLowerCase().trim().replace(/[^\w\s]/g, '');
        isCorrect = question.expectedAnswers.some(expected => {
          const expectedNormalized = expected.toLowerCase().trim().replace(/[^\w\s]/g, '');
          return expectedNormalized === userAnswerNormalized;
        });

        if (isCorrect) {
          earnedPoints += question.points || 1;
        }

        console.log(`🔍 Question ${questionIndex + 1}:`);
        console.log(`   User answer: "${textAnswer}"`);
        console.log(`   Normalized: "${userAnswerNormalized}"`);
        console.log(`   Expected: ${question.expectedAnswers}`);
        console.log(`   Is correct: ${isCorrect}`);
      }

      await userAnswer.addAnswer(questionIndex, {
        textAnswer: textAnswer || '',
        isCorrect: isCorrect,
        timeSpent: timeSpent || 0
      });
    }

    // Calculate score if we have expected answers
    if (totalPoints > 0) {
      const score = Math.round((earnedPoints / totalPoints) * 100);
      userAnswer.score = score;
      userAnswer.correctAnswers = earnedPoints;
    }

    // Mark as completed
    await userAnswer.markCompleted();

    // Update questionnaire metadata
    await questionnaire.updateMetadata();

    // Calculate results for questionnaires
    const hasAutoScoring = questionnaire.questions.some(q => q.expectedAnswers && q.expectedAnswers.length > 0);
    const results = {
      submissionId: userAnswer._id,
      completedAt: userAnswer.completedAt,
      completionTime: userAnswer.completionTime,
      totalQuestions: questionnaire.questions.length,
      answeredQuestions: userAnswer.answers.length,
      correctAnswers: userAnswer.correctAnswers || 0,
      score: userAnswer.score || null,
      passed: userAnswer.score ? userAnswer.score >= questionnaire.passingScore : null,
      feedback: hasAutoScoring
        ? `You scored ${userAnswer.score || 0}% (${userAnswer.correctAnswers || 0}/${questionnaire.questions.length} correct)`
        : 'Your answers have been submitted for review. Results will be available after evaluation.'
    };

    res.status(200).json({
      success: true,
      message: 'Answers submitted successfully',
      data: results
    });
  } catch (error) {
    console.error('Submit questionnaire answers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get questionnaire results
// @route   GET /api/questionnaires/:id/results
// @access  Private
const getQuestionnaireResults = async (req, res) => {
  try {
    // Get questionnaire with package ID validation
    const packageFilter = getPackageFilter(req.packageId);
    const questionnaire = await Questionnaire.findOne({
      _id: req.params.id,
      ...packageFilter,
      isActive: true
    });

    if (!questionnaire) {
      return res.status(404).json({
        success: false,
        message: 'Questionnaire not found'
      });
    }

    // Get user's latest attempt
    const userAnswer = await UserAnswer.findOne({
      user: req.user._id,
      contentId: questionnaire._id,
      contentType: 'questionnaire',
      packageId: req.packageId,
      isCompleted: true
    }).sort({ completedAt: -1 });

    if (!userAnswer) {
      return res.status(404).json({
        success: false,
        message: 'No completed attempt found'
      });
    }

    // Build results
    const results = {
      submissionId: userAnswer._id,
      completedAt: userAnswer.completedAt,
      completionTime: userAnswer.completionTime,
      totalQuestions: questionnaire.questions.length,
      answeredQuestions: userAnswer.answers.length,
      score: null, // Questionnaires don't have automatic scoring
      passed: null, // Will be determined by manual review
      feedback: 'Your answers have been submitted for review. Results will be available after evaluation.',
      answers: userAnswer.answers.map(answer => ({
        questionIndex: answer.questionIndex,
        questionText: questionnaire.questions[answer.questionIndex]?.questionText,
        textAnswer: answer.textAnswer,
        timeSpent: answer.timeSpent
      }))
    };

    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Get questionnaire results error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get questionnaire by topic
// @route   GET /api/topics/:topicId/questionnaires
// @access  Public
const getQuestionnairesByTopic = async (req, res) => {
  try {
    const { topicId } = req.params;
    const { limit = 10 } = req.query;

    // Build query with package ID filter
    const packageFilter = getPackageFilter(req.packageId);
    const questionnaires = await Questionnaire.find({
      ...packageFilter,
      topic: topicId,
      isActive: true
    })
      .sort({ order: 1, title: 1 })
      .limit(parseInt(limit))
      .select('title slug description difficulty estimatedTime metadata isPremium order');

    // Add access information if user is authenticated
    if (req.user) {
      questionnaires.forEach(questionnaire => {
        questionnaire._doc.hasAccess = questionnaire.hasAccess(req.user);
      });
    }

    res.status(200).json({
      success: true,
      count: questionnaires.length,
      data: questionnaires
    });
  } catch (error) {
    console.error('Get questionnaires by topic error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getQuestionnaires,
  getQuestionnaire,
  submitAnswers,
  getQuestionnaireResults,
  getQuestionnairesByTopic
};
