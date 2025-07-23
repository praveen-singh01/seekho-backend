const express = require('express');
const { updateOnboarding } = require('../controllers/onboardingController');
const { protect } = require('../middleware/auth');
const { validateOnboarding } = require('../middleware/validation');

const router = express.Router();

// @route   PUT /api/onboarding
// @desc    Update user onboarding data
// @access  Private
router.put('/', protect, validateOnboarding, updateOnboarding);

module.exports = router;
