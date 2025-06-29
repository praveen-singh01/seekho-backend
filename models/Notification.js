const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Multi-tenant package ID for app segregation
  packageId: {
    type: String,
    required: [true, 'Package ID is required'],
    index: true,
    validate: {
      validator: function(v) {
        const { SUPPORTED_PACKAGES } = require('../config/packages');
        return SUPPORTED_PACKAGES.includes(v);
      },
      message: 'Invalid package ID'
    }
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'error', 'new_content', 'subscription', 'achievement'],
    default: 'info'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  data: {
    // Additional data for the notification (e.g., video ID, category ID, etc.)
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  actionUrl: {
    type: String,
    default: null
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  expiresAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries with multi-tenancy
notificationSchema.index({ packageId: 1, user: 1, createdAt: -1 });
notificationSchema.index({ packageId: 1, user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to create notification for user
notificationSchema.statics.createForUser = async function(userId, title, message, type = 'info', data = null, actionUrl = null, priority = 'medium', expiresInDays = null, packageId = null) {
  const notification = {
    user: userId,
    title,
    message,
    type,
    data,
    actionUrl,
    priority
  };

  if (packageId) {
    notification.packageId = packageId;
  }

  if (expiresInDays) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    notification.expiresAt = expiresAt;
  }

  return await this.create(notification);
};

// Static method to mark notifications as read
notificationSchema.statics.markAsRead = async function(userId, notificationIds = null) {
  const query = { user: userId, isRead: false };
  
  if (notificationIds && notificationIds.length > 0) {
    query._id = { $in: notificationIds };
  }
  
  return await this.updateMany(query, {
    isRead: true,
    readAt: new Date()
  });
};

// Static method to get user's unread count
notificationSchema.statics.getUnreadCount = async function(userId, packageId = null) {
  const query = { user: userId, isRead: false };
  if (packageId) {
    query.packageId = packageId;
  }
  return await this.countDocuments(query);
};

// Static method to get user's notifications with pagination
notificationSchema.statics.getUserNotifications = async function(userId, page = 1, limit = 20, unreadOnly = false, packageId = null) {
  const skip = (page - 1) * limit;
  const query = { user: userId };

  if (packageId) {
    query.packageId = packageId;
  }

  if (unreadOnly) {
    query.isRead = false;
  }
  
  const notifications = await this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  
  const total = await this.countDocuments(query);
  
  return {
    notifications,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

module.exports = mongoose.model('Notification', notificationSchema);
