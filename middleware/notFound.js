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
        'GET /api/categories/:id'
      ],
      topics: [
        'GET /api/topics',
        'GET /api/categories/:id/topics',
        'GET /api/topics/:id'
      ],
      videos: [
        'GET /api/videos',
        'GET /api/topics/:id/videos',
        'GET /api/videos/:id',
        'POST /api/videos/:id/view'
      ],
      subscriptions: [
        'POST /api/subscriptions/create-order',
        'POST /api/subscriptions/verify-payment',
        'GET /api/subscriptions/status',
        'POST /api/subscriptions/cancel'
      ],
      users: [
        'GET /api/users/me',
        'PUT /api/users/me',
        'GET /api/users/me/videos/:videoId/unlock'
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
