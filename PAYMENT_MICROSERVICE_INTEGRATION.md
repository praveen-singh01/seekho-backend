# Payment Microservice Integration Guide for Frontend Teams

## 🚀 Overview

The Seekho Backend has been successfully integrated with a new Payment Microservice architecture. This guide provides the frontend teams with all the necessary information to update their API calls and integrate with the new payment system.

## 📱 Applications Supported

- **Seekho Learning App** (`com.gumbo.learning`)
- **Bolo English App** (`com.gumbo.english`)

## 🔧 Production Endpoints

### Base URL
```
https://learner.netaapp.in
```

### Health Check
```
GET https://learner.netaapp.in/health
```

## 💳 Payment Integration

### 1. Get Subscription Plans

**Endpoint:**
```
GET https://learner.netaapp.in/api/subscriptions/plans
```

**Headers:**
```javascript
{
  "x-package-id": "com.gumbo.learning" // or "com.gumbo.english"
}
```

**Response:**
```json
{
  "subscriptionList": [
    {
      "packageId": "05bd18be-6d18-421b-898e-8148e185f0ce",
      "label": "Monthly",
      "price": 99,
      "priceAfterTax": 117,
      "strikePrice": 0,
      "freeTrial": false,
      "trialPrice": 0,
      "planId": "plan_QkkDaTp9Hje6uC",
      "validityInDays": 30
    },
    {
      "packageId": "a7b7e439-56b1-7e2b-b5a8-9820d3b54136",
      "label": "Annually",
      "price": 499,
      "priceAfterTax": 587,
      "strikePrice": 0,
      "freeTrial": false,
      "trialPrice": 0,
      "planId": "plan_QkkDw9QRHFT0nG",
      "validityInDays": 365
    }
  ],
  "premiumUser": false,
  "premiumTill": 0,
  "subscriptionStatus": "NO_ACTIVE_SUBSCRIPTIONS",
  "previouslyPurchased": false,
  "apiKey": "rzp_live_EWIcFTdUd0CymA"
}
```

### 2. Create Subscription

**Endpoint:**
```
POST https://learner.netaapp.in/api/subscriptions/create-order
```

**Headers:**
```javascript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <USER_JWT_TOKEN>",
  "x-package-id": "com.gumbo.learning" // or "com.gumbo.english"
}
```

**Request Body:**
```json
{
  "plan": "monthly", // or "yearly"
  "recurring": true
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "subscriptionId": "sub_1752620296919_bne87ut",
    "razorpaySubscriptionId": "sub_QtW4P6QZKjygiq",
    "amount": 11700,
    "currency": "INR",
    "plan": "monthly",
    "razorpayKeyId": "rzp_live_EWIcFTdUd0CymA",
    "type": "recurring-subscription",
    "source": "microservice",
    "shortUrl": "https://rzp.io/rzp/am8KCdFe",
    "subscriptionDetails": {
      "microserviceSubscriptionId": "sub_1752620296919_bne87ut",
      "razorpaySubscriptionId": "sub_QtW4P6QZKjygiq",
      "status": "created"
    }
  }
}
```

## 🔄 Migration Guide

### Before (Old API Calls)
```javascript
// OLD - Direct Razorpay integration
const response = await fetch('/api/subscriptions/create-order', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${userToken}`
  },
  body: JSON.stringify({
    plan: 'monthly',
    recurring: true
  })
});
```

### After (New Microservice Integration)
```javascript
// NEW - Payment Microservice integration
const response = await fetch('https://learner.netaapp.in/api/subscriptions/create-order', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${userToken}`,
    'x-package-id': 'com.gumbo.learning' // IMPORTANT: Add package ID
  },
  body: JSON.stringify({
    plan: 'monthly',
    recurring: true
  })
});

const data = await response.json();

if (data.success) {
  // Use the shortUrl for payment redirection
  window.open(data.data.shortUrl, '_blank');
  
  // Store subscription details for tracking
  const subscriptionInfo = {
    subscriptionId: data.data.subscriptionId,
    razorpaySubscriptionId: data.data.razorpaySubscriptionId,
    amount: data.data.amount,
    plan: data.data.plan,
    paymentUrl: data.data.shortUrl
  };
}
```

## 📱 App-Specific Configuration

### Seekho Learning App
```javascript
const PACKAGE_ID = 'com.gumbo.learning';
const API_BASE_URL = 'https://learner.netaapp.in';
```

### Bolo English App
```javascript
const PACKAGE_ID = 'com.gumbo.english';
const API_BASE_URL = 'https://learner.netaapp.in';
```

## 🔑 Authentication

### JWT Token Requirements
- Use the same JWT tokens you're currently using
- No changes required to authentication flow
- Token should be included in `Authorization: Bearer <token>` header

### Package ID Header
- **CRITICAL**: Always include `x-package-id` header
- Use `com.gumbo.learning` for Seekho app
- Use `com.gumbo.english` for Bolo app

## 💰 Payment Flow

### 1. Get Plans
```javascript
async function getSubscriptionPlans(packageId) {
  const response = await fetch(`${API_BASE_URL}/api/subscriptions/plans`, {
    headers: {
      'x-package-id': packageId
    }
  });
  return response.json();
}
```

### 2. Create Subscription
```javascript
async function createSubscription(userToken, packageId, plan) {
  const response = await fetch(`${API_BASE_URL}/api/subscriptions/create-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`,
      'x-package-id': packageId
    },
    body: JSON.stringify({
      plan: plan, // 'monthly' or 'yearly'
      recurring: true
    })
  });
  
  const data = await response.json();
  
  if (data.success) {
    // Redirect user to payment URL
    return {
      paymentUrl: data.data.shortUrl,
      subscriptionId: data.data.subscriptionId,
      amount: data.data.amount
    };
  } else {
    throw new Error(data.message || 'Subscription creation failed');
  }
}
```

### 3. Handle Payment Redirect
```javascript
// Redirect user to Razorpay payment page
function redirectToPayment(paymentUrl) {
  // For mobile apps, open in browser
  if (isMobileApp()) {
    window.open(paymentUrl, '_system');
  } else {
    // For web, open in new tab
    window.open(paymentUrl, '_blank');
  }
}
```

## 🔄 Response Handling

### Success Response Structure
```javascript
{
  success: true,
  data: {
    subscriptionId: "sub_xxx", // Internal microservice ID
    razorpaySubscriptionId: "sub_xxx", // Razorpay subscription ID
    amount: 11700, // Amount in paise
    currency: "INR",
    plan: "monthly",
    razorpayKeyId: "rzp_live_xxx",
    type: "recurring-subscription",
    source: "microservice", // Indicates new integration
    shortUrl: "https://rzp.io/rzp/xxx", // Payment URL
    subscriptionDetails: {
      microserviceSubscriptionId: "sub_xxx",
      razorpaySubscriptionId: "sub_xxx",
      status: "created"
    }
  }
}
```

### Error Response Structure
```javascript
{
  success: false,
  message: "Error description"
}
```

## 🚨 Important Changes

### 1. Package ID Header
- **MUST** include `x-package-id` header in all requests
- Different package IDs for different apps
- Missing this header will cause requests to fail

### 2. Payment URL
- Use `data.shortUrl` for payment redirection
- This replaces any direct Razorpay integration
- URL is pre-configured and ready for payment

### 3. Subscription IDs
- Two IDs returned: `subscriptionId` (internal) and `razorpaySubscriptionId` (Razorpay)
- Use `subscriptionId` for internal tracking
- Use `razorpaySubscriptionId` for Razorpay-specific operations

### 4. Source Indicator
- Response includes `source: "microservice"` to indicate new integration
- Can be used for analytics and debugging

## 🧪 Testing

### Test Endpoints
```javascript
// Health check
GET https://learner.netaapp.in/health

// Test plans (both apps should return same plans)
GET https://learner.netaapp.in/api/subscriptions/plans
Headers: { "x-package-id": "com.gumbo.learning" }

GET https://learner.netaapp.in/api/subscriptions/plans
Headers: { "x-package-id": "com.gumbo.english" }
```

### Test Subscription Creation
```bash
# Test with curl (replace USER_TOKEN with actual JWT)
curl -X POST https://learner.netaapp.in/api/subscriptions/create-order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "x-package-id: com.gumbo.learning" \
  -d '{"plan": "monthly", "recurring": true}'
```

## 📞 Support

### Production URLs
- **API Base**: `https://learner.netaapp.in`
- **Payment Microservice**: `https://payments.netaapp.in`
- **Documentation**: `http://learner.netaapp.in/api-docs`

### Callback URLs (for reference)
- **Learning**: `https://learner.netaapp.in/api/payment/callback/learning`
- **English**: `https://learner.netaapp.in/api/payment/callback/english`

### Plan IDs
- **Monthly**: `plan_QkkDaTp9Hje6uC` (₹99 + GST = ₹117)
- **Yearly**: `plan_QkkDw9QRHFT0nG` (₹499 + GST = ₹587)

## ✅ Checklist for Frontend Teams

- [ ] Update API base URL to `https://learner.netaapp.in`
- [ ] Add `x-package-id` header to all subscription-related requests
- [ ] Update subscription creation endpoint calls
- [ ] Handle new response structure with `shortUrl`
- [ ] Test with both package IDs (`com.gumbo.learning` and `com.gumbo.english`)
- [ ] Update payment redirection logic to use `shortUrl`
- [ ] Test end-to-end payment flow
- [ ] Update error handling for new response structure
- [ ] Verify authentication still works with existing JWT tokens

## 🎉 Benefits of New Integration

1. **Unified Payment System**: Both apps use the same payment infrastructure
2. **Better Security**: Package isolation prevents cross-app access
3. **Improved Reliability**: Dedicated payment microservice with retry logic
4. **Easier Maintenance**: Centralized payment logic
5. **Better Monitoring**: Enhanced logging and error tracking
6. **Future-Proof**: Scalable architecture for additional apps

---

**Ready for Production**: The integration is live and tested. Frontend teams can start implementing these changes immediately.
