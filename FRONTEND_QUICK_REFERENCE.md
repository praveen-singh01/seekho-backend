# Frontend Quick Reference - Payment Microservice Integration

## 🚀 Quick Start

### 1. Update Base URL
```javascript
// OLD
const API_BASE = 'your-old-api-url';

// NEW
const API_BASE = 'https://learner.netaapp.in';
```

### 2. Add Package ID Configuration
```javascript
// Seekho Learning App
const PACKAGE_ID = 'com.gumbo.learning';

// Bolo English App  
const PACKAGE_ID = 'com.gumbo.english';
```

### 3. Update API Calls

#### Get Subscription Plans
```javascript
// NEW - Add x-package-id header
const plans = await fetch(`${API_BASE}/api/subscriptions/plans`, {
  headers: {
    'x-package-id': PACKAGE_ID  // ← ADD THIS
  }
});
```

#### Create Subscription
```javascript
// NEW - Add x-package-id header
const subscription = await fetch(`${API_BASE}/api/subscriptions/create-order`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${userToken}`,
    'x-package-id': PACKAGE_ID  // ← ADD THIS
  },
  body: JSON.stringify({
    plan: 'monthly', // or 'yearly'
    recurring: true
  })
});

const result = await subscription.json();

if (result.success) {
  // NEW - Use shortUrl for payment
  window.open(result.data.shortUrl, '_blank');  // ← USE THIS
}
```

## 📱 Complete Example

```javascript
class PaymentService {
  constructor(packageId) {
    this.API_BASE = 'https://learner.netaapp.in';
    this.PACKAGE_ID = packageId; // 'com.gumbo.learning' or 'com.gumbo.english'
  }

  async getPlans() {
    const response = await fetch(`${this.API_BASE}/api/subscriptions/plans`, {
      headers: {
        'x-package-id': this.PACKAGE_ID
      }
    });
    return response.json();
  }

  async createSubscription(userToken, plan) {
    const response = await fetch(`${this.API_BASE}/api/subscriptions/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
        'x-package-id': this.PACKAGE_ID
      },
      body: JSON.stringify({
        plan: plan, // 'monthly' or 'yearly'
        recurring: true
      })
    });

    const result = await response.json();
    
    if (result.success) {
      return {
        paymentUrl: result.data.shortUrl,
        subscriptionId: result.data.subscriptionId,
        amount: result.data.amount,
        plan: result.data.plan
      };
    } else {
      throw new Error(result.message);
    }
  }
}

// Usage for Seekho Learning App
const seekhoPayment = new PaymentService('com.gumbo.learning');

// Usage for Bolo English App
const boloPayment = new PaymentService('com.gumbo.english');
```

## 🔄 Migration Checklist

- [ ] ✅ Update API base URL to `https://learner.netaapp.in`
- [ ] ✅ Add `x-package-id` header to all requests
- [ ] ✅ Use `shortUrl` from response for payment redirection
- [ ] ✅ Test with both package IDs
- [ ] ✅ Verify existing JWT tokens still work

## 🚨 Critical Changes

1. **MUST ADD**: `x-package-id` header to all subscription requests
2. **MUST USE**: `result.data.shortUrl` for payment redirection
3. **MUST UPDATE**: Base URL to `https://learner.netaapp.in`

## 📞 Support

- **Production API**: `https://learner.netaapp.in`
- **Health Check**: `https://learner.netaapp.in/health`
- **Documentation**: `http://learner.netaapp.in/api-docs`

---
**Status**: ✅ Live in Production | **Ready**: Immediate Implementation
