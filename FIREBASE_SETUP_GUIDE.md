# 🔥 Firebase Authentication Setup Guide for Multi-Tenant Apps

This guide explains how to set up Firebase Authentication for both Seekho and Bolo apps with Google Sign-In.

## 📋 Overview

The Seekho Backend supports two Android apps:
- **Seekho App** (`com.gumbo.learning`) - Original learning platform
- **Bolo App** (`com.gumbo.english`) - English learning platform

Each app requires its own Firebase project and Google OAuth credentials.

## 🚀 Setup Instructions

### 1. Seekho App Firebase Setup (Already Done)

If you already have Seekho app working, you can skip this section.

### 2. Bolo App Firebase Setup (New)

#### Step 2.1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Project name: `Bolo English Learning` (or similar)
4. Enable Google Analytics (optional)
5. Click "Create project"

#### Step 2.2: Enable Authentication
1. In your Firebase project, go to **Authentication**
2. Click "Get started"
3. Go to **Sign-in method** tab
4. Click on **Google** provider
5. Enable Google Sign-In
6. Set project support email
7. Click "Save"

#### Step 2.3: Add Android App
1. In Firebase project overview, click "Add app" → Android icon
2. **Android package name**: `com.gumbo.english`
3. **App nickname**: `Bolo English Learning`
4. **Debug signing certificate SHA-1**: Get from your debug keystore
5. **Release signing certificate SHA-1**: Get from your release keystore
6. Click "Register app"
7. Download `google-services.json` (for your Android app)

#### Step 2.4: Get SHA-1 Fingerprints

**Debug Keystore:**
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

**Release Keystore:**
```bash
keytool -list -v -keystore /path/to/your/release.keystore -alias your_alias_name
```

#### Step 2.5: Get OAuth Client IDs
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Bolo Firebase project
3. Go to **APIs & Credentials** → **Credentials**
4. Find the Android client (auto-created by Firebase)
5. Copy the **Client ID** (format: `xxxxx-xxxxxxx.apps.googleusercontent.com`)

## 🔧 Backend Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Seekho App Configuration (com.gumbo.learning)
SEEKHO_ANDROID_CLIENT_ID=your-seekho-google-client-id.apps.googleusercontent.com

# Bolo App Configuration (com.gumbo.english)  
BOLO_ANDROID_CLIENT_ID=your-bolo-google-client-id.apps.googleusercontent.com

# Legacy (for backward compatibility)
ANDROID_CLIENT_ID=your-seekho-google-client-id.apps.googleusercontent.com
```

### Example Configuration

```env
# Seekho App
SEEKHO_ANDROID_CLIENT_ID=601890245278-8bm75vhctl3udijcf3uj1kmdrm848krr.apps.googleusercontent.com

# Bolo App
BOLO_ANDROID_CLIENT_ID=123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
```

## 📱 Android App Integration

### Seekho App (`com.gumbo.learning`)
```kotlin
// In your Android app
val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
    .requestIdToken("601890245278-8bm75vhctl3udijcf3uj1kmdrm848krr.apps.googleusercontent.com")
    .requestEmail()
    .build()

// API calls
val headers = mapOf(
    "X-Package-ID" to "com.gumbo.learning",
    "Authorization" to "Bearer $token"
)
```

### Bolo App (`com.gumbo.english`)
```kotlin
// In your Android app
val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
    .requestIdToken("123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com")
    .requestEmail()
    .build()

// API calls
val headers = mapOf(
    "X-Package-ID" to "com.gumbo.english",
    "Authorization" to "Bearer $token"
)
```

## 🧪 Testing

### Test Google Sign-In Configuration

```bash
# Get Seekho app config
curl -X GET "https://learner.netaapp.in/api/auth/android/config" \
  -H "X-Package-ID: com.gumbo.learning"

# Get Bolo app config  
curl -X GET "https://learner.netaapp.in/api/auth/android/config" \
  -H "X-Package-ID: com.gumbo.english"
```

### Test Authentication

```bash
# Test Bolo app Google sign-in
curl -X POST "https://learner.netaapp.in/api/auth/android/google" \
  -H "Content-Type: application/json" \
  -H "X-Package-ID: com.gumbo.english" \
  -d '{"idToken": "your-google-id-token-from-bolo-app"}'
```

## ⚠️ Important Notes

1. **Separate Firebase Projects**: Each app needs its own Firebase project
2. **Different Package Names**: Ensure package names match exactly
3. **SHA-1 Certificates**: Add both debug and release SHA-1 fingerprints
4. **Client IDs**: Each app has its own Google OAuth client ID
5. **google-services.json**: Each Android app needs its own config file

## 🔍 Troubleshooting

### Common Issues

1. **"Invalid audience" error**
   - Check if the correct client ID is set for the package
   - Verify package name matches Firebase configuration

2. **"Token verification failed"**
   - Ensure SHA-1 fingerprints are added to Firebase
   - Check if the correct google-services.json is in your Android app

3. **"Client ID not configured"**
   - Set `BOLO_ANDROID_CLIENT_ID` environment variable
   - Restart your backend server after adding env vars

4. **"Package ID mismatch"**
   - Ensure Android app sends correct `X-Package-ID` header
   - Check if user was created with the correct package ID

## 📞 Support

If you encounter issues:
1. Check Firebase Console for any configuration errors
2. Verify environment variables are set correctly
3. Test with debug mode first (`SKIP_GOOGLE_VERIFICATION=true`)
4. Check server logs for detailed error messages
