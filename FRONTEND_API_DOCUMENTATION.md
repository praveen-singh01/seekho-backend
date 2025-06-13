# Frontend API Documentation - Trial Subscription System

## 📋 Overview

This document provides complete API documentation for integrating the new trial-based subscription system into the frontend application.

## 🔄 Subscription Flow

### New User Journey
```
1. Check trial eligibility → Show trial options
2. Create trial subscription → Get payment URL
3. User completes payment → Subscription activated
4. After 5 days → Auto-conversion to monthly
```

### Returning User Journey
```
1. Check trial eligibility → Show monthly only
2. Create monthly subscription → Get payment URL
3. User completes payment → Subscription activated
```

## 🛠 API Endpoints

### Base URL
```
Production: https://your-api-domain.com/api
Development: http://localhost:8000/api
```

### Authentication
All subscription endpoints require Bearer token authentication:
```
Authorization: Bearer <jwt_token>
```

---

## 1. Check Trial Eligibility

**Endpoint:** `GET /api/subscriptions/trial-eligibility`
**Purpose:** Check if user can use trial subscription
**Auth:** Required

### Request
```javascript
const response = await fetch('/api/subscriptions/trial-eligibility', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Response - Eligible User
```json
{
  "success": true,
  "data": {
    "isTrialEligible": true,
    "hasUsedTrial": false,
    "trialUsedAt": null,
    "alternativeOptions": null
  }
}
```

### Response - Trial Already Used
```json
{
  "success": true,
  "data": {
    "isTrialEligible": false,
    "hasUsedTrial": true,
    "trialUsedAt": "2024-01-15T10:30:00.000Z",
    "alternativeOptions": {
      "monthlyPrice": 117,
      "monthlyPriceInPaise": 11700,
      "description": "₹99 + 18% GST = ₹117/month"
    }
  }
}
```

---

## 2. Get Subscription Plans

**Endpoint:** `GET /api/subscriptions/plans`
**Purpose:** Get available subscription plans with pricing
**Auth:** Not required

### Request
```javascript
const response = await fetch('/api/subscriptions/plans');
```

### Response
```json
{
  "success": true,
  "data": {
    "trial": {
      "name": "Trial",
      "duration": "5 days",
      "price": 1,
      "currency": "INR",
      "features": ["Access to all videos", "HD quality", "Mobile & web access"],
      "billingCycle": "one-time",
      "description": "Try 5 days for ₹1, then ₹117/month"
    },
    "monthly": {
      "name": "Monthly Subscription",
      "duration": "30 days",
      "price": 117,
      "basePrice": 99,
      "gst": 18,
      "currency": "INR",
      "features": ["Access to all videos", "HD quality", "Mobile & web access", "Download for offline viewing", "Auto-renewal"],
      "billingCycle": "monthly",
      "autoRenew": true,
      "description": "₹99 + 18% GST = ₹117/month"
    },
    "yearly": {
      "name": "Yearly Subscription",
      "duration": "365 days",
      "price": 499,
      "currency": "INR",
      "features": ["Access to all videos", "HD quality", "Mobile & web access", "Download for offline viewing", "Priority support"],
      "billingCycle": "yearly",
      "autoRenew": true
    }
  }
}
```

---

## 3. Create Regular Trial Order

**Endpoint:** `POST /api/subscriptions/create-order`
**Purpose:** Create regular trial order (manual conversion)
**Auth:** Required

### Request
```javascript
const response = await fetch('/api/subscriptions/create-order', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    plan: 'trial',
    subscriptionType: 'one-time'
  })
});
```

### Success Response
```json
{
  "success": true,
  "data": {
    "orderId": "order_QgbzrJDvUPvuMj",
    "amount": 100,
    "currency": "INR",
    "plan": "trial",
    "razorpayKeyId": "rzp_live_xxx",
    "type": "one-time"
  }
}
```

### Error Response (Trial Used)
```json
{
  "success": false,
  "message": "Trial already used. Please choose monthly subscription.",
  "showMonthlyOnly": true,
  "monthlyPrice": 117,
  "monthlyPriceInPaise": 11700
}
```

---

## 4. Create Trial with UPI Mandate

**Endpoint:** `POST /api/subscriptions/create-trial-with-mandate`
**Purpose:** Create trial with UPI mandate for auto-conversion
**Auth:** Required

### Request
```javascript
const response = await fetch('/api/subscriptions/create-trial-with-mandate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'User Name',
    email: 'user@example.com',
    phone: '9876543210'
  })
});
```

### Success Response
```json
{
  "success": true,
  "message": "Trial subscription with UPI mandate created successfully",
  "data": {
    "subscriptionId": "684be7d74517f60a834ec2ca",
    "razorpaySubscriptionId": "sub_QgcdjUHo8XeiFa",
    "shortUrl": "https://rzp.io/rzp/XYM0ulM",
    "mandateSetup": true,
    "firstPaymentAmount": 100,
    "mandateAmount": 11700,
    "trialPeriod": 5,
    "description": "UPI mandate for ₹117/month, first payment ₹1 (trial)",
    "instructions": "Complete the subscription setup to activate your trial"
  }
}
```

### Error Response (Trial Used)
```json
{
  "success": false,
  "message": "Trial already used. Please choose monthly subscription.",
  "showMonthlyOnly": true,
  "monthlyPrice": 117,
  "monthlyPriceInPaise": 11700
}
```

---

## 5. Create Monthly Order

**Endpoint:** `POST /api/subscriptions/create-order`
**Purpose:** Create monthly subscription order
**Auth:** Required

### Request
```javascript
const response = await fetch('/api/subscriptions/create-order', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    plan: 'monthly',
    subscriptionType: 'recurring'
  })
});
```

### Success Response
```json
{
  "success": true,
  "data": {
    "orderId": "order_xyz123",
    "amount": 11700,
    "currency": "INR",
    "plan": "monthly",
    "razorpayKeyId": "rzp_live_xxx",
    "type": "recurring"
  }
}
```

---

## 6. Verify Payment

**Endpoint:** `POST /api/subscriptions/verify-payment`
**Purpose:** Verify payment and activate subscription
**Auth:** Required

### Request
```javascript
const response = await fetch('/api/subscriptions/verify-payment', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    razorpay_order_id: 'order_xyz',
    razorpay_payment_id: 'pay_xyz',
    razorpay_signature: 'signature_xyz',
    plan: 'trial' // or 'monthly'
  })
});
```

### Success Response
```json
{
  "success": true,
  "message": "Payment verified and subscription activated",
  "data": {
    "subscription": {
      "id": "subscription_id",
      "plan": "trial",
      "status": "active",
      "startDate": "2024-01-15T10:30:00.000Z",
      "endDate": "2024-01-20T10:30:00.000Z"
    }
  }
}
```

---

## 7. Get Subscription Status

**Endpoint:** `GET /api/subscriptions/status`
**Purpose:** Get current subscription status
**Auth:** Required

### Request
```javascript
const response = await fetch('/api/subscriptions/status', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Response - Active Subscription
```json
{
  "success": true,
  "data": {
    "hasSubscription": true,
    "isActive": true,
    "subscription": {
      "id": "subscription_id",
      "plan": "trial",
      "status": "active",
      "startDate": "2024-01-15T10:30:00.000Z",
      "endDate": "2024-01-20T10:30:00.000Z",
      "isTrialSubscription": true,
      "trialWithMandate": true,
      "autoRenew": true
    }
  }
}
```

### Response - No Subscription
```json
{
  "success": true,
  "data": {
    "hasSubscription": false,
    "isActive": false,
    "subscription": null
  }
}
```

---

## 8. Cancel Subscription

**Endpoint:** `POST /api/subscriptions/cancel`
**Purpose:** Cancel active subscription
**Auth:** Required

### Request
```javascript
const response = await fetch('/api/subscriptions/cancel', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    reason: 'User requested cancellation'
  })
});
```

### Success Response
```json
{
  "success": true,
  "message": "Subscription cancelled successfully",
  "data": {
    "subscription": {
      "id": "subscription_id",
      "status": "cancelled",
      "cancelledAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

---

## 💻 Frontend Implementation Guide

### 1. Subscription Page Logic

```javascript
// Main subscription component
const SubscriptionPage = () => {
  const [trialEligible, setTrialEligible] = useState(null);
  const [plans, setPlans] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      // Check trial eligibility
      const eligibilityResponse = await fetch('/api/subscriptions/trial-eligibility', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const eligibility = await eligibilityResponse.json();
      setTrialEligible(eligibility.data);

      // Get subscription plans
      const plansResponse = await fetch('/api/subscriptions/plans');
      const plansData = await plansResponse.json();
      setPlans(plansData.data);

      setLoading(false);
    } catch (error) {
      console.error('Error loading subscription data:', error);
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="subscription-page">
      {trialEligible?.isTrialEligible ? (
        <TrialOptions plans={plans} />
      ) : (
        <MonthlyOnlyOption plans={plans} />
      )}
    </div>
  );
};
```

### 2. Trial Options Component

```javascript
const TrialOptions = ({ plans }) => {
  const createRegularTrial = async () => {
    try {
      const response = await fetch('/api/subscriptions/create-order', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          plan: 'trial',
          subscriptionType: 'one-time'
        })
      });

      const data = await response.json();
      if (data.success) {
        // Proceed with Razorpay payment
        initiateRazorpayPayment(data.data);
      }
    } catch (error) {
      console.error('Error creating trial:', error);
    }
  };

  const createTrialWithMandate = async () => {
    try {
      const response = await fetch('/api/subscriptions/create-trial-with-mandate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          phone: user.phone
        })
      });

      const data = await response.json();
      if (data.success) {
        // Redirect to Razorpay subscription page
        window.open(data.data.shortUrl, '_blank');
      }
    } catch (error) {
      console.error('Error creating trial with mandate:', error);
    }
  };

  return (
    <div className="trial-options">
      <div className="trial-option">
        <h3>Quick Trial</h3>
        <div className="price">₹1</div>
        <div className="duration">5 days</div>
        <div className="description">Manual conversion required</div>
        <button onClick={createRegularTrial}>
          Start Quick Trial
        </button>
      </div>

      <div className="trial-option recommended">
        <h3>Smart Trial</h3>
        <div className="price">₹1</div>
        <div className="duration">5 days</div>
        <div className="description">Auto-converts to ₹117/month</div>
        <div className="badge">UPI Auto-pay</div>
        <button onClick={createTrialWithMandate}>
          Start Smart Trial
        </button>
      </div>
    </div>
  );
};
```

### 3. Payment Integration

```javascript
const initiateRazorpayPayment = (orderData) => {
  const options = {
    key: orderData.razorpayKeyId,
    amount: orderData.amount,
    currency: orderData.currency,
    name: 'Seekho',
    description: `${orderData.plan} subscription`,
    order_id: orderData.orderId,
    handler: function (response) {
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

const verifyPayment = async (paymentResponse, plan) => {
  try {
    const response = await fetch('/api/subscriptions/verify-payment', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
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
      // Payment successful, redirect to success page
      router.push('/subscription/success');
    }
  } catch (error) {
    console.error('Payment verification failed:', error);
  }
};
```

### 4. Error Handling

```javascript
const handleSubscriptionError = (error) => {
  if (error.showMonthlyOnly) {
    // User already used trial
    setShowTrialOptions(false);
    setShowMonthlyOnly(true);
    showMessage('Trial already used. Please choose monthly subscription.');
  } else {
    // General error
    showErrorMessage(error.message || 'Something went wrong');
  }
};
```

### 5. Subscription Status Check

```javascript
const checkSubscriptionStatus = async () => {
  try {
    const response = await fetch('/api/subscriptions/status', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();

    if (data.data.hasSubscription && data.data.isActive) {
      // User has active subscription
      setHasActiveSubscription(true);
      setSubscriptionData(data.data.subscription);
    } else {
      // No active subscription
      setHasActiveSubscription(false);
    }
  } catch (error) {
    console.error('Error checking subscription status:', error);
  }
};
```

---

## 🧪 Testing Guide

### Test Scenarios

1. **New User Trial Flow**
   - Check eligibility → Should return `true`
   - Create trial → Should succeed
   - Verify payment → Should activate trial

2. **Returning User Flow**
   - Check eligibility → Should return `false`
   - Try trial → Should show error
   - Create monthly → Should succeed

3. **UPI Mandate Flow**
   - Create trial with mandate → Should return `shortUrl`
   - User completes setup → Should activate trial
   - After 5 days → Should auto-convert

### Test Commands

```bash
# Check trial eligibility
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8000/api/subscriptions/trial-eligibility

# Create trial with mandate
curl -X POST \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","phone":"9876543210"}' \
  http://localhost:8000/api/subscriptions/create-trial-with-mandate
```

---

## 🚨 Important Notes

### Trial Eligibility
- Always check trial eligibility before showing trial options
- Handle trial-used scenarios gracefully
- Show appropriate error messages

### UPI Mandate
- Use `shortUrl` to redirect users to Razorpay
- UPI mandate is set up for ₹117/month
- Auto-conversion happens after 5 days

### Payment Flow
- Regular trial: Use Razorpay SDK integration
- UPI mandate trial: Redirect to Razorpay subscription page
- Always verify payments on backend

### Error Handling
- Handle network errors gracefully
- Show user-friendly error messages
- Provide fallback options

---

## 📞 Support

For integration support or questions:
- Backend API is ready for testing
- All endpoints are documented with examples
- Test environment available for development

The trial-based subscription system is ready for frontend integration! 🚀
