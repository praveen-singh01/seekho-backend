const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getPackageFilter } = require('../config/packages');

// Protect routes - require authentication
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token - first try without package filtering
      let user = await User.findOne({ _id: decoded.id }).populate('subscription');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Token is not valid. User not found.'
        });
      }

      // Check if user belongs to the correct package (only if package ID is provided)
      if (req.packageId && user.role !== 'admin') {
        // For multi-tenant apps, verify user belongs to the requested package
        if (user.packageId && user.packageId !== req.packageId) {
          return res.status(403).json({
            success: false,
            message: 'Access denied. Package ID mismatch.',
            code: 'PACKAGE_ID_MISMATCH'
          });
        }

        // If user doesn't have packageId set, allow access but log it
        if (!user.packageId) {
          console.log(`⚠️  User ${user._id} doesn't have packageId set, allowing access to ${req.packageId}`);
        }
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated.'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid.'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

// Optional authentication - doesn't require token but sets user if present
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        let user = await User.findOne({ _id: decoded.id }).populate('subscription');

        if (user && user.isActive) {
          // Admin users can access all packages
          if (user.role === 'admin') {
            req.user = user;
          }
          // For regular users, check package access if package ID is provided
          else if (!req.packageId || !user.packageId || user.packageId === req.packageId) {
            req.user = user;
          }
          // If package mismatch, don't attach user but don't fail (optional auth)
        }
      } catch (error) {
        // Invalid token, but continue without user
        console.log('Invalid token in optional auth:', error.message);
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
};

// Authorize specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' is not authorized.`
      });
    }

    next();
  };
};

// Check if user has active subscription
const requireSubscription = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    const subscription = await req.user.getActiveSubscription();
    
    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: 'Active subscription required to access this content.',
        code: 'SUBSCRIPTION_REQUIRED'
      });
    }

    req.subscription = subscription;
    next();
  } catch (error) {
    console.error('Subscription middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error checking subscription'
    });
  }
};

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

module.exports = {
  protect,
  optionalAuth,
  authorize,
  requireSubscription,
  generateToken
};
