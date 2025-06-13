# Frontend Integration Guide - Auto-Recurring Trial Subscriptions

## 🎯 **Overview**

This guide provides complete integration instructions for the **auto-recurring trial subscription system**. The backend now supports proper auto-recurring trials that match your implementation requirements.

### **Trial Flow Summary**
- **₹1 payment** for 5-day trial period
- **Automatic ₹117 billing** starting from day 6
- **Monthly recurring** billing every 30 days thereafter
- **One trial per user** (lifetime)

### **Key Changes from Previous Implementation**
- **Uses Razorpay subscriptions** instead of orders for auto-recurring
- **Returns `subscription_id`** for frontend integration
- **Automatic billing** handled by Razorpay webhooks
- **Proper signature verification** for subscription payments

## 🔄 New Subscription Flow

### For New Users (Trial Eligible)
```
1. User sees: "Try 5 days for ₹1, then ₹117/month"
2. User pays ₹1 for trial
3. Trial is active for 5 days
4. After 5 days: Auto-converts to ₹117/month
5. Continues monthly billing
```

### For Returning Users (Trial Used)
```
1. User sees: "₹117/month" (no trial option)
2. Direct monthly subscription
3. Monthly billing at ₹117
```

## 🛠 API Changes

### 1. Check Trial Eligibility
```http
GET /api/subscriptions/trial-eligibility
Authorization: Bearer <token>
```

**Response:**
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

**If trial already used:**
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

### 2. Updated Subscription Plans
**Endpoint:** `GET /api/subscriptions/plans`

**Response:**
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
    }
  }
}
```

### 2. Create Auto-Recurring Trial Subscription
```http
POST /api/subscriptions/create-order
Authorization: Bearer <token>
Content-Type: application/json

{
  "plan": "trial"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "sub_NjHjOGJhNzE2M",
    "subscription_id": "sub_NjHjOGJhNzE2M",
    "amount": 100,
    "currency": "INR",
    "plan": "trial",
    "subscriptionDetails": {
      "subscriptionId": "64f8a1b2c3d4e5f6g7h8i9j0",
      "customerId": "cust_NjHjOGJhNzE2M",
      "planId": "plan_NjHjOGJhNzE2M",
      "trialPeriod": 5,
      "trialAmount": 100,
      "monthlyAmount": 11700
    },
    "razorpayKeyId": "rzp_test_1234567890",
    "type": "auto-recurring-trial"
  }
}
```

**Error Response (Trial Already Used):**
```json
{
  "success": false,
  "message": "Trial already used. Please choose monthly subscription.",
  "showMonthlyOnly": true,
  "monthlyPrice": 117,
  "monthlyPriceInPaise": 11700
}
```

### 3. Verify Payment
```http
POST /api/subscriptions/verify-payment
Authorization: Bearer <token>
Content-Type: application/json

{
  "razorpay_subscription_id": "sub_NjHjOGJhNzE2M",
  "razorpay_payment_id": "pay_NjHjOGJhNzE2M",
  "razorpay_signature": "signature_string",
  "plan": "trial"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription created successfully",
  "data": {
    "_id": "64f8a1b2c3d4e5f6g7h8i9j0",
    "plan": "trial",
    "status": "active",
    "isTrialSubscription": true,
    "startDate": "2024-01-15T10:30:00.000Z",
    "endDate": "2024-01-20T10:30:00.000Z",
    "amount": 100,
    "autoRenew": true,
    "nextBillingDate": "2024-01-20T10:30:00.000Z"
  }
}
```

---

## � **Razorpay Integration**

### **Payment Configuration for Auto-Recurring Trial**

```dart
// For trial subscriptions (₹1 with auto-recurring)
Map<String, dynamic> options = {
  'key': razorpayKeyId,
  'amount': 100, // ₹1 in paise
  'subscription_id': orderData.subscription_id, // Use subscription_id from API
  'recurring': 1, // Enable auto-recurring
  'name': 'GyaniFy App',
  'description': '5-Day Trial Subscription',
  'prefill': {
    'contact': userPhone,
    'email': userEmail,
  },
  'theme': {
    'color': '#3399cc'
  }
};

// Initialize Razorpay
Razorpay razorpay = Razorpay();
razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handlePaymentSuccess);
razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _handlePaymentError);
razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleExternalWallet);
razorpay.open(options);
```

### **Payment Success Handler**

```dart
void _handlePaymentSuccess(PaymentSuccessResponse response) async {
  try {
    // Verify payment with backend
    final verificationResult = await ApiService.verifyPayment({
      'razorpay_subscription_id': response.razorpaySubscriptionId,
      'razorpay_payment_id': response.razorpayPaymentId,
      'razorpay_signature': response.razorpaySignature,
      'plan': 'trial'
    });

    if (verificationResult['success']) {
      // Trial activated successfully
      _showSuccessDialog();
      _navigateToHomeScreen();
    } else {
      _showErrorDialog('Payment verification failed');
    }
  } catch (error) {
    _showErrorDialog('Payment verification error: $error');
  }
}
```

### 2. Payment Flow
```javascript
async function createSubscription(plan) {
  try {
    // Create order
    const orderResponse = await fetch('/api/subscriptions/create-order', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
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
        // User already used trial, show monthly option
        showMonthlyOnlyOption();
        return;
      }
      throw new Error(orderData.message);
    }

    // Proceed with Razorpay payment
    initiateRazorpayPayment(orderData.data);

  } catch (error) {
    console.error('Error creating subscription:', error);
    showErrorMessage(error.message);
  }
}
```

### 3. UI Components

**Trial Option Component:**
```jsx
const TrialOption = () => (
  <div className="subscription-card trial">
    <h3>Trial</h3>
    <div className="price">₹1</div>
    <div className="duration">5 days</div>
    <div className="description">Try 5 days for ₹1, then ₹117/month</div>
    <ul className="features">
      <li>Access to all videos</li>
      <li>HD quality</li>
      <li>Mobile & web access</li>
    </ul>
    <button onClick={() => createSubscription('trial')}>
      Start Trial
    </button>
  </div>
);
```

**Monthly Option Component:**
```jsx
const MonthlyOption = ({ isTrialUsed = false }) => (
  <div className="subscription-card monthly">
    <h3>Monthly</h3>
    <div className="price">₹117</div>
    <div className="duration">per month</div>
    <div className="description">
      {isTrialUsed ? '₹117/month' : '₹99 + 18% GST = ₹117/month'}
    </div>
    <ul className="features">
      <li>Access to all videos</li>
      <li>HD quality</li>
      <li>Mobile & web access</li>
      <li>Download for offline viewing</li>
      <li>Auto-renewal</li>
    </ul>
    <button onClick={() => createSubscription('monthly')}>
      Subscribe Monthly
    </button>
  </div>
);
```

## 🧪 Testing Scenarios

### Test Case 1: New User (Trial Eligible)
1. Login with new user
2. Check trial eligibility → Should return `true`
3. Display trial option (₹1 for 5 days)
4. Create trial subscription
5. Complete payment
6. Verify subscription is active

### Test Case 2: Returning User (Trial Used)
1. Login with user who used trial
2. Check trial eligibility → Should return `false`
3. Display monthly option only (₹117/month)
4. Create monthly subscription
5. Complete payment
6. Verify subscription is active

### Test Case 3: Trial Already Used Error
1. User who used trial tries to create trial again
2. Should receive error with `showMonthlyOnly: true`
3. Frontend should automatically show monthly option

## 🔧 Error Handling

```javascript
// Handle trial eligibility errors
if (response.showMonthlyOnly) {
  // User already used trial
  showMonthlyOnlyOption();
  showMessage("Trial already used. Please choose monthly subscription.");
}

// Handle general subscription errors
if (!response.success) {
  showErrorMessage(response.message);
}
```

## 📱 Mobile App Considerations

- Update subscription screens to check trial eligibility
- Handle trial-used scenarios gracefully
- Update pricing displays (₹99 → ₹117)
- Test payment flows for both trial and monthly

## 🚨 Important Notes

1. **Always check trial eligibility** before showing subscription options
2. **Handle trial-used scenarios** gracefully
3. **Update all pricing** from ₹99 to ₹117 for monthly
4. **Test payment flows** thoroughly
5. **Update subscription status** displays

## 📞 Support

For any questions or issues during integration:
- Backend API is running on the same endpoints
- All existing endpoints remain functional
- New endpoints are additive (no breaking changes)
- Test with the provided test scenarios

## 🔄 Migration Checklist

- [ ] Update subscription page to check trial eligibility
- [ ] Add trial option UI component
- [ ] Update monthly pricing (₹99 → ₹117)
- [ ] Handle trial-used error scenarios
- [ ] Test payment flows for both plans
- [ ] Update subscription status displays
- [ ] Test with new and returning users
- [ ] Update mobile app screens
- [ ] Verify error handling works correctly
