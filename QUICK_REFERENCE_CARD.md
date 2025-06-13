# Quick Reference Card - Trial Subscription API

## 🚀 Essential Endpoints

### 1. Check Trial Eligibility
```javascript
GET /api/subscriptions/trial-eligibility
Headers: Authorization: Bearer <token>

// Response: { isTrialEligible: true/false }
```

### 2. Create Regular Trial (₹1, manual conversion)
```javascript
POST /api/subscriptions/create-order
Body: { plan: "trial", subscriptionType: "one-time" }

// Response: { orderId, amount: 100, razorpayKeyId }
```

### 3. Create Smart Trial (₹1, UPI auto-pay)
```javascript
POST /api/subscriptions/create-trial-with-mandate
Body: { name, email, phone }

// Response: { shortUrl, mandateAmount: 11700 }
```

### 4. Create Monthly (₹117)
```javascript
POST /api/subscriptions/create-order
Body: { plan: "monthly", subscriptionType: "recurring" }

// Response: { orderId, amount: 11700, razorpayKeyId }
```

### 5. Verify Payment
```javascript
POST /api/subscriptions/verify-payment
Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan }

// Response: { success: true, subscription }
```

### 6. Check Status
```javascript
GET /api/subscriptions/status
Headers: Authorization: Bearer <token>

// Response: { hasSubscription, isActive, subscription }
```

---

## 💰 Pricing Summary

| Plan | Price | Duration | Auto-Convert |
|------|-------|----------|--------------|
| **Trial** | ₹1 | 5 days | Manual |
| **Smart Trial** | ₹1 | 5 days | Auto ₹117/month |
| **Monthly** | ₹117 | 30 days | Auto-renew |
| **Yearly** | ₹499 | 365 days | Auto-renew |

---

## 🔄 User Flow Logic

```javascript
// 1. Check eligibility
const eligibility = await checkTrialEligibility();

if (eligibility.isTrialEligible) {
  // Show trial options
  showTrialOptions();
} else {
  // Show monthly only
  showMonthlyOption();
}

// 2. Handle trial creation
const createTrial = async (withMandate = false) => {
  if (withMandate) {
    // Smart trial with UPI mandate
    const result = await createTrialWithMandate();
    window.open(result.shortUrl, '_blank');
  } else {
    // Regular trial
    const order = await createTrialOrder();
    initiateRazorpayPayment(order);
  }
};
```

---

## ⚡ Quick Implementation

```javascript
// Complete subscription component
const SubscriptionPage = () => {
  const [eligible, setEligible] = useState(null);

  useEffect(() => {
    checkEligibility();
  }, []);

  const checkEligibility = async () => {
    const response = await fetch('/api/subscriptions/trial-eligibility', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setEligible(data.data.isTrialEligible);
  };

  return (
    <div>
      {eligible ? (
        <div>
          <TrialOption />
          <SmartTrialOption />
          <MonthlyOption />
        </div>
      ) : (
        <MonthlyOnlyOption />
      )}
    </div>
  );
};
```

---

## 🎯 Key Points

### Trial Eligibility
- ✅ Always check before showing options
- ✅ One trial per user (lifetime)
- ✅ Handle "trial used" gracefully

### Payment Types
- **Regular Trial**: Razorpay SDK integration
- **Smart Trial**: Redirect to Razorpay subscription page
- **Monthly**: Razorpay SDK integration

### Error Handling
```javascript
if (error.showMonthlyOnly) {
  // User already used trial
  showMonthlyOnly();
} else {
  // General error
  showError(error.message);
}
```

### UPI Mandate Flow
```javascript
// 1. Create trial with mandate
const result = await createTrialWithMandate();

// 2. Redirect to Razorpay
window.open(result.shortUrl, '_blank');

// 3. User sets up UPI mandate
// 4. Auto-billing starts after 5 days
```

---

## 🧪 Test Tokens

```bash
# Generate test user
node scripts/generate-test-token.js --name "Test User" --email "test@example.com"

# Use token for API calls
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/subscriptions/trial-eligibility
```

---

## 📱 Mobile Integration

### React Native
```javascript
import { Linking } from 'react-native';

// For UPI mandate trial
const openRazorpaySubscription = (shortUrl) => {
  Linking.openURL(shortUrl);
};
```

### Flutter
```dart
import 'package:url_launcher/url_launcher.dart';

// For UPI mandate trial
void openRazorpaySubscription(String shortUrl) async {
  if (await canLaunch(shortUrl)) {
    await launch(shortUrl);
  }
}
```

---

## 🚨 Important Notes

1. **Always authenticate** - All subscription endpoints need Bearer token
2. **Check eligibility first** - Don't show trial to users who already used it
3. **Handle errors gracefully** - Show appropriate messages for different scenarios
4. **Verify payments** - Always call verify-payment after successful payment
5. **UPI mandate setup** - Use shortUrl for smart trial, not SDK

---

## 📞 Quick Help

### Common Issues
- **401 Unauthorized**: Check Bearer token
- **Trial already used**: Show monthly option only
- **Payment failed**: Retry with new order
- **Mandate setup**: Use shortUrl, not SDK

### Test Scenarios
1. New user → Should see trial options
2. Used trial → Should see monthly only
3. Payment success → Should activate subscription
4. UPI mandate → Should redirect to Razorpay

The API is ready for integration! 🎉
