const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  uploads,
  validateUpload,
  handleUploadError,
  deleteFile,
  listFiles,
  checkBucketExists,
  uploadToS3
} = require('../services/uploadService');

const router = express.Router();

// Apply authentication and validation to all upload routes
router.use(protect);
router.use(validateUpload);

/**
 * @swagger
 * /api/upload/category-thumbnail:
 *   post:
 *     summary: Upload category thumbnail
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *                 description: Category thumbnail image
 *     responses:
 *       200:
 *         description: File uploaded successfully
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
 *                   example: File uploaded successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                       example: https://bucket.s3.region.amazonaws.com/categories/file.jpg
 *                     key:
 *                       type: string
 *                       example: categories/1234567890-abc123-filename.jpg
 *                     size:
 *                       type: number
 *                       example: 1024000
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/category-thumbnail', authorize('admin'), async (req, res, next) => {
  const upload = uploads.categoryThumbnail;

  upload(req, res, async (err) => {
    if (err) {
      return handleUploadError(err, req, res, next);
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    try {
      const result = await uploadToS3(req.file, 'categories');

      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'Category thumbnail uploaded successfully',
          data: result.data
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to upload to S3',
          error: result.error
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Upload failed',
        error: error.message
      });
    }
  });
});

/**
 * @swagger
 * /api/upload/topic-thumbnail:
 *   post:
 *     summary: Upload topic thumbnail
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post('/topic-thumbnail', authorize('admin'), (req, res, next) => {
  uploads.topicThumbnail(req, res, async (err) => {
    if (err) {
      return handleUploadError(err, req, res, next);
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    try {
      // Upload file to S3
      const uploadResult = await uploadToS3(req.file, 'topics');

      if (!uploadResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to upload topic thumbnail to S3',
          error: uploadResult.error
        });
      }

      res.status(200).json({
        success: true,
        message: 'Topic thumbnail uploaded successfully',
        data: uploadResult.data
      });
    } catch (error) {
      console.error('Topic thumbnail upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during upload',
        error: error.message
      });
    }
  });
});

/**
 * @swagger
 * /api/upload/video:
 *   post:
 *     summary: Upload video file
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               video:
 *                 type: string
 *                 format: binary
 *                 description: Video file (max 500MB)
 *     responses:
 *       200:
 *         description: Video uploaded successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post('/video', authorize('admin'), (req, res, next) => {
  uploads.videoFile(req, res, async (err) => {
    if (err) {
      return handleUploadError(err, req, res, next);
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No video file uploaded'
      });
    }

    try {
      // Upload file to S3
      const uploadResult = await uploadToS3(req.file, 'videos');

      if (!uploadResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to upload video to S3',
          error: uploadResult.error
        });
      }

      res.status(200).json({
        success: true,
        message: 'Video uploaded successfully',
        data: uploadResult.data
      });
    } catch (error) {
      console.error('Video upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during upload',
        error: error.message
      });
    }
  });
});

/**
 * @swagger
 * /api/upload/video-thumbnail:
 *   post:
 *     summary: Upload video thumbnail
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Thumbnail uploaded successfully
 */
router.post('/video-thumbnail', authorize('admin'), (req, res, next) => {
  uploads.videoThumbnail(req, res, async (err) => {
    if (err) {
      return handleUploadError(err, req, res, next);
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No thumbnail uploaded'
      });
    }

    try {
      // Upload file to S3
      const uploadResult = await uploadToS3(req.file, 'thumbnails');

      if (!uploadResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to upload thumbnail to S3',
          error: uploadResult.error
        });
      }

      res.status(200).json({
        success: true,
        message: 'Video thumbnail uploaded successfully',
        data: uploadResult.data
      });
    } catch (error) {
      console.error('Thumbnail upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during upload',
        error: error.message
      });
    }
  });
});

/**
 * @swagger
 * /api/upload/avatar:
 *   post:
 *     summary: Upload user avatar
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 */
router.post('/avatar', (req, res, next) => {
  uploads.userAvatar(req, res, async (err) => {
    if (err) {
      return handleUploadError(err, req, res, next);
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No avatar uploaded'
      });
    }

    try {
      // Upload file to S3
      const uploadResult = await uploadToS3(req.file, 'avatars');

      if (!uploadResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to upload avatar to S3',
          error: uploadResult.error
        });
      }

      res.status(200).json({
        success: true,
        message: 'Avatar uploaded successfully',
        data: uploadResult.data
      });
    } catch (error) {
      console.error('Avatar upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during upload',
        error: error.message
      });
    }
  });
});

/**
 * @swagger
 * /api/upload/files:
 *   get:
 *     summary: List uploaded files
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: folder
 *         schema:
 *           type: string
 *         description: Folder prefix to filter files
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Maximum number of files to return
 *     responses:
 *       200:
 *         description: Files listed successfully
 */
router.get('/files', authorize('admin'), async (req, res) => {
  try {
    const { folder = '', limit = 100 } = req.query;
    
    const result = await listFiles(folder, parseInt(limit));
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error
      });
    }
    
    res.status(200).json({
      success: true,
      count: result.files.length,
      data: result.files
    });
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @swagger
 * /api/upload/delete:
 *   delete:
 *     summary: Delete uploaded file
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *                 description: File URL to delete
 *             required:
 *               - url
 *     responses:
 *       200:
 *         description: File deleted successfully
 */
router.delete('/delete', authorize('admin'), async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'File URL is required'
      });
    }
    
    const result = await deleteFile(url);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/upload/check-bucket
// @desc    Check if S3 bucket exists and is accessible
// @access  Private/Admin
router.get('/check-bucket', authorize('admin'), async (req, res) => {
  try {
    const result = await checkBucketExists();
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('Bucket check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking S3 bucket',
      error: error.message
    });
  }
});

module.exports = router;
