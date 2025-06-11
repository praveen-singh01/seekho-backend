# 🔄 Razorpay Auto-Renewal Subscription System

## 📋 Overview

This document describes the complete implementation of the Razorpay auto-renewal subscription system for the Seekho Backend API. The system supports:

- **Monthly Subscription**: ₹99/month with 30-day auto-renewal
- **Yearly Subscription**: ₹499/year with 365-day auto-renewal
- **Trial Subscription**: ₹1 for 7 days (one-time payment)

## 🏗️ Architecture

### Core Components

1. **Payment Service** (`services/paymentService.js`)
   - Razorpay integration
   - Subscription plan management
   - Customer and subscription creation

2. **Subscription Service** (`services/subscriptionService.js`)
   - Subscription lifecycle management
   - Auto-renewal processing
   - Webhook event handling

3. **Cron Service** (`services/cronService.js`)
   - Automated subscription maintenance
   - Failed payment retry logic
   - Cleanup tasks

4. **Webhook Handler** (`controllers/webhookController.js`)
   - Razorpay webhook processing
   - Event-driven subscription updates

## 💳 Subscription Plans

### Monthly Plan
- **Price**: ₹99
- **Duration**: 30 days
- **Auto-renewal**: Every 30 days
- **Features**: All videos, HD quality, mobile & web access, downloads

### Yearly Plan
- **Price**: ₹499
- **Duration**: 365 days
- **Auto-renewal**: Every 365 days
- **Features**: All monthly features + priority support
- **Savings**: ₹689 compared to monthly (₹1188 vs ₹499)

### Trial Plan
- **Price**: ₹1
- **Duration**: 7 days
- **Auto-renewal**: No (one-time payment)
- **Features**: Basic access to all videos

## 🔧 Configuration

### Environment Variables

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_live_DPQaE6uBg2h7OS
RAZORPAY_KEY_SECRET=kUNbJKMSdHYr6MHvXCRqjzpe
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here

# Subscription Pricing (in paise)
MONTHLY_PRICE=9900    # ₹99
YEARLY_PRICE=49900    # ₹499
TRIAL_PRICE=100       # ₹1
TRIAL_DURATION_DAYS=7
```

### Webhook Configuration

Set up webhook endpoint in Razorpay Dashboard:
- **URL**: `https://yourdomain.com/api/webhooks/razorpay`
- **Events**: 
  - `subscription.charged`
  - `subscription.cancelled`
  - `subscription.completed`
  - `payment.failed`

## 📡 API Endpoints

### Public Endpoints

#### Get Subscription Plans
```http
GET /api/subscriptions/plans
```

### Protected Endpoints (Require Authentication)

#### Create Subscription Order
```http
POST /api/subscriptions/create-order
Content-Type: application/json

{
  "plan": "monthly|yearly|trial",
  "subscriptionType": "recurring|one-time"
}
```

#### Verify Payment (for trial/one-time)
```http
POST /api/subscriptions/verify-payment
Content-Type: application/json

{
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "signature_xxx",
  "plan": "trial"
}
```

#### Get Subscription Status
```http
GET /api/subscriptions/status
```

#### Cancel Subscription
```http
POST /api/subscriptions/cancel
Content-Type: application/json

{
  "reason": "User requested cancellation"
}
```

#### Cancel Razorpay Subscription
```http
POST /api/subscriptions/cancel-razorpay
```

### Admin Endpoints

#### Get Subscription Statistics
```http
GET /api/admin/subscriptions/stats
```

#### Get All Subscriptions
```http
GET /api/admin/subscriptions?page=1&limit=20&status=active&plan=monthly
```

#### Run Manual Maintenance
```http
POST /api/admin/subscriptions/maintenance
```

### Webhook Endpoints

#### Razorpay Webhook Handler
```http
POST /api/webhooks/razorpay
```

## 🔄 Auto-Renewal Process

### 1. Subscription Creation
- User selects monthly/yearly plan
- System creates Razorpay customer and subscription
- Local subscription record created with recurring flag

### 2. Automatic Renewal
- Cron job runs hourly to check for due renewals
- Razorpay automatically charges the customer
- Webhook notifies our system of successful payment
- Local subscription record updated with new end date

### 3. Failed Payment Handling
- Razorpay sends `payment.failed` webhook
- System increments failed payment counter
- Retry logic attempts renewal after 24 hours
- After 3 failed attempts, subscription is cancelled

### 4. Subscription Cancellation
- User can cancel anytime through API
- Razorpay subscription cancelled with `cancel_at_cycle_end`
- User retains access until current period ends

## ⏰ Cron Jobs

### Daily Maintenance (2:00 AM)
- Process expired subscriptions
- Find subscriptions expiring in 3 days
- Clean up old webhook events

### Hourly Renewal Check
- Find subscriptions due for renewal
- Process automatic renewals

### 6-Hour Failed Payment Retry
- Retry failed subscription renewals
- Maximum 3 attempts per subscription

## 🔍 Testing

### Run Test Suite
```bash
node test-subscription.js
```

### Manual Testing Steps

1. **Create Test User**
   ```bash
   curl -X POST http://localhost:8000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
   ```

2. **Login and Get Token**
   ```bash
   curl -X POST http://localhost:8000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}'
   ```

3. **Create Monthly Subscription**
   ```bash
   curl -X POST http://localhost:8000/api/subscriptions/create-order \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"plan":"monthly","subscriptionType":"recurring"}'
   ```

## 🚨 Error Handling

### Common Error Scenarios

1. **Duplicate Subscription**
   - Status: 400
   - Message: "You already have an active subscription"

2. **Invalid Payment Signature**
   - Status: 400
   - Message: "Invalid payment signature"

3. **Razorpay API Failure**
   - Status: 500
   - Message: Specific Razorpay error message

4. **Webhook Signature Verification Failed**
   - Status: 400
   - Message: "Invalid signature"

## 📊 Monitoring

### Key Metrics to Monitor

1. **Subscription Stats**
   - Total active subscriptions
   - Monthly vs yearly distribution
   - Churn rate
   - Failed payment rate

2. **Revenue Metrics**
   - Monthly recurring revenue (MRR)
   - Annual recurring revenue (ARR)
   - Average revenue per user (ARPU)

3. **System Health**
   - Webhook processing success rate
   - Cron job execution status
   - Failed payment retry success rate

### Admin Dashboard

Access subscription analytics at:
- `/api/admin/subscriptions/stats` - Overall statistics
- `/api/admin/subscriptions` - Detailed subscription list
- `/api/admin/subscriptions/maintenance` - Manual maintenance trigger

## 🔐 Security

### Webhook Security
- Signature verification using HMAC SHA256
- Webhook secret stored in environment variables
- Request body validation

### Payment Security
- All payment processing handled by Razorpay
- No sensitive payment data stored locally
- PCI DSS compliance through Razorpay

### API Security
- JWT-based authentication
- Role-based access control for admin endpoints
- Rate limiting on all endpoints

## 🚀 Deployment Checklist

- [ ] Set up Razorpay webhook endpoint
- [ ] Configure environment variables
- [ ] Test webhook signature verification
- [ ] Verify cron jobs are running
- [ ] Test subscription creation flow
- [ ] Monitor webhook events
- [ ] Set up alerting for failed payments

## 📞 Support

For issues or questions regarding the subscription system:

1. Check logs for error details
2. Verify Razorpay webhook configuration
3. Test API endpoints using provided test script
4. Review subscription status in admin dashboard
