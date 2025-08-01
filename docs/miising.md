# Backend API Requirements for English Course App Fixes

This document outlines the backend API modifications and new endpoints required to support the fixes implemented in the English Course Flutter application.

## Overview

The following fixes have been implemented in the frontend and may require corresponding backend support:

1. **Test Completion Progress Updates** - Real-time progress tracking
2. **Progress Data Persistence** - Improved progress storage and retrieval
3. **Video Social Features** - Share, like, save, and comment functionality
4. **Learning Statistics** - Enhanced user statistics tracking

## Required API Endpoints

### 1. Progress Tracking APIs

#### 1.1 Enhanced Progress Recording
**Endpoint:** `POST /api/progress/record`
**Purpose:** Record detailed content progress with metadata

**Request Body:**
```json
{
  "contentId": "string",
  "contentType": "video|text|mcq|questionnaire",
  "progressPercentage": "number (0-100)",
  "timeSpent": "number (seconds)",
  "status": "notStarted|inProgress|completed",
  "metadata": {
    "moduleId": "string",
    "contentTitle": "string",
    "contentOrder": "number",
    "score": "number (for MCQs)",
    "totalQuestions": "number (for MCQs)",
    "percentage": "number (for MCQs)",
    "passed": "boolean (for MCQs)"
  },
  "timestamp": "ISO 8601 datetime"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Progress recorded successfully",
  "data": {
    "progressId": "string",
    "updatedAt": "ISO 8601 datetime"
  }
}
```

#### 1.2 Bulk Progress Retrieval
**Endpoint:** `GET /api/progress/bulk`
**Purpose:** Retrieve progress for multiple content items

**Query Parameters:**
- `contentIds`: Comma-separated list of content IDs
- `moduleId`: Optional module ID filter

**Response:**
```json
{
  "success": true,
  "data": {
    "contentId1": {
      "progressPercentage": 100,
      "status": "completed",
      "timeSpent": 1200,
      "lastAccessed": "ISO 8601 datetime",
      "metadata": {}
    },
    "contentId2": {
      "progressPercentage": 45,
      "status": "inProgress",
      "timeSpent": 600,
      "lastAccessed": "ISO 8601 datetime",
      "metadata": {}
    }
  }
}
```

### 2. Video Social Features APIs

#### 2.1 Video Sharing
**Endpoint:** `POST /api/videos/{videoId}/share`
**Purpose:** Record video share action and generate shareable link

**Request Body:**
```json
{
  "platform": "string (optional)",
  "message": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "shareUrl": "string",
    "shareId": "string",
    "expiresAt": "ISO 8601 datetime (optional)"
  }
}
```

#### 2.2 Video Comments
**Endpoint:** `GET /api/videos/{videoId}/comments`
**Purpose:** Retrieve comments for a video

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Comments per page (default: 20)
- `sortBy`: Sort order (newest|oldest|popular)

**Response:**
```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "id": "string",
        "userId": "string",
        "userName": "string",
        "userAvatar": "string (optional)",
        "content": "string",
        "createdAt": "ISO 8601 datetime",
        "likes": "number",
        "isLiked": "boolean",
        "replies": "number"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalComments": 100
    }
  }
}
```

**Endpoint:** `POST /api/videos/{videoId}/comments`
**Purpose:** Add a comment to a video

**Request Body:**
```json
{
  "content": "string",
  "parentCommentId": "string (optional, for replies)"
}
```

#### 2.3 Video Favorites/Likes
**Endpoint:** `POST /api/videos/{videoId}/favorite`
**Purpose:** Add video to favorites

**Endpoint:** `DELETE /api/videos/{videoId}/favorite`
**Purpose:** Remove video from favorites

**Response:**
```json
{
  "success": true,
  "message": "Video added to favorites",
  "data": {
    "isFavorite": true,
    "totalFavorites": 1250
  }
}
```

#### 2.4 Video Bookmarks
**Endpoint:** `POST /api/videos/{videoId}/bookmark`
**Purpose:** Bookmark a video

**Request Body:**
```json
{
  "note": "string (optional)",
  "timestamp": "number (optional, for video position)"
}
```

**Endpoint:** `DELETE /api/videos/{videoId}/bookmark`
**Purpose:** Remove video bookmark

### 3. Enhanced User Statistics APIs

#### 3.1 Real-time Statistics Update
**Endpoint:** `POST /api/users/stats/update`
**Purpose:** Update user statistics based on activity

**Request Body:**
```json
{
  "activityType": "video_watched|content_completed|test_passed|login",
  "contentId": "string (optional)",
  "contentType": "string (optional)",
  "timeSpent": "number (optional)",
  "score": "number (optional)"
}
```

#### 3.2 Comprehensive Statistics Retrieval
**Endpoint:** `GET /api/users/stats/detailed`
**Purpose:** Get detailed user statistics including progress aggregation

**Response:**
```json
{
  "success": true,
  "data": {
    "videosWatched": 45,
    "totalWatchTime": 18000,
    "completedCourses": 3,
    "favoriteVideos": 12,
    "totalBookmarks": 8,
    "currentStreak": 7,
    "averageProgress": 78.5,
    "progressByModule": {
      "moduleId1": {
        "completedContent": 8,
        "totalContent": 10,
        "progressPercentage": 80
      }
    },
    "recentActivity": [
      {
        "type": "content_completed",
        "contentTitle": "Present Tense Basics",
        "timestamp": "ISO 8601 datetime"
      }
    ],
    "achievements": [
      {
        "id": "first_video",
        "title": "First Video Watched",
        "unlockedAt": "ISO 8601 datetime"
      }
    ]
  }
}
```

## Authentication Requirements

All endpoints require authentication via Bearer token:
```
Authorization: Bearer <access_token>
```

## Error Handling

All endpoints should return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": "Additional error details (optional)"
  }
}
```

Common error codes:
- `UNAUTHORIZED`: Invalid or missing authentication
- `FORBIDDEN`: User doesn't have permission
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Invalid request data
- `RATE_LIMITED`: Too many requests
- `INTERNAL_ERROR`: Server error

## Data Models

### ContentProgress Model
```json
{
  "id": "string",
  "userId": "string",
  "contentId": "string",
  "contentType": "video|text|mcq|questionnaire",
  "progressPercentage": "number",
  "status": "notStarted|inProgress|completed",
  "timeSpent": "number",
  "metadata": "object",
  "createdAt": "ISO 8601 datetime",
  "updatedAt": "ISO 8601 datetime"
}
```

### UserStats Model
```json
{
  "userId": "string",
  "videosWatched": "number",
  "totalWatchTime": "number",
  "completedCourses": "number",
  "favoriteVideos": "number",
  "totalBookmarks": "number",
  "currentStreak": "number",
  "averageProgress": "number",
  "lastActivityAt": "ISO 8601 datetime",
  "updatedAt": "ISO 8601 datetime"
}
```

## Implementation Priority

1. **High Priority**: Progress tracking APIs (1.1, 1.2)
2. **Medium Priority**: User statistics APIs (3.1, 3.2)
3. **Low Priority**: Video social features APIs (2.1-2.4)

## Notes

- All timestamps should be in UTC
- Progress percentages should be stored as decimals (0-100)
- Time spent should be in seconds
- Implement proper rate limiting for social features
- Consider implementing caching for frequently accessed statistics
- Ensure GDPR compliance for user data storage
