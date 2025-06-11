# 📱 Subscription API Documentation for Flutter Frontend

## 🌐 Base URL
```
Production: https://your-api-domain.com
Development: http://localhost:8000
```

## 🔐 Authentication
All endpoints require JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 📋 **SUBSCRIPTION ENDPOINTS**

### 1. Get Available Plans
Get all available subscription plans.

```http
GET /api/subscriptions/plans
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "trial",
      "name": "Trial",
      "price": 0,
      "duration": 7,
      "durationType": "days",
      "features": ["Access to basic content", "Limited videos"],
      "isPopular": false
    },
    {
      "id": "monthly",
      "name": "Monthly Plan",
      "price": 99,
      "duration": 1,
      "durationType": "month",
      "features": ["Full access", "HD videos", "Download offline"],
      "isPopular": true
    },
    {
      "id": "yearly",
      "name": "Yearly Plan",
      "price": 499,
      "duration": 1,
      "durationType": "year",
      "features": ["Full access", "HD videos", "Download offline", "Priority support"],
      "isPopular": false
    }
  ]
}
```

### 2. Create Subscription Order
Create a payment order for subscription.

```http
POST /api/subscriptions/create-order
```

**Request Body:**
```json
{
  "plan": "monthly",
  "subscriptionType": "recurring"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "order_xyz123",
    "amount": 9900,
    "currency": "INR",
    "plan": "monthly",
    "razorpayKeyId": "rzp_test_xyz",
    "type": "recurring",
    "subscriptionDetails": {
      "subscriptionId": "sub_xyz123",
      "customerId": "cust_xyz123"
    }
  }
}
```

### 3. Verify Payment
Verify payment after successful transaction.

```http
POST /api/subscriptions/verify-payment
```

**Request Body:**
```json
{
  "razorpay_payment_id": "pay_xyz123",
  "razorpay_order_id": "order_xyz123",
  "razorpay_signature": "signature_xyz123",
  "plan": "monthly"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription created successfully",
  "data": {
    "id": "sub_xyz123",
    "plan": "monthly",
    "status": "active",
    "startDate": "2024-01-15T00:00:00.000Z",
    "endDate": "2024-02-15T00:00:00.000Z",
    "autoRenew": true
  }
}
```

### 4. Get Subscription Status
Get current user's subscription status.

```http
GET /api/subscriptions/status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "hasSubscription": true,
    "isActive": true,
    "subscription": {
      "id": "sub_xyz123",
      "plan": "monthly",
      "status": "active",
      "startDate": "2024-01-15T00:00:00.000Z",
      "endDate": "2024-02-15T00:00:00.000Z",
      "autoRenew": true,
      "amount": 99,
      "daysRemaining": 15
    },
    "daysRemaining": 15,
    "autoRenew": true
  }
}
```

### 5. Cancel Subscription
Cancel current subscription.

```http
POST /api/subscriptions/cancel
```

**Request Body:**
```json
{
  "reason": "Not satisfied with content"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription cancelled successfully",
  "data": {
    "status": "cancelled",
    "cancelledAt": "2024-01-20T10:30:00.000Z",
    "validUntil": "2024-02-15T00:00:00.000Z"
  }
}
```

### 6. Reactivate Subscription
Reactivate a cancelled subscription.

```http
POST /api/subscriptions/reactivate
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription reactivated successfully",
  "data": {
    "status": "active",
    "reactivatedAt": "2024-01-21T09:15:00.000Z"
  }
}
```

### 7. Get Subscription History
Get user's subscription history with pagination.

```http
GET /api/subscriptions/history?page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 3,
    "pages": 1
  },
  "data": [
    {
      "id": "sub_xyz123",
      "plan": "monthly",
      "status": "active",
      "amount": 99,
      "startDate": "2024-01-15T00:00:00.000Z",
      "endDate": "2024-02-15T00:00:00.000Z",
      "paymentId": "pay_xyz123",
      "createdAt": "2024-01-15T00:00:00.000Z"
    }
  ]
}
```

---

## 🔄 **RAZORPAY INTEGRATION**

### Payment Flow for Flutter

1. **Get Plans** → Display available subscription plans
2. **Create Order** → Get Razorpay order details
3. **Open Razorpay Checkout** → Use Razorpay Flutter SDK
4. **Verify Payment** → Confirm payment on backend
5. **Update UI** → Show subscription status

### Razorpay Flutter SDK Setup

```dart
// Add to pubspec.yaml
dependencies:
  razorpay_flutter: ^1.3.4

// Initialize Razorpay
Razorpay _razorpay = Razorpay();

// Setup event listeners
_razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handlePaymentSuccess);
_razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _handlePaymentError);
_razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleExternalWallet);

// Open checkout
var options = {
  'key': 'rzp_test_xyz', // From create-order response
  'amount': 9900, // From create-order response
  'order_id': 'order_xyz123', // From create-order response
  'name': 'Seekho App',
  'description': 'Monthly Subscription',
  'prefill': {
    'contact': user.phone,
    'email': user.email
  }
};
_razorpay.open(options);
```

---

## 📱 **FLUTTER IMPLEMENTATION EXAMPLES**

### 1. Subscription Service Class

```dart
class SubscriptionService {
  static const String baseUrl = 'http://localhost:8000/api/subscriptions';
  
  Future<List<Plan>> getPlans() async {
    final response = await http.get(
      Uri.parse('$baseUrl/plans'),
      headers: {'Authorization': 'Bearer $token'},
    );
    // Handle response
  }
  
  Future<OrderResponse> createOrder(String plan) async {
    final response = await http.post(
      Uri.parse('$baseUrl/create-order'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({'plan': plan, 'subscriptionType': 'recurring'}),
    );
    // Handle response
  }
  
  Future<bool> verifyPayment(PaymentData paymentData) async {
    final response = await http.post(
      Uri.parse('$baseUrl/verify-payment'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode(paymentData.toJson()),
    );
    // Handle response
  }
}
```

### 2. Subscription Status Widget

```dart
class SubscriptionStatusWidget extends StatefulWidget {
  @override
  _SubscriptionStatusWidgetState createState() => _SubscriptionStatusWidgetState();
}

class _SubscriptionStatusWidgetState extends State<SubscriptionStatusWidget> {
  SubscriptionStatus? status;
  
  @override
  void initState() {
    super.initState();
    _loadSubscriptionStatus();
  }
  
  Future<void> _loadSubscriptionStatus() async {
    final response = await SubscriptionService().getStatus();
    setState(() {
      status = response;
    });
  }
  
  @override
  Widget build(BuildContext context) {
    if (status == null) return CircularProgressIndicator();
    
    return Card(
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          children: [
            Text('Subscription Status: ${status!.isActive ? "Active" : "Inactive"}'),
            if (status!.isActive) 
              Text('Days Remaining: ${status!.daysRemaining}'),
            // Add more UI elements
          ],
        ),
      ),
    );
  }
}
```

---

## ⚠️ **ERROR HANDLING**

### Common Error Responses

```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE"
}
```

### Error Codes

| Code | Description | Action |
|------|-------------|---------|
| `SUBSCRIPTION_ALREADY_ACTIVE` | User already has active subscription | Show current subscription |
| `PAYMENT_VERIFICATION_FAILED` | Payment verification failed | Retry payment |
| `INVALID_PLAN` | Invalid subscription plan | Show available plans |
| `SUBSCRIPTION_NOT_FOUND` | No subscription found | Redirect to plans |
| `PAYMENT_FAILED` | Payment processing failed | Retry payment |

---

## 🔒 **SECURITY CONSIDERATIONS**

1. **Always verify payments on backend** - Never trust client-side payment success
2. **Use HTTPS** - All API calls must use HTTPS in production
3. **Token expiry** - Handle JWT token expiry gracefully
4. **Webhook verification** - Backend handles Razorpay webhooks for security
5. **Rate limiting** - API has rate limits, implement retry logic

---

## 🧪 **TESTING**

### Test Cards (Razorpay Test Mode)

| Card Number | Type | Result |
|-------------|------|---------|
| 4111 1111 1111 1111 | Visa | Success |
| 5555 5555 5555 4444 | Mastercard | Success |
| 4000 0000 0000 0002 | Visa | Declined |

### Test UPI ID
- `success@razorpay` - Success
- `failure@razorpay` - Failure

---

---

## 📊 **DATA MODELS**

### Plan Model
```dart
class Plan {
  final String id;
  final String name;
  final int price;
  final int duration;
  final String durationType;
  final List<String> features;
  final bool isPopular;

  Plan({
    required this.id,
    required this.name,
    required this.price,
    required this.duration,
    required this.durationType,
    required this.features,
    required this.isPopular,
  });

  factory Plan.fromJson(Map<String, dynamic> json) {
    return Plan(
      id: json['id'],
      name: json['name'],
      price: json['price'],
      duration: json['duration'],
      durationType: json['durationType'],
      features: List<String>.from(json['features']),
      isPopular: json['isPopular'] ?? false,
    );
  }
}
```

### Subscription Model
```dart
class Subscription {
  final String id;
  final String plan;
  final String status;
  final DateTime startDate;
  final DateTime endDate;
  final bool autoRenew;
  final int amount;
  final int daysRemaining;

  Subscription({
    required this.id,
    required this.plan,
    required this.status,
    required this.startDate,
    required this.endDate,
    required this.autoRenew,
    required this.amount,
    required this.daysRemaining,
  });

  factory Subscription.fromJson(Map<String, dynamic> json) {
    return Subscription(
      id: json['id'],
      plan: json['plan'],
      status: json['status'],
      startDate: DateTime.parse(json['startDate']),
      endDate: DateTime.parse(json['endDate']),
      autoRenew: json['autoRenew'],
      amount: json['amount'],
      daysRemaining: json['daysRemaining'],
    );
  }

  bool get isActive => status == 'active';
  bool get isExpired => DateTime.now().isAfter(endDate);
  bool get isExpiringSoon => daysRemaining <= 3;
}
```

### Payment Data Model
```dart
class PaymentData {
  final String razorpayPaymentId;
  final String razorpayOrderId;
  final String razorpaySignature;
  final String plan;

  PaymentData({
    required this.razorpayPaymentId,
    required this.razorpayOrderId,
    required this.razorpaySignature,
    required this.plan,
  });

  Map<String, dynamic> toJson() {
    return {
      'razorpay_payment_id': razorpayPaymentId,
      'razorpay_order_id': razorpayOrderId,
      'razorpay_signature': razorpaySignature,
      'plan': plan,
    };
  }
}
```

---

## 🔄 **SUBSCRIPTION STATES**

### State Management
```dart
enum SubscriptionState {
  loading,
  noSubscription,
  active,
  expired,
  cancelled,
  error
}

class SubscriptionProvider extends ChangeNotifier {
  SubscriptionState _state = SubscriptionState.loading;
  Subscription? _subscription;
  String? _error;

  SubscriptionState get state => _state;
  Subscription? get subscription => _subscription;
  String? get error => _error;

  Future<void> loadSubscription() async {
    _state = SubscriptionState.loading;
    notifyListeners();

    try {
      final response = await SubscriptionService().getStatus();
      if (response.hasSubscription && response.isActive) {
        _subscription = response.subscription;
        _state = SubscriptionState.active;
      } else if (response.hasSubscription) {
        _subscription = response.subscription;
        _state = _subscription!.status == 'cancelled'
          ? SubscriptionState.cancelled
          : SubscriptionState.expired;
      } else {
        _state = SubscriptionState.noSubscription;
      }
    } catch (e) {
      _error = e.toString();
      _state = SubscriptionState.error;
    }

    notifyListeners();
  }
}
```

---

## 🎯 **BEST PRACTICES**

### 1. Caching Strategy
```dart
class SubscriptionCache {
  static const String _cacheKey = 'subscription_status';
  static const Duration _cacheExpiry = Duration(minutes: 5);

  static Future<void> cacheSubscription(Subscription subscription) async {
    final prefs = await SharedPreferences.getInstance();
    final data = {
      'subscription': subscription.toJson(),
      'timestamp': DateTime.now().millisecondsSinceEpoch,
    };
    await prefs.setString(_cacheKey, jsonEncode(data));
  }

  static Future<Subscription?> getCachedSubscription() async {
    final prefs = await SharedPreferences.getInstance();
    final cached = prefs.getString(_cacheKey);

    if (cached != null) {
      final data = jsonDecode(cached);
      final timestamp = DateTime.fromMillisecondsSinceEpoch(data['timestamp']);

      if (DateTime.now().difference(timestamp) < _cacheExpiry) {
        return Subscription.fromJson(data['subscription']);
      }
    }

    return null;
  }
}
```

### 2. Offline Handling
```dart
class OfflineSubscriptionHandler {
  static Future<bool> hasValidOfflineSubscription() async {
    final cached = await SubscriptionCache.getCachedSubscription();
    return cached != null && cached.isActive && !cached.isExpired;
  }

  static Future<void> syncWhenOnline() async {
    if (await ConnectivityService.isOnline()) {
      await SubscriptionProvider().loadSubscription();
    }
  }
}
```

### 3. Auto-Renewal Notifications
```dart
class SubscriptionNotifications {
  static Future<void> scheduleRenewalReminder(Subscription subscription) async {
    if (subscription.autoRenew && subscription.daysRemaining <= 3) {
      await LocalNotifications.schedule(
        id: 1,
        title: 'Subscription Renewal',
        body: 'Your subscription will renew in ${subscription.daysRemaining} days',
        scheduledDate: DateTime.now().add(Duration(hours: 1)),
      );
    }
  }

  static Future<void> scheduleExpiryWarning(Subscription subscription) async {
    if (!subscription.autoRenew && subscription.daysRemaining <= 7) {
      await LocalNotifications.schedule(
        id: 2,
        title: 'Subscription Expiring',
        body: 'Your subscription expires in ${subscription.daysRemaining} days',
        scheduledDate: DateTime.now().add(Duration(hours: 2)),
      );
    }
  }
}
```

---

## 🚀 **ADVANCED FEATURES**

### 1. Subscription Analytics
```http
GET /api/subscriptions/analytics
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalWatchTime": 1200,
    "videosWatched": 45,
    "favoriteCategories": ["Technology", "Business"],
    "usagePattern": "evening_user",
    "engagementScore": 85
  }
}
```

### 2. Family Sharing (Future Feature)
```http
POST /api/subscriptions/family/invite
```

### 3. Gift Subscriptions (Future Feature)
```http
POST /api/subscriptions/gift
```

---

## 📞 **SUPPORT**

For integration support, contact:
- **Backend Team**: backend@yourcompany.com
- **Documentation**: [API Docs](https://your-api-docs.com)
- **Razorpay Docs**: [Razorpay Flutter](https://razorpay.com/docs/payments/payment-gateway/flutter/)

---

## 📝 **CHANGELOG**

### v1.2.0 (Latest)
- Added subscription analytics endpoint
- Improved error handling
- Added auto-renewal management

### v1.1.0
- Added subscription history
- Implemented reactivation feature
- Enhanced payment verification

### v1.0.0
- Initial subscription system
- Basic plan management
- Razorpay integration
