# Seekho Backend - Learning Video Platform

A complete Node.js backend system for a learning video platform like Seekho, featuring user authentication, subscription management, and content delivery.

## 🚀 Features

### Authentication & User Management
- Google OAuth 2.0 integration with JWT tokens
- **Username/Password Login** for admin management
- **Android Google Sign-In** support with ID token verification
- User profile management
- Role-based access control (User/Admin)
- **Admin Management System** - Create/remove admin accounts

### Content Management
- **Categories**: Organize content by subjects (Gaming, Astrology, English, etc.)
- **Topics**: Group related videos within categories
- **Videos**: Individual learning content with metadata
- Hierarchical content structure with proper relationships

### Subscription System
- **Trial**: ₹1 for 7 days
- **Monthly**: ₹199/month with auto-renewal
- **Yearly**: ₹1912/year (20% discount)
- Razorpay payment integration
- Subscription status tracking and management

### Access Control
- Video locking/unlocking based on subscription status
- Free content available to all users
- Premium content requires active subscription

### Admin Dashboard
- User management and analytics
- **Enhanced Category Management**: Create, update, reorder, and analyze categories
- Content creation and management with file uploads
- Subscription analytics and revenue tracking
- Comprehensive dashboard with statistics
- **File Upload System**: AWS S3 integration for thumbnails, videos, and documents

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Passport.js (Google OAuth), JWT
- **Payment**: Razorpay integration
- **Security**: Helmet, CORS, Rate limiting, Input sanitization
- **Validation**: Express-validator
- **File Upload**: AWS S3, Multer, Multer-S3
- **Documentation**: Swagger/OpenAPI 3.0

## 📁 Project Structure

```
seekho-backend/
├── config/
│   ├── database.js          # MongoDB connection
│   └── passport.js          # Passport strategies
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── categoryController.js # Category management
│   ├── topicController.js   # Topic management
│   ├── videoController.js   # Video management
│   ├── subscriptionController.js # Subscription logic
│   └── adminController.js   # Admin operations
├── middleware/
│   ├── auth.js             # Authentication middleware
│   ├── validation.js       # Input validation
│   ├── errorHandler.js     # Error handling
│   └── notFound.js         # 404 handler
├── models/
│   ├── User.js             # User schema
│   ├── Category.js         # Category schema
│   ├── Topic.js            # Topic schema
│   ├── Video.js            # Video schema
│   └── Subscription.js     # Subscription schema
├── routes/
│   ├── auth.js             # Auth routes
│   ├── categories.js       # Category routes
│   ├── topics.js           # Topic routes
│   ├── videos.js           # Video routes
│   ├── subscriptions.js    # Subscription routes
│   ├── users.js            # User routes
│   └── admin.js            # Admin routes
├── services/
│   ├── paymentService.js   # Payment processing
│   ├── subscriptionService.js # Subscription logic
│   └── uploadService.js    # AWS S3 file upload
├── seeds/
│   └── seedData.js         # Sample data seeding
├── utils/
│   └── helpers.js          # Utility functions
├── config/
│   ├── database.js         # MongoDB connection
│   ├── passport.js         # Authentication strategies
│   └── swagger.js          # API documentation config
├── scripts/
│   ├── setup.sh            # Setup script
│   └── test-api.js         # API testing script
├── .env.example            # Environment variables template
├── server.js               # Application entry point
└── package.json            # Dependencies and scripts
```

## 🚦 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Google OAuth credentials (Web + Android)
- Razorpay account
- AWS S3 bucket for file storage

### 📱 For Android Integration
See [ANDROID_INTEGRATION.md](./ANDROID_INTEGRATION.md) for complete Android setup guide.

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd seekho-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Google OAuth Setup (Automated)**
   ```bash
   # Run the automated setup script
   chmod +x scripts/setup-google-oauth.sh
   ./scripts/setup-google-oauth.sh
   ```

   Or manually copy and fill environment variables:
   ```bash
   cp .env.example .env
   ```
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/seekho-backend
   JWT_SECRET=your-super-secret-jwt-key
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   RAZORPAY_KEY_ID=your-razorpay-key-id
   RAZORPAY_KEY_SECRET=your-razorpay-key-secret
   AWS_ACCESS_KEY_ID=your-aws-access-key
   AWS_SECRET_ACCESS_KEY=your-aws-secret-key
   AWS_S3_BUCKET_NAME=your-s3-bucket-name
   # ... other variables
   ```

4. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   ```

5. **Seed the database**
   ```bash
   npm run seed
   ```

6. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 📚 API Documentation

### 🌐 Interactive Documentation
Access the complete interactive API documentation at: `http://localhost:5000/api-docs`

The Swagger UI provides:
- Complete endpoint documentation
- Request/response schemas
- Interactive testing interface
- Authentication support
- Example requests and responses

### Authentication Endpoints
```
# Web Authentication
POST /api/auth/google              # Initiate Google OAuth
GET  /api/auth/google/callback     # Google OAuth callback
GET  /api/auth/me                  # Get current user
POST /api/auth/logout              # Logout user
PUT  /api/auth/profile             # Update profile

# Android Authentication
POST /api/auth/android/google      # Authenticate with Google ID token
POST /api/auth/android/refresh     # Refresh JWT token
GET  /api/auth/android/config      # Get Android app configuration
POST /api/auth/android/logout      # Android logout
DELETE /api/auth/android/account   # Delete Android account

# Admin Authentication (Username/Password)
POST /api/auth/admin/login         # Admin login with username/password
POST /api/auth/admin/create        # Create new admin user
GET  /api/auth/admin/list          # List all admin users
DELETE /api/auth/admin/remove/:id  # Remove admin user
PUT  /api/auth/admin/change-password # Change admin password
```

### Content Endpoints
```
GET  /api/categories               # List categories
GET  /api/categories/:id           # Get category details
GET  /api/categories/:id/topics    # Get topics in category

GET  /api/topics                   # List topics
GET  /api/topics/:id               # Get topic details
GET  /api/topics/:id/videos        # Get videos in topic

GET  /api/videos                   # List videos
GET  /api/videos/:id               # Get video details
POST /api/videos/:id/view          # Record video view
```

### Subscription Endpoints
```
GET  /api/subscriptions/plans      # Get subscription plans
POST /api/subscriptions/create-order # Create payment order
POST /api/subscriptions/verify-payment # Verify payment
GET  /api/subscriptions/status     # Get subscription status
POST /api/subscriptions/cancel     # Cancel subscription
```

### Admin Endpoints
```
GET  /api/admin/dashboard          # Admin dashboard
GET  /api/admin/users              # Manage users
GET  /api/admin/categories         # Get all categories (admin)
POST /api/admin/categories         # Create category
PUT  /api/admin/categories/:id     # Update category
PUT  /api/admin/categories/reorder # Reorder categories
GET  /api/admin/categories/:id/analytics # Category analytics
POST /api/admin/topics             # Create topic
POST /api/admin/videos             # Create video
```

### File Upload Endpoints
```
POST /api/upload/category-thumbnail # Upload category thumbnail
POST /api/upload/topic-thumbnail   # Upload topic thumbnail
POST /api/upload/video             # Upload video file
POST /api/upload/video-thumbnail   # Upload video thumbnail
POST /api/upload/avatar            # Upload user avatar
GET  /api/upload/files             # List uploaded files
DELETE /api/upload/delete          # Delete uploaded file
```

## 🔒 Security Features

- **Authentication**: JWT-based authentication with Google OAuth
- **Authorization**: Role-based access control
- **Input Validation**: Comprehensive input validation and sanitization
- **Rate Limiting**: API rate limiting to prevent abuse
- **Security Headers**: Helmet.js for security headers
- **CORS**: Configured CORS for cross-origin requests
- **Data Sanitization**: MongoDB injection prevention

## 💳 Payment Integration

### Razorpay Setup
1. Create a Razorpay account
2. Get API keys from dashboard
3. Configure webhook endpoints for payment verification
4. Test with Razorpay test mode

### Subscription Flow
1. User selects a plan
2. Frontend calls `/api/subscriptions/create-order`
3. Razorpay payment gateway handles payment
4. Frontend calls `/api/subscriptions/verify-payment`
5. Backend verifies payment and creates subscription

## 👨‍💼 Admin Management

### Hardcoded Super Admin
The system includes a hardcoded super admin account:

```
Username: superadmin
Password: SuperAdmin@123
Email: superadmin@seekho.com
```

**Important**: Change these credentials in production!

### Admin Management Features
- ✅ **Username/Password Login** for admins
- ✅ **Create/Remove Admin Users**
- ✅ **Password Management** with strong requirements
- ✅ **Super Admin Protection** (cannot be deleted)
- ✅ **Role-Based Access Control**

For complete admin management guide, see [ADMIN_MANAGEMENT.md](./ADMIN_MANAGEMENT.md)

## 🎯 Usage Examples

### Admin Login
```javascript
// Login as admin
const response = await fetch('/api/auth/admin/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'superadmin',
    password: 'SuperAdmin@123'
  })
});

const { data } = await response.json();
const adminToken = data.token;
```

### Creating a Subscription
```javascript
// Create order
const orderResponse = await fetch('/api/subscriptions/create-order', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ plan: 'monthly' })
});

// After payment success, verify
const verifyResponse = await fetch('/api/subscriptions/verify-payment', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    razorpay_order_id: 'order_id',
    razorpay_payment_id: 'payment_id',
    razorpay_signature: 'signature',
    plan: 'monthly'
  })
});
```

### Checking Video Access
```javascript
const accessResponse = await fetch(`/api/users/me/videos/${videoId}/unlock`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { hasAccess } = await accessResponse.json();
```

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Test API endpoints
curl -X GET http://localhost:5000/api/categories
```

## 📊 Admin Features

- **Dashboard**: Overview of users, content, and revenue
- **User Management**: View and manage user accounts
- **Content Management**: Create, update, and delete categories, topics, and videos
- **Analytics**: Subscription analytics and revenue tracking
- **Access Control**: Manage video lock/unlock status

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=strong-production-secret
# ... other production variables
```

### Deployment Platforms
- **Heroku**: Easy deployment with MongoDB Atlas
- **AWS**: EC2 with RDS/DocumentDB
- **DigitalOcean**: Droplets with managed databases
- **Vercel**: Serverless deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**Built with ❤️ for the Seekho learning platform**
