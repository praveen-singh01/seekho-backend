const bcrypt = require('bcryptjs');
const { generateToken } = require('../middleware/auth');
const User = require('../models/User');

// Hardcoded super admin credentials
const SUPER_ADMIN = {
  username: 'superadmin',
  password: 'SuperAdmin@123', // This will be hashed
  email: 'superadmin@seekho.com',
  name: 'Super Administrator'
};

// @desc    Login with username and password (Admin only)
// @route   POST /api/auth/admin/login
// @access  Public
const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    let user = null;
    let isValidPassword = false;

    // Check if it's the hardcoded super admin
    if (username === SUPER_ADMIN.username) {
      isValidPassword = password === SUPER_ADMIN.password;
      
      if (isValidPassword) {
        // Find or create super admin user
        user = await User.findOne({ email: SUPER_ADMIN.email });
        
        if (!user) {
          // Create super admin user
          const hashedPassword = await bcrypt.hash(SUPER_ADMIN.password, 12);
          user = await User.create({
            name: SUPER_ADMIN.name,
            email: SUPER_ADMIN.email,
            password: hashedPassword,
            role: 'admin',
            provider: 'local',
            isVerified: true,
            isActive: true
          });
        }
        
        // Update last login
        user.lastLogin = new Date();
        await user.save();
      }
    } else {
      // Check database for admin user with username or email
      user = await User.findOne({
        $or: [
          { username: username },
          { email: username }
        ],
        role: 'admin',
        provider: 'local',
        isActive: true
      }).select('+password');

      if (user) {
        isValidPassword = await user.comparePassword(password);
        
        if (isValidPassword) {
          user.lastLogin = new Date();
          await user.save();
        }
      }
    }

    if (!user || !isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

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
          role: user.role,
          provider: user.provider,
          isVerified: user.isVerified,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
};

// @desc    Create new admin user
// @route   POST /api/auth/admin/create
// @access  Private/Admin
const createAdmin = async (req, res) => {
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

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: email },
        { username: username }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email/username already exists'
      });
    }

    // Create new admin user
    const adminUser = await User.create({
      name,
      email: email,
      username: username,
      password, // Will be hashed by pre-save middleware
      role: 'admin',
      provider: 'local',
      isVerified: true,
      isActive: true
    });

    // Remove password from response
    adminUser.password = undefined;

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      data: {
        user: {
          _id: adminUser._id,
          name: adminUser.name,
          email: adminUser.email,
          role: adminUser.role,
          provider: adminUser.provider,
          isVerified: adminUser.isVerified,
          createdAt: adminUser.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Create admin error:', error);
    
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
      message: 'Failed to create admin user'
    });
  }
};

// @desc    Remove admin user
// @route   DELETE /api/auth/admin/remove/:id
// @access  Private/Admin
const removeAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent removing super admin
    const userToRemove = await User.findById(id);
    
    if (!userToRemove) {
      return res.status(404).json({
        success: false,
        message: 'Admin user not found'
      });
    }

    if (userToRemove.email === SUPER_ADMIN.email) {
      return res.status(403).json({
        success: false,
        message: 'Cannot remove super admin user'
      });
    }

    // Prevent removing yourself
    if (userToRemove._id.toString() === req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Cannot remove your own admin account'
      });
    }

    // Check if user is admin
    if (userToRemove.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'User is not an admin'
      });
    }

    // Soft delete - deactivate the admin user
    await User.findByIdAndUpdate(id, { 
      isActive: false,
      email: `deleted_${Date.now()}_${userToRemove.email}`
    });

    res.status(200).json({
      success: true,
      message: 'Admin user removed successfully'
    });

  } catch (error) {
    console.error('Remove admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove admin user'
    });
  }
};

// @desc    Get all admin users
// @route   GET /api/auth/admin/list
// @access  Private/Admin
const getAdminUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const adminUsers = await User.find({ 
      role: 'admin',
      isActive: true
    })
    .select('-password')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await User.countDocuments({ 
      role: 'admin',
      isActive: true
    });

    res.status(200).json({
      success: true,
      count: adminUsers.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      data: adminUsers
    });

  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin users'
    });
  }
};

// @desc    Change admin password
// @route   PUT /api/auth/admin/change-password
// @access  Private/Admin
const changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check current password
    const isValidPassword = await user.comparePassword(currentPassword);

    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword; // Will be hashed by pre-save middleware
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
};

module.exports = {
  adminLogin,
  createAdmin,
  removeAdmin,
  getAdminUsers,
  changeAdminPassword
};
