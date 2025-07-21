# 📚 Seekho Backend API Documentation - Enhanced Multi-Tenant

Complete API documentation for the enhanced Seekho Backend supporting both **Seekho** (`com.gumbo.learning`) and **Bolo** (`com.gumbo.english`) apps with new content management features.

## 🌐 Base URL

```
Development: http://localhost:8000
Production: https://your-domain.com
```

## 🔐 Authentication

### Headers Required

```http
Content-Type: application/json
X-Package-ID: com.gumbo.english  # For Bolo app
Authorization: Bearer <jwt-token>  # For authenticated endpoints
```

### Google OAuth Login

```http
POST /api/auth/google
```

**Request Body:**
```json
{
  "idToken": "google-id-token-here",
  "packageId": "com.gumbo.english"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt-token-here",
    "user": {
      "_id": "user-id",
      "name": "John Doe",
      "email": "john@example.com",
      "packageId": "com.gumbo.english",
      "isSubscribed": true
    }
  }
}
```

---

## 📝 Questionnaires API

### Get All Questionnaires

```http
GET /api/questionnaires
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `topic` (optional): Filter by topic ID
- `difficulty` (optional): Filter by difficulty (beginner, intermediate, advanced)
- `search` (optional): Search in title and description
- `isPremium` (optional): Filter by premium status (true/false)

**Response:**
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
  "data": [
    {
      "_id": "questionnaire-id",
      "title": "Present Tense Practice",
      "description": "Practice questions for present tense",
      "topic": {
        "_id": "topic-id",
        "title": "Basic Tenses",
        "slug": "basic-tenses"
      },
      "difficulty": "beginner",
      "estimatedTime": 15,
      "isPremium": false,
      "questions": [
        {
          "_id": "question-id",
          "questionText": "What is the present tense of 'go'?",
          "questionType": "short_answer",
          "order": 0,
          "isRequired": true
        }
      ],
      "metadata": {
        "totalQuestions": 5,
        "totalAttempts": 120,
        "averageCompletionTime": 12.5
      }
    }
  ]
}
```

### Get Single Questionnaire

```http
GET /api/questionnaires/:id
```

**Authentication:** Required

**Response:** Same as single questionnaire object above with full question details.

### Submit Questionnaire Answers

```http
POST /api/questionnaires/:id/submit
```

**Authentication:** Required

**Request Body:**
```json
{
  "answers": [
    {
      "questionId": "question-id-1",
      "answer": "goes"
    },
    {
      "questionId": "question-id-2", 
      "answer": "I am going to the store"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "submissionId": "submission-id",
    "score": null,
    "feedback": "Your answers have been recorded for review",
    "completedAt": "2024-01-15T10:30:00Z",
    "timeTaken": 720
  }
}
```

---

## 🧩 MCQs API

### Get All MCQs

```http
GET /api/mcqs
```

**Query Parameters:** Same as questionnaires

**Response:**
```json
{
  "success": true,
  "count": 8,
  "total": 15,
  "pagination": {
    "page": 1,
    "limit": 10,
    "pages": 2
  },
  "data": [
    {
      "_id": "mcq-id",
      "title": "Tense Identification Quiz",
      "description": "Multiple choice quiz on English tenses",
      "topic": {
        "_id": "topic-id",
        "title": "Basic Tenses"
      },
      "difficulty": "beginner",
      "estimatedTime": 10,
      "passingScore": 70,
      "isPremium": false,
      "questions": [
        {
          "_id": "question-id",
          "questionText": "Which sentence uses present continuous?",
          "options": [
            { "text": "I go to school" },
            { "text": "I am going to school" },
            { "text": "I went to school" },
            { "text": "I will go to school" }
          ],
          "difficulty": "easy",
          "points": 1,
          "order": 0
        }
      ],
      "metadata": {
        "totalQuestions": 10,
        "totalAttempts": 85,
        "passRate": 78.5,
        "averageScore": 8.2
      }
    }
  ]
}
```

**Note:** `isCorrect` field is not included in options for security.

### Get Single MCQ

```http
GET /api/mcqs/:id
```

**Authentication:** Required

### Submit MCQ Answers

```http
POST /api/mcqs/:id/submit
```

**Authentication:** Required

**Request Body:**
```json
{
  "answers": [
    {
      "questionId": "question-id-1",
      "selectedOption": 1
    },
    {
      "questionId": "question-id-2",
      "selectedOption": 0
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "submissionId": "submission-id",
    "score": 8,
    "totalQuestions": 10,
    "percentage": 80,
    "passed": true,
    "passingScore": 70,
    "feedback": "Great job! You passed the quiz.",
    "results": [
      {
        "questionId": "question-id-1",
        "isCorrect": true,
        "selectedOption": 1,
        "correctOption": 1,
        "explanation": "Present continuous uses am/is/are + verb+ing"
      }
    ],
    "completedAt": "2024-01-15T10:30:00Z",
    "timeTaken": 480
  }
}
```

---

## 🎓 Learning Modules API

### Get All Learning Modules

```http
GET /api/learning-modules
```

**Query Parameters:** Same as questionnaires

**Response:**
```json
{
  "success": true,
  "count": 5,
  "total": 12,
  "data": [
    {
      "_id": "module-id",
      "title": "Complete Present Tense Course",
      "description": "Comprehensive course covering all aspects of present tense",
      "topic": {
        "_id": "topic-id",
        "title": "Basic Tenses"
      },
      "difficulty": "beginner",
      "estimatedDuration": 45,
      "isPremium": false,
      "content": [
        {
          "contentType": "summary",
          "contentId": "content-id-1",
          "contentModel": "TextContent",
          "order": 0,
          "isRequired": true,
          "customTitle": "Course Overview",
          "customDescription": "Start here to get an overview"
        },
        {
          "contentType": "questionnaire",
          "contentId": "content-id-2", 
          "contentModel": "Questionnaire",
          "order": 1,
          "isRequired": true
        }
      ],
      "metadata": {
        "totalContent": 4,
        "totalVideos": 1,
        "totalQuestionnaires": 1,
        "totalMCQs": 1,
        "totalTextContent": 1,
        "totalEnrollments": 150,
        "averageCompletionRate": 85.5
      }
    }
  ]
}
```

### Get Single Learning Module

```http
GET /api/learning-modules/:id
```

**Authentication:** Required

**Response:** Same as above but includes `populatedContent` array with full content details:

```json
{
  "success": true,
  "data": {
    "_id": "module-id",
    "title": "Complete Present Tense Course",
    // ... other fields
    "populatedContent": [
      {
        "contentType": "summary",
        "contentId": "content-id-1",
        "contentModel": "TextContent",
        "order": 0,
        "isRequired": true,
        "customTitle": "Course Overview",
        "contentData": {
          "_id": "content-id-1",
          "title": "Present Tense Summary",
          "contentType": "summary",
          "estimatedReadingTime": 5,
          "wordCount": 150,
          "contentPreview": "The present tense is used to describe..."
        }
      },
      {
        "contentType": "questionnaire",
        "contentId": "content-id-2",
        "contentModel": "Questionnaire", 
        "order": 1,
        "isRequired": true,
        "contentData": {
          "_id": "content-id-2",
          "title": "Present Tense Practice",
          "estimatedTime": 15,
          "isPremium": false
        }
      }
    ]
  }
}
```

---

## 📄 Text Content API

### Get All Text Content

```http
GET /api/text-content
```

**Query Parameters:**
- `page`, `limit`, `topic`, `difficulty`, `search`, `isPremium` (same as above)
- `contentType` (optional): Filter by content type (summary, reading, instructions, notes, explanation, other)
- `sort` (optional): Sort by (title, newest, difficulty, popular, reading-time)

**Response:**
```json
{
  "success": true,
  "count": 6,
  "total": 20,
  "data": [
    {
      "_id": "text-content-id",
      "title": "Present Tense Summary",
      "description": "Quick summary of present tense rules",
      "topic": {
        "_id": "topic-id",
        "title": "Basic Tenses"
      },
      "contentType": "summary",
      "content": "# Present Tense Summary\n\nThe present tense is used to describe...",
      "contentFormat": "markdown",
      "estimatedReadingTime": 3,
      "difficulty": "beginner",
      "isPremium": false,
      "tags": ["grammar", "tenses", "beginner"],
      "resources": [
        {
          "title": "Audio Pronunciation",
          "url": "https://example.com/audio.mp3",
          "type": "audio"
        }
      ],
      "contentPreview": "The present tense is used to describe current actions...",
      "wordCount": 145,
      "metadata": {
        "totalViews": 250,
        "averageReadingTime": 2.8,
        "totalBookmarks": 45
      }
    }
  ]
}
```

### Get Single Text Content

```http
GET /api/text-content/:id
```

**Authentication:** Optional (required for premium content)

**Response:** Same as single text content object above with full content.

### Get Content Types

```http
GET /api/text-content/types
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "value": "summary",
      "label": "Summary",
      "description": "Brief overview or summary of a topic"
    },
    {
      "value": "reading",
      "label": "Reading Material", 
      "description": "Detailed reading content"
    },
    {
      "value": "instructions",
      "label": "Instructions",
      "description": "Step-by-step instructions"
    },
    {
      "value": "notes",
      "label": "Notes",
      "description": "Study notes and key points"
    },
    {
      "value": "explanation",
      "label": "Explanation",
      "description": "Detailed explanation of concepts"
    },
    {
      "value": "other",
      "label": "Other",
      "description": "Other types of text content"
    }
  ]
}
```

---

## ⚙️ Admin APIs

### Admin Authentication

```http
POST /api/auth/admin/login
```

**Request Body:**
```json
{
  "username": "admin@bolo.com",
  "password": "Admin@123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "admin-jwt-token",
    "admin": {
      "_id": "admin-id",
      "username": "admin@bolo.com",
      "name": "Admin User",
      "role": "admin",
      "packageId": "com.gumbo.english"
    }
  }
}
```

### Create Questionnaire (Admin)

```http
POST /api/admin/questionnaires
```

**Authentication:** Admin Required

**Request Body:**
```json
{
  "title": "English Grammar Practice",
  "description": "Practice questions for English grammar",
  "topic": "topic-id",
  "difficulty": "beginner",
  "estimatedTime": 15,
  "isPremium": false,
  "questions": [
    {
      "questionText": "What is the past tense of 'go'?",
      "questionType": "short_answer",
      "order": 0,
      "isRequired": true
    }
  ]
}
```

### Create MCQ (Admin)

```http
POST /api/admin/mcqs
```

**Authentication:** Admin Required

**Request Body:**
```json
{
  "title": "English Tenses Quiz",
  "description": "Multiple choice quiz on English tenses",
  "topic": "topic-id",
  "difficulty": "beginner",
  "estimatedTime": 10,
  "passingScore": 70,
  "isPremium": false,
  "questions": [
    {
      "questionText": "Which sentence uses present continuous?",
      "options": [
        { "text": "I go to school", "isCorrect": false },
        { "text": "I am going to school", "isCorrect": true },
        { "text": "I went to school", "isCorrect": false },
        { "text": "I will go to school", "isCorrect": false }
      ],
      "explanation": "Present continuous uses am/is/are + verb+ing",
      "difficulty": "easy",
      "points": 1,
      "order": 0
    }
  ]
}
```

### Create Text Content (Admin)

```http
POST /api/admin/text-content
```

**Authentication:** Admin Required

**Request Body:**
```json
{
  "title": "Present Tense Guide",
  "description": "Complete guide to present tense in English",
  "topic": "topic-id",
  "contentType": "summary",
  "content": "# Present Tense\n\nThe present tense is used to describe...",
  "contentFormat": "markdown",
  "difficulty": "beginner",
  "isPremium": false,
  "tags": ["grammar", "tenses", "beginner"],
  "resources": [
    {
      "title": "Audio Guide",
      "url": "https://example.com/audio.mp3",
      "type": "audio"
    }
  ]
}
```

### Get Answer Analytics (Admin)

```http
GET /api/admin/answers/analytics
```

**Authentication:** Admin Required

**Query Parameters:**
- `contentType` (optional): Filter by content type (questionnaire, mcq)
- `period` (optional): Time period (day, week, month, year)
- `topicId` (optional): Filter by topic
- `startDate` (optional): Start date (YYYY-MM-DD)
- `endDate` (optional): End date (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalSubmissions": 1250,
      "totalUsers": 85,
      "averageScore": 78.5,
      "completionRate": 82.3
    },
    "byContentType": {
      "questionnaire": {
        "totalSubmissions": 650,
        "averageCompletionTime": 12.5
      },
      "mcq": {
        "totalSubmissions": 600,
        "averageScore": 78.5,
        "passRate": 85.2
      }
    },
    "byTopic": [
      {
        "topicId": "topic-id-1",
        "topicTitle": "Basic Tenses",
        "submissions": 450,
        "averageScore": 82.1
      }
    ],
    "byDifficulty": {
      "beginner": { "submissions": 800, "averageScore": 85.2 },
      "intermediate": { "submissions": 350, "averageScore": 72.8 },
      "advanced": { "submissions": 100, "averageScore": 65.5 }
    },
    "timeline": [
      {
        "date": "2024-01-15",
        "submissions": 45,
        "averageScore": 78.2
      }
    ]
  }
}
```

---

## 🔄 Error Responses

All endpoints return consistent error responses:

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

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## 🌐 Multi-Tenant Support

All endpoints support multi-tenant architecture:

- **Seekho App**: `X-Package-ID: com.gumbo.learning`
- **Bolo App**: `X-Package-ID: com.gumbo.english`

Data is completely isolated between apps. If no package ID is provided, it defaults to Seekho app for backward compatibility.

---

## 📊 Rate Limiting

- **General endpoints**: 100 requests per 15 minutes per IP
- **Authentication endpoints**: 5 requests per 15 minutes per IP
- **Admin endpoints**: 200 requests per 15 minutes per admin user

---

## 🔐 Security Features

- **JWT Authentication** with secure token generation
- **Multi-tenant data isolation** with package ID validation
- **Input validation** and sanitization on all endpoints
- **Rate limiting** to prevent abuse
- **CORS protection** with configurable origins
- **Helmet.js** for security headers
- **XSS protection** and SQL injection prevention

This documentation covers all the enhanced APIs for the Bolo English learning app! 🚀
