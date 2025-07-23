const passport = require('passport');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../middleware/auth');
const User = require('../models/User');
const { getPackageFilter } = require('../config/packages');

// @desc    Initiate Google OAuth
// @route   GET /api/auth/google
// @access  Public
const googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email']
});

// @desc    Google OAuth callback
// @route   GET /api/auth/google/callback
// @access  Public
const googleCallback = (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user, info) => {
    if (err) {
      console.error('Google OAuth error:', err);
      return res.redirect(`${process.env.CLIENT_URL}/auth/error?message=Authentication failed`);
    }

    if (!user) {
      return res.redirect(`${process.env.CLIENT_URL}/auth/error?message=Authentication failed`);
    }

    // Generate JWT token
    const token = generateToken(user._id);

    // Redirect to frontend with token
    res.redirect(`${process.env.CLIENT_URL}/auth/success?token=${token}`);
  })(req, res, next);
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    // Get user with package filtering for security
    const packageFilter = getPackageFilter(req.packageId);
    const user = await User.findOne({
      _id: req.user.id,
      ...packageFilter
    })
      .populate('subscription')
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user,
        isSubscribed: user.subscription ? user.subscription.isActive() : false
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    // In a stateless JWT system, logout is handled on the client side
    // by removing the token. We can optionally blacklist the token here.

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, preferences } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (preferences) updateData.preferences = { ...req.user.preferences, ...preferences };

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete user account
// @route   DELETE /api/auth/account
// @access  Private
const deleteAccount = async (req, res) => {
  try {
    // Cancel active subscription if exists
    if (req.user.subscription) {
      const Subscription = require('../models/Subscription');
      const subscription = await Subscription.findById(req.user.subscription);
      if (subscription && subscription.isActive()) {
        await subscription.cancel('Account deletion');
      }
    }

    // Soft delete - deactivate account
    await User.findByIdAndUpdate(req.user.id, {
      isActive: false,
      email: `deleted_${Date.now()}_${req.user.email}` // Prevent email conflicts
    });

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user statistics
// @route   GET /api/auth/stats
// @access  Private
const getUserStats = async (req, res) => {
  try {
    const Video = require('../models/Video');
    const Subscription = require('../models/Subscription');

    // Get package filter for multi-tenant support
    const packageFilter = getPackageFilter(req.packageId);

    // Get user's subscription history with package filtering
    const subscriptions = await Subscription.find({
      ...packageFilter,
      user: req.user.id
    }).sort({ createdAt: -1 });

    // Get video watch statistics (this would require a separate model for tracking)
    // For now, we'll return basic stats
    const stats = {
      joinDate: req.user.createdAt,
      lastLogin: req.user.lastLogin,
      subscriptionHistory: subscriptions,
      currentSubscription: req.user.subscription,
      totalSubscriptions: subscriptions.length
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Register user with email and password
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password, username } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check if user already exists with package ID validation
    const packageFilter = getPackageFilter(req.packageId);

    // Build the query conditions
    const orConditions = [{ email: email }];

    // Only check username if it's provided
    if (username) {
      orConditions.push({ username: username });
    }

    const query = {
      ...packageFilter,
      $or: orConditions
    };

    const existingUser = await User.findOne(query);

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email/username already exists'
      });
    }

    // Create new user with package ID
    const user = await User.create({
      packageId: req.packageId,
      name,
      email: email.toLowerCase(),
      username: username,
      password, // Will be hashed by pre-save middleware
      role: 'user',
      provider: 'local',
      isVerified: true, // Set to true for now, can be changed later for email verification
      isActive: true,
      lastLogin: new Date()
    });

    // Generate JWT token
    const token = generateToken(user._id);

    // Remove password from response
    user.password = undefined;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          username: user.username,
          role: user.role,
          provider: user.provider,
          isVerified: user.isVerified,
          createdAt: user.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Register error:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
};

// @desc    Login user with email and password
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user by email with package ID validation and include password field
    const packageFilter = getPackageFilter(req.packageId);
    const user = await User.findOne({
      ...packageFilter,
      email: email.toLowerCase(),
      provider: 'local',
      isActive: true
    }).select('+password').populate('subscription');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    // Remove password from response
    user.password = undefined;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          username: user.username,
          profilePicture: user.profilePicture,
          role: user.role,
          provider: user.provider,
          isVerified: user.isVerified,
          lastLogin: user.lastLogin,
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
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
};

module.exports = {
  googleAuth,
  googleCallback,
  getMe,
  logout,
  updateProfile,
  deleteAccount,
  getUserStats,
  register,
  login
};
