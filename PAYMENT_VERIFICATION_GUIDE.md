# Payment Verification Guide

## Overview
The payment verification system now supports both **single-time payments** and **recurring subscription payments** for the Seekho backend.

## Payment Types Supported

### 1. Single-Time Payments (One-time)
- **Use Case**: User pays once for a subscription period (monthly/yearly) without auto-renewal
- **Payment Flow**: Order → Payment → Verification → Subscription Creation
- **Required Parameters**:
  - `razorpay_order_id`
  - `razorpay_payment_id` 
  - `razorpay_signature`
  - `plan` (monthly/yearly)

### 2. Recurring Subscription Payments
- **Use Case**: Auto-renewing subscriptions with recurring billing
- **Payment Flow**: Subscription → Payment → Verification → Subscription Activation
- **Required Parameters**:
  - `razorpay_subscription_id`
  - `razorpay_payment_id`
  - `razorpay_signature`
  - `plan` (monthly/yearly)

## API Endpoint

### POST `/api/subscriptions/verify-payment`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body for Single-Time Payment:**
```json
{
  "razorpay_order_id": "order_xxxxxxxxxxxxx",
  "razorpay_payment_id": "pay_xxxxxxxxxxxxx",
  "razorpay_signature": "signature_hash",
  "plan": "monthly"
}
```

**Request Body for Recurring Subscription:**
```json
{
  "razorpay_subscription_id": "sub_xxxxxxxxxxxxx",
  "razorpay_payment_id": "pay_xxxxxxxxxxxxx", 
  "razorpay_signature": "signature_hash",
  "plan": "monthly"
}
```

## Verification Process

### Single-Time Payment Verification
1. **Signature Verification**: Uses `PaymentService.verifyRazorpaySignature(orderId, paymentId, signature)`
2. **Subscription Creation**: Creates one-time subscription via `SubscriptionService.createOneTimeSubscription()`
3. **Properties Set**:
   - `subscriptionType: 'one-time'`
   - `isRecurring: false`
   - `autoRenew: false`

### Recurring Payment Verification  
1. **Signature Verification**: Uses `PaymentService.verifyRazorpaySubscriptionSignature(subscriptionId, paymentId, signature)`
2. **Subscription Activation**: Activates recurring subscription via `SubscriptionService.activateRecurringSubscription()`
3. **Properties Set**:
   - `subscriptionType: 'recurring'`
   - `isRecurring: true`
   - `autoRenew: true`

## Response Format

**Success Response:**
```json
{
  "success": true,
  "message": "Subscription created successfully",
  "data": {
    "_id": "subscription_id",
    "user": "user_id",
    "plan": "monthly",
    "status": "active",
    "startDate": "2025-07-01T00:00:00.000Z",
    "endDate": "2025-07-31T00:00:00.000Z",
    "amount": 11700,
    "currency": "INR",
    "subscriptionType": "one-time",
    "isRecurring": false,
    "autoRenew": false
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Invalid payment signature"
}
```

## Error Handling

The system handles various error scenarios:

1. **Missing Parameters**: Returns 400 with descriptive message
2. **Invalid Signature**: Returns 400 with "Invalid payment signature" 
3. **Invalid Plan**: Returns 400 with "Invalid subscription plan"
4. **Service Errors**: Returns 400 with specific error message
5. **Server Errors**: Returns 500 with generic error message

## Testing

To test the payment verification:

1. **Create Order** (for single-time): `POST /api/subscriptions/create-order`
2. **Process Payment** (via Razorpay SDK)
3. **Verify Payment**: `POST /api/subscriptions/verify-payment`

## Notes

- Both payment types support monthly and yearly plans
- Package ID is automatically determined from user context
- User subscription reference is updated upon successful verification
- All payments are processed through Razorpay
- Signature verification ensures payment authenticity
