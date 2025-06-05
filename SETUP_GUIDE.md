# 🚀 Seekho Backend Setup Guide

This guide will help you set up the complete Seekho backend system with all features including Swagger documentation, AWS S3 file uploads, and enhanced admin dashboard.

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- ✅ **Node.js v16+** installed
- ✅ **MongoDB** (local or cloud instance)
- ✅ **Google OAuth 2.0** credentials
- ✅ **Razorpay** account and API keys
- ✅ **AWS S3** bucket and access credentials

## 🔧 Step-by-Step Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd seekho-backend

# Install dependencies
npm install

# Or use the setup script
npm run setup
```

### 2. Environment Configuration

Copy the environment template:
```bash
cp .env.example .env
```

Update `.env` with your credentials:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/seekho-backend
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/seekho-backend

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters

# Google OAuth (Get from Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Frontend URL
CLIENT_URL=http://localhost:3000

# Razorpay Configuration (Get from Razorpay Dashboard)
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# AWS S3 Configuration (Get from AWS IAM)
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=seekho-uploads

# Admin Configuration
ADMIN_EMAIL=admin@seekho.com
ADMIN_PASSWORD=admin123

# Subscription Configuration
TRIAL_PRICE=100  # ₹1 in paise
MONTHLY_PRICE=19900  # ₹199 in paise
TRIAL_DURATION_DAYS=7
```

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set application type to "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:5000/api/auth/google/callback` (development)
   - `https://yourdomain.com/api/auth/google/callback` (production)
7. Copy Client ID and Client Secret to `.env`

### 4. Razorpay Setup

1. Sign up at [Razorpay](https://razorpay.com/)
2. Go to Dashboard → Settings → API Keys
3. Generate Test/Live API keys
4. Copy Key ID and Key Secret to `.env`
5. Configure webhooks (optional):
   - Webhook URL: `https://yourdomain.com/api/webhooks/razorpay`
   - Events: `payment.captured`, `payment.failed`

### 5. AWS S3 Setup

1. Create AWS account and go to [S3 Console](https://s3.console.aws.amazon.com/)
2. Create a new bucket:
   ```
   Bucket name: seekho-uploads (or your preferred name)
   Region: us-east-1 (or your preferred region)
   Public access: Allow public read access for uploaded files
   ```
3. Create IAM user with S3 permissions:
   - Go to IAM → Users → Add User
   - Attach policy: `AmazonS3FullAccess` (or create custom policy)
   - Generate Access Key and Secret
4. Configure bucket CORS:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "POST", "PUT", "DELETE"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": []
     }
   ]
   ```

### 6. Database Setup

**Option A: Local MongoDB**
```bash
# Install MongoDB locally
# macOS
brew install mongodb-community

# Ubuntu
sudo apt install mongodb

# Start MongoDB
mongod
```

**Option B: MongoDB Atlas (Cloud)**
1. Sign up at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a cluster
3. Get connection string and update `MONGODB_URI` in `.env`

### 7. Seed Database

```bash
# Populate database with sample data
npm run seed
```

This creates:
- Admin user (admin@seekho.com / admin123)
- Sample categories, topics, and videos
- Sample user with active subscription

### 8. Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

## 🧪 Testing the Setup

### 1. Health Check
```bash
curl http://localhost:5000/health
```

### 2. API Testing
```bash
# Run comprehensive API tests
npm run test-api
```

### 3. Swagger Documentation
Open your browser and go to: `http://localhost:5000/api-docs`

### 4. Test File Upload
Use Swagger UI or Postman to test file upload endpoints:
- POST `/api/upload/category-thumbnail`
- POST `/api/upload/video`

## 🎯 Key Features to Test

### 1. Authentication Flow
1. Visit: `http://localhost:5000/api/auth/google`
2. Complete Google OAuth
3. Get JWT token from callback
4. Use token to access protected endpoints

### 2. Admin Dashboard
1. Login as admin (admin@seekho.com / admin123)
2. Access admin endpoints:
   - GET `/api/admin/dashboard`
   - GET `/api/admin/categories`
   - POST `/api/admin/categories` (create new category)

### 3. File Upload System
1. Upload category thumbnail
2. Upload video file
3. Upload video thumbnail
4. Verify files in S3 bucket

### 4. Subscription System
1. Create subscription order
2. Simulate payment verification
3. Check video access control

## 🔧 Troubleshooting

### Common Issues

**1. MongoDB Connection Error**
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
Solution: Ensure MongoDB is running or check connection string

**2. Google OAuth Error**
```
Error: redirect_uri_mismatch
```
Solution: Check redirect URI in Google Console matches your callback URL

**3. AWS S3 Upload Error**
```
Error: The AWS Access Key Id you provided does not exist
```
Solution: Verify AWS credentials and bucket permissions

**4. Razorpay Error**
```
Error: Invalid key_id
```
Solution: Check Razorpay API keys and ensure test/live mode consistency

### Debug Mode

Enable debug logging:
```env
NODE_ENV=development
DEBUG=seekho:*
```

### Port Conflicts

If port 5000 is in use:
```env
PORT=3001
```

## 📱 Frontend Integration

To integrate with a frontend application:

1. **Authentication**: Use Google OAuth flow and store JWT token
2. **API Calls**: Include JWT token in Authorization header
3. **File Upload**: Use multipart/form-data for file uploads
4. **Subscription**: Integrate Razorpay checkout on frontend

Example frontend auth flow:
```javascript
// Redirect to Google OAuth
window.location.href = 'http://localhost:5000/api/auth/google';

// Handle callback with token
const token = new URLSearchParams(window.location.search).get('token');
localStorage.setItem('authToken', token);

// Use token for API calls
const response = await fetch('/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## 🚀 Production Deployment

### Environment Variables
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://...
CLIENT_URL=https://yourdomain.com
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback
```

### Security Checklist
- ✅ Use strong JWT secret (32+ characters)
- ✅ Enable HTTPS
- ✅ Configure CORS properly
- ✅ Set up rate limiting
- ✅ Use production MongoDB
- ✅ Configure proper S3 bucket policies
- ✅ Set up monitoring and logging

## 📞 Support

If you encounter issues:

1. Check the logs for error messages
2. Verify all environment variables are set correctly
3. Test individual components (DB, S3, OAuth) separately
4. Use Swagger UI for API testing
5. Check the troubleshooting section above

## 🎉 Success!

If everything is working correctly, you should see:

- ✅ Server running on specified port
- ✅ MongoDB connected
- ✅ Swagger UI accessible
- ✅ Google OAuth working
- ✅ File uploads to S3 working
- ✅ Admin dashboard functional
- ✅ API tests passing

Your Seekho backend is now ready for development and testing!
