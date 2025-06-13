import api from './authService';

export const uploadService = {
  // Upload category thumbnail
  uploadCategoryThumbnail: async (file) => {
    try {
      const formData = new FormData();
      formData.append('thumbnail', file);
      
      const response = await api.post('/api/upload/category-thumbnail', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Upload topic thumbnail
  uploadTopicThumbnail: async (file) => {
    try {
      const formData = new FormData();
      formData.append('thumbnail', file);
      
      const response = await api.post('/api/upload/topic-thumbnail', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Upload video file
  uploadVideo: async (file, onProgress) => {
    try {
      const formData = new FormData();
      formData.append('video', file);

      const response = await api.post('/api/upload/video', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Upload video thumbnail
  uploadVideoThumbnail: async (file) => {
    try {
      const formData = new FormData();
      formData.append('thumbnail', file);
      
      const response = await api.post('/api/upload/video-thumbnail', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Upload user avatar
  uploadAvatar: async (file) => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await api.post('/api/upload/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // List uploaded files
  listFiles: async (folder = '', limit = 100) => {
    try {
      const response = await api.get(`/api/upload/files?folder=${folder}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete file
  deleteFile: async (fileUrl) => {
    try {
      const response = await api.delete('/api/upload/delete', {
        data: { fileUrl }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};
