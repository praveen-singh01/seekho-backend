const express = require('express');
const {
  getDashboard,
  getUsers,
  getCategories,
  createCategory,
  updateCategory,
  reorderCategories,
  getCategoryAnalytics,
  createTopic,
  updateTopic,
  createVideo,
  updateVideo,
  getUserAnalytics,
  getContentAnalytics,
  getEngagementAnalytics,
  sendNotification,
  getNotifications,
  getNotificationAnalytics,
  getCloudFrontStatus,
  testCloudFrontUrl,
  invalidateCloudFrontCache,
  convertVideosToCloudFront,
  getSubscriptionStats,
  runSubscriptionMaintenance,
  getAllSubscriptions,
  getSubscriptionAnalytics
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');
const { 
  validateCategory, 
  validateTopic, 
  validateVideo, 
  validateObjectId,
  validatePagination 
} = require('../middleware/validation');

const router = express.Router();

// Apply admin authorization to all routes
router.use(protect);
router.use(authorize('admin'));

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard stats
// @access  Private/Admin
router.get('/dashboard', getDashboard);

// @route   GET /api/admin/users
// @desc    Get all users with pagination
// @access  Private/Admin
router.get('/users', validatePagination, getUsers);

// Category management routes

/**
 * @swagger
 * /api/admin/categories:
 *   get:
 *     summary: Get all categories (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *   post:
 *     summary: Create new category
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Gaming
 *               description:
 *                 type: string
 *                 example: Learn gaming strategies and techniques
 *               color:
 *                 type: string
 *                 example: "#FF6B6B"
 *               thumbnail:
 *                 type: string
 *                 example: https://s3.amazonaws.com/bucket/gaming.jpg
 *               icon:
 *                 type: string
 *                 example: fas fa-gamepad
 *               order:
 *                 type: number
 *                 example: 1
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Validation error or category already exists
 */
router.get('/categories', validatePagination, getCategories);
router.post('/categories', validateCategory, createCategory);

router.put('/categories/:id', validateObjectId(), validateCategory, updateCategory);

/**
 * @swagger
 * /api/admin/categories/reorder:
 *   put:
 *     summary: Reorder categories
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categoryOrders:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     order:
 *                       type: number
 *                       example: 1
 *     responses:
 *       200:
 *         description: Categories reordered successfully
 */
router.put('/categories/reorder', reorderCategories);

/**
 * @swagger
 * /api/admin/categories/{id}/analytics:
 *   get:
 *     summary: Get category analytics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category analytics retrieved successfully
 *       404:
 *         description: Category not found
 */
router.get('/categories/:id/analytics', validateObjectId(), getCategoryAnalytics);

// Analytics routes
// @route   GET /api/admin/users/:id/analytics
// @desc    Get user analytics
// @access  Private/Admin
router.get('/users/:id/analytics', validateObjectId(), getUserAnalytics);

// @route   GET /api/admin/analytics/content
// @desc    Get content performance analytics
// @access  Private/Admin
router.get('/analytics/content', getContentAnalytics);

// @route   GET /api/admin/analytics/engagement
// @desc    Get user engagement analytics
// @access  Private/Admin
router.get('/analytics/engagement', getEngagementAnalytics);

// Notification management routes
// @route   POST /api/admin/notifications/send
// @desc    Send notification to users
// @access  Private/Admin
router.post('/notifications/send', sendNotification);

// @route   GET /api/admin/notifications
// @desc    Get all notifications (admin view)
// @access  Private/Admin
router.get('/notifications', validatePagination, getNotifications);

// @route   GET /api/admin/notifications/analytics
// @desc    Get notification analytics
// @access  Private/Admin
router.get('/notifications/analytics', getNotificationAnalytics);

// Topic management routes
// @route   POST /api/admin/topics
// @desc    Create new topic
// @access  Private/Admin
router.post('/topics', validateTopic, createTopic);

// @route   PUT /api/admin/topics/:id
// @desc    Update topic
// @access  Private/Admin
router.put('/topics/:id', validateObjectId(), validateTopic, updateTopic);

// Video management routes
// @route   POST /api/admin/videos
// @desc    Create new video
// @access  Private/Admin
router.post('/videos', validateVideo, createVideo);

// @route   PUT /api/admin/videos/:id
// @desc    Update video
// @access  Private/Admin
router.put('/videos/:id', validateObjectId(), validateVideo, updateVideo);

// CloudFront management routes

/**
 * @swagger
 * /api/admin/cloudfront/status:
 *   get:
 *     summary: Get CloudFront configuration status
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: CloudFront status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     isConfigured:
 *                       type: boolean
 *                     distributionDomain:
 *                       type: string
 *                     keyPairId:
 *                       type: string
 *                     hasPrivateKey:
 *                       type: boolean
 *                     message:
 *                       type: string
 */
router.get('/cloudfront/status', getCloudFrontStatus);

/**
 * @swagger
 * /api/admin/cloudfront/test-url:
 *   post:
 *     summary: Test CloudFront signed URL generation
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - s3Key
 *             properties:
 *               s3Key:
 *                 type: string
 *                 example: "videos/sample-video.mp4"
 *               expiresIn:
 *                 type: number
 *                 example: 3600
 *                 description: Expiration time in seconds
 *     responses:
 *       200:
 *         description: Signed URL generated successfully
 *       400:
 *         description: CloudFront not configured or invalid request
 */
router.post('/cloudfront/test-url', testCloudFrontUrl);

/**
 * @swagger
 * /api/admin/cloudfront/invalidate:
 *   post:
 *     summary: Invalidate CloudFront cache for specific paths
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paths
 *             properties:
 *               paths:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["videos/video1.mp4", "thumbnails/thumb1.jpg"]
 *     responses:
 *       200:
 *         description: Cache invalidation initiated successfully
 *       400:
 *         description: CloudFront not configured or invalid request
 */
router.post('/cloudfront/invalidate', invalidateCloudFrontCache);

/**
 * @swagger
 * /api/admin/videos/convert-to-cloudfront:
 *   post:
 *     summary: Convert existing video URLs to CloudFront
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               videoIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Specific video IDs to convert (optional)
 *               dryRun:
 *                 type: boolean
 *                 default: false
 *                 description: Test conversion without making changes
 *     responses:
 *       200:
 *         description: Conversion completed successfully
 *       400:
 *         description: CloudFront not configured
 */
router.post('/videos/convert-to-cloudfront', convertVideosToCloudFront);

// Additional admin routes for content management

// @route   DELETE /api/admin/categories/:id
// @desc    Delete category (soft delete)
// @access  Private/Admin
router.delete('/categories/:id', validateObjectId(), async (req, res) => {
  try {
    const Category = require('../models/Category');
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/admin/topics/:id
// @desc    Delete topic (soft delete)
// @access  Private/Admin
router.delete('/topics/:id', validateObjectId(), async (req, res) => {
  try {
    const Topic = require('../models/Topic');
    const topic = await Topic.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Topic deleted successfully'
    });
  } catch (error) {
    console.error('Delete topic error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/admin/videos/:id
// @desc    Delete video (soft delete)
// @access  Private/Admin
router.delete('/videos/:id', validateObjectId(), async (req, res) => {
  try {
    const Video = require('../models/Video');
    const video = await Video.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Video deleted successfully'
    });
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/admin/users/:id/toggle-status
// @desc    Toggle user active status
// @access  Private/Admin
router.post('/users/:id/toggle-status', validateObjectId(), async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { isActive: user.isActive }
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Subscription management routes
// @route   GET /api/admin/subscriptions/stats
// @desc    Get subscription statistics
// @access  Private/Admin
router.get('/subscriptions/stats', getSubscriptionStats);

// @route   POST /api/admin/subscriptions/maintenance
// @desc    Run subscription maintenance manually
// @access  Private/Admin
router.post('/subscriptions/maintenance', runSubscriptionMaintenance);

// @route   GET /api/admin/subscriptions/analytics
// @desc    Get subscription analytics with historical data
// @access  Private/Admin
router.get('/subscriptions/analytics', getSubscriptionAnalytics);

// @route   GET /api/admin/subscriptions
// @desc    Get all subscriptions with filters
// @access  Private/Admin
router.get('/subscriptions', validatePagination, getAllSubscriptions);

module.exports = router;
