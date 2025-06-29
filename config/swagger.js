const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Seekho Backend API',
      version: '2.0.0',
      description: 'A comprehensive multi-tenant learning video platform API supporting both Seekho and Bolo apps with subscription management',
      contact: {
        name: 'Seekho Team',
        email: 'support@seekho.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://your-production-domain.com' 
          : `http://localhost:${process.env.PORT || 5000}`,
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from Google OAuth login'
        }
      },
      parameters: {
        PackageIdHeader: {
          name: 'X-Package-ID',
          in: 'header',
          required: true,
          description: 'Package ID for multi-tenant support. Use "com.gumbo.learning" for Seekho app or "com.gumbo.english" for Bolo app',
          schema: {
            type: 'string',
            enum: ['com.gumbo.learning', 'com.gumbo.english'],
            example: 'com.gumbo.learning'
          }
        },
        OptionalPackageIdHeader: {
          name: 'X-Package-ID',
          in: 'header',
          required: false,
          description: 'Optional Package ID for multi-tenant support. Defaults to "com.gumbo.learning" if not provided',
          schema: {
            type: 'string',
            enum: ['com.gumbo.learning', 'com.gumbo.english'],
            example: 'com.gumbo.learning'
          }
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', example: 'john@example.com' },
            profilePicture: { type: 'string', example: 'https://example.com/avatar.jpg' },
            role: { type: 'string', enum: ['user', 'admin'], example: 'user' },
            isVerified: { type: 'boolean', example: true },
            isActive: { type: 'boolean', example: true },
            provider: { type: 'string', enum: ['local', 'google'], example: 'google' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Category: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            name: { type: 'string', example: 'Gaming' },
            slug: { type: 'string', example: 'gaming' },
            description: { type: 'string', example: 'Learn gaming strategies and techniques' },
            thumbnail: { type: 'string', example: 'https://s3.amazonaws.com/bucket/gaming.jpg' },
            color: { type: 'string', example: '#FF6B6B' },
            isActive: { type: 'boolean', example: true },
            order: { type: 'number', example: 1 },
            metadata: {
              type: 'object',
              properties: {
                totalTopics: { type: 'number', example: 5 },
                totalVideos: { type: 'number', example: 25 },
                totalDuration: { type: 'number', example: 7200 }
              }
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Topic: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            title: { type: 'string', example: 'PUBG Mobile Strategies' },
            slug: { type: 'string', example: 'pubg-mobile-strategies' },
            description: { type: 'string', example: 'Advanced strategies for PUBG Mobile' },
            category: { type: 'string', example: '507f1f77bcf86cd799439011' },
            thumbnail: { type: 'string', example: 'https://s3.amazonaws.com/bucket/topic.jpg' },
            difficulty: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'], example: 'intermediate' },
            estimatedDuration: { type: 'number', example: 120 },
            isPremium: { type: 'boolean', example: true },
            isActive: { type: 'boolean', example: true },
            order: { type: 'number', example: 1 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Video: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            title: { type: 'string', example: 'Landing Strategies' },
            slug: { type: 'string', example: 'landing-strategies' },
            description: { type: 'string', example: 'Learn the best landing spots' },
            topic: { type: 'string', example: '507f1f77bcf86cd799439011' },
            videoUrl: { type: 'string', example: 'https://s3.amazonaws.com/bucket/video.mp4' },
            thumbnail: { type: 'string', example: 'https://s3.amazonaws.com/bucket/thumb.jpg' },
            duration: { type: 'number', example: 600 },
            episodeNumber: { type: 'number', example: 1 },
            isLocked: { type: 'boolean', example: true },
            isFree: { type: 'boolean', example: false },
            quality: { type: 'string', enum: ['360p', '480p', '720p', '1080p'], example: '720p' },
            views: { type: 'number', example: 1250 },
            likes: { type: 'number', example: 89 },
            isActive: { type: 'boolean', example: true },
            hasAccess: { type: 'boolean', example: false, description: 'Whether current user has access' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Subscription: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            user: { type: 'string', example: '507f1f77bcf86cd799439011' },
            plan: { type: 'string', enum: ['trial', 'monthly', 'yearly'], example: 'monthly' },
            status: { type: 'string', enum: ['active', 'cancelled', 'expired', 'pending'], example: 'active' },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
            amount: { type: 'number', example: 19900 },
            currency: { type: 'string', example: 'INR' },
            paymentProvider: { type: 'string', enum: ['razorpay', 'stripe'], example: 'razorpay' },
            autoRenew: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' }
                }
              }
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation successful' },
            data: { type: 'object' }
          }
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            count: { type: 'number', example: 10 },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'number', example: 1 },
                limit: { type: 'number', example: 10 },
                total: { type: 'number', example: 100 },
                pages: { type: 'number', example: 10 }
              }
            },
            data: { type: 'array', items: { type: 'object' } }
          }
        }
      },
      responses: {
        BadRequest: {
          description: 'Bad request',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        Unauthorized: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  message: { type: 'string', example: 'Access denied. No token provided.' }
                }
              }
            }
          }
        },
        Forbidden: {
          description: 'Forbidden',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  message: { type: 'string', example: 'Access denied. Insufficient permissions.' }
                }
              }
            }
          }
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  message: { type: 'string', example: 'Resource not found' }
                }
              }
            }
          }
        },
        ServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  message: { type: 'string', example: 'Server error' }
                }
              }
            }
          }
        }
      }
    },
    tags: [
      { name: 'Authentication', description: 'Web authentication and profile management' },
      { name: 'Android Authentication', description: 'Android app authentication with Google' },
      { name: 'Admin Authentication', description: 'Admin username/password authentication and management' },
      { name: 'Categories', description: 'Content categories management' },
      { name: 'Topics', description: 'Learning topics management' },
      { name: 'Videos', description: 'Video content management' },
      { name: 'Subscriptions', description: 'Subscription and payment management' },
      { name: 'Users', description: 'User profile and preferences' },
      { name: 'Admin', description: 'Administrative operations' },
      { name: 'Upload', description: 'File upload operations' }
    ]
  },
  apis: [
    './routes/*.js',
    './controllers/*.js',
    './models/*.js'
  ]
};

const specs = swaggerJsdoc(options);

const swaggerOptions = {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #3b82f6 }
  `,
  customSiteTitle: 'Seekho API Documentation',
  customfavIcon: '/favicon.ico'
};

module.exports = {
  specs,
  swaggerUi,
  swaggerOptions
};
