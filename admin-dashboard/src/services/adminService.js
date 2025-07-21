import api from './authService';

export const adminService = {
  // Dashboard
  getDashboard: async () => {
    try {
      const response = await api.get('/api/admin/dashboard');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Users
  getUsers: async (page = 1, limit = 10) => {
    try {
      const response = await api.get(`/api/admin/users?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },



  createCategory: async (categoryData) => {
    try {
      const response = await api.post('/api/admin/categories', categoryData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateCategory: async (id, categoryData) => {
    try {
      const response = await api.put(`/api/admin/categories/${id}`, categoryData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteCategory: async (id) => {
    try {
      const response = await api.delete(`/api/admin/categories/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getCategoryAnalytics: async (id) => {
    try {
      const response = await api.get(`/api/admin/categories/${id}/analytics`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Topics
  createTopic: async (topicData) => {
    try {
      const response = await api.post('/api/admin/topics', topicData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateTopic: async (id, topicData) => {
    try {
      const response = await api.put(`/api/admin/topics/${id}`, topicData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteTopic: async (id) => {
    try {
      const response = await api.delete(`/api/admin/topics/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Topics (Admin)
  getTopics: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });
      const response = await api.get(`/api/admin/topics?${queryParams}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getTopic: async (id) => {
    try {
      const response = await api.get(`/api/admin/topics/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Categories (Admin)
  getCategories: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });
      const response = await api.get(`/api/admin/categories?${queryParams}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getTopicVideos: async (id, page = 1, limit = 10) => {
    try {
      const response = await api.get(`/api/topics/${id}/videos?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Videos
  getVideos: async (page = 1, limit = 10, topicId = '') => {
    try {
      const params = new URLSearchParams({ page, limit });
      if (topicId) params.append('topic', topicId);
      const response = await api.get(`/api/videos?${params}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getVideo: async (id) => {
    try {
      const response = await api.get(`/api/videos/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  createVideo: async (videoData) => {
    try {
      const response = await api.post('/api/admin/videos', videoData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateVideo: async (id, videoData) => {
    try {
      const response = await api.put(`/api/admin/videos/${id}`, videoData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteVideo: async (id) => {
    try {
      const response = await api.delete(`/api/admin/videos/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Admin Management
  getAdminUsers: async (page = 1, limit = 10) => {
    try {
      const response = await api.get(`/api/auth/admin/list?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  createAdmin: async (adminData) => {
    try {
      const response = await api.post('/api/auth/admin/create', adminData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  removeAdmin: async (id) => {
    try {
      const response = await api.delete(`/api/auth/admin/remove/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  changeAdminPassword: async (passwordData) => {
    try {
      const response = await api.put('/api/auth/admin/change-password', passwordData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // NEW ANALYTICS ENDPOINTS

  // User Analytics
  getUserAnalytics: async (userId) => {
    try {
      const response = await api.get(`/api/admin/users/${userId}/analytics`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Content Performance Analytics
  getContentAnalytics: async () => {
    try {
      const response = await api.get('/api/admin/analytics/content');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // User Engagement Analytics
  getEngagementAnalytics: async (days = 30) => {
    try {
      const response = await api.get(`/api/admin/analytics/engagement?days=${days}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // NOTIFICATION MANAGEMENT

  // Send notification to users
  sendNotification: async (notificationData) => {
    try {
      const response = await api.post('/api/admin/notifications/send', notificationData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get all notifications (admin view)
  getNotifications: async (page = 1, limit = 20, type = '', isRead = '') => {
    try {
      const params = new URLSearchParams({ page, limit });
      if (type) params.append('type', type);
      if (isRead !== '') params.append('isRead', isRead);
      const response = await api.get(`/api/admin/notifications?${params}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get notification analytics
  getNotificationAnalytics: async (days = 30) => {
    try {
      const response = await api.get(`/api/admin/notifications/analytics?days=${days}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // SUBSCRIPTION ANALYTICS

  // Get subscription statistics
  getSubscriptionStats: async () => {
    try {
      const response = await api.get('/api/admin/subscriptions/stats');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get subscription analytics with historical data
  getSubscriptionAnalytics: async (timeRange = '6months') => {
    try {
      const response = await api.get(`/api/admin/subscriptions/analytics?timeRange=${timeRange}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get all subscriptions for admin
  getAllSubscriptions: async (page = 1, limit = 20, status = '', plan = '') => {
    try {
      const params = new URLSearchParams({ page, limit });
      if (status) params.append('status', status);
      if (plan) params.append('plan', plan);
      const response = await api.get(`/api/admin/subscriptions?${params}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ==================== NEW CONTENT MANAGEMENT METHODS ====================

  // Questionnaires
  getQuestionnaires: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });
      const response = await api.get(`/api/admin/questionnaires?${queryParams}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  createQuestionnaire: async (questionnaireData) => {
    try {
      const response = await api.post('/api/admin/questionnaires', questionnaireData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateQuestionnaire: async (id, questionnaireData) => {
    try {
      const response = await api.put(`/api/admin/questionnaires/${id}`, questionnaireData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteQuestionnaire: async (id) => {
    try {
      const response = await api.delete(`/api/admin/questionnaires/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // MCQs
  getMCQs: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });
      const response = await api.get(`/api/admin/mcqs?${queryParams}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  createMCQ: async (mcqData) => {
    try {
      const response = await api.post('/api/admin/mcqs', mcqData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateMCQ: async (id, mcqData) => {
    try {
      const response = await api.put(`/api/admin/mcqs/${id}`, mcqData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteMCQ: async (id) => {
    try {
      const response = await api.delete(`/api/admin/mcqs/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Learning Modules
  getLearningModules: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });
      const response = await api.get(`/api/admin/learning-modules?${queryParams}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  createLearningModule: async (moduleData) => {
    try {
      const response = await api.post('/api/admin/learning-modules', moduleData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateLearningModule: async (id, moduleData) => {
    try {
      const response = await api.put(`/api/admin/learning-modules/${id}`, moduleData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteLearningModule: async (id) => {
    try {
      const response = await api.delete(`/api/admin/learning-modules/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Answer Analytics
  getAnswerAnalytics: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });
      const response = await api.get(`/api/admin/answers/analytics?${queryParams}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Text Content management methods
  getTextContent: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });
      const response = await api.get(`/api/admin/text-content?${queryParams}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  createTextContent: async (textContentData) => {
    try {
      const response = await api.post('/api/admin/text-content', textContentData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateTextContent: async (id, textContentData) => {
    try {
      const response = await api.put(`/api/admin/text-content/${id}`, textContentData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteTextContent: async (id) => {
    try {
      const response = await api.delete(`/api/admin/text-content/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};
