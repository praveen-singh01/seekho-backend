# Razorpay Plan Setup Guide

## ⚠️ IMPORTANT: No More Programmatic Plan Creation

**This backend now uses PREDEFINED plan IDs from Razorpay Dashboard instead of creating plans programmatically.**

### Why This Change?

1. **Performance**: Creating plans for every user is extremely inefficient
2. **Cost**: Each plan creation API call costs money and time
3. **Management**: Having hundreds of duplicate plans makes dashboard unusable
4. **Best Practice**: Razorpay recommends using predefined plans for production

## 🏗️ Setup Instructions

### Step 1: Create Plans in Razorpay Dashboard

1. Login to your Razorpay Dashboard
2. Go to **Subscriptions** → **Plans**
3. Create the following plans:

#### Monthly Plan
- **Plan ID**: `seekho_monthly_117`
- **Plan Name**: `Seekho Monthly Plan`
- **Billing Amount**: `₹117` (11700 paise)
- **Billing Cycle**: `Monthly`
- **Description**: `Monthly subscription for Seekho learning platform`

#### Yearly Plan
- **Plan ID**: `seekho_yearly_499`
- **Plan Name**: `Seekho Yearly Plan`
- **Billing Amount**: `₹499` (49900 paise)
- **Billing Cycle**: `Yearly`
- **Description**: `Yearly subscription for Seekho learning platform`

### Step 2: Update Environment Variables

Add these to your `.env` file:

```bash
# Razorpay Plan IDs (created in Razorpay Dashboard)
RAZORPAY_MONTHLY_PLAN_ID=seekho_monthly_117
RAZORPAY_YEARLY_PLAN_ID=seekho_yearly_499
```

### Step 3: Verify Configuration

The server will automatically validate these plan IDs on startup. You'll see:

```
✅ PaymentService initialized with predefined plan IDs
```

If plan IDs are missing, you'll see:
```
❌ PaymentService initialization failed: RAZORPAY_MONTHLY_PLAN_ID is not configured
```

## 🔧 Code Changes Made

### Deprecated Methods

The following methods are now **DEPRECATED** and will throw errors:

- `PaymentService.createRazorpayPlan()` - ❌ Don't use
- `PaymentService.createTrialToMonthlyPlan()` - ❌ Don't use

### New Methods

- `PaymentService.getPredefinedPlanId(plan)` - ✅ Use this
- `PaymentService.validatePlanConfiguration()` - ✅ Validates setup

### Updated Methods

- `PaymentService.createAutoRecurringTrialSubscription()` - Now uses predefined plans
- `SubscriptionService.createRecurringSubscription()` - Already used predefined plans
- `SubscriptionService.createTrialWithMandate()` - Already used predefined plans

## 🧪 Testing

### Test Plan Configuration

```javascript
// This will validate your setup
const PaymentService = require('./services/paymentService');

try {
  PaymentService.initialize();
  console.log('✅ Plans configured correctly');
} catch (error) {
  console.error('❌ Plan configuration error:', error.message);
}
```

### Test Plan ID Retrieval

```javascript
// Get monthly plan ID
const monthlyPlanId = PaymentService.getPredefinedPlanId('monthly');
console.log('Monthly Plan ID:', monthlyPlanId);

// Get yearly plan ID
const yearlyPlanId = PaymentService.getPredefinedPlanId('yearly');
console.log('Yearly Plan ID:', yearlyPlanId);
```

## 🚨 Migration Notes

### Before (❌ Bad)
```javascript
// This created a new plan for every user - VERY BAD!
const planResult = await PaymentService.createRazorpayPlan(
  `plan_${Date.now()}`,
  11700,
  'monthly'
);
```

### After (✅ Good)
```javascript
// This uses predefined plan ID - CORRECT!
const planId = PaymentService.getPredefinedPlanId('monthly');
const subscriptionResult = await PaymentService.createRazorpaySubscription(
  planId,
  customerId,
  120
);
```

## 📊 Benefits

1. **Performance**: No API calls to create plans
2. **Consistency**: All users use the same plans
3. **Management**: Easy to manage in Razorpay Dashboard
4. **Cost**: Reduced API usage
5. **Reliability**: No plan creation failures

## 🔍 Troubleshooting

### Error: "Plan ID not configured"
- Check your `.env` file has the correct plan IDs
- Verify the plan IDs exist in your Razorpay Dashboard

### Error: "Plan creation is disabled"
- You're using deprecated methods
- Update your code to use `getPredefinedPlanId()`

### Server startup warnings
- Check the console for PaymentService initialization messages
- Fix any missing environment variables

## 📝 Environment Variables Reference

```bash
# Required Plan IDs
RAZORPAY_MONTHLY_PLAN_ID=seekho_monthly_117
RAZORPAY_YEARLY_PLAN_ID=seekho_yearly_499

# Pricing (for reference only)
MONTHLY_PRICE=11700  # ₹117 in paise
YEARLY_PRICE=49900   # ₹499 in paise
TRIAL_PRICE=100      # ₹1 in paise
```

## ✅ Verification Checklist

- [ ] Plans created in Razorpay Dashboard
- [ ] Environment variables updated
- [ ] Server starts without PaymentService errors
- [ ] Subscription creation works with predefined plans
- [ ] No more programmatic plan creation in logs

---

**Remember**: Always use predefined plan IDs. Never create plans programmatically in production!
