# 🚀 Team Integration Guide - New Subscription System

## 📋 Overview

This comprehensive guide helps the development team integrate the new auto-recurring trial subscription system into the Seekho platform. The system supports both trial and monthly subscriptions with automatic UPI mandate setup.

## 🎯 System Architecture

### Subscription Models
- **Trial Subscription**: ₹1 for 5 days → Auto-converts to ₹117/month
- **Monthly Subscription**: ₹117/month (includes ₹99 base + 18% GST)
- **UPI Mandate**: Automatic setup for seamless recurring payments
- **One Trial Per User**: Lifetime trial eligibility restriction

### Key Features
- ✅ Razorpay integration with auto-recurring subscriptions
- ✅ UPI mandate setup for seamless payments
- ✅ Trial eligibility checking
- ✅ Automatic trial-to-monthly conversion
- ✅ Webhook-based payment verification
- ✅ Comprehensive error handling

## 🔧 Backend Setup

### 1. Environment Configuration

Required environment variables in `.env`:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Subscription Pricing (in paise)
TRIAL_PRICE=100          # ₹1
MONTHLY_PRICE=11700      # ₹117 (₹99 + 18% GST)
TRIAL_DURATION_DAYS=5

# Database
MONGODB_URI=mongodb://localhost:27017/seekho-backend

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
```

### 2. Database Models

The system uses these key models:

- **User**: Extended with trial eligibility tracking
- **Subscription**: Comprehensive subscription management
- **Payment tracking**: Razorpay integration fields

### 3. API Endpoints

#### Core Subscription Endpoints

```http
# Get subscription plans
GET /api/subscriptions/plans

# Check trial eligibility
GET /api/subscriptions/trial-eligibility

# Create subscription order
POST /api/subscriptions/create-order

# Verify payment
POST /api/subscriptions/verify-payment

# Get subscription status
GET /api/subscriptions/status
```

## 📱 Frontend Integration

### 1. Trial Eligibility Check

**Always check trial eligibility before showing subscription options:**

```javascript
// Check if user can access trial
const checkTrialEligibility = async () => {
  try {
    const response = await fetch('/api/subscriptions/trial-eligibility', {
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      return {
        isEligible: data.isTrialEligible,
        hasUsedTrial: data.hasUsedTrial
      };
    }
  } catch (error) {
    console.error('Trial eligibility check failed:', error);
    return { isEligible: false, hasUsedTrial: true };
  }
};
```

### 2. Subscription Plans Display

```javascript
// Get available plans
const getSubscriptionPlans = async () => {
  const response = await fetch('/api/subscriptions/plans');
  const data = await response.json();
  
  return data.data; // { trial: {...}, monthly: {...} }
};

// Display logic
const displaySubscriptionOptions = async () => {
  const eligibility = await checkTrialEligibility();
  const plans = await getSubscriptionPlans();
  
  if (eligibility.isEligible) {
    // Show both trial and monthly options
    showTrialOption(plans.trial);
    showMonthlyOption(plans.monthly);
  } else {
    // Show only monthly option
    showMonthlyOption(plans.monthly);
    showTrialUsedMessage();
  }
};
```

### 3. Payment Flow Implementation

```javascript
const createSubscription = async (plan) => {
  try {
    // Create order
    const orderResponse = await fetch('/api/subscriptions/create-order', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        plan: plan, // 'trial' or 'monthly'
        subscriptionType: plan === 'trial' ? 'one-time' : 'recurring'
      })
    });

    const orderData = await orderResponse.json();

    if (!orderData.success) {
      if (orderData.showMonthlyOnly) {
        // User already used trial
        displayMonthlyOnlyOption();
        return;
      }
      throw new Error(orderData.message);
    }

    // Handle different payment types
    if (orderData.data.type === 'recurring') {
      // For UPI mandate subscriptions
      if (orderData.data.shortUrl) {
        // Redirect to Razorpay subscription page
        window.location.href = orderData.data.shortUrl;
      } else {
        // Use Razorpay SDK for subscription
        initiateRazorpaySubscription(orderData.data);
      }
    } else {
      // For one-time trial payments
      initiateRazorpayPayment(orderData.data);
    }

  } catch (error) {
    console.error('Subscription creation failed:', error);
    showErrorMessage(error.message);
  }
};
```

### 4. Razorpay Integration

```javascript
// For one-time payments (trial)
const initiateRazorpayPayment = (orderData) => {
  const options = {
    key: orderData.razorpayKeyId,
    amount: orderData.amount,
    currency: orderData.currency,
    order_id: orderData.orderId,
    name: 'Seekho',
    description: `${orderData.plan} subscription`,
    handler: function(response) {
      verifyPayment(response, orderData.plan);
    },
    prefill: {
      name: user.name,
      email: user.email,
      contact: user.phone
    },
    theme: {
      color: '#3399cc'
    }
  };

  const rzp = new Razorpay(options);
  rzp.open();
};

// For recurring subscriptions
const initiateRazorpaySubscription = (orderData) => {
  const options = {
    key: orderData.razorpayKeyId,
    subscription_id: orderData.orderId,
    name: 'Seekho',
    description: 'Monthly Subscription',
    handler: function(response) {
      verifySubscriptionPayment(response);
    },
    prefill: {
      name: user.name,
      email: user.email,
      contact: user.phone
    }
  };

  const rzp = new Razorpay(options);
  rzp.open();
};
```

### 5. Payment Verification

```javascript
const verifyPayment = async (paymentResponse, plan) => {
  try {
    const response = await fetch('/api/subscriptions/verify-payment', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_signature: paymentResponse.razorpay_signature,
        plan: plan
      })
    });

    const data = await response.json();

    if (data.success) {
      showSuccessMessage('Subscription activated successfully!');
      redirectToContent();
    } else {
      showErrorMessage('Payment verification failed');
    }
  } catch (error) {
    console.error('Payment verification failed:', error);
    showErrorMessage('Payment verification failed');
  }
};
```

## 🎨 UI/UX Guidelines

### 1. Subscription Options Display

```jsx
const SubscriptionOptions = ({ isTrialEligible }) => {
  return (
    <div className="subscription-options">
      {isTrialEligible && (
        <div className="subscription-card trial-card">
          <div className="badge">Recommended</div>
          <h3>Trial</h3>
          <div className="price">₹1</div>
          <div className="duration">5 days</div>
          <div className="description">
            Try 5 days for ₹1, then ₹117/month
          </div>
          <ul className="features">
            <li>Access to all videos</li>
            <li>HD quality streaming</li>
            <li>Mobile & web access</li>
          </ul>
          <button 
            className="btn-primary"
            onClick={() => createSubscription('trial')}
          >
            Start Trial
          </button>
        </div>
      )}
      
      <div className="subscription-card monthly-card">
        <h3>Monthly</h3>
        <div className="price">₹117</div>
        <div className="price-breakdown">₹99 + 18% GST</div>
        <div className="duration">per month</div>
        <ul className="features">
          <li>Access to all videos</li>
          <li>HD quality streaming</li>
          <li>Mobile & web access</li>
          <li>Download for offline viewing</li>
          <li>Auto-renewal</li>
        </ul>
        <button 
          className="btn-secondary"
          onClick={() => createSubscription('monthly')}
        >
          Subscribe Monthly
        </button>
      </div>
    </div>
  );
};
```

### 2. Error Handling

```javascript
const handleSubscriptionError = (error) => {
  if (error.showMonthlyOnly) {
    // User already used trial
    showNotification({
      type: 'info',
      title: 'Trial Already Used',
      message: 'You have already used your trial. Please choose monthly subscription.',
      action: () => showMonthlyOption()
    });
  } else {
    // General error
    showNotification({
      type: 'error',
      title: 'Subscription Failed',
      message: error.message || 'Something went wrong. Please try again.',
      action: () => retrySubscription()
    });
  }
};
```

## 📱 Mobile App Integration

### Flutter Implementation

```dart
// Check trial eligibility
Future<Map<String, dynamic>> checkTrialEligibility() async {
  final response = await http.get(
    Uri.parse('$baseUrl/api/subscriptions/trial-eligibility'),
    headers: {
      'Authorization': 'Bearer $userToken',
      'Content-Type': 'application/json',
    },
  );
  
  return json.decode(response.body);
}

// Create subscription
Future<Map<String, dynamic>> createSubscription(String plan) async {
  final response = await http.post(
    Uri.parse('$baseUrl/api/subscriptions/create-order'),
    headers: {
      'Authorization': 'Bearer $userToken',
      'Content-Type': 'application/json',
    },
    body: json.encode({
      'plan': plan,
      'subscriptionType': plan == 'trial' ? 'one-time' : 'recurring',
    }),
  );
  
  return json.decode(response.body);
}
```

## 🧪 Testing Strategy

### 1. Test Scenarios

**New User Flow:**
```
1. Login with new user
2. Check trial eligibility → Should return true
3. Display trial option (₹1 for 5 days)
4. Create trial subscription
5. Complete payment via Razorpay
6. Verify subscription activation
7. Wait 5 days → Auto-conversion to monthly
```

**Returning User Flow:**
```
1. Login with user who used trial
2. Check trial eligibility → Should return false
3. Display monthly option only (₹117/month)
4. Create monthly subscription
5. Complete payment via Razorpay
6. Verify subscription activation
```

### 2. Test Data

```javascript
// Generate test user token
const generateTestToken = async (userData) => {
  const response = await fetch('/api/auth/test-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  
  return response.json();
};

// Test users
const testUsers = {
  newUser: {
    name: 'New User',
    email: 'newuser@test.com',
    hasUsedTrial: false
  },
  returningUser: {
    name: 'Returning User',
    email: 'returning@test.com',
    hasUsedTrial: true
  }
};
```

## 🚨 Important Considerations

### 1. Security
- Always validate payments on backend
- Use HTTPS for all API calls
- Implement rate limiting for payment endpoints
- Validate user authentication for all subscription operations

### 2. Error Handling
- Handle network failures gracefully
- Provide clear error messages to users
- Implement retry mechanisms for failed payments
- Log errors for debugging

### 3. Performance
- Cache subscription plans data
- Optimize API calls
- Implement loading states
- Handle slow network conditions

### 4. User Experience
- Clear pricing information
- Transparent trial terms
- Easy cancellation process
- Responsive design for all devices

## 📞 Support & Resources

### Documentation
- **API Documentation**: `FRONTEND_API_DOCUMENTATION.md`
- **Setup Guide**: `SETUP_GUIDE.md`
- **Quick Start**: `QUICK_START_GUIDE.md`

### Testing
- **Postman Collection**: Available for API testing
- **Test Environment**: Backend running on same endpoints
- **Test Users**: Use provided test token generation

### Contact
- Backend API is ready and tested
- All endpoints are documented with examples
- Integration support available

## 🎉 Success Checklist

- [ ] Environment variables configured
- [ ] Trial eligibility check implemented
- [ ] Subscription options display updated
- [ ] Payment flows tested (trial & monthly)
- [ ] Error handling implemented
- [ ] Mobile app integration completed
- [ ] User testing completed
- [ ] Production deployment ready

The new subscription system is ready for team integration! 🚀
