const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const passport = require('passport');
require('dotenv').config();

// Import configurations
require('./config/passport');
const connectDB = require('./config/database');
const { specs, swaggerUi, swaggerOptions } = require('./config/swagger');

// Import routes
const authRoutes = require('./routes/auth');
const androidAuthRoutes = require('./routes/androidAuth');
const adminAuthRoutes = require('./routes/adminAuth');
const categoryRoutes = require('./routes/categories');
const topicRoutes = require('./routes/topics');
const videoRoutes = require('./routes/videos');
const questionnaireRoutes = require('./routes/questionnaires');
const mcqRoutes = require('./routes/mcqs');
const learningModuleRoutes = require('./routes/learningModules');
const textContentRoutes = require('./routes/textContent');
const subscriptionRoutes = require('./routes/subscriptions');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/users');
const uploadRoutes = require('./routes/upload');
const notificationRoutes = require('./routes/notifications');
const webhookRoutes = require('./routes/webhooks');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');
const { processPackageId, optionalPackageId } = require('./middleware/packageId');

// Import services
const PaymentService = require('./services/paymentService');

const app = express();

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet());

// Enhanced CORS configuration for web platforms
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Define allowed origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:8080',
      'http://localhost:8081',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:8080',
      // Add your production domains here
      process.env.CLIENT_URL,
      process.env.FRONTEND_URL,
      process.env.WEB_URL,
      process.env.ADMIN_DASHBOARD_URL,
      // Additional origins from environment variable
      ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim()) : []),
      // Allow any localhost with different ports for development
      ...(process.env.NODE_ENV === 'development' ? [
        /^http:\/\/localhost:\d+$/,
        /^http:\/\/127\.0\.0\.1:\d+$/,
        /^https:\/\/localhost:\d+$/,
        /^https:\/\/127\.0\.0\.1:\d+$/
      ] : [])
    ].filter(Boolean); // Remove undefined values

    // Check if origin is allowed
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return origin === allowedOrigin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      console.log(`🚫 CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-Access-Token',
    'X-Key',
    'X-Auth-Token',
    'X-Package-ID'
  ],
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset'
  ],
  optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Data sanitization
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// Compression middleware
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Passport middleware
app.use(passport.initialize());

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerOptions));

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Seekho Backend API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    documentation: `${req.protocol}://${req.get('host')}/api-docs`
  });
});

// API routes with package ID middleware
app.use('/api/auth', optionalPackageId, authRoutes);
app.use('/api/auth/android', processPackageId, androidAuthRoutes);
app.use('/api/auth/admin', optionalPackageId, adminAuthRoutes);
app.use('/api/categories', optionalPackageId, categoryRoutes);
app.use('/api/topics', optionalPackageId, topicRoutes);
app.use('/api/videos', optionalPackageId, videoRoutes);
app.use('/api/questionnaires', optionalPackageId, questionnaireRoutes);
app.use('/api/mcqs', optionalPackageId, mcqRoutes);
app.use('/api/learning-modules', optionalPackageId, learningModuleRoutes);
app.use('/api/text-content', optionalPackageId, textContentRoutes);
app.use('/api/subscriptions', processPackageId, subscriptionRoutes);
app.use('/api/admin', optionalPackageId, adminRoutes);
app.use('/api/users', processPackageId, userRoutes);
app.use('/api/upload', processPackageId, uploadRoutes);
app.use('/api/notifications', processPackageId, notificationRoutes);
app.use('/api/webhooks', optionalPackageId, webhookRoutes);

// Payment Microservice callback routes (no package ID middleware needed)
app.use('/api', webhookRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);

  // Initialize PaymentService with predefined plan validation
  try {
    PaymentService.initialize();
  } catch (error) {
    console.error('⚠️  PaymentService initialization failed, but server will continue:', error.message);
  }

  // Note: Subscription renewals and billing are handled automatically by Razorpay
  console.log('💳 Subscription management handled by Razorpay webhooks');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log(`Error: ${err.message}`);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log(`Error: ${err.message}`);
  process.exit(1);
});

module.exports = app;