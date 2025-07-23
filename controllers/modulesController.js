const LearningModule = require('../models/LearningModule');
const { getPackageFilter } = require('../config/packages');

// @desc    Get modules by class number
// @route   GET /api/modules?class=X
// @access  Public
const getModulesByClass = async (req, res) => {
  try {
    const { class: classNumber } = req.query;
    
    // Get package filter for multi-tenant support
    const packageFilter = getPackageFilter(req.packageId);
    
    // Build query with package ID and class filter
    const query = {
      ...packageFilter,
      classNumber: parseInt(classNumber),
      isActive: true
    };

    // Find modules matching the class number
    const modules = await LearningModule.find(query)
      .populate('topic', 'title slug')
      .select('title slug description classNumber difficulty estimatedDuration isPremium thumbnail tags order createdAt')
      .sort({ order: 1, createdAt: 1 });

    // Add access information if user is authenticated
    if (req.user) {
      modules.forEach(module => {
        module._doc.hasAccess = module.hasAccess ? module.hasAccess(req.user) : !module.isPremium;
      });
    } else {
      // For unauthenticated users, only free modules have access
      modules.forEach(module => {
        module._doc.hasAccess = !module.isPremium;
      });
    }

    res.status(200).json({
      success: true,
      count: modules.length,
      data: modules,
      filters: {
        class: parseInt(classNumber),
        packageId: req.packageId
      }
    });

  } catch (error) {
    console.error('Get modules by class error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Server error while fetching modules'
    });
  }
};

module.exports = {
  getModulesByClass
};
