# Payments Service

A microservice for handling payments and subscriptions for Seekho/Bolo apps.

## Features

- **Multi-tenant Support**: Supports both Seekho (com.gumbo.learning) and Bolo (com.gumbo.english) apps
- **Payment Providers**: Razorpay and Stripe integration
- **Subscription Plans**: Monthly and yearly subscription plans
- **Webhook Handling**: Automated webhook processing for payment events
- **Trial Subscriptions**: Support for trial periods (currently disabled)

## API Endpoints

### Subscription Management
- `GET /api/subscriptions/plans` - Get available subscription plans
- `POST /api/subscriptions/create-order` - Create subscription order
- `POST /api/subscriptions/verify-payment` - Verify payment and activate subscription
- `GET /api/subscriptions/status` - Get user's subscription status
- `POST /api/subscriptions/cancel` - Cancel subscription
- `GET /api/subscriptions/history` - Get subscription history

### Webhooks
- `POST /api/webhooks/razorpay` - Handle Razorpay webhooks
- `GET /api/webhooks/test` - Test webhook endpoint

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

3. Configure your environment variables in `.env`

4. Start the service:
   ```bash
   npm run dev
   ```

## Environment Variables

See `.env.example` for all required environment variables.

## Documentation

- Postman collection: `docs/Seekho-Backend-Subscriptions-Only.postman_collection.json`

## Multi-Tenant Architecture

This service supports multiple apps through the `packageId` field:
- `com.gumbo.learning` - Seekho app
- `com.gumbo.english` - Bolo app

Each subscription is isolated by package ID while sharing the same payment infrastructure.
