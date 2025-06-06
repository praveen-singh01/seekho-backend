const express = require('express');
const {
  getNotifications,
  markNotificationsAsRead,
  getUnreadCount
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');
const { validatePagination } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get user notifications
// @access  Private
router.get('/', protect, validatePagination, getNotifications);

// @route   POST /api/notifications/mark-read
// @desc    Mark notifications as read
// @access  Private
router.post('/mark-read', protect, markNotificationsAsRead);

// @route   GET /api/notifications/unread-count
// @desc    Get unread notification count
// @access  Private
router.get('/unread-count', protect, getUnreadCount);

module.exports = router;
