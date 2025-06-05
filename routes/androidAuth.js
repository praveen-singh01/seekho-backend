const express = require('express');
const {
  verifyAndroidGoogleToken,
  refreshToken,
  getAndroidConfig,
  logoutAndroid,
  deleteAndroidAccount
} = require('../controllers/androidAuthController');
const { protect } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/auth/android/google:
 *   post:
 *     summary: Authenticate Android user with Google ID token
 *     tags: [Android Authentication]
 *     description: Verify Google ID token from Android app and return JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Google ID token from Android GoogleSignIn
 *                 example: "eyJhbGciOiJSUzI1NiIsImtpZCI6..."
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Authentication successful"
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: JWT token for API authentication
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     subscription:
 *                       type: object
 *                       properties:
 *                         hasSubscription:
 *                           type: boolean
 *                           example: true
 *                         isActive:
 *                           type: boolean
 *                           example: true
 *                         plan:
 *                           type: string
 *                           example: "monthly"
 *                         endDate:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: Invalid or missing Google token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Authentication failed
 */
router.post('/google', verifyAndroidGoogleToken);

/**
 * @swagger
 * /api/auth/android/refresh:
 *   post:
 *     summary: Refresh JWT token
 *     tags: [Android Authentication]
 *     security:
 *       - bearerAuth: []
 *     description: Get a new JWT token for authenticated user
 *     responses:
 *       200:
 *         description: Token refreshed successfully
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
 *                     token:
 *                       type: string
 *                       description: New JWT token
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     subscription:
 *                       type: object
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/refresh', protect, refreshToken);

/**
 * @swagger
 * /api/auth/android/config:
 *   get:
 *     summary: Get Android app configuration
 *     tags: [Android Authentication]
 *     description: Get configuration needed for Android app setup
 *     responses:
 *       200:
 *         description: Configuration retrieved successfully
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
 *                     androidClientId:
 *                       type: string
 *                       description: Google OAuth client ID for Android
 *                       example: "123456789-abc.apps.googleusercontent.com"
 *                     packageName:
 *                       type: string
 *                       example: "com.seekho.app"
 *                     deepLink:
 *                       type: string
 *                       example: "seekho://auth/callback"
 *                     subscriptionPlans:
 *                       type: object
 *                       properties:
 *                         trial:
 *                           type: object
 *                           properties:
 *                             price:
 *                               type: number
 *                               example: 1
 *                             duration:
 *                               type: string
 *                               example: "7 days"
 *                             priceInPaise:
 *                               type: number
 *                               example: 100
 *                         monthly:
 *                           type: object
 *                           properties:
 *                             price:
 *                               type: number
 *                               example: 199
 *                             duration:
 *                               type: string
 *                               example: "1 month"
 *                             priceInPaise:
 *                               type: number
 *                               example: 19900
 */
router.get('/config', getAndroidConfig);

/**
 * @swagger
 * /api/auth/android/logout:
 *   post:
 *     summary: Logout Android user
 *     tags: [Android Authentication]
 *     security:
 *       - bearerAuth: []
 *     description: Logout user (client should remove stored token)
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Logged out successfully"
 */
router.post('/logout', protect, logoutAndroid);

/**
 * @swagger
 * /api/auth/android/account:
 *   delete:
 *     summary: Delete Android user account
 *     tags: [Android Authentication]
 *     security:
 *       - bearerAuth: []
 *     description: Permanently delete user account and cancel subscriptions
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Account deleted successfully"
 *       404:
 *         description: User not found
 */
router.delete('/account', protect, deleteAndroidAccount);

module.exports = router;
