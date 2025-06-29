const { OAuth2Client } = require('google-auth-library');
const { generateToken } = require('../middleware/auth');
const User = require('../models/User');
const { getPackageFilter } = require('../config/packages');

// Initialize Google OAuth client for Android
const androidClient = process.env.ANDROID_CLIENT_ID ? new OAuth2Client(process.env.ANDROID_CLIENT_ID) : null;

// @desc    Verify Google token from Android app
// @route   POST /api/auth/android/google
// @access  Public
const verifyAndroidGoogleToken = async (req, res) => {
  try {
    // Enhanced environment validation
    if (!process.env.ANDROID_CLIENT_ID) {
      console.error('❌ ANDROID_CLIENT_ID not set in environment variables');
      return res.status(500).json({
        success: false,
        message: 'Android OAuth not configured. Please set ANDROID_CLIENT_ID in environment variables.',
        error: 'MISSING_ANDROID_CLIENT_ID'
      });
    }

    if (!androidClient) {
      console.error('❌ Android OAuth client not initialized');
      return res.status(500).json({
        success: false,
        message: 'Android OAuth client not initialized.',
        error: 'CLIENT_NOT_INITIALIZED'
      });
    }

    const { idToken } = req.body;

    if (!idToken) {
      console.error('❌ No ID token provided in request');
      return res.status(400).json({
        success: false,
        message: 'Google ID token is required',
        error: 'MISSING_ID_TOKEN'
      });
    }

    console.log('🔍 Processing Google ID token for Android...');
    console.log('📱 Client ID:', process.env.ANDROID_CLIENT_ID);
    console.log('🎫 Token length:', idToken.length);

    let payload;

    // Check if we should skip verification (for testing)
    if (process.env.SKIP_GOOGLE_VERIFICATION === 'true') {
      console.log('⚠️  SKIPPING Google token verification (testing mode)');

      try {
        // Decode token without verification (for testing only)
        const tokenParts = idToken.split('.');
        if (tokenParts.length !== 3) {
          throw new Error('Invalid token format - must have 3 parts');
        }

        const payloadBase64 = tokenParts[1];
        const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf8');
        payload = JSON.parse(payloadJson);

        console.log('🔓 Token decoded without verification');
      } catch (decodeError) {
        console.error('❌ Failed to decode token:', decodeError.message);
        return res.status(400).json({
          success: false,
          message: 'Invalid token format - cannot decode',
          error: 'INVALID_TOKEN_FORMAT'
        });
      }
    } else {
      console.log('🔒 Verifying token with Google...');

      // Verify the token with Google (production mode)
      const ticket = await androidClient.verifyIdToken({
        idToken: idToken,
        audience: process.env.ANDROID_CLIENT_ID
      });

      payload = ticket.getPayload();

      if (!payload) {
        console.error('❌ Invalid token payload received from Google');
        return res.status(400).json({
          success: false,
          message: 'Invalid Google token - no payload received',
          error: 'INVALID_TOKEN_PAYLOAD'
        });
      }

      console.log('✅ Token verified successfully with Google');
    }

    console.log('👤 User info:', {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name
    });

    const { sub: googleId, email, name, picture } = payload;

    // Check if user already exists with package ID validation
    const packageFilter = getPackageFilter(req.packageId);
    let user = await User.findOne({ ...packageFilter, googleId });

    if (user) {
      // Update last login
      user.lastLogin = new Date();
      await user.save();
    } else {
      // Check if user exists with same email in this package
      user = await User.findOne({ ...packageFilter, email });

      if (user) {
        // Link Google account to existing user
        user.googleId = googleId;
        user.profilePicture = picture;
        user.lastLogin = new Date();
        await user.save();
      } else {
        // Create new user with package ID
        user = await User.create({
          packageId: req.packageId,
          googleId,
          name,
          email,
          profilePicture: picture,
          provider: 'google',
          isVerified: true,
          lastLogin: new Date()
        });
      }
    }

    // Generate JWT token
    const token = generateToken(user._id);

    // Get user with subscription info
    await user.populate('subscription');

    res.status(200).json({
      success: true,
      message: 'Authentication successful',
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          profilePicture: user.profilePicture,
          role: user.role,
          isVerified: user.isVerified,
          createdAt: user.createdAt
        },
        subscription: {
          hasSubscription: !!user.subscription,
          isActive: user.subscription ? user.subscription.isActive() : false,
          plan: user.subscription?.plan,
          endDate: user.subscription?.endDate
        }
      }
    });

  } catch (error) {
    console.error('❌ Android Google auth error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    // Handle specific Google Auth errors
    if (error.message.includes('Token used too late') || error.message.includes('exp')) {
      return res.status(400).json({
        success: false,
        message: 'Token expired. Please try logging in again.',
        error: 'TOKEN_EXPIRED'
      });
    }

    if (error.message.includes('Invalid token') || error.message.includes('Wrong number of segments')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Google token format',
        error: 'INVALID_TOKEN_FORMAT'
      });
    }

    if (error.message.includes('Invalid audience')) {
      return res.status(400).json({
        success: false,
        message: 'Token audience mismatch. Please check your Android app configuration.',
        error: 'AUDIENCE_MISMATCH'
      });
    }

    if (error.message.includes('Invalid issuer')) {
      return res.status(400).json({
        success: false,
        message: 'Token issuer invalid. Token must be from Google.',
        error: 'INVALID_ISSUER'
      });
    }

    // Database errors
    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      return res.status(500).json({
        success: false,
        message: 'Database error occurred during authentication',
        error: 'DATABASE_ERROR'
      });
    }

    // Generic error response
    res.status(500).json({
      success: false,
      message: 'Authentication failed. Please try again.',
      error: 'AUTHENTICATION_FAILED',
      ...(process.env.NODE_ENV === 'development' && {
        details: error.message
      })
    });
  }
};

// @desc    Refresh user token
// @route   POST /api/auth/android/refresh
// @access  Private
const refreshToken = async (req, res) => {
  try {
    // Get user from the protect middleware with package validation
    const packageFilter = getPackageFilter(req.packageId);
    const user = await User.findOne({ _id: req.user.id, ...packageFilter }).populate('subscription');
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    // Generate new token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          profilePicture: user.profilePicture,
          role: user.role,
          isVerified: user.isVerified
        },
        subscription: {
          hasSubscription: !!user.subscription,
          isActive: user.subscription ? user.subscription.isActive() : false,
          plan: user.subscription?.plan,
          endDate: user.subscription?.endDate
        }
      }
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Token refresh failed'
    });
  }
};

// @desc    Get Android app configuration
// @route   GET /api/auth/android/config
// @access  Public
const getAndroidConfig = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        androidClientId: process.env.ANDROID_CLIENT_ID,
        packageName: process.env.ANDROID_PACKAGE_NAME,
        deepLink: process.env.ANDROID_DEEP_LINK,
        subscriptionPlans: {
          trial: {
            price: 1,
            duration: '7 days',
            priceInPaise: 100
          },
          monthly: {
            price: 199,
            duration: '1 month',
            priceInPaise: 19900
          },
          yearly: {
            price: 1912,
            duration: '12 months',
            priceInPaise: 191200,
            discount: '20%'
          }
        }
      }
    });
  } catch (error) {
    console.error('Get Android config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get configuration'
    });
  }
};

// @desc    Logout user (invalidate token on client side)
// @route   POST /api/auth/android/logout
// @access  Private
const logoutAndroid = async (req, res) => {
  try {
    // In a stateless JWT system, logout is handled on the client side
    // Optionally, you can maintain a blacklist of tokens here
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Android logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
};

// @desc    Delete Android user account
// @route   DELETE /api/auth/android/account
// @access  Private
const deleteAndroidAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Cancel active subscription if exists
    if (user.subscription) {
      const Subscription = require('../models/Subscription');
      const subscription = await Subscription.findById(user.subscription);
      if (subscription && subscription.isActive()) {
        await subscription.cancel('Account deletion');
      }
    }

    // Soft delete - deactivate account
    await User.findByIdAndUpdate(req.user.id, { 
      isActive: false,
      email: `deleted_${Date.now()}_${user.email}`,
      googleId: null // Remove Google ID to allow re-registration
    });

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete Android account error:', error);
    res.status(500).json({
      success: false,
      message: 'Account deletion failed'
    });
  }
};

module.exports = {
  verifyAndroidGoogleToken,
  refreshToken,
  getAndroidConfig,
  logoutAndroid,
  deleteAndroidAccount
};
