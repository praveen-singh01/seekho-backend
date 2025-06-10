const AWS = require('aws-sdk');
const multer = require('multer');
const path = require('path');

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const s3 = new AWS.S3();

// File filter function
const fileFilter = (req, file, cb) => {
  // Define allowed file types
  const allowedTypes = {
    image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    video: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm'],
    document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  };

  const allAllowedTypes = [...allowedTypes.image, ...allowedTypes.video, ...allowedTypes.document];

  if (allAllowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`), false);
  }
};

// Generate unique filename
const generateFileName = (originalname, folder = '') => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = path.extname(originalname);
  const baseName = path.basename(originalname, extension).replace(/[^a-zA-Z0-9]/g, '-');
  
  return folder ? `${folder}/${timestamp}-${randomString}-${baseName}${extension}` : `${timestamp}-${randomString}-${baseName}${extension}`;
};

// Custom S3 storage using memory storage + manual upload
const createS3Upload = (folder = 'uploads') => {
  return multer({
    storage: multer.memoryStorage(),
    fileFilter: fileFilter,
    limits: {
      fileSize: getFileSizeLimit(folder)
    }
  });
};

// Upload file to S3 manually
const uploadToS3 = async (file, folder = 'uploads') => {
  const fileName = generateFileName(file.originalname, folder);

  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype
  };

  try {
    const result = await s3.upload(params).promise();

    // Use CloudFront URL instead of direct S3 URL
    const cloudFrontUrl = process.env.CLOUDFRONT_DISTRIBUTION_DOMAIN
      ? `https://${process.env.CLOUDFRONT_DISTRIBUTION_DOMAIN}/${result.Key}`
      : result.Location;

    return {
      success: true,
      data: {
        url: cloudFrontUrl,
        key: result.Key,
        size: file.size,
        mimetype: file.mimetype
      }
    };
  } catch (error) {
    console.error('S3 upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get file size limit based on folder/type
const getFileSizeLimit = (folder) => {
  const limits = {
    'thumbnails': 5 * 1024 * 1024,      // 5MB for thumbnails
    'videos': 500 * 1024 * 1024,        // 500MB for videos
    'documents': 10 * 1024 * 1024,      // 10MB for documents
    'avatars': 2 * 1024 * 1024,         // 2MB for avatars
    'uploads': 50 * 1024 * 1024         // 50MB default
  };
  
  return limits[folder] || limits['uploads'];
};

// Upload middleware for different types
const uploadMiddleware = {
  // Single file upload
  single: (fieldName, folder = 'uploads') => {
    return createS3Upload(folder).single(fieldName);
  },
  
  // Multiple files upload
  multiple: (fieldName, maxCount = 5, folder = 'uploads') => {
    return createS3Upload(folder).array(fieldName, maxCount);
  },
  
  // Multiple fields upload
  fields: (fields, folder = 'uploads') => {
    return createS3Upload(folder).fields(fields);
  }
};

// Specific upload configurations using memory storage
const uploads = {
  // Category thumbnail upload
  categoryThumbnail: createS3Upload('categories').single('thumbnail'),

  // Topic thumbnail upload
  topicThumbnail: createS3Upload('topics').single('thumbnail'),

  // Video file upload
  videoFile: createS3Upload('videos').single('video'),

  // Video thumbnail upload
  videoThumbnail: createS3Upload('thumbnails').single('thumbnail'),

  // User avatar upload
  userAvatar: createS3Upload('avatars').single('avatar'),

  // Multiple video resources
  videoResources: createS3Upload('resources').array('resources', 10),

  // Video with thumbnail
  videoWithThumbnail: createS3Upload('videos').fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ])
};

// Delete file from S3
const deleteFile = async (fileUrl) => {
  try {
    // Extract key from URL
    const urlParts = fileUrl.split('/');
    const key = urlParts.slice(-2).join('/'); // Get folder/filename
    
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key
    };
    
    await s3.deleteObject(params).promise();
    return { success: true };
  } catch (error) {
    console.error('S3 delete error:', error);
    return { success: false, error: error.message };
  }
};

// Get signed URL for private files
const getSignedUrl = (key, expires = 3600) => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
      Expires: expires
    };
    
    return s3.getSignedUrl('getObject', params);
  } catch (error) {
    console.error('S3 signed URL error:', error);
    return null;
  }
};

// List files in bucket
const listFiles = async (prefix = '', maxKeys = 1000) => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Prefix: prefix,
      MaxKeys: maxKeys
    };

    const data = await s3.listObjectsV2(params).promise();
    return {
      success: true,
      files: data.Contents.map(file => {
        // Use CloudFront URL instead of direct S3 URL
        const url = process.env.CLOUDFRONT_DISTRIBUTION_DOMAIN
          ? `https://${process.env.CLOUDFRONT_DISTRIBUTION_DOMAIN}/${file.Key}`
          : `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${file.Key}`;

        return {
          key: file.Key,
          size: file.Size,
          lastModified: file.LastModified,
          url: url
        };
      })
    };
  } catch (error) {
    console.error('S3 list files error:', error);
    return { success: false, error: error.message };
  }
};

// Upload validation middleware
const validateUpload = (req, res, next) => {
  if (!process.env.AWS_S3_BUCKET_NAME) {
    return res.status(500).json({
      success: false,
      message: 'S3 bucket not configured'
    });
  }
  
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    return res.status(500).json({
      success: false,
      message: 'AWS credentials not configured'
    });
  }
  
  next();
};

// Handle upload errors
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files'
      });
    }
  }
  
  if (error.message.includes('File type')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
};

// Check if bucket exists and is accessible
const checkBucketExists = async () => {
  try {
    await s3.headBucket({ Bucket: process.env.AWS_S3_BUCKET_NAME }).promise();
    return { success: true, message: 'S3 bucket exists and is accessible' };
  } catch (error) {
    console.error('S3 bucket check error:', error);
    return { 
      success: false, 
      message: 'S3 bucket does not exist or is not accessible',
      error: error.message 
    };
  }
};

module.exports = {
  uploads,
  uploadMiddleware,
  uploadToS3,
  deleteFile,
  getSignedUrl,
  listFiles,
  validateUpload,
  handleUploadError,
  s3,
  checkBucketExists
};
