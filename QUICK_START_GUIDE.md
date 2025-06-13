# Quick Start Guide - Trial Subscription Integration

## 🚀 5-Minute Integration Guide

This is a condensed guide for frontend developers to quickly understand and implement the new trial subscription system.

## 📋 What You Need to Know

### 1. New Subscription Model
- **Trial:** ₹1 for 5 days → Auto-converts to ₹117/month
- **Monthly:** ₹117/month (was ₹99)
- **One trial per user** (lifetime limit)

### 2. User Flow Changes
```
New User: Shows trial option (₹1 for 5 days)
Returning User: Shows monthly only (₹117/month)
```

## 🔧 Implementation Steps

### Step 1: Check Trial Eligibility
```javascript
// Add this before showing subscription options
const checkTrialEligibility = async () => {
  const response = await fetch('/api/subscriptions/trial-eligibility', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  return data.data.isTrialEligible;
};
```

### Step 2: Update Subscription Display
```javascript
const loadSubscriptionOptions = async () => {
  const isEligible = await checkTrialEligibility();
  
  if (isEligible) {
    // Show: "Try 5 days for ₹1, then ₹117/month"
    showTrialOption();
  } else {
    // Show: "₹117/month"
    showMonthlyOnlyOption();
  }
};
```

### Step 3: Handle Order Creation
```javascript
const createSubscription = async (plan) => {
  const response = await fetch('/api/subscriptions/create-order', {
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
  
  const data = await response.json();
  
  if (!data.success && data.showMonthlyOnly) {
    // User already used trial
    showMonthlyOnlyOption();
    return;
  }
  
  // Proceed with payment
  initiatePayment(data.data);
};
```

### Step 4: Update Pricing Display
```javascript
// Update all pricing references
const pricing = {
  trial: { amount: 1, display: "₹1 for 5 days" },
  monthly: { amount: 117, display: "₹117/month" },
  monthlyWithGST: { display: "₹99 + 18% GST = ₹117" }
};
```

## 🎨 UI Components

### Trial Option
```jsx
<div className="trial-option">
  <h3>Trial</h3>
  <div className="price">₹1</div>
  <div className="duration">5 days</div>
  <div className="description">Try 5 days for ₹1, then ₹117/month</div>
  <button onClick={() => createSubscription('trial')}>
    Start Trial
  </button>
</div>
```

### Monthly Option
```jsx
<div className="monthly-option">
  <h3>Monthly</h3>
  <div className="price">₹117</div>
  <div className="duration">per month</div>
  <div className="description">₹99 + 18% GST = ₹117/month</div>
  <button onClick={() => createSubscription('monthly')}>
    Subscribe Monthly
  </button>
</div>
```

## 🧪 Quick Test

### Test with cURL
```bash
# 1. Check trial eligibility
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/subscriptions/trial-eligibility

# 2. Create trial order
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"plan":"trial","subscriptionType":"one-time"}' \
  http://localhost:8000/api/subscriptions/create-order
```

### Expected Responses
```javascript
// Trial eligible user
{ "isTrialEligible": true, "hasUsedTrial": false }

// Trial order response
{ "orderId": "order_xyz", "amount": 100, "plan": "trial" }

// Trial already used error
{ "success": false, "showMonthlyOnly": true, "monthlyPrice": 117 }
```

## 🚨 Key Points

### Must Do
1. ✅ Check trial eligibility before showing options
2. ✅ Update monthly pricing from ₹99 to ₹117
3. ✅ Handle trial-used error gracefully
4. ✅ Test with both new and existing users

### Don't Forget
- Trial amount is ₹1 (100 paise)
- Monthly amount is ₹117 (11,700 paise)
- One trial per user (lifetime)
- Auto-conversion after 5 days

## 🔄 Migration Checklist

### Frontend Changes
- [ ] Add trial eligibility check
- [ ] Update subscription plans display
- [ ] Change monthly pricing ₹99 → ₹117
- [ ] Handle trial-used errors
- [ ] Test payment flows

### Mobile App Changes
- [ ] Update subscription screens
- [ ] Change pricing displays
- [ ] Test payment integration
- [ ] Handle error scenarios

## 📞 Need Help?

### Quick References
- **API Docs:** `API_TESTING_GUIDE.md`
- **Detailed Guide:** `FRONTEND_INTEGRATION_GUIDE.md`
- **Full Changes:** `SUBSCRIPTION_CHANGES_SUMMARY.md`

### Common Issues
1. **Trial check fails:** Ensure Bearer token is included
2. **Order creation fails:** Check plan and subscriptionType values
3. **Payment fails:** Verify amount matches plan (₹1 or ₹117)

### Test Users
```javascript
// Generate test token
node scripts/generate-test-token.js --name "Test User" --email "test@example.com"

// Use token to authenticate and test flows
```

## 🎯 Success Criteria

Your integration is successful when:
- ✅ New users see trial option (₹1 for 5 days)
- ✅ Users who used trial see monthly only (₹117/month)
- ✅ Payment flows work for both amounts
- ✅ Error handling works gracefully
- ✅ Subscription activation works correctly

## 🚀 Ready to Start?

1. **Read this guide** ✅
2. **Check API endpoints** with test user
3. **Update frontend code** with trial eligibility
4. **Test payment flows** for both plans
5. **Deploy and monitor** 🎉

The backend is ready and waiting for your integration! 🔥
