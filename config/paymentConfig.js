/**
 * Payment Configuration for Seekho Backend
 * 
 * This configuration supports both Gumbo applications:
 * - com.gumbo.learning (Seekho app)
 * - com.gumbo.english (Bolo app)
 * 
 * Integrates with Payment Microservice at https://payments.netaapp.in
 */

const config = {
  // Payment microservice settings
  microservice: {
    baseUrl: process.env.PAYMENT_MICROSERVICE_URL || 'https://payments.netaapp.in',
    enabled: process.env.USE_PAYMENT_MICROSERVICE === 'true',
    timeout: 30000, // 30 seconds
    retries: 3,
    retryDelay: 1000 // 1 second
  },

  // JWT secrets for different packages (Backend A)
  jwt: {
    'com.gumbo.learning': process.env.PAYMENT_JWT_SECRET_BACKEND_A || process.env.PAYMENT_JWT_SECRET || 'hdjdjkolso12339nfhf@1!u',
    'com.gumbo.english': process.env.PAYMENT_JWT_SECRET_BACKEND_A || process.env.PAYMENT_JWT_SECRET || 'hdjdjkolso12339nfhf@1!u'
  },

  // Callback URLs for different packages
  callbacks: {
    'com.gumbo.learning': process.env.CALLBACK_URL_COM_GUMBO_LEARNING || 'https://api.seekho.com/api/payment/callback/learning',
    'com.gumbo.english': process.env.CALLBACK_URL_COM_GUMBO_ENGLISH || 'https://api.seekho.com/api/payment/callback/english'
  },

  // Plan mappings for microservice (using environment variables for plan IDs)
  planMappings: {
    'com.gumbo.learning': {
      trial: {
        planId: process.env.RAZORPAY_TRIAL_PLAN_ID_LEARNING || 'plan_trial_learning',
        duration: 7,
        amount: 100, // ₹1 in paise
        currency: 'INR'
      },
      monthly: {
        planId: process.env.RAZORPAY_MONTHLY_PLAN_ID_LEARNING || process.env.RAZORPAY_MONTHLY_PLAN_ID || 'plan_monthly_learning',
        duration: 30,
        amount: 11700, // ₹117 in paise (₹99 + 18% GST)
        currency: 'INR'
      },
      yearly: {
        planId: process.env.RAZORPAY_YEARLY_PLAN_ID_LEARNING || process.env.RAZORPAY_YEARLY_PLAN_ID || 'plan_yearly_learning',
        duration: 365,
        amount: 58700, // ₹587 in paise (₹499 + 18% GST)
        currency: 'INR'
      }
    },
    'com.gumbo.english': {
      trial: {
        planId: process.env.RAZORPAY_TRIAL_PLAN_ID_ENGLISH || 'plan_trial_english',
        duration: 7,
        amount: 100, // ₹1 in paise
        currency: 'INR'
      },
      monthly: {
        planId: process.env.RAZORPAY_MONTHLY_PLAN_ID_ENGLISH || process.env.RAZORPAY_MONTHLY_PLAN_ID || 'plan_monthly_english',
        duration: 30,
        amount: 117, // ₹117 (will be converted to paise by payment microservice if needed)
        currency: 'INR'
      },
      yearly: {
        planId: process.env.RAZORPAY_YEARLY_PLAN_ID_ENGLISH || process.env.RAZORPAY_YEARLY_PLAN_ID || 'plan_yearly_english',
        duration: 365,
        amount: 587, // ₹587 (will be converted to paise by payment microservice if needed)
        currency: 'INR'
      }
    }
  },

  // Legacy Razorpay settings (for fallback)
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
    enabled: process.env.ENABLE_LEGACY_RAZORPAY === 'true'
  },

  // Feature flags
  features: {
    useMicroservice: process.env.USE_PAYMENT_MICROSERVICE === 'true',
    enableLegacyRazorpay: process.env.ENABLE_LEGACY_RAZORPAY === 'true',
    enableTrialSubscriptions: process.env.ENABLE_TRIAL_SUBSCRIPTIONS !== 'false',
    enableRecurringPayments: process.env.ENABLE_RECURRING_PAYMENTS !== 'false'
  },

  // Supported packages
  supportedPackages: ['com.gumbo.learning', 'com.gumbo.english'],

  // Default package for backward compatibility
  defaultPackage: 'com.gumbo.learning'
};

/**
 * Get configuration for a specific package
 * @param {string} packageId - Package ID
 * @returns {Object} Package-specific configuration
 */
const getPackageConfig = (packageId) => {
  if (!config.supportedPackages.includes(packageId)) {
    throw new Error(`Unsupported package ID: ${packageId}`);
  }

  return {
    packageId,
    jwtSecret: config.jwt[packageId],
    callbackUrl: config.callbacks[packageId],
    planMappings: config.planMappings[packageId],
    microserviceUrl: config.microservice.baseUrl
  };
};

/**
 * Get plan configuration for a package and plan type
 * @param {string} packageId - Package ID
 * @param {string} planType - Plan type (trial, monthly, yearly)
 * @returns {Object} Plan configuration
 */
const getPlanConfig = (packageId, planType) => {
  const packageConfig = getPackageConfig(packageId);
  const planConfig = packageConfig.planMappings[planType];
  
  if (!planConfig) {
    throw new Error(`Plan type '${planType}' not found for package '${packageId}'`);
  }

  return planConfig;
};

/**
 * Check if microservice is enabled
 * @returns {boolean} Whether microservice is enabled
 */
const isMicroserviceEnabled = () => {
  return config.features.useMicroservice;
};

/**
 * Check if legacy Razorpay is enabled
 * @returns {boolean} Whether legacy Razorpay is enabled
 */
const isLegacyRazorpayEnabled = () => {
  return config.features.enableLegacyRazorpay;
};

/**
 * Get JWT secret for package
 * @param {string} packageId - Package ID
 * @returns {string} JWT secret
 */
const getJwtSecret = (packageId) => {
  const packageConfig = getPackageConfig(packageId);
  return packageConfig.jwtSecret;
};

/**
 * Get callback URL for package
 * @param {string} packageId - Package ID
 * @returns {string} Callback URL
 */
const getCallbackUrl = (packageId) => {
  const packageConfig = getPackageConfig(packageId);
  return packageConfig.callbackUrl;
};

/**
 * Validate package configuration
 * @param {string} packageId - Package ID
 * @returns {Object} Validation result
 */
const validatePackageConfig = (packageId) => {
  try {
    const packageConfig = getPackageConfig(packageId);
    
    // Check required fields
    const requiredFields = ['jwtSecret', 'callbackUrl', 'planMappings'];
    for (const field of requiredFields) {
      if (!packageConfig[field]) {
        return {
          valid: false,
          error: `Missing required field: ${field} for package ${packageId}`
        };
      }
    }

    // Check plan mappings
    const requiredPlans = ['monthly', 'yearly'];
    for (const planType of requiredPlans) {
      if (!packageConfig.planMappings[planType]) {
        return {
          valid: false,
          error: `Missing plan mapping for ${planType} in package ${packageId}`
        };
      }
    }

    return {
      valid: true,
      config: packageConfig
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
};

module.exports = {
  config,
  getPackageConfig,
  getPlanConfig,
  isMicroserviceEnabled,
  isLegacyRazorpayEnabled,
  getJwtSecret,
  getCallbackUrl,
  validatePackageConfig
};
