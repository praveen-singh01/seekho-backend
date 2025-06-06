const express = require('express');
const {
  getCategories,
  getCategory,
  getCategoryTopics,
  getCategoryStats,
  getCategoryComplete,
  getCategoryUpdates
} = require('../controllers/categoryController');
const { optionalAuth } = require('../middleware/auth');
const { validateObjectId, validatePagination } = require('../middleware/validation');

const router = express.Router();

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [order, name, newest, popular]
 *           default: order
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Category'
 */
router.get('/', validatePagination, optionalAuth, getCategories);

// @route   GET /api/categories/:id/complete
// @desc    Get complete category data (topics, videos, stats)
// @access  Public
router.get('/:id/complete', validateObjectId(), optionalAuth, getCategoryComplete);

// @route   GET /api/categories/:id/updates
// @desc    Get category updates (new content)
// @access  Public
router.get('/:id/updates', validateObjectId(), getCategoryUpdates);

// @route   GET /api/categories/:id
// @desc    Get single category
// @access  Public
router.get('/:id', validateObjectId(), optionalAuth, getCategory);

// @route   GET /api/categories/:id/topics
// @desc    Get topics in a category
// @access  Public
router.get('/:id/topics', validateObjectId(), validatePagination, optionalAuth, getCategoryTopics);

// @route   GET /api/categories/:id/stats
// @desc    Get category statistics
// @access  Public
router.get('/:id/stats', validateObjectId(), getCategoryStats);

module.exports = router;
