# 🔧 Technical Implementation Guide - Subscription System

## 📋 Overview

This technical guide provides detailed implementation instructions, code examples, and best practices for integrating the new subscription system across different platforms.

## 🏗️ Architecture Overview

### System Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Razorpay      │
│   (Web/Mobile)  │◄──►│   (Node.js)     │◄──►│   (Payments)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐              │
         │              │   MongoDB       │              │
         │              │   (Database)    │              │
         │              └─────────────────┘              │
         │                                                │
         └────────────── Webhook Events ◄─────────────────┘
```

### Data Flow

1. **User Authentication** → JWT token generation
2. **Trial Eligibility Check** → Database query
3. **Subscription Creation** → Razorpay order/subscription
4. **Payment Processing** → Razorpay payment gateway
5. **Payment Verification** → Webhook + signature validation
6. **Subscription Activation** → Database update

## 🔐 Authentication & Security

### JWT Token Implementation

```javascript
// Frontend: Store and use JWT token
class AuthService {
  static setToken(token) {
    localStorage.setItem('authToken', token);
  }
  
  static getToken() {
    return localStorage.getItem('authToken');
  }
  
  static getAuthHeaders() {
    const token = this.getToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }
  
  static async makeAuthenticatedRequest(url, options = {}) {
    const headers = {
      ...this.getAuthHeaders(),
      ...options.headers
    };
    
    return fetch(url, { ...options, headers });
  }
}
```

### API Security Best Practices

```javascript
// Backend: Rate limiting for subscription endpoints
const subscriptionRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many subscription attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply to subscription routes
app.use('/api/subscriptions', subscriptionRateLimit);
```

## 💳 Payment Integration

### Razorpay SDK Integration

#### Web Implementation

```html
<!-- Include Razorpay SDK -->
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

```javascript
class PaymentService {
  static async initializePayment(orderData) {
    return new Promise((resolve, reject) => {
      const options = {
        key: orderData.razorpayKeyId,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.orderId,
        name: 'Seekho Learning Platform',
        description: `${orderData.plan} subscription`,
        image: '/logo.png',
        handler: function(response) {
          resolve(response);
        },
        prefill: {
          name: orderData.userDetails?.name || '',
          email: orderData.userDetails?.email || '',
          contact: orderData.userDetails?.phone || ''
        },
        notes: {
          plan: orderData.plan,
          user_id: orderData.userId
        },
        theme: {
          color: '#3399cc'
        },
        modal: {
          ondismiss: function() {
            reject(new Error('Payment cancelled by user'));
          }
        }
      };

      const rzp = new Razorpay(options);
      rzp.open();
    });
  }

  static async processSubscriptionPayment(plan, userDetails) {
    try {
      // Step 1: Create order
      const orderResponse = await AuthService.makeAuthenticatedRequest(
        '/api/subscriptions/create-order',
        {
          method: 'POST',
          body: JSON.stringify({
            plan: plan,
            subscriptionType: plan === 'trial' ? 'one-time' : 'recurring'
          })
        }
      );

      const orderData = await orderResponse.json();

      if (!orderData.success) {
        throw new Error(orderData.message);
      }

      // Step 2: Process payment
      const paymentResponse = await this.initializePayment({
        ...orderData.data,
        userDetails
      });

      // Step 3: Verify payment
      const verificationResponse = await AuthService.makeAuthenticatedRequest(
        '/api/subscriptions/verify-payment',
        {
          method: 'POST',
          body: JSON.stringify({
            razorpay_order_id: paymentResponse.razorpay_order_id,
            razorpay_payment_id: paymentResponse.razorpay_payment_id,
            razorpay_signature: paymentResponse.razorpay_signature,
            plan: plan
          })
        }
      );

      const verificationData = await verificationResponse.json();

      if (verificationData.success) {
        return {
          success: true,
          subscription: verificationData.subscription
        };
      } else {
        throw new Error('Payment verification failed');
      }

    } catch (error) {
      console.error('Payment processing failed:', error);
      throw error;
    }
  }
}
```

#### React Component Example

```jsx
import React, { useState, useEffect } from 'react';

const SubscriptionPage = () => {
  const [plans, setPlans] = useState(null);
  const [isTrialEligible, setIsTrialEligible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      // Load plans and trial eligibility in parallel
      const [plansResponse, eligibilityResponse] = await Promise.all([
        fetch('/api/subscriptions/plans'),
        AuthService.makeAuthenticatedRequest('/api/subscriptions/trial-eligibility')
      ]);

      const plansData = await plansResponse.json();
      const eligibilityData = await eligibilityResponse.json();

      setPlans(plansData.data);
      setIsTrialEligible(eligibilityData.isTrialEligible);
    } catch (error) {
      console.error('Failed to load subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscription = async (plan) => {
    setProcessing(true);
    try {
      const result = await PaymentService.processSubscriptionPayment(plan, {
        name: 'User Name',
        email: 'user@example.com',
        phone: '9999999999'
      });

      if (result.success) {
        // Redirect to success page or dashboard
        window.location.href = '/dashboard';
      }
    } catch (error) {
      alert(`Subscription failed: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="subscription-page">
      <h1>Choose Your Plan</h1>
      
      <div className="plans-container">
        {isTrialEligible && plans?.trial && (
          <div className="plan-card trial">
            <div className="badge">Recommended</div>
            <h3>{plans.trial.name}</h3>
            <div className="price">₹{plans.trial.price}</div>
            <div className="duration">{plans.trial.duration}</div>
            <p>{plans.trial.description}</p>
            <ul>
              {plans.trial.features.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
            <button 
              onClick={() => handleSubscription('trial')}
              disabled={processing}
              className="btn-primary"
            >
              {processing ? 'Processing...' : 'Start Trial'}
            </button>
          </div>
        )}

        {plans?.monthly && (
          <div className="plan-card monthly">
            <h3>{plans.monthly.name}</h3>
            <div className="price">₹{plans.monthly.price}</div>
            <div className="price-breakdown">
              ₹{plans.monthly.basePrice} + {plans.monthly.gst}% GST
            </div>
            <div className="duration">per month</div>
            <p>{plans.monthly.description}</p>
            <ul>
              {plans.monthly.features.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
            <button 
              onClick={() => handleSubscription('monthly')}
              disabled={processing}
              className="btn-secondary"
            >
              {processing ? 'Processing...' : 'Subscribe Monthly'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionPage;
```

### Flutter/Mobile Implementation

```dart
// payment_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:razorpay_flutter/razorpay_flutter.dart';

class PaymentService {
  static final Razorpay _razorpay = Razorpay();
  static String? _currentPlan;
  
  static void initialize() {
    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handlePaymentSuccess);
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _handlePaymentError);
    _razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleExternalWallet);
  }

  static Future<Map<String, dynamic>> createSubscription(String plan) async {
    final response = await http.post(
      Uri.parse('${Config.baseUrl}/api/subscriptions/create-order'),
      headers: {
        'Authorization': 'Bearer ${AuthService.getToken()}',
        'Content-Type': 'application/json',
      },
      body: json.encode({
        'plan': plan,
        'subscriptionType': plan == 'trial' ? 'one-time' : 'recurring',
      }),
    );

    return json.decode(response.body);
  }

  static Future<void> processPayment(String plan) async {
    try {
      _currentPlan = plan;
      
      final orderData = await createSubscription(plan);
      
      if (!orderData['success']) {
        throw Exception(orderData['message']);
      }

      final options = {
        'key': orderData['data']['razorpayKeyId'],
        'amount': orderData['data']['amount'],
        'currency': orderData['data']['currency'],
        'order_id': orderData['data']['orderId'],
        'name': 'Seekho Learning Platform',
        'description': '${plan} subscription',
        'prefill': {
          'contact': AuthService.getUserPhone(),
          'email': AuthService.getUserEmail(),
          'name': AuthService.getUserName(),
        },
        'theme': {
          'color': '#3399cc',
        }
      };

      _razorpay.open(options);
    } catch (e) {
      print('Payment initiation failed: $e');
      throw e;
    }
  }

  static void _handlePaymentSuccess(PaymentSuccessResponse response) async {
    try {
      final verificationResponse = await http.post(
        Uri.parse('${Config.baseUrl}/api/subscriptions/verify-payment'),
        headers: {
          'Authorization': 'Bearer ${AuthService.getToken()}',
          'Content-Type': 'application/json',
        },
        body: json.encode({
          'razorpay_order_id': response.orderId,
          'razorpay_payment_id': response.paymentId,
          'razorpay_signature': response.signature,
          'plan': _currentPlan,
        }),
      );

      final verificationData = json.decode(verificationResponse.body);

      if (verificationData['success']) {
        // Navigate to success page
        NavigationService.navigateToSuccess();
      } else {
        throw Exception('Payment verification failed');
      }
    } catch (e) {
      print('Payment verification failed: $e');
      NavigationService.showError('Payment verification failed');
    }
  }

  static void _handlePaymentError(PaymentFailureResponse response) {
    print('Payment failed: ${response.message}');
    NavigationService.showError('Payment failed: ${response.message}');
  }

  static void _handleExternalWallet(ExternalWalletResponse response) {
    print('External wallet selected: ${response.walletName}');
  }

  static void dispose() {
    _razorpay.clear();
  }
}
```

## 🔄 State Management

### Redux/Context Implementation

```javascript
// subscriptionContext.js
import React, { createContext, useContext, useReducer } from 'react';

const SubscriptionContext = createContext();

const initialState = {
  plans: null,
  isTrialEligible: false,
  currentSubscription: null,
  loading: false,
  error: null
};

const subscriptionReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_PLANS':
      return { ...state, plans: action.payload };
    case 'SET_TRIAL_ELIGIBILITY':
      return { ...state, isTrialEligible: action.payload };
    case 'SET_CURRENT_SUBSCRIPTION':
      return { ...state, currentSubscription: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

export const SubscriptionProvider = ({ children }) => {
  const [state, dispatch] = useReducer(subscriptionReducer, initialState);

  const loadSubscriptionData = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const [plansResponse, eligibilityResponse] = await Promise.all([
        fetch('/api/subscriptions/plans'),
        AuthService.makeAuthenticatedRequest('/api/subscriptions/trial-eligibility')
      ]);

      const plansData = await plansResponse.json();
      const eligibilityData = await eligibilityResponse.json();

      dispatch({ type: 'SET_PLANS', payload: plansData.data });
      dispatch({ type: 'SET_TRIAL_ELIGIBILITY', payload: eligibilityData.isTrialEligible });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const value = {
    ...state,
    loadSubscriptionData
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return context;
};
```

## 🧪 Testing Implementation

### Unit Tests

```javascript
// subscriptionService.test.js
import { PaymentService } from '../services/PaymentService';
import { AuthService } from '../services/AuthService';

// Mock Razorpay
global.Razorpay = jest.fn().mockImplementation(() => ({
  open: jest.fn()
}));

// Mock fetch
global.fetch = jest.fn();

describe('PaymentService', () => {
  beforeEach(() => {
    fetch.mockClear();
    AuthService.getToken = jest.fn().mockReturnValue('mock-token');
  });

  test('should create trial subscription successfully', async () => {
    const mockOrderResponse = {
      success: true,
      data: {
        orderId: 'order_123',
        amount: 100,
        currency: 'INR',
        razorpayKeyId: 'rzp_test_123'
      }
    };

    fetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockOrderResponse)
    });

    const orderData = await PaymentService.createOrder('trial');
    
    expect(fetch).toHaveBeenCalledWith('/api/subscriptions/create-order', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        plan: 'trial',
        subscriptionType: 'one-time'
      })
    });

    expect(orderData.success).toBe(true);
    expect(orderData.data.amount).toBe(100);
  });

  test('should handle trial already used error', async () => {
    const mockErrorResponse = {
      success: false,
      message: 'Trial already used',
      showMonthlyOnly: true
    };

    fetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockErrorResponse)
    });

    try {
      await PaymentService.createOrder('trial');
    } catch (error) {
      expect(error.showMonthlyOnly).toBe(true);
    }
  });
});
```

### Integration Tests

```javascript
// subscription.integration.test.js
describe('Subscription Integration', () => {
  test('complete subscription flow for new user', async () => {
    // 1. Check trial eligibility
    const eligibilityResponse = await fetch('/api/subscriptions/trial-eligibility', {
      headers: { 'Authorization': 'Bearer new-user-token' }
    });
    const eligibilityData = await eligibilityResponse.json();
    expect(eligibilityData.isTrialEligible).toBe(true);

    // 2. Create trial order
    const orderResponse = await fetch('/api/subscriptions/create-order', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer new-user-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        plan: 'trial',
        subscriptionType: 'one-time'
      })
    });
    const orderData = await orderResponse.json();
    expect(orderData.success).toBe(true);
    expect(orderData.data.amount).toBe(100);

    // 3. Simulate payment verification
    const verificationResponse = await fetch('/api/subscriptions/verify-payment', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer new-user-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        razorpay_order_id: orderData.data.orderId,
        razorpay_payment_id: 'pay_test_123',
        razorpay_signature: 'test_signature',
        plan: 'trial'
      })
    });
    const verificationData = await verificationResponse.json();
    expect(verificationData.success).toBe(true);
  });
});
```

## 📊 Analytics & Monitoring

### Event Tracking

```javascript
// analytics.js
class AnalyticsService {
  static trackSubscriptionEvent(event, data) {
    // Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', event, {
        event_category: 'subscription',
        event_label: data.plan,
        value: data.amount
      });
    }

    // Custom analytics
    this.sendCustomEvent(event, data);
  }

  static sendCustomEvent(event, data) {
    fetch('/api/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        data,
        timestamp: new Date().toISOString(),
        userId: AuthService.getUserId()
      })
    });
  }
}

// Usage in payment flow
PaymentService.processSubscriptionPayment = async (plan, userDetails) => {
  AnalyticsService.trackSubscriptionEvent('subscription_initiated', { plan });
  
  try {
    const result = await originalProcessPayment(plan, userDetails);
    AnalyticsService.trackSubscriptionEvent('subscription_completed', { 
      plan, 
      amount: result.amount 
    });
    return result;
  } catch (error) {
    AnalyticsService.trackSubscriptionEvent('subscription_failed', { 
      plan, 
      error: error.message 
    });
    throw error;
  }
};
```

## 🚀 Performance Optimization

### Caching Strategy

```javascript
// cacheService.js
class CacheService {
  static cache = new Map();
  static TTL = 5 * 60 * 1000; // 5 minutes

  static set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  static get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  static async getOrFetch(key, fetchFn) {
    let data = this.get(key);
    if (!data) {
      data = await fetchFn();
      this.set(key, data);
    }
    return data;
  }
}

// Usage
const getSubscriptionPlans = async () => {
  return CacheService.getOrFetch('subscription-plans', async () => {
    const response = await fetch('/api/subscriptions/plans');
    return response.json();
  });
};
```

## 🔧 Error Handling & Recovery

### Comprehensive Error Handling

```javascript
// errorHandler.js
class ErrorHandler {
  static handle(error, context = {}) {
    console.error('Error occurred:', error, context);

    // Log to monitoring service
    this.logError(error, context);

    // Show user-friendly message
    this.showUserMessage(error);

    // Attempt recovery if possible
    this.attemptRecovery(error, context);
  }

  static logError(error, context) {
    // Send to monitoring service (e.g., Sentry)
    if (typeof Sentry !== 'undefined') {
      Sentry.captureException(error, { extra: context });
    }
  }

  static showUserMessage(error) {
    const userMessage = this.getUserFriendlyMessage(error);
    // Show notification to user
    NotificationService.show({
      type: 'error',
      message: userMessage
    });
  }

  static getUserFriendlyMessage(error) {
    if (error.message?.includes('network')) {
      return 'Network error. Please check your connection and try again.';
    }
    if (error.message?.includes('trial already used')) {
      return 'You have already used your trial. Please choose monthly subscription.';
    }
    if (error.message?.includes('payment')) {
      return 'Payment failed. Please try again or contact support.';
    }
    return 'Something went wrong. Please try again.';
  }

  static attemptRecovery(error, context) {
    if (context.action === 'subscription' && error.message?.includes('trial already used')) {
      // Automatically show monthly option
      SubscriptionService.showMonthlyOption();
    }
  }
}
```

This technical implementation guide provides comprehensive code examples and best practices for integrating the new subscription system. The team can use these examples as a foundation for their implementation across web and mobile platforms.
