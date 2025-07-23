const User = require('../models/User');
const { getPackageFilter } = require('../config/packages');

// @desc    Update user onboarding data
// @route   PUT /api/onboarding
// @access  Private (requires authentication)
const updateOnboarding = async (req, res) => {
  try {
    const { name, number, class: userClass, parentAge } = req.body;
    
    // Get package filter for multi-tenant support
    const packageFilter = getPackageFilter(req.packageId);
    
    // Check if user exists and belongs to the correct package
    const user = await User.findOne({
      _id: req.user._id,
      ...packageFilter
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if phone number is already taken by another user in the same package
    if (number) {
      const existingUser = await User.findOne({
        ...packageFilter,
        number: number,
        _id: { $ne: req.user._id }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is already registered'
        });
      }
    }

    // Update user with onboarding data
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        name,
        number,
        class: userClass,
        parentAge
      },
      {
        new: true,
        runValidators: true
      }
    ).select('-password -resetPasswordToken -resetPasswordExpire -emailVerificationToken -emailVerificationExpire');

    res.status(200).json({
      success: true,
      message: 'Onboarding data updated successfully',
      data: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        number: updatedUser.number,
        class: updatedUser.class,
        parentAge: updatedUser.parentAge,
        packageId: updatedUser.packageId,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      }
    });

  } catch (error) {
    console.error('Update onboarding error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating onboarding data'
    });
  }
};

module.exports = {
  updateOnboarding
};
