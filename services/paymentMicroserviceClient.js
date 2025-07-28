/**
 * Payment Microservice Client for Seekho Backend
 * 
 * This client handles communication with the Payment Microservice
 * for both Gumbo applications: com.gumbo.learning and com.gumbo.english
 * 
 * Based on the successful Polo Backend integration pattern
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');

class PaymentMicroserviceClient {
  constructor() {
    this.baseUrl = process.env.PAYMENT_MICROSERVICE_URL || 'https://payments.netaapp.in';
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
    
    // Configure axios defaults
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('Payment microservice request failed:', {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get JWT secret for package ID
   * @param {string} packageId - Package ID (com.gumbo.learning or com.gumbo.english)
   * @returns {string} JWT secret
   */
  getJwtSecret(packageId) {
    // Both Gumbo applications use Backend A JWT secret
    return process.env.PAYMENT_JWT_SECRET_BACKEND_A || process.env.PAYMENT_JWT_SECRET || 'hdjdjkolso12339nfhf@1!u';
  }

  /**
   * Generate JWT token for authentication
   * @param {string} userId - User ID
   * @param {string} packageId - Package ID
   * @returns {string} JWT token
   */
  generateToken(userId, packageId) {
    const secret = this.getJwtSecret(packageId);
    
    return jwt.sign(
      { 
        userId, 
        appId: packageId 
      },
      secret,
      { expiresIn: '1h' }
    );
  }

  /**
   * Create request headers with authentication
   * @param {string} userId - User ID for token generation
   * @param {string} packageId - Package ID
   * @returns {Object} Headers object
   */
  getHeaders(userId, packageId) {
    const token = this.generateToken(userId, packageId);
    
    return {
      'Authorization': `Bearer ${token}`,
      'x-app-id': packageId,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Retry mechanism for API calls
   * @param {Function} apiCall - The API call function to retry
   * @param {number} retries - Number of retries remaining
   * @returns {Promise} API response
   */
  async retryApiCall(apiCall, retries = this.maxRetries) {
    try {
      return await apiCall();
    } catch (error) {
      if (retries > 0 && this.isRetryableError(error)) {
        console.warn(`API call failed, retrying... (${retries} retries left)`, {
          error: error.message,
          status: error.response?.status
        });
        
        await this.delay(this.retryDelay);
        return this.retryApiCall(apiCall, retries - 1);
      }
      throw error;
    }
  }

  /**
   * Check if error is retryable
   * @param {Error} error - The error to check
   * @returns {boolean} Whether the error is retryable
   */
  isRetryableError(error) {
    // Retry on network errors or 5xx server errors
    return !error.response || 
           error.code === 'ECONNRESET' ||
           error.code === 'ETIMEDOUT' ||
           (error.response.status >= 500 && error.response.status < 600);
  }

  /**
   * Delay utility for retries
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} Promise that resolves after delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create a subscription in the payment microservice
   * @param {string} userId - User ID
   * @param {string} packageId - Package ID (com.gumbo.learning or com.gumbo.english)
   * @param {string} planId - Plan ID (e.g., 'plan_monthly_premium')
   * @param {Object} paymentContext - Additional context for the payment
   * @returns {Promise<Object>} Subscription data
   */
  async createSubscription(userId, packageId, planId, paymentContext = {}) {
    console.log('Creating subscription via payment microservice', {
      userId,
      packageId,
      planId,
      baseUrl: this.baseUrl
    });

    const apiCall = async () => {
      return await this.axiosInstance.post('/api/payment/subscription', {
        userId,
        planId,
        paymentContext
      }, { 
        headers: this.getHeaders(userId, packageId)
      });
    };

    try {
      const response = await this.retryApiCall(apiCall);

      console.log('Subscription created successfully', {
        userId,
        packageId,
        subscriptionId: response.data.data.subscriptionId
      });

      return response.data;
    } catch (error) {
      console.error('Failed to create subscription', {
        userId,
        packageId,
        planId,
        error: error.response?.data || error.message
      });

      // Check if it's a customer creation error
      const errorMessage = error.response?.data?.error?.message || error.response?.data?.message || error.message;

      if (errorMessage && errorMessage.includes('customer')) {
        // If customer creation failed, it might be because customer already exists
        // The payment microservice should handle this, but we can provide a better error message
        throw new Error('Customer already exists or customer creation failed. Please try again or contact support.');
      }

      throw new Error(errorMessage || 'Failed to create subscription');
    }
  }

  /**
   * Create a payment order in the payment microservice
   * @param {string} userId - User ID
   * @param {string} packageId - Package ID
   * @param {number} amount - Amount in smallest currency unit (e.g., paise for INR)
   * @param {string} currency - Currency code (default: 'INR')
   * @param {Object} paymentContext - Additional context for the payment
   * @returns {Promise<Object>} Order data
   */
  async createOrder(userId, packageId, amount, currency = 'INR', paymentContext = {}) {
    // ✅ FIXED: Payment microservice expects amount in paise, not rupees
    console.log('Creating payment order via payment microservice', {
      userId,
      packageId,
      amountInPaise: amount,
      currency,
      baseUrl: this.baseUrl
    });

    const apiCall = async () => {
      return await this.axiosInstance.post('/api/payment/order', {
        userId,
        amount: amount, // ✅ FIXED: Send amount in paise directly
        currency,
        paymentContext
      }, {
        headers: this.getHeaders(userId, packageId)
      });
    };

    try {
      const response = await this.retryApiCall(apiCall);

      console.log('Payment order created successfully', {
        userId,
        packageId,
        orderId: response.data.data.orderId,
        amountInPaise: amount
      });

      return response.data;
    } catch (error) {
      console.error('Failed to create payment order', {
        userId,
        packageId,
        amount,
        error: error.response?.data || error.message
      });
      
      throw new Error(error.response?.data?.error?.message || error.response?.data?.message || 'Failed to create payment order');
    }
  }

  /**
   * Get user's payment orders
   * @param {string} userId - User ID
   * @param {string} packageId - Package ID
   * @param {number} page - Page number (default: 1)
   * @param {number} limit - Items per page (default: 10)
   * @returns {Promise<Object>} Orders data
   */
  async getUserOrders(userId, packageId, page = 1, limit = 10) {
    console.log('Fetching user orders via payment microservice', {
      userId,
      packageId,
      page,
      limit,
      baseUrl: this.baseUrl
    });

    const apiCall = async () => {
      return await this.axiosInstance.get('/api/payment/orders', {
        params: { page, limit },
        headers: this.getHeaders(userId, packageId)
      });
    };

    try {
      const response = await this.retryApiCall(apiCall);

      console.log('User orders fetched successfully', {
        userId,
        packageId,
        count: response.data.data?.orders?.length || 0
      });

      return response.data;
    } catch (error) {
      console.error('Failed to fetch user orders', {
        userId,
        packageId,
        error: error.response?.data || error.message
      });
      
      throw new Error(error.response?.data?.error?.message || error.response?.data?.message || 'Failed to fetch user orders');
    }
  }

  /**
   * Get user's subscriptions
   * @param {string} userId - User ID
   * @param {string} packageId - Package ID
   * @param {number} page - Page number (default: 1)
   * @param {number} limit - Items per page (default: 10)
   * @returns {Promise<Object>} Subscriptions data
   */
  async getUserSubscriptions(userId, packageId, page = 1, limit = 10) {
    console.log('Fetching user subscriptions via payment microservice', {
      userId,
      packageId,
      page,
      limit,
      baseUrl: this.baseUrl
    });

    const apiCall = async () => {
      return await this.axiosInstance.get('/api/payment/subscriptions', {
        params: { page, limit },
        headers: this.getHeaders(userId, packageId)
      });
    };

    try {
      const response = await this.retryApiCall(apiCall);

      console.log('User subscriptions fetched successfully', {
        userId,
        packageId,
        count: response.data.data?.subscriptions?.length || 0
      });

      return response.data;
    } catch (error) {
      console.error('Failed to fetch user subscriptions', {
        userId,
        packageId,
        error: error.response?.data || error.message
      });
      
      throw new Error(error.response?.data?.error?.message || error.response?.data?.message || 'Failed to fetch user subscriptions');
    }
  }

  /**
   * Cancel a subscription
   * @param {string} userId - User ID
   * @param {string} packageId - Package ID
   * @param {string} subscriptionId - Subscription ID
   * @returns {Promise<Object>} Cancellation result
   */
  async cancelSubscription(userId, packageId, subscriptionId) {
    console.log('Cancelling subscription via payment microservice', {
      userId,
      packageId,
      subscriptionId,
      baseUrl: this.baseUrl
    });

    const apiCall = async () => {
      return await this.axiosInstance.post(`/api/payment/subscription/${subscriptionId}/cancel`, {}, { 
        headers: this.getHeaders(userId, packageId)
      });
    };

    try {
      const response = await this.retryApiCall(apiCall);

      console.log('Subscription cancelled successfully', {
        userId,
        packageId,
        subscriptionId
      });

      return response.data;
    } catch (error) {
      console.error('Failed to cancel subscription', {
        userId,
        packageId,
        subscriptionId,
        error: error.response?.data || error.message
      });
      
      throw new Error(error.response?.data?.error?.message || error.response?.data?.message || 'Failed to cancel subscription');
    }
  }

  /**
   * Verify payment success by fetching status from Razorpay
   * @param {string} userId - User ID
   * @param {string} packageId - Package ID (com.gumbo.learning or com.gumbo.english)
   * @param {Object} verificationData - Verification data
   * @param {string} [verificationData.orderId] - Internal order ID
   * @param {string} [verificationData.subscriptionId] - Internal subscription ID
   * @param {string} [verificationData.razorpayOrderId] - Razorpay order ID
   * @param {string} [verificationData.razorpaySubscriptionId] - Razorpay subscription ID
   * @returns {Promise<Object>} Verification result
   */
  async verifyPaymentSuccess(userId, packageId, verificationData) {
    console.log('Verifying payment success via payment microservice', {
      userId,
      packageId,
      verificationData,
      baseUrl: this.baseUrl
    });

    const apiCall = async () => {
      return await this.axiosInstance.post('/api/payment/verify-success', verificationData, {
        headers: this.getHeaders(userId, packageId)
      });
    };

    try {
      const response = await this.executeWithRetry(apiCall);

      console.log('Payment verification successful:', {
        userId,
        packageId,
        success: response.data.success,
        type: response.data.data?.type,
        status: response.data.data?.status,
        verified: response.data.data?.verified,
        activated: response.data.data?.activated
      });

      return {
        success: response.data.success,
        message: response.data.message,
        data: response.data.data,
        timestamp: response.data.timestamp
      };

    } catch (error) {
      console.error('Payment verification failed:', {
        userId,
        packageId,
        verificationData,
        error: error.response?.data || error.message
      });

      throw new Error(error.response?.data?.error?.message || error.response?.data?.message || 'Failed to verify payment');
    }
  }
}

// Export singleton instance
module.exports = new PaymentMicroserviceClient();
