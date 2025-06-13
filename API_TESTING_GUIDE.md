# API Testing Guide - Trial Subscription System

## 🧪 Complete Testing Guide for Frontend Team

This guide provides step-by-step instructions to test the new trial-based subscription system.

## 🔧 Setup

**Base URL:** `http://localhost:8000/api`
**Authentication:** All subscription endpoints require Bearer token

## 📝 Test Scenarios

### Scenario 1: New User Trial Flow

#### Step 1: Create Test User
```bash
# Generate test token
node scripts/generate-test-token.js --name "Test User" --email "test@example.com"

# Authenticate user
curl -X POST http://localhost:8000/api/auth/android/google \
  -H "Content-Type: application/json" \
  -d '{"idToken": "GENERATED_TOKEN_HERE"}'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "token": "JWT_TOKEN_HERE",
    "user": { ... },
    "subscription": {
      "hasSubscription": false,
      "isActive": false
    }
  }
}
```

#### Step 2: Check Trial Eligibility
```bash
curl -X GET http://localhost:8000/api/subscriptions/trial-eligibility \
  -H "Authorization: Bearer JWT_TOKEN_HERE"
```

**Expected Response:**
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

#### Step 3: Get Subscription Plans
```bash
curl -X GET http://localhost:8000/api/subscriptions/plans
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "trial": {
      "name": "Trial",
      "duration": "5 days",
      "price": 1,
      "description": "Try 5 days for ₹1, then ₹117/month"
    },
    "monthly": {
      "name": "Monthly Subscription",
      "duration": "30 days",
      "price": 117,
      "basePrice": 99,
      "gst": 18,
      "description": "₹99 + 18% GST = ₹117/month"
    }
  }
}
```

#### Step 4: Create Trial Order
```bash
curl -X POST http://localhost:8000/api/subscriptions/create-order \
  -H "Authorization: Bearer JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"plan":"trial","subscriptionType":"one-time"}'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "order_xyz",
    "amount": 100,
    "currency": "INR",
    "plan": "trial",
    "razorpayKeyId": "rzp_live_xxx",
    "type": "one-time"
  }
}
```

### Scenario 2: User Who Already Used Trial

#### Step 1: Check Trial Eligibility (After Trial Used)
```bash
curl -X GET http://localhost:8000/api/subscriptions/trial-eligibility \
  -H "Authorization: Bearer JWT_TOKEN_HERE"
```

**Expected Response:**
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

#### Step 2: Try to Create Trial Order (Should Fail)
```bash
curl -X POST http://localhost:8000/api/subscriptions/create-order \
  -H "Authorization: Bearer JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"plan":"trial","subscriptionType":"one-time"}'
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Trial already used. Please choose monthly subscription.",
  "showMonthlyOnly": true,
  "monthlyPrice": 117,
  "monthlyPriceInPaise": 11700
}
```

#### Step 3: Create Monthly Order
```bash
curl -X POST http://localhost:8000/api/subscriptions/create-order \
  -H "Authorization: Bearer JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"plan":"monthly","subscriptionType":"recurring"}'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "order_xyz",
    "amount": 11700,
    "currency": "INR",
    "plan": "monthly",
    "razorpayKeyId": "rzp_live_xxx",
    "type": "recurring"
  }
}
```

### Scenario 3: Subscription Status Check

#### Check Current Subscription Status
```bash
curl -X GET http://localhost:8000/api/subscriptions/status \
  -H "Authorization: Bearer JWT_TOKEN_HERE"
```

**Expected Response (Active Trial):**
```json
{
  "success": true,
  "data": {
    "hasSubscription": true,
    "isActive": true,
    "subscription": {
      "plan": "trial",
      "status": "active",
      "startDate": "2024-01-15T10:30:00.000Z",
      "endDate": "2024-01-20T10:30:00.000Z",
      "isTrialSubscription": true
    }
  }
}
```

## 🔍 Testing Checklist

### ✅ Frontend Integration Tests

#### Trial Eligibility
- [ ] New user shows trial option
- [ ] User who used trial shows monthly only
- [ ] API call handles errors gracefully
- [ ] Loading states work correctly

#### Subscription Plans
- [ ] Plans API returns updated pricing
- [ ] Trial shows ₹1 for 5 days
- [ ] Monthly shows ₹117 with GST breakdown
- [ ] UI displays correct information

#### Order Creation
- [ ] Trial order creates with ₹1 amount
- [ ] Monthly order creates with ₹117 amount
- [ ] Error handling for trial-used scenario
- [ ] Razorpay integration works

#### Payment Flow
- [ ] Trial payment processes ₹1
- [ ] Monthly payment processes ₹117
- [ ] Payment verification works
- [ ] Subscription activates correctly

#### Error Scenarios
- [ ] Trial already used error handled
- [ ] Network errors handled gracefully
- [ ] Invalid token errors handled
- [ ] Payment failures handled

### 🧪 Test Data

#### Test Users
```javascript
// New user (trial eligible)
const newUser = {
  name: "New Test User",
  email: "new.test@example.com",
  expectedTrialEligible: true
};

// Existing user (trial used)
const existingUser = {
  name: "Existing Test User", 
  email: "existing.test@example.com",
  expectedTrialEligible: false
};
```

#### Expected Amounts
```javascript
const expectedAmounts = {
  trial: 100,        // ₹1 in paise
  monthly: 11700,    // ₹117 in paise
  yearly: 49900      // ₹499 in paise (unchanged)
};
```

## 🚨 Common Issues & Solutions

### Issue 1: Trial Eligibility Check Fails
**Cause:** User not authenticated
**Solution:** Ensure Bearer token is included in headers

### Issue 2: Order Creation Fails
**Cause:** Invalid plan or missing subscription type
**Solution:** Verify request payload matches API specification

### Issue 3: Payment Verification Fails
**Cause:** Invalid Razorpay signature
**Solution:** Use proper signature generation for testing

### Issue 4: Trial Already Used Error
**Cause:** User previously used trial
**Solution:** Handle error gracefully and show monthly option

## 📊 Test Results Template

```markdown
## Test Results

### Trial Eligibility API
- [ ] New user: Returns eligible ✅/❌
- [ ] Used trial user: Returns not eligible ✅/❌
- [ ] Error handling: Works correctly ✅/❌

### Subscription Plans API
- [ ] Trial plan: ₹1, 5 days ✅/❌
- [ ] Monthly plan: ₹117, GST breakdown ✅/❌
- [ ] Response format: Correct ✅/❌

### Order Creation API
- [ ] Trial order: ₹1 amount ✅/❌
- [ ] Monthly order: ₹117 amount ✅/❌
- [ ] Trial used error: Handled ✅/❌

### Payment Flow
- [ ] Trial payment: Processes ₹1 ✅/❌
- [ ] Monthly payment: Processes ₹117 ✅/❌
- [ ] Subscription activation: Works ✅/❌

### UI Integration
- [ ] Trial option display: Correct ✅/❌
- [ ] Monthly only display: Correct ✅/❌
- [ ] Error messages: User-friendly ✅/❌
- [ ] Loading states: Implemented ✅/❌

### Notes:
[Add any issues or observations here]
```

## 🔄 Quick Test Script

```bash
#!/bin/bash
# Quick test script for trial system

echo "Testing Trial Subscription System..."

# Test 1: Get plans
echo "1. Testing subscription plans..."
curl -s http://localhost:8000/api/subscriptions/plans | jq .

# Test 2: Check trial eligibility (requires auth token)
echo "2. Testing trial eligibility..."
# Replace TOKEN with actual JWT token
curl -s -H "Authorization: Bearer TOKEN" \
  http://localhost:8000/api/subscriptions/trial-eligibility | jq .

# Test 3: Create trial order
echo "3. Testing trial order creation..."
curl -s -X POST \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"plan":"trial","subscriptionType":"one-time"}' \
  http://localhost:8000/api/subscriptions/create-order | jq .

echo "Testing complete!"
```

## 📞 Support

If you encounter any issues during testing:
1. Check the server logs for detailed error messages
2. Verify authentication tokens are valid
3. Ensure request payloads match the API specification
4. Test with both new and existing users

The backend team is available to help resolve any integration issues!
