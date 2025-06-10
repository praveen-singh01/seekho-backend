#!/usr/bin/env node

/**
 * Test script for CloudFront URL generation
 * Usage: node scripts/test-cloudfront.js
 */

require('dotenv').config();
const { generateCloudFrontUrl, isCloudFrontConfigured, isSignedUrlConfigured } = require('../services/cloudfrontService');

console.log('🔍 Testing CloudFront Configuration...\n');

// Check configuration
console.log('Configuration Status:');
console.log('- CloudFront Configured:', isCloudFrontConfigured());
console.log('- Signed URLs Configured:', isSignedUrlConfigured());
console.log('- Distribution Domain:', process.env.CLOUDFRONT_DISTRIBUTION_DOMAIN || 'Not set');
console.log('- Key Pair ID:', process.env.CLOUDFRONT_KEY_PAIR_ID || 'Not set');
console.log('- Has Private Key:', !!(process.env.CLOUDFRONT_PRIVATE_KEY_BASE64 || process.env.CLOUDFRONT_PRIVATE_KEY_PATH));
console.log('');

// Test URLs based on your example
const testFiles = [
  'categories/Cyberpunk city.mp4',
  'categories/Cyberpunk city.jpg',
  'videos/sample-video.mp4',
  'thumbnails/sample-thumb.jpg'
];

console.log('🌐 Generated CloudFront URLs:\n');

testFiles.forEach(file => {
  console.log(`File: ${file}`);
  
  try {
    // Public URL
    const publicUrl = generateCloudFrontUrl(file, 3600, false);
    console.log(`  Public URL: ${publicUrl}`);
    
    // Signed URL (if configured)
    if (isSignedUrlConfigured()) {
      const signedUrl = generateCloudFrontUrl(file, 3600, true);
      console.log(`  Signed URL: ${signedUrl.substring(0, 100)}...`);
    } else {
      console.log(`  Signed URL: Not configured (missing key pair or private key)`);
    }
  } catch (error) {
    console.log(`  Error: ${error.message}`);
  }
  
  console.log('');
});

// Test URL encoding for special characters
console.log('🔤 Testing URL Encoding:\n');

const specialFiles = [
  'categories/Cyberpunk city.mp4',
  'videos/My Video (1080p).mp4',
  'categories/Test & Demo.jpg',
  'videos/Episode #1 - Introduction.mp4'
];

specialFiles.forEach(file => {
  console.log(`Original: ${file}`);
  const url = generateCloudFrontUrl(file, 3600, false);
  console.log(`Encoded:  ${url}`);
  console.log('');
});

console.log('✅ CloudFront test completed!');
console.log('\nExpected URL format for your domain:');
console.log('https://d1ta1qd8y4woyq.cloudfront.net/categories/Cyberpunk%20city.mp4');
