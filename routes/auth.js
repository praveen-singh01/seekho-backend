const express = require('express');
const {
  googleAuth,
  googleCallback,
  getMe,
  logout,
  updateProfile,
  deleteAccount,
  getUserStats,
  register,
  login
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validateUser } = require('../middleware/validation');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register user with email and password
// @access  Public
router.post('/register', register);

// @route   POST /api/auth/login
// @desc    Login user with email and password
// @access  Public
router.post('/login', login);

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Initiate Google OAuth authentication
 *     tags: [Authentication]
 *     description: Redirects user to Google OAuth consent screen
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth
 *       500:
 *         description: Server error
 */
router.get('/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(500).json({
      success: false,
      message: 'Google OAuth not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in environment variables.'
    });
  }
  googleAuth(req, res, next);
});

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     tags: [Authentication]
 *     description: Handles Google OAuth callback and redirects with JWT token
 *     responses:
 *       302:
 *         description: Redirect to frontend with token or error
 */
router.get('/google/callback', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(500).json({
      success: false,
      message: 'Google OAuth not configured.'
    });
  }
  googleCallback(req, res, next);
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     isSubscribed:
 *                       type: boolean
 *                       example: true
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/me', protect, getMe);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', protect, logout);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, updateProfile);

// @route   DELETE /api/auth/account
// @desc    Delete user account
// @access  Private
router.delete('/account', protect, deleteAccount);

// @route   GET /api/auth/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', protect, getUserStats);

module.exports = router;
