# 📱 Android Integration Guide for Seekho Backend

This guide explains how to integrate your Android app with the Seekho backend API.

## 🚀 Quick Setup

### 1. Run Google OAuth Setup Script

```bash
# Make script executable
chmod +x scripts/setup-google-oauth.sh

# Run the setup script
./scripts/setup-google-oauth.sh
```

This script will:
- ✅ Set up Google Cloud project
- ✅ Enable required APIs
- ✅ Guide you through OAuth credential creation
- ✅ Update your .env file automatically

### 2. Manual Setup (Alternative)

If you prefer manual setup, follow the [CLI commands](#cli-commands-for-google-oauth) below.

## 📋 Android App Configuration

### 1. Add Dependencies to `build.gradle` (app level)

```gradle
dependencies {
    // Google Sign-In
    implementation 'com.google.android.gms:play-services-auth:20.7.0'
    
    // HTTP client for API calls
    implementation 'com.squareup.retrofit2:retrofit:2.9.0'
    implementation 'com.squareup.retrofit2:converter-gson:2.9.0'
    implementation 'com.squareup.okhttp3:logging-interceptor:4.11.0'
    
    // JWT handling (optional)
    implementation 'io.jsonwebtoken:jjwt-api:0.11.5'
    implementation 'io.jsonwebtoken:jjwt-impl:0.11.5'
    implementation 'io.jsonwebtoken:jjwt-jackson:0.11.5'
}
```

### 2. Add Google Services to `build.gradle` (project level)

```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.4.0'
    }
}
```

### 3. Apply Google Services Plugin

In `build.gradle` (app level):
```gradle
apply plugin: 'com.google.gms.google-services'
```

### 4. Create `google-services.json`

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create/select your project
3. Add Android app with your package name
4. Download `google-services.json`
5. Place it in `app/` directory

## 🔐 Authentication Implementation

### 1. Configure Google Sign-In

```kotlin
// In your Activity or Fragment
class MainActivity : AppCompatActivity() {
    
    private lateinit var googleSignInClient: GoogleSignInClient
    private val RC_SIGN_IN = 9001
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Configure Google Sign-In
        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken("YOUR_ANDROID_CLIENT_ID") // From .env file
            .requestEmail()
            .build()
            
        googleSignInClient = GoogleSignIn.getClient(this, gso)
    }
    
    private fun signIn() {
        val signInIntent = googleSignInClient.signInIntent
        startActivityForResult(signInIntent, RC_SIGN_IN)
    }
    
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        
        if (requestCode == RC_SIGN_IN) {
            val task = GoogleSignIn.getSignedInAccountFromIntent(data)
            handleSignInResult(task)
        }
    }
    
    private fun handleSignInResult(completedTask: Task<GoogleSignInAccount>) {
        try {
            val account = completedTask.getResult(ApiException::class.java)
            val idToken = account?.idToken
            
            if (idToken != null) {
                // Send token to your backend
                authenticateWithBackend(idToken)
            }
        } catch (e: ApiException) {
            Log.w("GoogleSignIn", "signInResult:failed code=" + e.statusCode)
        }
    }
}
```

### 2. Backend Authentication

```kotlin
// API Service Interface
interface AuthService {
    @POST("auth/android/google")
    suspend fun authenticateWithGoogle(@Body request: GoogleAuthRequest): Response<AuthResponse>
    
    @POST("auth/android/refresh")
    suspend fun refreshToken(): Response<AuthResponse>
    
    @GET("auth/android/config")
    suspend fun getConfig(): Response<ConfigResponse>
}

// Data Classes
data class GoogleAuthRequest(
    val idToken: String
)

data class AuthResponse(
    val success: Boolean,
    val message: String?,
    val data: AuthData?
)

data class AuthData(
    val token: String,
    val user: User,
    val subscription: SubscriptionInfo
)

data class User(
    val _id: String,
    val name: String,
    val email: String,
    val profilePicture: String?,
    val role: String,
    val isVerified: Boolean,
    val createdAt: String
)

data class SubscriptionInfo(
    val hasSubscription: Boolean,
    val isActive: Boolean,
    val plan: String?,
    val endDate: String?
)

// Authentication Function
private suspend fun authenticateWithBackend(idToken: String) {
    try {
        val request = GoogleAuthRequest(idToken)
        val response = authService.authenticateWithGoogle(request)
        
        if (response.isSuccessful && response.body()?.success == true) {
            val authData = response.body()?.data
            
            // Store JWT token
            saveAuthToken(authData?.token)
            
            // Store user data
            saveUserData(authData?.user)
            
            // Navigate to main app
            navigateToMainActivity()
        } else {
            // Handle authentication error
            showError("Authentication failed")
        }
    } catch (e: Exception) {
        showError("Network error: ${e.message}")
    }
}
```

### 3. Token Management

```kotlin
class TokenManager(private val context: Context) {
    private val prefs = context.getSharedPreferences("auth", Context.MODE_PRIVATE)
    
    fun saveToken(token: String) {
        prefs.edit().putString("jwt_token", token).apply()
    }
    
    fun getToken(): String? {
        return prefs.getString("jwt_token", null)
    }
    
    fun clearToken() {
        prefs.edit().remove("jwt_token").apply()
    }
    
    fun isLoggedIn(): Boolean {
        return getToken() != null
    }
}

// HTTP Interceptor for adding auth header
class AuthInterceptor(private val tokenManager: TokenManager) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()
        
        val token = tokenManager.getToken()
        if (token != null) {
            val newRequest = originalRequest.newBuilder()
                .header("Authorization", "Bearer $token")
                .build()
            return chain.proceed(newRequest)
        }
        
        return chain.proceed(originalRequest)
    }
}
```

## 🎥 Video Access Control

```kotlin
// Check video access before playing
private suspend fun checkVideoAccess(videoId: String): Boolean {
    try {
        val response = userService.checkVideoAccess(videoId)
        return response.body()?.data?.hasAccess == true
    } catch (e: Exception) {
        return false
    }
}

// Video player with access control
private fun playVideo(videoId: String) {
    lifecycleScope.launch {
        if (checkVideoAccess(videoId)) {
            // User has access, play video
            startVideoPlayer(videoId)
        } else {
            // Show subscription prompt
            showSubscriptionDialog()
        }
    }
}
```

## 💳 Subscription Integration

```kotlin
// Subscription service
interface SubscriptionService {
    @GET("subscriptions/plans")
    suspend fun getPlans(): Response<PlansResponse>
    
    @POST("subscriptions/create-order")
    suspend fun createOrder(@Body request: CreateOrderRequest): Response<OrderResponse>
    
    @POST("subscriptions/verify-payment")
    suspend fun verifyPayment(@Body request: VerifyPaymentRequest): Response<SubscriptionResponse>
    
    @GET("subscriptions/status")
    suspend fun getSubscriptionStatus(): Response<SubscriptionStatusResponse>
}

// Razorpay integration
private fun initiatePayment(orderId: String, amount: Int) {
    val checkout = Checkout()
    checkout.setKeyID("YOUR_RAZORPAY_KEY_ID")
    
    val options = JSONObject()
    options.put("name", "Seekho")
    options.put("description", "Video Learning Subscription")
    options.put("order_id", orderId)
    options.put("currency", "INR")
    options.put("amount", amount) // amount in paise
    
    checkout.open(this, options)
}

// Payment success callback
override fun onPaymentSuccess(razorpayPaymentID: String?) {
    // Verify payment with backend
    lifecycleScope.launch {
        verifyPaymentWithBackend(razorpayPaymentID)
    }
}
```

## 🔧 CLI Commands for Google OAuth

If you prefer manual setup:

### 1. Install Google Cloud CLI

```bash
# macOS
brew install --cask google-cloud-sdk

# Linux
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Windows - Download from:
# https://cloud.google.com/sdk/docs/install
```

### 2. Setup Project

```bash
# Login
gcloud auth login

# Create project
gcloud projects create seekho-backend-$(date +%s) --name="Seekho Backend"

# Set project
gcloud config set project YOUR_PROJECT_ID

# Enable APIs
gcloud services enable oauth2.googleapis.com
gcloud services enable people.googleapis.com
gcloud services enable plus.googleapis.com
```

### 3. Get SHA1 Fingerprint

```bash
# Debug keystore
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

# Release keystore
keytool -list -v -keystore /path/to/release.keystore -alias your_alias
```

### 4. Create OAuth Credentials

Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials) and create:

1. **Web Application** (for backend)
   - Authorized redirect URIs: `http://localhost:5000/api/auth/google/callback`

2. **Android Application**
   - Package name: `com.seekho.app`
   - SHA-1 fingerprint: (from step 3)

## 📚 API Endpoints for Android

### Authentication
- `POST /api/auth/android/google` - Authenticate with Google ID token
- `POST /api/auth/android/refresh` - Refresh JWT token
- `GET /api/auth/android/config` - Get app configuration
- `POST /api/auth/android/logout` - Logout
- `DELETE /api/auth/android/account` - Delete account

### Content Access
- `GET /api/categories` - Get categories
- `GET /api/topics` - Get topics
- `GET /api/videos` - Get videos
- `GET /api/users/me/videos/:videoId/unlock` - Check video access

### Subscriptions
- `GET /api/subscriptions/plans` - Get subscription plans
- `POST /api/subscriptions/create-order` - Create payment order
- `POST /api/subscriptions/verify-payment` - Verify payment
- `GET /api/subscriptions/status` - Get subscription status

## 🧪 Testing

### 1. Test Backend
```bash
npm run dev
npm run test-api
```

### 2. Test Android Auth
Use Swagger UI at `http://localhost:5000/api-docs` to test the Android authentication endpoint.

### 3. Example Request
```bash
curl -X POST http://localhost:5000/api/auth/android/google \
  -H "Content-Type: application/json" \
  -d '{"idToken": "YOUR_GOOGLE_ID_TOKEN"}'
```

## 🔒 Security Best Practices

1. **Store JWT securely** using Android Keystore
2. **Validate tokens** on every API call
3. **Handle token expiration** gracefully
4. **Use HTTPS** in production
5. **Implement certificate pinning**
6. **Obfuscate API keys** in release builds

## 🚀 Production Deployment

1. Update backend URLs in Android app
2. Use production Google OAuth credentials
3. Configure proper CORS settings
4. Set up SSL certificates
5. Update Razorpay to live mode

Your Android app is now ready to integrate with the Seekho backend! 🎉
