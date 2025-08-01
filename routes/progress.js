const express = require('express');
const {
  recordProgress,
  getBulkProgress,
  getUserProgress,
  getModuleProgress
} = require('../controllers/progressController');
const { protect } = require('../middleware/auth');
const { validateObjectId, validateProgressData } = require('../middleware/validation');

const router = express.Router();

// @route   POST /api/progress/record
// @desc    Record detailed content progress with metadata
// @access  Private
router.post('/record', protect, validateProgressData, recordProgress);

// @route   GET /api/progress/bulk
// @desc    Retrieve progress for multiple content items
// @access  Private
router.get('/bulk', protect, getBulkProgress);

// @route   GET /api/progress/user
// @desc    Get user's overall progress summary
// @access  Private
router.get('/user', protect, getUserProgress);

// @route   GET /api/progress/module/:moduleId
// @desc    Get progress for a specific module
// @access  Private
router.get('/module/:moduleId', protect, validateObjectId(), getModuleProgress);

module.exports = router;
