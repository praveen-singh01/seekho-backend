const express = require('express');
const { getModulesByClass } = require('../controllers/modulesController');
const { optionalAuth } = require('../middleware/auth');
const { validateModuleQuery } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/modules?class=X
// @desc    Get modules by class number
// @access  Public (optional authentication)
router.get('/', validateModuleQuery, optionalAuth, getModulesByClass);

module.exports = router;
