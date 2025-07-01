/**
 * Multi-tenant package configuration for Seekho Backend
 * Supports both Seekho and Bolo Android applications
 */

// Supported package IDs
const SUPPORTED_PACKAGES = [
  'com.gumbo.learning',  // Seekho app (existing)
  'com.gumbo.english'    // Bolo app (new)
];

// Default package ID for backward compatibility
const DEFAULT_PACKAGE_ID = 'com.gumbo.learning';

// Package-specific configurations
const PACKAGE_CONFIGS = {
  'com.gumbo.learning': {
    name: 'Seekho',
    displayName: 'Seekho Learning App',
    description: 'Educational learning platform',
    theme: {
      primaryColor: '#007bff',
      secondaryColor: '#6c757d'
    },
    features: {
      subscriptions: true,
      notifications: true,
      analytics: true,
      fileUploads: true
    },
    storage: {
      s3Prefix: 'seekho',
      bucketFolder: 'seekho-app'
    },
    database: {
      collectionPrefix: '', // No prefix for backward compatibility
      indexes: true
    }
  },
  'com.gumbo.english': {
    name: 'Bolo',
    displayName: 'Bolo English Learning App',
    description: 'English language learning platform',
    theme: {
      primaryColor: '#28a745',
      secondaryColor: '#17a2b8'
    },
    features: {
      subscriptions: true,
      notifications: true,
      analytics: true,
      fileUploads: true
    },
    storage: {
      s3Prefix: 'bolo',
      bucketFolder: 'bolo-app'
    },
    database: {
      collectionPrefix: '', // No prefix needed, using packageId field
      indexes: true
    }
  }
};

// Get package configuration
const getPackageConfig = (packageId) => {
  if (!packageId || !SUPPORTED_PACKAGES.includes(packageId)) {
    return null;
  }
  
  return PACKAGE_CONFIGS[packageId];
};

// Get all supported packages with their configurations
const getAllPackageConfigs = () => {
  return PACKAGE_CONFIGS;
};

// Check if package ID is supported
const isPackageSupported = (packageId) => {
  return SUPPORTED_PACKAGES.includes(packageId);
};

// Get package name from package ID
const getPackageName = (packageId) => {
  const config = getPackageConfig(packageId);
  return config ? config.name : null;
};

// Get package display name from package ID
const getPackageDisplayName = (packageId) => {
  const config = getPackageConfig(packageId);
  return config ? config.displayName : null;
};

// Get S3 storage prefix for package
const getStoragePrefix = (packageId) => {
  const config = getPackageConfig(packageId);
  return config ? config.storage.s3Prefix : 'default';
};

// Get S3 bucket folder for package
const getBucketFolder = (packageId) => {
  const config = getPackageConfig(packageId);
  return config ? config.storage.bucketFolder : 'default-app';
};

// Check if feature is enabled for package
const isFeatureEnabled = (packageId, featureName) => {
  const config = getPackageConfig(packageId);
  return config && config.features && config.features[featureName] === true;
};

// Get theme configuration for package
const getThemeConfig = (packageId) => {
  const config = getPackageConfig(packageId);
  return config ? config.theme : null;
};

// Validate package configuration
const validatePackageConfig = (packageId) => {
  const config = getPackageConfig(packageId);
  
  if (!config) {
    return {
      valid: false,
      error: 'Package configuration not found'
    };
  }

  // Check required fields
  const requiredFields = ['name', 'displayName', 'features', 'storage'];
  for (const field of requiredFields) {
    if (!config[field]) {
      return {
        valid: false,
        error: `Missing required field: ${field}`
      };
    }
  }

  return {
    valid: true,
    config
  };
};

// Get database query filter for package
const getPackageFilter = (packageId) => {
  if (!isPackageSupported(packageId)) {
    throw new Error(`Unsupported package ID: ${packageId}`);
  }
  
  return { packageId };
};

// Get package-specific file path
const getPackageFilePath = (packageId, fileName, folder = 'uploads') => {
  const storagePrefix = getStoragePrefix(packageId);
  return `${storagePrefix}/${folder}/${fileName}`;
};

module.exports = {
  SUPPORTED_PACKAGES,
  DEFAULT_PACKAGE_ID,
  PACKAGE_CONFIGS,
  getPackageConfig,
  getAllPackageConfigs,
  isPackageSupported,
  getPackageName,
  getPackageDisplayName,
  getStoragePrefix,
  getBucketFolder,
  isFeatureEnabled,
  getThemeConfig,
  validatePackageConfig,
  getPackageFilter,
  getPackageFilePath
};
