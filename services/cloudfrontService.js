const AWS = require('aws-sdk');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Configure AWS CloudFront
const cloudfront = new AWS.CloudFront({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

/**
 * Generate CloudFront URL (public or signed)
 * @param {string} s3Key - S3 object key (e.g., 'videos/video-file.mp4')
 * @param {number} expiresIn - Expiration time in seconds (default: 1 hour)
 * @param {boolean} useSignedUrl - Whether to generate signed URL (default: true for premium content)
 * @returns {string} - CloudFront URL
 */
const generateCloudFrontUrl = (s3Key, expiresIn = 3600, useSignedUrl = true) => {
  try {
    const distributionDomain = process.env.CLOUDFRONT_DISTRIBUTION_DOMAIN;

    if (!distributionDomain) {
      console.warn('CloudFront not configured, falling back to S3 URL');
      return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
    }

    // CloudFront URL - encode the s3Key to handle spaces and special characters
    const encodedKey = encodeURIComponent(s3Key).replace(/%2F/g, '/'); // Keep forward slashes
    const url = `https://${distributionDomain}/${encodedKey}`;

    // If signed URL is not required, return public URL
    if (!useSignedUrl) {
      return url;
    }

    // Generate signed URL for premium content
    const keyPairId = process.env.CLOUDFRONT_KEY_PAIR_ID;

    if (!keyPairId) {
      console.warn('CloudFront key pair not configured, returning public URL');
      return url;
    }

    // Expiration time
    const expires = Math.floor(Date.now() / 1000) + expiresIn;

    // Create policy
    const policy = {
      Statement: [
        {
          Resource: url,
          Condition: {
            DateLessThan: {
              'AWS:EpochTime': expires
            }
          }
        }
      ]
    };

    const policyString = JSON.stringify(policy);
    const policyBase64 = Buffer.from(policyString).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    // Get private key
    let privateKey;
    if (process.env.CLOUDFRONT_PRIVATE_KEY_BASE64) {
      privateKey = Buffer.from(process.env.CLOUDFRONT_PRIVATE_KEY_BASE64, 'base64').toString('utf8');
    } else if (process.env.CLOUDFRONT_PRIVATE_KEY_PATH) {
      const keyPath = path.resolve(process.env.CLOUDFRONT_PRIVATE_KEY_PATH);
      privateKey = fs.readFileSync(keyPath, 'utf8');
    } else {
      console.warn('CloudFront private key not configured, returning public URL');
      return url;
    }

    // Create signature
    const signature = crypto.sign('sha1', Buffer.from(policyString), privateKey)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    // Return signed URL
    return `${url}?Policy=${policyBase64}&Signature=${signature}&Key-Pair-Id=${keyPairId}`;

  } catch (error) {
    console.error('CloudFront URL generation error:', error);
    // Fallback to S3 URL
    return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
  }
};

/**
 * Generate signed URL for CloudFront distribution (backward compatibility)
 * @param {string} s3Key - S3 object key (e.g., 'videos/video-file.mp4')
 * @param {number} expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns {string} - Signed CloudFront URL
 */
const generateSignedUrl = (s3Key, expiresIn = 3600) => {
  return generateCloudFrontUrl(s3Key, expiresIn, true);
};

/**
 * Generate multiple quality URLs for adaptive streaming
 * @param {string} baseS3Key - Base S3 key without quality suffix
 * @param {Array} qualities - Array of quality strings ['720p', '480p', '360p']
 * @param {number} expiresIn - Expiration time in seconds
 * @returns {Object} - Object with quality as key and signed URL as value
 */
const generateQualityUrls = (baseS3Key, qualities = ['720p', '480p', '360p'], expiresIn = 3600) => {
  const urls = {};
  
  qualities.forEach(quality => {
    // Assume quality files are stored with quality suffix
    // e.g., 'videos/video-file-720p.mp4', 'videos/video-file-480p.mp4'
    const qualityKey = baseS3Key.replace(/(\.[^.]+)$/, `-${quality}$1`);
    urls[quality] = generateSignedUrl(qualityKey, expiresIn);
  });

  return urls;
};

/**
 * Generate HLS playlist URL for adaptive streaming
 * @param {string} s3Key - S3 key for the HLS playlist file (.m3u8)
 * @param {number} expiresIn - Expiration time in seconds
 * @returns {string} - Signed CloudFront URL for HLS playlist
 */
const generateHLSUrl = (s3Key, expiresIn = 3600) => {
  // For HLS, the s3Key should point to the master playlist (.m3u8 file)
  const hlsKey = s3Key.replace(/\.[^.]+$/, '.m3u8');
  return generateSignedUrl(hlsKey, expiresIn);
};

/**
 * Check if CloudFront is properly configured
 * @returns {boolean} - True if CloudFront is configured
 */
const isCloudFrontConfigured = () => {
  return !!(process.env.CLOUDFRONT_DISTRIBUTION_DOMAIN);
};

/**
 * Check if CloudFront signed URLs are properly configured
 * @returns {boolean} - True if signed URLs can be generated
 */
const isSignedUrlConfigured = () => {
  return !!(
    process.env.CLOUDFRONT_DISTRIBUTION_DOMAIN &&
    process.env.CLOUDFRONT_KEY_PAIR_ID &&
    (process.env.CLOUDFRONT_PRIVATE_KEY_BASE64 || process.env.CLOUDFRONT_PRIVATE_KEY_PATH)
  );
};

/**
 * Convert S3 URL to CloudFront URL
 * @param {string} s3Url - Full S3 URL
 * @param {number} expiresIn - Expiration time in seconds
 * @param {boolean} useSignedUrl - Whether to generate signed URL
 * @returns {string} - CloudFront URL (signed if configured)
 */
const convertS3ToCloudFront = (s3Url, expiresIn = 3600, useSignedUrl = true) => {
  try {
    // Extract S3 key from URL
    const url = new URL(s3Url);
    const pathParts = url.pathname.split('/');
    const s3Key = pathParts.slice(1).join('/'); // Remove leading slash

    return generateCloudFrontUrl(s3Key, expiresIn, useSignedUrl);
  } catch (error) {
    console.error('Error converting S3 URL to CloudFront:', error);
    return s3Url; // Return original URL as fallback
  }
};

/**
 * Invalidate CloudFront cache for specific paths
 * @param {Array} paths - Array of paths to invalidate
 * @returns {Promise} - CloudFront invalidation result
 */
const invalidateCache = async (paths) => {
  try {
    if (!isCloudFrontConfigured()) {
      console.warn('CloudFront not configured, skipping cache invalidation');
      return { success: false, message: 'CloudFront not configured' };
    }

    const distributionId = process.env.CLOUDFRONT_DISTRIBUTION_DOMAIN.split('.')[0];
    
    const params = {
      DistributionId: distributionId,
      InvalidationBatch: {
        CallerReference: `invalidation-${Date.now()}`,
        Paths: {
          Quantity: paths.length,
          Items: paths.map(path => `/${path}`)
        }
      }
    };

    const result = await cloudfront.createInvalidation(params).promise();
    return { success: true, invalidationId: result.Invalidation.Id };
  } catch (error) {
    console.error('CloudFront cache invalidation error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  generateSignedUrl,
  generateCloudFrontUrl,
  generateQualityUrls,
  generateHLSUrl,
  isCloudFrontConfigured,
  isSignedUrlConfigured,
  convertS3ToCloudFront,
  invalidateCache
};
