# CloudFront Setup for Video Streaming

This document explains how to set up AWS CloudFront for efficient video streaming in the Seekho backend.

## Why CloudFront?

1. **Performance**: Global edge locations for faster video delivery
2. **Cost Optimization**: Reduces S3 data transfer costs
3. **Security**: Signed URLs for access control
4. **Scalability**: Handles high traffic loads
5. **Video Features**: Supports adaptive bitrate streaming

## Setup Steps

### 1. Create CloudFront Distribution

1. Go to AWS CloudFront Console
2. Click "Create Distribution"
3. Configure the following settings:

#### Origin Settings
- **Origin Domain**: `your-s3-bucket-name.s3.amazonaws.com`
- **Origin Path**: Leave empty (or `/videos` if you want to serve only videos folder)
- **Origin Access**: Use OAC (Origin Access Control) - Recommended
- **Origin Access Control**: Create new OAC for your S3 bucket

#### Default Cache Behavior
- **Viewer Protocol Policy**: Redirect HTTP to HTTPS
- **Allowed HTTP Methods**: GET, HEAD, OPTIONS
- **Cache Policy**: Managed-CachingOptimized
- **Origin Request Policy**: Managed-CORS-S3Origin
- **Response Headers Policy**: Managed-SimpleCORS

#### Distribution Settings
- **Price Class**: Use all edge locations (or choose based on your audience)
- **Alternate Domain Names (CNAMEs)**: Optional - your custom domain
- **SSL Certificate**: Default CloudFront certificate (or custom if using CNAME)

### 2. Configure S3 Bucket Policy

Update your S3 bucket policy to allow CloudFront OAC access:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowCloudFrontServicePrincipal",
            "Effect": "Allow",
            "Principal": {
                "Service": "cloudfront.amazonaws.com"
            },
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::your-bucket-name/*",
            "Condition": {
                "StringEquals": {
                    "AWS:SourceArn": "arn:aws:cloudfront::your-account-id:distribution/your-distribution-id"
                }
            }
        }
    ]
}
```

### 3. Create CloudFront Key Pair (for Signed URLs)

1. Go to AWS CloudFront Console
2. Navigate to "Key Management" → "Key Groups"
3. Create a new key group
4. Generate a new public/private key pair
5. Download the private key file

### 4. Environment Configuration

Add the following to your `.env` file:

```env
# AWS CloudFront Configuration
CLOUDFRONT_DISTRIBUTION_DOMAIN=d1ta1qd8y4woyq.cloudfront.net
CLOUDFRONT_KEY_PAIR_ID=your-key-pair-id
CLOUDFRONT_PRIVATE_KEY_PATH=./config/cloudfront-private-key.pem
# OR use base64 encoded key
CLOUDFRONT_PRIVATE_KEY_BASE64=your-base64-encoded-private-key
```

**Note**: Your CloudFront distribution is already set up at `d1ta1qd8y4woyq.cloudfront.net`.
If you only need public URLs (no access control), you can omit the key pair configuration.

### 5. Store Private Key Securely

Option 1: File-based (Development)
```bash
mkdir -p config
# Copy your private key file to config/cloudfront-private-key.pem
```

Option 2: Environment Variable (Production)
```bash
# Convert private key to base64
base64 -i cloudfront-private-key.pem | tr -d '\n'
# Add the output to CLOUDFRONT_PRIVATE_KEY_BASE64 environment variable
```

## Video Upload Workflow

### Current Workflow
1. Admin uploads video → S3
2. Video URL stored in database
3. Frontend requests video → Direct S3 URL

### New CloudFront Workflow
1. Admin uploads video → S3
2. Video URL stored in database (S3 URL)
3. Frontend requests video → Backend generates CloudFront signed URL
4. Video served via CloudFront edge locations

## API Changes

### Video Streaming Endpoint
```
GET /api/videos/:id/stream
```

**Response with CloudFront:**
```json
{
  "success": true,
  "data": {
    "streamUrl": "https://d1ta1qd8y4woyq.cloudfront.net/videos/video.mp4?Policy=...&Signature=...&Key-Pair-Id=...",
    "qualityUrls": {
      "1080p": "https://d1ta1qd8y4woyq.cloudfront.net/videos/video-1080p.mp4?...",
      "720p": "https://d1ta1qd8y4woyq.cloudfront.net/videos/video-720p.mp4?...",
      "480p": "https://d1ta1qd8y4woyq.cloudfront.net/videos/video-480p.mp4?..."
    },
    "qualities": ["1080p", "720p", "480p", "360p"],
    "duration": 1800,
    "thumbnail": "https://d1ta1qd8y4woyq.cloudfront.net/thumbnails/thumb.jpg",
    "metadata": {
      "isCloudFrontEnabled": true,
      "quality": "720p"
    }
  }
}
```

**URL Structure Examples:**
- Public video: `https://d1ta1qd8y4woyq.cloudfront.net/categories/Cyberpunk%20city.mp4`
- Public thumbnail: `https://d1ta1qd8y4woyq.cloudfront.net/categories/Cyberpunk%20city.jpg`
- Premium video (signed): `https://d1ta1qd8y4woyq.cloudfront.net/videos/premium-video.mp4?Policy=...&Signature=...&Key-Pair-Id=...`

## Security Features

### Signed URLs
- URLs expire after 4 hours for videos
- URLs expire after 24 hours for thumbnails
- Access control based on user subscription

### Access Control
- Only authenticated users with valid subscriptions get signed URLs
- Free videos can use public CloudFront URLs
- Premium videos require signed URLs

## Performance Optimizations

### Caching Strategy
- Videos: Long-term caching (1 year)
- Thumbnails: Medium-term caching (1 month)
- Playlists: Short-term caching (1 hour)

### Compression
- Enable Gzip compression for text-based files
- Use appropriate video encoding (H.264/H.265)

## Monitoring

### CloudWatch Metrics
- Monitor cache hit ratio
- Track origin requests
- Monitor error rates

### Cost Optimization
- Use appropriate price class
- Monitor data transfer costs
- Implement cache invalidation strategies

## Troubleshooting

### Common Issues
1. **403 Forbidden**: Check S3 bucket policy and OAC configuration
2. **Signed URL Invalid**: Verify key pair ID and private key
3. **Slow Performance**: Check cache hit ratio and origin response times

### Testing
```bash
# Test CloudFront URL
curl -I "https://your-distribution.cloudfront.net/videos/test-video.mp4"

# Test signed URL generation
node -e "
const { generateSignedUrl } = require('./services/cloudfrontService');
console.log(generateSignedUrl('videos/test-video.mp4'));
"
```

## Migration Strategy

1. **Phase 1**: Deploy CloudFront service (fallback to S3)
2. **Phase 2**: Test with subset of videos
3. **Phase 3**: Enable for all videos
4. **Phase 4**: Optimize caching and performance

## Next Steps

1. Set up video transcoding for multiple qualities
2. Implement HLS streaming for adaptive bitrate
3. Add video analytics and monitoring
4. Implement progressive video upload
