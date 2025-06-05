const express = require('express');
const {
  adminLogin,
  createAdmin,
  removeAdmin,
  getAdminUsers,
  changeAdminPassword
} = require('../controllers/adminAuthController');
const { protect, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// Validation middleware for admin login
const validateAdminLogin = [
  body('username')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters long'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  handleValidationErrors
];

// Validation middleware for creating admin
const validateCreateAdmin = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters'),
  handleValidationErrors
];

// Validation middleware for password change
const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
  handleValidationErrors
];

/**
 * @swagger
 * /api/auth/admin/login:
 *   post:
 *     summary: Admin login with username/password
 *     tags: [Admin Authentication]
 *     description: Login for admin users using username and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: Admin username or email
 *                 example: "superadmin"
 *               password:
 *                 type: string
 *                 description: Admin password
 *                 example: "SuperAdmin@123"
 *     responses:
 *       200:
 *         description: Login successful
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
 *                   example: "Login successful"
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: JWT token for authentication
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid username or password"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post('/login', validateAdminLogin, adminLogin);

/**
 * @swagger
 * /api/auth/admin/create:
 *   post:
 *     summary: Create new admin user
 *     tags: [Admin Authentication]
 *     security:
 *       - bearerAuth: []
 *     description: Create a new admin user (requires admin privileges)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Admin"
 *               email:
 *                 type: string
 *                 example: "john.admin@seekho.com"
 *               password:
 *                 type: string
 *                 example: "AdminPass@123"
 *               username:
 *                 type: string
 *                 description: Optional username (will use email if not provided)
 *                 example: "johnadmin"
 *     responses:
 *       201:
 *         description: Admin user created successfully
 *       400:
 *         description: Validation error or user already exists
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/create', protect, authorize('admin'), validateCreateAdmin, createAdmin);

/**
 * @swagger
 * /api/auth/admin/list:
 *   get:
 *     summary: Get all admin users
 *     tags: [Admin Authentication]
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
 *           default: 10
 *     responses:
 *       200:
 *         description: Admin users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get('/list', protect, authorize('admin'), getAdminUsers);

/**
 * @swagger
 * /api/auth/admin/remove/{id}:
 *   delete:
 *     summary: Remove admin user
 *     tags: [Admin Authentication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Admin user ID to remove
 *     responses:
 *       200:
 *         description: Admin user removed successfully
 *       403:
 *         description: Cannot remove super admin or yourself
 *       404:
 *         description: Admin user not found
 */
router.delete('/remove/:id', protect, authorize('admin'), removeAdmin);

/**
 * @swagger
 * /api/auth/admin/change-password:
 *   put:
 *     summary: Change admin password
 *     tags: [Admin Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: "OldPassword@123"
 *               newPassword:
 *                 type: string
 *                 example: "NewPassword@123"
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid current password or validation error
 */
router.put('/change-password', protect, authorize('admin'), validatePasswordChange, changeAdminPassword);

module.exports = router;
