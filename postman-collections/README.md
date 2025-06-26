# Seekho Backend - Postman Collections

This directory contains comprehensive Postman collections for testing the Seekho Backend API.

## 📁 Collections Available

### 1. **Seekho-Backend-Complete-API.postman_collection.json**
Complete API collection with all endpoints including:
- 🔐 Authentication (Regular & Android)
- 💳 Subscriptions (All endpoints)
- 📚 Categories
- 📖 Topics  
- 🎥 Videos
- 👤 Users
- 🔔 Notifications
- 🔗 Webhooks
- ⚙️ Admin Panel
- 🔐 Admin Authentication

### 2. **Seekho-Backend-Subscriptions-Only.postman_collection.json**
Focused collection for subscription management including:
- 🔐 Authentication (Required for subscriptions)
- 💳 Subscription Management (All subscription endpoints)
- 🔗 Webhook Testing (Subscription-related webhooks)
- ⚙️ Admin Subscription Management

## 🚀 Quick Start

### 1. Import Collections
1. Open Postman
2. Click **Import** button
3. Select the JSON files from this directory
4. Both collections will be imported with pre-configured requests

### 2. Set Environment Variables
Both collections use the following variables that you should configure:

#### Required Variables:
- `base_url` - Your server URL (default: `http://localhost:8000`)
- `jwt_token` - User authentication token (auto-set after login)
- `admin_token` - Admin authentication token (auto-set after admin login)

#### Optional Variables (auto-populated):
- `user_id` - Current user ID
- `category_id` - Category ID for testing
- `topic_id` - Topic ID for testing  
- `video_id` - Video ID for testing
- `subscription_id` - Subscription ID for testing
- `razorpay_order_id` - Razorpay order ID
- `razorpay_payment_id` - Razorpay payment ID
- `razorpay_signature` - Razorpay signature

### 3. Authentication Flow

#### For Regular Users:
1. **Login User** or **Android Google Login**
2. Token will be automatically saved to `jwt_token` variable
3. All subsequent requests will use this token

#### For Admin Users:
1. **Admin Login** (in Admin Authentication section)
2. Token will be automatically saved to `admin_token` variable
3. Admin requests will use this token

## 💳 Subscription Testing Workflow

### Trial Subscription (Recommended Flow):
1. **Check Trial Eligibility** - Verify user can use trial
2. **Create Trial with Mandate** - Creates ₹1 trial with auto-conversion
3. **Get Subscription Status** - Check current subscription state
4. **Test Webhook** - Simulate Razorpay webhook calls

### Regular Subscription Flow:
1. **Get Subscription Plans** - View available plans
2. **Create Subscription Order** - Create order for monthly/yearly
3. **Verify Payment** - Verify Razorpay payment
4. **Get Subscription Status** - Check subscription state

### Subscription Management:
- **Cancel Subscription** - Cancel current subscription
- **Reactivate Subscription** - Reactivate cancelled subscription
- **Get Subscription History** - View all past subscriptions
- **Convert Trial** - Convert trial to paid subscription

## 🔗 Webhook Testing

The collections include webhook testing endpoints to simulate Razorpay webhooks:

### Test Webhooks:
1. **Test Webhook Endpoint** - Basic connectivity test
2. **Debug Subscriptions** - View current subscriptions in database
3. **Test Subscription Charged Webhook** - Simulate subscription payment
4. **Test Payment Captured Webhook** - Simulate one-time payment

### Webhook Notes Testing:
The webhook test requests include sample `notes` fields showing:
```json
{
  "packageName": "com.gumbo.learning",
  "AppName": "seekho", 
  "userId": "test-user-123",
  "trialPeriod": 5,
  "autoConvert": true
}
```

## ⚙️ Admin Features

### Admin Authentication:
1. **Admin Login** - Login with username/password
2. **Create Admin User** - Create new admin accounts
3. **List Admin Users** - View all admin users
4. **Change Admin Password** - Update admin password

### Admin Subscription Management:
1. **Get Subscription Stats** - Overview of subscription metrics
2. **Get All Subscriptions** - View all user subscriptions with filters
3. **Get Subscription Analytics** - Detailed subscription analytics
4. **Run Subscription Maintenance** - Manual maintenance tasks

## 🧪 Testing Tips

### 1. **Use the Subscription-Only Collection** for focused subscription testing
### 2. **Check Console Logs** - Many requests include test scripts that log useful information
### 3. **Variables Auto-Population** - Login requests automatically save tokens and IDs
### 4. **Webhook Testing** - Use the webhook test endpoints to simulate Razorpay callbacks
### 5. **Admin Testing** - Use admin endpoints to view system-wide subscription data

## 🔧 Environment Setup

### Local Development:
```
base_url = http://localhost:8000
```

### Production/Staging:
```
base_url = https://your-api-domain.com
```

## 📝 Notes

- **Authentication Required**: Most endpoints require authentication via JWT token
- **Admin Endpoints**: Admin endpoints require admin role and admin token
- **Webhook Testing**: Webhook signature verification is temporarily disabled for testing
- **Auto-Variables**: Many responses automatically populate collection variables for easy testing
- **Error Handling**: Check response status codes and error messages for debugging

## 🆘 Troubleshooting

### Common Issues:
1. **401 Unauthorized** - Check if JWT token is set and valid
2. **403 Forbidden** - Check if user has required permissions (admin role)
3. **Webhook Failures** - Check server logs for detailed webhook processing information
4. **Subscription Errors** - Verify user trial eligibility and subscription state

### Debug Endpoints:
- `/api/webhooks/test` - Test webhook connectivity
- `/api/webhooks/debug-subscriptions` - View subscription data
- `/api/subscriptions/status` - Check user subscription status
- `/api/admin/subscriptions/stats` - View system subscription statistics
