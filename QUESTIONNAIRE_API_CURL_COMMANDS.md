# 📋 Questionnaire API - CURL Commands for Frontend Team

## 🔐 Authentication

### Admin Login
```bash
curl -X POST http://localhost:8000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "superadmin",
    "password": "superadmin@123"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "684c0739271fc131540171cc",
      "name": "Super Administrator",
      "email": "superadmin@seekho.com",
      "role": "admin"
    }
  }
}
```

## 📚 Admin Questionnaire Management

### 1. Get All Questionnaires (Admin)
```bash
curl -X GET "http://localhost:8000/api/admin/questionnaires?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "X-Package-ID: com.gumbo.english"
```

### 2. Create New Questionnaire with Expected Answers
```bash
curl -X POST http://localhost:8000/api/admin/questionnaires \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "X-Package-ID: com.gumbo.english" \
  -d '{
    "title": "English Grammar Practice",
    "description": "Practice questions on English grammar with auto-scoring",
    "topic": "687e92e901bfc0821f6b056d",
    "difficulty": "beginner",
    "estimatedTime": 15,
    "passingScore": 70,
    "isPremium": false,
    "questions": [
      {
        "questionText": "What is the past tense of \"go\"?",
        "questionType": "short_answer",
        "isRequired": true,
        "order": 0,
        "hints": ["Think about yesterday"],
        "maxLength": 50,
        "expectedAnswers": ["went", "gone"],
        "points": 1
      },
      {
        "questionText": "Write a sentence using present continuous tense.",
        "questionType": "long_answer",
        "isRequired": true,
        "order": 1,
        "hints": ["Use am/is/are + verb+ing"],
        "maxLength": 200,
        "expectedAnswers": [
          "I am reading a book",
          "She is writing a letter",
          "They are playing football",
          "He is studying English"
        ],
        "points": 2
      }
    ]
  }'
```

### 3. Update Questionnaire
```bash
curl -X PUT http://localhost:8000/api/admin/questionnaires/QUESTIONNAIRE_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "X-Package-ID: com.gumbo.english" \
  -d '{
    "title": "Updated English Grammar Practice",
    "passingScore": 80,
    "questions": [
      {
        "questionText": "What is the past tense of \"go\"?",
        "questionType": "short_answer",
        "isRequired": true,
        "order": 0,
        "maxLength": 50,
        "expectedAnswers": ["went"],
        "points": 1
      }
    ]
  }'
```

### 4. Delete Questionnaire (Soft Delete)
```bash
curl -X DELETE http://localhost:8000/api/admin/questionnaires/QUESTIONNAIRE_ID \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "X-Package-ID: com.gumbo.english"
```

## 📱 Public Questionnaire APIs (for Flutter App)

### 1. Get All Questionnaires
```bash
curl -X GET "http://localhost:8000/api/questionnaires?page=1&limit=10" \
  -H "X-Package-ID: com.gumbo.english"
```

### 2. Get Single Questionnaire
```bash
curl -X GET http://localhost:8000/api/questionnaires/687e8636f132c7fb7db172fc \
  -H "X-Package-ID: com.gumbo.english"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "687e8636f132c7fb7db172fc",
    "title": "Present Tense Practice",
    "description": "Practice questions on present tense usage",
    "topic": {
      "_id": "687e8635f132c7fb7db172f2",
      "title": "Basic Tenses",
      "slug": "basic-tenses"
    },
    "questions": [
      {
        "questionText": "What is the present tense of \"go\" for third person singular?",
        "questionType": "short_answer",
        "isRequired": true,
        "order": 0,
        "hints": ["Think about he/she/it"],
        "maxLength": 50,
        "_id": "687e8636f132c7fb7db172fd"
      }
    ],
    "difficulty": "beginner",
    "estimatedTime": 10,
    "passingScore": 70,
    "isActive": true,
    "isPremium": false,
    "hasAccess": true
  }
}
```

### 3. Submit Questionnaire Answers (with Auto-Scoring)
```bash
curl -X POST http://localhost:8000/api/questionnaires/687e8636f132c7fb7db172fc/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "X-Package-ID: com.gumbo.english" \
  -d '{
    "answers": [
      {
        "questionIndex": 0,
        "textAnswer": "goes",
        "timeSpent": 30
      },
      {
        "questionIndex": 1,
        "textAnswer": "I am reading a book right now.",
        "timeSpent": 45
      }
    ]
  }'
```

**Response (with Auto-Scoring):**
```json
{
  "success": true,
  "message": "Answers submitted successfully",
  "data": {
    "submissionId": "6883d8a13b60f36a9647c81e",
    "completedAt": "2025-07-25T19:18:57.617Z",
    "completionTime": 0,
    "totalQuestions": 2,
    "answeredQuestions": 2,
    "correctAnswers": 2,
    "score": 100,
    "passed": true,
    "feedback": "You scored 100% (2/2 correct)"
  }
}
```

### 4. Get Questionnaire Results
```bash
curl -X GET http://localhost:8000/api/questionnaires/687e8636f132c7fb7db172fc/results \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "X-Package-ID: com.gumbo.english"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "submissionId": "6883d8a13b60f36a9647c81e",
    "completedAt": "2025-07-25T19:18:57.617Z",
    "completionTime": 0,
    "totalQuestions": 2,
    "answeredQuestions": 2,
    "correctAnswers": 2,
    "score": 100,
    "passed": true,
    "feedback": "You scored 100% (2/2 correct)",
    "answers": [
      {
        "questionIndex": 0,
        "questionText": "What is the present tense of \"go\" for third person singular?",
        "textAnswer": "goes",
        "timeSpent": 30
      },
      {
        "questionIndex": 1,
        "questionText": "Write a sentence using present continuous tense.",
        "textAnswer": "I am reading a book right now.",
        "timeSpent": 45
      }
    ]
  }
}
```

## 🔧 Key Features

### Auto-Scoring Logic
- **Expected Answers**: Questions can have multiple expected answers
- **Case Insensitive**: Matching is case-insensitive
- **Punctuation Ignored**: Special characters are ignored in comparison
- **Scoring**: `(correct answers / total questions) × 100`
- **Pass/Fail**: Based on `passingScore` field (default 70%)

### Response Fields
- **score**: Percentage score (0-100) or `null` for manual review
- **passed**: `true`/`false`/`null` based on passing score
- **correctAnswers**: Number of correct answers
- **feedback**: Detailed feedback message

## 🌐 Environment Variables
```bash
# Development
BASE_URL=http://localhost:8000

# Production
BASE_URL=https://your-production-domain.com
```

## 📦 Package IDs
- **Seekho App**: `com.gumbo.learning`
- **Bolo App**: `com.gumbo.english`

## ⚠️ Important Notes
1. Always include `X-Package-ID` header for multi-tenant support
2. Use admin token for admin APIs, user token for user APIs
3. Questions without `expectedAnswers` will return `score: null`
4. Auto-scoring works only when `expectedAnswers` array is provided
5. All timestamps are in ISO 8601 format (UTC)
