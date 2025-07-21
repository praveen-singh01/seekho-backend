# 📮 Postman Collection Setup Guide

This guide helps you set up and test the enhanced Seekho Backend APIs using the provided Postman collection.

## 📥 Import Collection

1. **Download the Collection**
   - File: `postman-collections/Seekho-Backend-Enhanced-Complete.postman_collection.json`

2. **Import into Postman**
   - Open Postman
   - Click "Import" button
   - Select the JSON file
   - Collection will be imported with all endpoints

## ⚙️ Environment Setup

### 1. Create Environment Variables

Create a new environment in Postman with these variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `base_url` | `http://localhost:8000` | Your server URL |
| `seekho_package_id` | `com.gumbo.learning` | Seekho app package ID |
| `bolo_package_id` | `com.gumbo.english` | Bolo app package ID |
| `jwt_token` | *(auto-set)* | User authentication token |
| `admin_token` | *(auto-set)* | Admin authentication token |
| `user_id` | *(auto-set)* | Current user ID |
| `category_id` | *(manual)* | Test category ID |
| `topic_id` | *(manual)* | Test topic ID |
| `video_id` | *(manual)* | Test video ID |
| `questionnaire_id` | *(auto-set)* | Test questionnaire ID |
| `mcq_id` | *(auto-set)* | Test MCQ ID |
| `learning_module_id` | *(auto-set)* | Test learning module ID |
| `text_content_id` | *(auto-set)* | Test text content ID |

### 2. Set Manual Variables

Before testing, you need to set these variables manually:

```bash
# Get existing category ID
curl -X GET "http://localhost:8000/api/categories" -H "X-Package-ID: com.gumbo.english"

# Get existing topic ID  
curl -X GET "http://localhost:8000/api/topics" -H "X-Package-ID: com.gumbo.english"

# Get existing video ID
curl -X GET "http://localhost:8000/api/videos" -H "X-Package-ID: com.gumbo.english"
```

Copy the IDs from responses and set them in your Postman environment.

## 🔐 Authentication Flow

### 1. User Authentication (Google OAuth)

**Note:** For testing, you can skip Google OAuth and use the test data created by our scripts.

If you want to test Google OAuth:
1. Get a Google ID token from your mobile app or web app
2. Use the "Google OAuth Login" request
3. The `jwt_token` will be automatically set from the response

### 2. Admin Authentication

1. Use the "Admin Login" request with credentials:
   ```json
   {
     "username": "admin@bolo.com",
     "password": "Admin@123"
   }
   ```
2. The `admin_token` will be automatically set from the response

## 🧪 Testing Workflow

### Phase 1: Basic Content (Existing)

1. **Test Categories**
   - Get All Categories - Bolo
   - Get Single Category

2. **Test Topics**
   - Get All Topics - Bolo
   - Get Single Topic

3. **Test Videos**
   - Get All Videos - Bolo
   - Get Single Video

### Phase 2: New Content Types

4. **Test Questionnaires**
   - Get All Questionnaires - Bolo
   - Get Single Questionnaire (requires auth)
   - Submit Questionnaire Answers (requires auth)

5. **Test MCQs**
   - Get All MCQs - Bolo
   - Get Single MCQ (requires auth)
   - Submit MCQ Answers (requires auth)

6. **Test Text Content**
   - Get Content Types
   - Get All Text Content - Bolo
   - Get Single Text Content

7. **Test Learning Modules**
   - Get All Learning Modules - Bolo
   - Get Single Learning Module with Content (requires auth)

### Phase 3: Admin Operations

8. **Admin Authentication**
   - Admin Login

9. **Admin Content Creation**
   - Create Questionnaire (Admin)
   - Create MCQ (Admin)
   - Create Text Content (Admin)

10. **Admin Analytics**
    - Get Answer Analytics (Admin)

## 📋 Test Scenarios

### Scenario 1: Student Learning Flow

1. **Browse Content**
   ```
   GET /api/categories → Get categories
   GET /api/topics → Get topics for a category
   GET /api/learning-modules → Get modules for a topic
   ```

2. **Access Learning Module**
   ```
   GET /api/learning-modules/:id → Get module with content
   ```

3. **Complete Content Items**
   ```
   GET /api/text-content/:id → Read summary/instructions
   GET /api/questionnaires/:id → Get questionnaire
   POST /api/questionnaires/:id/submit → Submit answers
   GET /api/mcqs/:id → Get MCQ
   POST /api/mcqs/:id/submit → Submit answers
   ```

### Scenario 2: Teacher Content Management

1. **Admin Login**
   ```
   POST /api/auth/admin/login
   ```

2. **Create Content**
   ```
   POST /api/admin/text-content → Create reading material
   POST /api/admin/questionnaires → Create Q&A session
   POST /api/admin/mcqs → Create quiz
   ```

3. **View Analytics**
   ```
   GET /api/admin/answers/analytics → Check performance
   ```

### Scenario 3: Multi-Tenant Testing

1. **Test Bolo App Data**
   ```
   Headers: X-Package-ID: com.gumbo.english
   GET /api/questionnaires
   ```

2. **Test Seekho App Data**
   ```
   Headers: X-Package-ID: com.gumbo.learning  
   GET /api/questionnaires
   ```

3. **Verify Data Isolation**
   - Results should be different between apps
   - Content created for Bolo should not appear in Seekho

## 🔍 Response Validation

### Success Response Format
```json
{
  "success": true,
  "count": 10,
  "total": 25,
  "pagination": {
    "page": 1,
    "limit": 10,
    "pages": 3
  },
  "data": [...]
}
```

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "title",
      "message": "Title is required"
    }
  ]
}
```

## 🐛 Common Issues & Solutions

### Issue 1: "Package ID is required"
**Solution:** Add `X-Package-ID` header with value `com.gumbo.english`

### Issue 2: "Unauthorized" 
**Solution:** 
1. Run authentication request first
2. Check if token is set in environment variables
3. Verify token hasn't expired

### Issue 3: "Content not found"
**Solution:**
1. Run the test data creation scripts first:
   ```bash
   node test-new-content.js
   node test-flexible-modules.js
   ```
2. Update environment variables with correct IDs

### Issue 4: Empty responses
**Solution:**
1. Verify you're using the correct package ID
2. Check if test data exists for that package
3. Run data creation scripts if needed

## 📊 Expected Test Results

After running all tests successfully, you should see:

### Content Counts (Bolo App)
- **Categories**: 1 (English Grammar)
- **Topics**: 1 (Basic Tenses)
- **Videos**: 0 (or existing videos)
- **Questionnaires**: 1 (Present Tense Practice)
- **MCQs**: 1 (Tense Identification Quiz)
- **Text Content**: 4 (Summary, Reading, Instructions, Notes)
- **Learning Modules**: 2 (Basic + Flexible modules)

### Response Times
- **GET requests**: < 200ms
- **POST requests**: < 500ms
- **Complex queries**: < 1000ms

### Success Rates
- **All GET requests**: 100% success
- **Authenticated requests**: 100% success (with valid token)
- **Admin requests**: 100% success (with admin token)

## 🚀 Advanced Testing

### Load Testing
Use Postman's Collection Runner to test multiple iterations:
1. Select the collection
2. Set iterations (e.g., 10)
3. Set delay between requests (e.g., 100ms)
4. Run and monitor performance

### Automated Testing
Set up automated tests with Newman (Postman CLI):
```bash
npm install -g newman
newman run Seekho-Backend-Enhanced-Complete.postman_collection.json \
  --environment your-environment.json \
  --reporters cli,html
```

## 📝 Test Documentation

Document your test results:

1. **API Response Times**
2. **Error Scenarios Tested**
3. **Multi-tenant Isolation Verified**
4. **Authentication Flow Tested**
5. **Data Integrity Confirmed**

This ensures your Flutter app integration will work smoothly! 🎯
