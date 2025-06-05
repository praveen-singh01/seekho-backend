const passport = require('passport');
const { generateToken } = require('../middleware/auth');
const User = require('../models/User');

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
    const user = await User.findById(req.user.id)
      .populate('subscription')
      .select('-password');

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

    // Get user's subscription history
    const subscriptions = await Subscription.find({ user: req.user.id })
      .sort({ createdAt: -1 });

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

module.exports = {
  googleAuth,
  googleCallback,
  getMe,
  logout,
  updateProfile,
  deleteAccount,
  getUserStats
};
