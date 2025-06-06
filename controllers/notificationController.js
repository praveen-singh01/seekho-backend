const Notification = require('../models/Notification');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    
    const result = await Notification.getUserNotifications(
      req.user.id,
      parseInt(page),
      parseInt(limit),
      unreadOnly === 'true'
    );

    // Get unread count
    const unreadCount = await Notification.getUnreadCount(req.user.id);

    res.status(200).json({
      success: true,
      count: result.notifications.length,
      unreadCount,
      pagination: result.pagination,
      data: result.notifications
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Mark notifications as read
// @route   POST /api/notifications/mark-read
// @access  Private
const markNotificationsAsRead = async (req, res) => {
  try {
    const { notificationIds } = req.body;
    
    const result = await Notification.markAsRead(req.user.id, notificationIds);

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`,
      data: {
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Mark notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
const getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Notification.getUnreadCount(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        unreadCount
      }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getNotifications,
  markNotificationsAsRead,
  getUnreadCount
};
