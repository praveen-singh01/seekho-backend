# Trial-Based Subscription System

## Overview

This document describes the implementation of the new trial-based subscription system for Seekho app, which replaces the previous monthly/yearly subscription model with a trial-first approach.

## New Subscription Model

### Trial Plan
- **Price**: ₹1 for 5 days
- **Duration**: 5 days
- **Auto-conversion**: After 5 days, automatically converts to monthly subscription
- **Monthly Price**: ₹117 (₹99 + 18% GST)
- **Recurring**: Every 30 days after conversion

### Key Features
1. **One-time trial per user**: Each user can only use the trial once
2. **Automatic conversion**: Trial converts to monthly subscription after 5 days
3. **Edge case handling**: Users who cancel trial and return see monthly pricing directly
4. **GST included**: Monthly price includes 18% GST (₹99 + ₹18 = ₹117)

## Implementation Details

### Database Changes

#### User Model Updates
```javascript
// New fields added to User schema
hasUsedTrial: {
  type: Boolean,
  default: false
},
trialUsedAt: {
  type: Date,
  default: null
}
```

#### Subscription Model Updates
```javascript
// New fields added to Subscription schema
isTrialSubscription: {
  type: Boolean,
  default: false
},
trialConvertedAt: {
  type: Date,
  default: null
},
originalTrialEndDate: {
  type: Date,
  default: null
}
```

### Environment Variables Updated
```bash
TRIAL_PRICE=100                # ₹1 in paise
MONTHLY_PRICE=11700           # ₹117 in paise (₹99 + 18% GST)
TRIAL_DURATION_DAYS=5         # Changed from 7 to 5 days
MONTHLY_BASE_PRICE=9900       # ₹99 base price without GST
```

### New API Endpoints

#### Check Trial Eligibility
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

**Response (Trial already used):**
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

#### Convert Trial to Monthly
```http
POST /api/subscriptions/convert-trial
Authorization: Bearer <token>
Content-Type: application/json

{
  "subscriptionId": "subscription_id_here"
}
```

#### Complete Trial Conversion
```http
POST /api/subscriptions/complete-conversion
Authorization: Bearer <token>
Content-Type: application/json

{
  "subscriptionId": "subscription_id_here",
  "razorpay_order_id": "order_id",
  "razorpay_payment_id": "payment_id",
  "razorpay_signature": "signature"
}
```

### Updated Subscription Flow

#### For New Users (Trial Eligible)
1. User sees "Try 5 days for ₹1, then ₹117/month"
2. User pays ₹1 for trial
3. Trial is marked as used for the user
4. After 5 days, system automatically handles conversion
5. User is charged ₹117 for monthly subscription
6. Subscription continues monthly at ₹117

#### For Returning Users (Trial Used)
1. User sees "₹117/month" directly
2. No trial option available
3. Direct monthly subscription at ₹117

### Background Jobs

#### Trial Conversion Job
- **Schedule**: Runs every hour
- **Function**: Checks for expired trials and handles conversion
- **Location**: `jobs/trialConversionJob.js`
- **Auto-start**: Starts with server

### Error Handling

#### Trial Already Used
```json
{
  "success": false,
  "message": "Trial already used. Please choose monthly subscription.",
  "showMonthlyOnly": true,
  "monthlyPrice": 117,
  "monthlyPriceInPaise": 11700
}
```

### Frontend Integration

#### Subscription Plans Display
```javascript
// Check trial eligibility first
const eligibilityResponse = await fetch('/api/subscriptions/trial-eligibility');
const eligibility = await eligibilityResponse.json();

if (eligibility.data.isTrialEligible) {
  // Show trial option: "Try 5 days for ₹1, then ₹117/month"
  showTrialOption();
} else {
  // Show monthly option only: "₹117/month"
  showMonthlyOnlyOption();
}
```

#### Payment Flow
```javascript
// For trial
const trialOrder = await createSubscriptionOrder('trial');
// Process ₹1 payment

// For monthly (after trial used)
const monthlyOrder = await createSubscriptionOrder('monthly');
// Process ₹117 payment
```

### Testing

#### Test Script
Run the test script to verify implementation:
```bash
node test-trial-system.js
```

#### Manual Testing Steps
1. Register new user
2. Check trial eligibility (should be true)
3. Create trial subscription (₹1)
4. Verify trial is marked as used
5. Try creating trial again (should fail)
6. Create monthly subscription (₹117)

### Migration Notes

#### Existing Users
- Existing users retain their current subscriptions
- New trial tracking fields are added with default values
- No impact on existing subscription functionality

#### Pricing Updates
- Monthly price updated from ₹99 to ₹117 (includes GST)
- Trial duration changed from 7 to 5 days
- Trial price remains ₹1

### Monitoring and Analytics

#### Key Metrics to Track
1. Trial conversion rate (trial to monthly)
2. Trial cancellation rate
3. Monthly subscription retention
4. Revenue per user (trial + monthly)

#### Database Queries for Analytics
```javascript
// Trial conversion rate
const trialConversions = await Subscription.countDocuments({
  isTrialSubscription: false,
  trialConvertedAt: { $exists: true }
});

// Active trials
const activeTrials = await Subscription.countDocuments({
  plan: 'trial',
  status: 'active',
  isTrialSubscription: true
});
```

### Security Considerations

1. **Trial Abuse Prevention**: One trial per user enforced at database level
2. **Payment Verification**: All payments verified through Razorpay signatures
3. **User Authentication**: All subscription endpoints require authentication
4. **Data Validation**: Input validation on all subscription endpoints

### Future Enhancements

1. **Email Notifications**: Notify users before trial expiration
2. **Grace Period**: Allow 1-2 days grace period for conversion
3. **Promo Codes**: Support for promotional trial extensions
4. **Analytics Dashboard**: Real-time trial conversion metrics
5. **A/B Testing**: Test different trial durations and pricing

## Conclusion

The new trial-based subscription system provides a user-friendly way to onboard new users while ensuring proper revenue conversion. The implementation handles all edge cases and provides a smooth transition from trial to monthly subscription.
