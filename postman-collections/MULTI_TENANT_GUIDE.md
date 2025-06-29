# 🏢 Multi-Tenant API Testing Guide

This guide explains how to test the multi-tenant features of the Seekho Backend API that supports both **Seekho** and **Bolo** apps.

## 🎯 Overview

The Seekho Backend now supports multi-tenant architecture with complete data isolation between:
- **Seekho App** (`com.gumbo.learning`) - Original learning platform
- **Bolo App** (`com.gumbo.english`) - English learning platform

## 📦 Package ID Header

All API requests now support the `X-Package-ID` header:

```http
X-Package-ID: com.gumbo.learning    # For Seekho app
X-Package-ID: com.gumbo.english     # For Bolo app
```

### Backward Compatibility
- Requests **without** `X-Package-ID` header default to Seekho app
- Existing Seekho app continues working without changes

## 🚀 Quick Start with Postman

### 1. Import Multi-Tenant Collection
Import `Seekho-Backend-Multi-Tenant.postman_collection.json` into Postman.

### 2. Set Environment Variables
```json
{
  "baseUrl": "http://localhost:8000",
  "seekhoPackageId": "com.gumbo.learning",
  "boloPackageId": "com.gumbo.english",
  "authToken": ""
}
```

### 3. Test Multi-Tenant Features

#### ✅ Package ID Validation
```http
GET {{baseUrl}}/api/categories
X-Package-ID: com.gumbo.learning     # ✅ Valid - Returns Seekho data
X-Package-ID: com.gumbo.english      # ✅ Valid - Returns Bolo data  
X-Package-ID: invalid.package.id     # ❌ Invalid - Returns 400 error
```

#### ✅ Data Isolation
```http
# Register same email in both apps (should work)
POST {{baseUrl}}/api/auth/register
X-Package-ID: com.gumbo.learning
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123"
}

POST {{baseUrl}}/api/auth/register  
X-Package-ID: com.gumbo.english
{
  "name": "Test User",
  "email": "test@example.com",  # Same email, different app
  "password": "password123"
}
```

#### ✅ Cross-Tenant Access Prevention
```http
# Login with Seekho user
POST {{baseUrl}}/api/auth/login
X-Package-ID: com.gumbo.learning
# Save token as seekhoToken

# Try to access Bolo data with Seekho token (should fail)
GET {{baseUrl}}/api/users/profile
X-Package-ID: com.gumbo.english      # Different package
Authorization: Bearer {{seekhoToken}} # Seekho user token
# Expected: 403 Forbidden - Package ID mismatch
```

## 🧪 Testing Scenarios

### Scenario 1: User Registration & Authentication
```http
# 1. Register Seekho user
POST /api/auth/register
X-Package-ID: com.gumbo.learning
Body: { "name": "Seekho User", "email": "seekho@test.com", "password": "pass123" }

# 2. Register Bolo user (same email should work)
POST /api/auth/register  
X-Package-ID: com.gumbo.english
Body: { "name": "Bolo User", "email": "seekho@test.com", "password": "pass123" }

# 3. Login to both apps
POST /api/auth/login
X-Package-ID: com.gumbo.learning
Body: { "email": "seekho@test.com", "password": "pass123" }

POST /api/auth/login
X-Package-ID: com.gumbo.english  
Body: { "email": "seekho@test.com", "password": "pass123" }
```

### Scenario 2: Content Segregation
```http
# 1. Get Seekho categories (should return existing data)
GET /api/categories
X-Package-ID: com.gumbo.learning

# 2. Get Bolo categories (should return empty initially)
GET /api/categories
X-Package-ID: com.gumbo.english

# 3. Admin creates content for Bolo
POST /api/admin/categories
X-Package-ID: com.gumbo.english
Authorization: Bearer {{adminToken}}
Body: { "name": "English Grammar", "description": "Learn English grammar" }
```

### Scenario 3: Subscription Isolation
```http
# 1. Create subscription for Seekho user
POST /api/subscriptions/create-order
X-Package-ID: com.gumbo.learning
Authorization: Bearer {{seekhoToken}}

# 2. Create subscription for Bolo user  
POST /api/subscriptions/create-order
X-Package-ID: com.gumbo.english
Authorization: Bearer {{boloToken}}

# 3. Verify subscriptions are separate
GET /api/subscriptions/status
X-Package-ID: com.gumbo.learning
Authorization: Bearer {{seekhoToken}}
# Should only show Seekho subscription

GET /api/subscriptions/status
X-Package-ID: com.gumbo.english  
Authorization: Bearer {{boloToken}}
# Should only show Bolo subscription
```

## 🔍 Validation Tests

### ✅ Valid Package IDs
- `com.gumbo.learning` ✅
- `com.gumbo.english` ✅

### ❌ Invalid Package IDs
- `invalid.package.id` → 400 Bad Request
- `com.example.app` → 400 Bad Request
- `malformed-id` → 400 Bad Request

### 🔄 Backward Compatibility
- No `X-Package-ID` header → Defaults to `com.gumbo.learning`
- Existing Seekho app requests continue working

## 📊 Expected Responses

### Success Response
```json
{
  "success": true,
  "data": [...],
  "packageInfo": {
    "packageId": "com.gumbo.learning",
    "appName": "Seekho"
  }
}
```

### Package ID Error
```json
{
  "success": false,
  "message": "Unsupported package ID",
  "code": "UNSUPPORTED_PACKAGE_ID",
  "supportedPackages": ["com.gumbo.learning", "com.gumbo.english"]
}
```

### Cross-Tenant Access Error
```json
{
  "success": false,
  "message": "Access denied. Package ID mismatch.",
  "code": "PACKAGE_ID_MISMATCH"
}
```

## 🛠️ Troubleshooting

### Common Issues

1. **400 Bad Request - Invalid Package ID**
   - Check `X-Package-ID` header value
   - Use only supported package IDs

2. **403 Forbidden - Package ID Mismatch**
   - User token doesn't match the package ID
   - Login with correct package ID

3. **Empty Data for Bolo App**
   - Expected behavior - Bolo starts with no content
   - Admin needs to create content for Bolo app

4. **Same Email Registration Fails**
   - Check if user already exists in that specific app
   - Same email can exist in different apps

## 📱 Mobile App Integration

### Android App Headers
```kotlin
// Seekho App
val headers = mapOf(
    "X-Package-ID" to "com.gumbo.learning",
    "Authorization" to "Bearer $token"
)

// Bolo App  
val headers = mapOf(
    "X-Package-ID" to "com.gumbo.english",
    "Authorization" to "Bearer $token"
)
```

### iOS App Headers
```swift
// Seekho App
let headers = [
    "X-Package-ID": "com.gumbo.learning",
    "Authorization": "Bearer \(token)"
]

// Bolo App
let headers = [
    "X-Package-ID": "com.gumbo.english", 
    "Authorization": "Bearer \(token)"
]
```

## 🎯 Production Checklist

- [ ] Mobile apps send correct `X-Package-ID` header
- [ ] Data migration completed successfully
- [ ] Both apps tested independently
- [ ] Cross-tenant access prevention verified
- [ ] Subscription system working for both apps
- [ ] File uploads segregated properly
- [ ] Admin panel supports both apps

---

**Need Help?** Check the main API documentation or contact the development team.
