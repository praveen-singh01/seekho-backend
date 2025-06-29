const { SUPPORTED_PACKAGES } = require('../config/packages');

/**
 * Middleware to extract and validate package ID from request headers
 * Supports multi-tenant architecture for Seekho and Bolo apps
 */

// Extract package ID from request headers
const extractPackageId = (req, res, next) => {
  try {
    // Get package ID from X-Package-ID header
    let packageId = req.headers['x-package-id'] || req.headers['X-Package-ID'];
    
    // If no package ID provided, check for legacy support (default to Seekho)
    if (!packageId) {
      // For backward compatibility, default to Seekho package ID
      packageId = 'com.gumbo.learning';
      console.log('No package ID provided, defaulting to Seekho app');
    }

    // Validate package ID format
    if (!isValidPackageIdFormat(packageId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid package ID format',
        code: 'INVALID_PACKAGE_ID_FORMAT'
      });
    }

    // Set package ID in request object
    req.packageId = packageId;
    next();
  } catch (error) {
    console.error('Package ID extraction error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error in package ID processing'
    });
  }
};

// Validate package ID against supported packages
const validatePackageId = (req, res, next) => {
  try {
    const { packageId } = req;

    if (!packageId) {
      return res.status(400).json({
        success: false,
        message: 'Package ID is required',
        code: 'PACKAGE_ID_REQUIRED'
      });
    }

    // Check if package ID is supported
    if (!SUPPORTED_PACKAGES.includes(packageId)) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported package ID',
        code: 'UNSUPPORTED_PACKAGE_ID',
        supportedPackages: SUPPORTED_PACKAGES
      });
    }

    next();
  } catch (error) {
    console.error('Package ID validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error in package ID validation'
    });
  }
};

// Optional package ID validation (doesn't fail if missing)
const optionalPackageId = (req, res, next) => {
  try {
    // Extract package ID if present
    let packageId = req.headers['x-package-id'] || req.headers['X-Package-ID'];
    
    if (packageId) {
      // Validate format if provided
      if (!isValidPackageIdFormat(packageId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid package ID format',
          code: 'INVALID_PACKAGE_ID_FORMAT'
        });
      }

      // Validate against supported packages
      if (!SUPPORTED_PACKAGES.includes(packageId)) {
        return res.status(400).json({
          success: false,
          message: 'Unsupported package ID',
          code: 'UNSUPPORTED_PACKAGE_ID',
          supportedPackages: SUPPORTED_PACKAGES
        });
      }

      req.packageId = packageId;
    } else {
      // Default to Seekho for backward compatibility
      req.packageId = 'com.gumbo.learning';
    }

    next();
  } catch (error) {
    console.error('Optional package ID validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error in package ID processing'
    });
  }
};

// Validate package ID format (Android package naming convention)
const isValidPackageIdFormat = (packageId) => {
  if (!packageId || typeof packageId !== 'string') {
    return false;
  }

  // Android package ID regex pattern
  const packageIdRegex = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/;
  return packageIdRegex.test(packageId);
};

// Get app name from package ID
const getAppNameFromPackageId = (packageId) => {
  const appNames = {
    'com.gumbo.learning': 'Seekho',
    'com.gumbo.english': 'Bolo'
  };
  
  return appNames[packageId] || 'Unknown App';
};

// Check if package ID is for Seekho app
const isSeekhoApp = (packageId) => {
  return packageId === 'com.gumbo.learning';
};

// Check if package ID is for Bolo app
const isBoloApp = (packageId) => {
  return packageId === 'com.gumbo.english';
};

// Middleware to add package ID to response headers (for debugging)
const addPackageIdToResponse = (req, res, next) => {
  if (req.packageId) {
    res.set('X-Response-Package-ID', req.packageId);
    res.set('X-App-Name', getAppNameFromPackageId(req.packageId));
  }
  next();
};

// Combined middleware for full package ID processing
const processPackageId = [extractPackageId, validatePackageId, addPackageIdToResponse];

module.exports = {
  extractPackageId,
  validatePackageId,
  optionalPackageId,
  processPackageId,
  addPackageIdToResponse,
  isValidPackageIdFormat,
  getAppNameFromPackageId,
  isSeekhoApp,
  isBoloApp
};
