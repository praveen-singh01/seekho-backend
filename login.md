# 🔐 Seekho Backend - Authentication API Documentation

This document provides comprehensive information about all authentication endpoints, including request/response formats, error codes, and sample curl commands for testing.

## 📋 Table of Contents

1. [Android Authentication](#android-authentication)
2. [Web Authentication](#web-authentication)
3. [Admin Authentication](#admin-authentication)
4. [Error Codes](#error-codes)
5. [Testing Guide](#testing-guide)

---

## 🤖 Android Authentication

### 1. Google OAuth Authentication

**Endpoint:** `POST /api/auth/android/google`

**Description:** Authenticate Android users using Google ID token from GoogleSignIn

**Request Body:**
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Authentication successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "name": "John Doe",
      "email": "john.doe@gmail.com",
      "profilePicture": "https://lh3.googleusercontent.com/...",
      "role": "user",
      "isVerified": true,
      "createdAt": "2023-07-20T10:30:00.000Z"
    },
    "subscription": {
      "hasSubscription": false,
      "isActive": false,
      "plan": null,
      "endDate": null
    }
  }
}
```

**Error Responses:**

- **400 Bad Request:**
```json
{
  "success": false,
  "message": "Google ID token is required",
  "error": "MISSING_ID_TOKEN"
}
```

- **400 Bad Request (Invalid Token):**
```json
{
  "success": false,
  "message": "Invalid Google token format",
  "error": "INVALID_TOKEN_FORMAT"
}
```

- **400 Bad Request (Expired Token):**
```json
{
  "success": false,
  "message": "Token expired. Please try logging in again.",
  "error": "TOKEN_EXPIRED"
}
```

- **500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Android OAuth not configured. Please set ANDROID_CLIENT_ID in environment variables.",
  "error": "MISSING_ANDROID_CLIENT_ID"
}
```

**Sample cURL Command:**
```bash
curl -X POST http://localhost:8000/api/auth/android/google \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "YOUR_GOOGLE_ID_TOKEN_HERE"
  }'
```

### 2. Refresh Token

**Endpoint:** `POST /api/auth/android/refresh`

**Description:** Refresh JWT token for authenticated users

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "name": "John Doe",
      "email": "john.doe@gmail.com",
      "profilePicture": "https://lh3.googleusercontent.com/...",
      "role": "user",
      "isVerified": true
    },
    "subscription": {
      "hasSubscription": true,
      "isActive": true,
      "plan": "monthly",
      "endDate": "2023-08-20T10:30:00.000Z"
    }
  }
}
```

**Sample cURL Command:**
```bash
curl -X POST http://localhost:8000/api/auth/android/refresh \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Get Android Configuration

**Endpoint:** `GET /api/auth/android/config`

**Description:** Get configuration needed for Android app setup

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "androidClientId": "601890245278-8bm75vhctl3udijcf3uj1kmdrm848krr.apps.googleusercontent.com",
    "packageName": "com.gumbo.learning",
    "deepLink": "seekho://auth/callback",
    "subscriptionPlans": {
      "trial": {
        "price": 1,
        "duration": "7 days",
        "priceInPaise": 100
      },
      "monthly": {
        "price": 199,
        "duration": "1 month",
        "priceInPaise": 19900
      },
      "yearly": {
        "price": 1912,
        "duration": "12 months",
        "priceInPaise": 191200,
        "discount": "20%"
      }
    }
  }
}
```

**Sample cURL Command:**
```bash
curl -X GET http://localhost:8000/api/auth/android/config
```

### 4. Logout

**Endpoint:** `POST /api/auth/android/logout`

**Description:** Logout user (client-side token invalidation)

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Sample cURL Command:**
```bash
curl -X POST http://localhost:8000/api/auth/android/logout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 5. Delete Account

**Endpoint:** `DELETE /api/auth/android/account`

**Description:** Delete user account (soft delete - deactivates account)

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Account deleted successfully"
}
```

**Sample cURL Command:**
```bash
curl -X DELETE http://localhost:8000/api/auth/android/account \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🌐 Web Authentication

### 1. Google OAuth (Web)

**Endpoint:** `GET /api/auth/google`

**Description:** Initiate Google OAuth flow for web users

**Response:** Redirects to Google OAuth consent screen

**Sample URL:**
```
http://localhost:8000/api/auth/google
```

### 2. Google OAuth Callback

**Endpoint:** `GET /api/auth/google/callback`

**Description:** Handle Google OAuth callback

**Response:** Redirects to frontend with token or error

---

## 👨‍💼 Admin Authentication

### 1. Admin Login

**Endpoint:** `POST /api/auth/admin/login`

**Description:** Login with username/password for admin users

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "username": "admin",
      "email": "admin@seekho.com",
      "role": "admin",
      "isVerified": true
    }
  }
}
```

**Sample cURL Command:**
```bash
curl -X POST http://localhost:8000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

---

## ⚠️ Error Codes

| Error Code | Description | HTTP Status |
|------------|-------------|-------------|
| `MISSING_ID_TOKEN` | Google ID token not provided | 400 |
| `INVALID_TOKEN_FORMAT` | Invalid Google token format | 400 |
| `TOKEN_EXPIRED` | Google token has expired | 400 |
| `AUDIENCE_MISMATCH` | Token audience doesn't match client ID | 400 |
| `INVALID_ISSUER` | Token not issued by Google | 400 |
| `MISSING_ANDROID_CLIENT_ID` | Android client ID not configured | 500 |
| `CLIENT_NOT_INITIALIZED` | OAuth client not initialized | 500 |
| `DATABASE_ERROR` | Database operation failed | 500 |
| `AUTHENTICATION_FAILED` | Generic authentication failure | 500 |

---

## 🧪 Testing Guide

### Prerequisites

1. **Start the server:**
```bash
npm start
```

2. **Ensure MongoDB is running:**
```bash
mongod
```

### Testing Android Authentication

#### Test 1: Missing Token
```bash
curl -X POST http://localhost:8000/api/auth/android/google \
  -H "Content-Type: application/json" \
  -d '{}' \
  -v
```

**Expected:** 400 error with `MISSING_ID_TOKEN`

#### Test 2: Invalid Token Format
```bash
curl -X POST http://localhost:8000/api/auth/android/google \
  -H "Content-Type: application/json" \
  -d '{"idToken": "invalid-token"}' \
  -v
```

**Expected:** 400 error with `INVALID_TOKEN_FORMAT`

#### Test 3: Configuration Check
```bash
curl -X GET http://localhost:8000/api/auth/android/config -v
```

**Expected:** 200 success with configuration data

### Testing with Real Google Token

To test with a real Google ID token, you'll need to:

1. **Set up Android app with Google Sign-In**
2. **Get a valid ID token from your Android app**
3. **Use the token in the API call:**

```bash
curl -X POST http://localhost:8000/api/auth/android/google \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "REAL_GOOGLE_ID_TOKEN_FROM_ANDROID_APP"
  }' \
  -v
```

### Environment Variables Check

Verify your environment variables are set correctly:

```bash
# Check if Android Client ID is set
echo $ANDROID_CLIENT_ID

# Or check in your .env file
cat .env | grep ANDROID_CLIENT_ID
```

### Quick Health Check

Test if the server and endpoints are working:

```bash
# Test server health
curl http://localhost:8000/health

# Test Android config endpoint
curl http://localhost:8000/api/auth/android/config

# Test missing token error
curl -X POST http://localhost:8000/api/auth/android/google \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Debugging Tips

1. **Check server logs** for detailed error messages with emojis (🔍, ✅, ❌)
2. **Verify Google Cloud Console** configuration:
   - OAuth 2.0 Client IDs are created
   - Android app is properly configured
   - SHA-1 fingerprints are added
3. **Ensure Android app** is using the correct client ID
4. **Check token expiration** - Google ID tokens expire after 1 hour
5. **Verify audience** - Token audience must match your Android client ID
6. **Test with real tokens** from your Android app

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| `MISSING_ANDROID_CLIENT_ID` | Set `ANDROID_CLIENT_ID` in `.env` file |
| `INVALID_TOKEN_FORMAT` | Use a real Google ID token from Android app |
| `TOKEN_EXPIRED` | Generate a new token from Android app |
| `AUDIENCE_MISMATCH` | Verify client ID matches between server and Android app |
| Server not responding | Check if server is running on port 8000 |

### Getting Real Google ID Tokens

To get a real Google ID token for testing:

1. **Set up Android app** with Google Sign-In
2. **Add debug SHA-1** to Google Cloud Console
3. **Use GoogleSignIn** in your Android app:

```kotlin
// In your Android app
val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
    .requestIdToken("YOUR_ANDROID_CLIENT_ID")
    .requestEmail()
    .build()

val googleSignInClient = GoogleSignIn.getClient(this, gso)

// After successful sign-in
val account = GoogleSignIn.getLastSignedInAccount(this)
val idToken = account?.idToken // Use this token for API testing
```

4. **Copy the ID token** and use it in your curl commands

---

## 📞 Support

If you encounter issues:

1. **Check server logs** for detailed error messages with emoji indicators
2. **Verify Google Cloud Console** configuration matches your setup
3. **Ensure Android app** is properly configured with correct client ID
4. **Check environment variables** are set correctly in `.env` file
5. **Test with real tokens** from your Android app, not dummy tokens

For development mode, detailed error messages are included in responses to help with debugging.

### Quick Troubleshooting Commands

```bash
# Restart server
npm start

# Check environment variables
cat .env | grep -E "(ANDROID_CLIENT_ID|MONGODB_URI|JWT_SECRET)"

# Test database connection
curl http://localhost:8000/health

# Test authentication endpoints
curl http://localhost:8000/api/auth/android/config
```
