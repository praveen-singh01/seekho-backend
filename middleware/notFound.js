const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: {
      auth: [
        'POST /api/auth/google',
        'GET /api/auth/google/callback',
        'POST /api/auth/logout',
        'GET /api/auth/me'
      ],
      categories: [
        'GET /api/categories',
        'GET /api/categories/:id',
        'GET /api/categories/:id/complete',
        'GET /api/categories/:id/updates',
        'GET /api/categories/:id/topics',
        'GET /api/categories/:id/stats'
      ],
      topics: [
        'GET /api/topics',
        'GET /api/topics/:id',
        'GET /api/topics/:id/related',
        'GET /api/topics/:id/videos',
        'GET /api/topics/:id/progress'
      ],
      videos: [
        'GET /api/videos',
        'GET /api/videos/search',
        'GET /api/videos/popular',
        'GET /api/videos/new',
        'GET /api/topics/:id/videos',
        'GET /api/videos/:id',
        'GET /api/videos/:id/stream',
        'GET /api/videos/:id/related',
        'POST /api/videos/:id/view',
        'POST /api/videos/:id/progress'
      ],
      subscriptions: [
        'POST /api/subscriptions/create-order',
        'POST /api/subscriptions/verify-payment',
        'GET /api/subscriptions/status',
        'POST /api/subscriptions/cancel'
      ],
      users: [
        'GET /api/users/profile',
        'PUT /api/users/profile',
        'GET /api/users/stats',
        'GET /api/users/watch-history',
        'POST /api/users/favorites',
        'DELETE /api/users/favorites/:videoId',
        'GET /api/users/favorites',
        'POST /api/users/bookmarks',
        'DELETE /api/users/bookmarks/:videoId',
        'GET /api/users/bookmarks',
        'GET /api/users/me',
        'PUT /api/users/me',
        'GET /api/users/me/videos/:videoId/unlock'
      ],
      notifications: [
        'GET /api/notifications',
        'POST /api/notifications/mark-read',
        'GET /api/notifications/unread-count'
      ],
      admin: [
        'GET /api/admin/dashboard',
        'GET /api/admin/users',
        'POST /api/admin/categories',
        'POST /api/admin/topics',
        'POST /api/admin/videos'
      ]
    }
  });
};

module.exports = notFound;
