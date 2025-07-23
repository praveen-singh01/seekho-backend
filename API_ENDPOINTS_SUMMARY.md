# Seekho Backend - Complete API Endpoints Summary

## Overview
This document provides a comprehensive list of all API endpoints in the Seekho Backend, including the newly added class-based learning modules functionality.

## Base URL
- **Development**: `http://localhost:8000`
- **Production**: `https://your-production-domain.com`

## Authentication
Most endpoints require authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Multi-Tenant Support
The API supports multi-tenant architecture with package IDs:
- **Seekho App**: `com.gumbo.learning`
- **Bolo App**: `com.gumbo.english`

Use the `X-Package-ID` header for package-specific requests.

---

## 1. Authentication Endpoints

### Web Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/google` - Google OAuth initiation
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/logout` - Logout user
- `DELETE /api/auth/account` - Delete user account
- `GET /api/auth/stats` - Get user statistics

### Android Authentication
- `POST /api/auth/android/google` - Android Google authentication
- `POST /api/auth/android/refresh` - Refresh JWT token
- `GET /api/auth/android/config` - Get Android app configuration
- `POST /api/auth/android/logout` - Android logout
- `DELETE /api/auth/android/account` - Delete Android account

### Admin Authentication
- `POST /api/auth/admin/login` - Admin login
- `GET /api/auth/admin/me` - Get current admin user
- `POST /api/auth/admin/create` - Create new admin user
- `GET /api/auth/admin/list` - List all admin users
- `DELETE /api/auth/admin/remove/:id` - Remove admin user
- `PUT /api/auth/admin/change-password` - Change admin password

---

## 2. Categories Endpoints

### Public Category Endpoints
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get single category
- `GET /api/categories/:id/topics` - Get topics in category
- `GET /api/categories/:id/stats` - Get category statistics
- `GET /api/categories/:id/complete` - Get complete category data
- `GET /api/categories/:id/updates` - Get category updates

---

## 3. Topics Endpoints

### Public Topic Endpoints
- `GET /api/topics` - Get all topics
- `GET /api/topics/:id` - Get single topic
- `GET /api/topics/:id/videos` - Get videos in topic
- `GET /api/topics/:id/related` - Get related topics
- `GET /api/topics/:id/progress` - Get topic progress (requires auth)

---

## 4. Videos Endpoints

### Public Video Endpoints
- `GET /api/videos` - Get all videos
- `GET /api/videos/:id` - Get single video
- `GET /api/videos/search` - Search videos
- `GET /api/videos/popular` - Get popular videos
- `GET /api/videos/new` - Get new videos
- `GET /api/videos/:id/related` - Get related videos
- `POST /api/videos/:id/view` - Record video view
- `GET /api/videos/:id/recommendations` - Get video recommendations

### Private Video Endpoints
- `GET /api/videos/:id/stream` - Get video streaming URL
- `POST /api/videos/:id/progress` - Record video progress

---

## 5. Learning Modules Endpoints (NEW)

### Public Learning Module Endpoints
- `GET /api/learning-modules` - Get all learning modules
- `GET /api/learning-modules/:id` - Get single learning module

### Class-Based Module Endpoints (NEW FEATURE)
- `GET /api/modules?class=1` - Get modules for Class 1
- `GET /api/modules?class=2` - Get modules for Class 2
- `GET /api/modules?class=3` - Get modules for Class 3
- `GET /api/modules?class=4` - Get modules for Class 4
- `GET /api/modules?class=5` - Get modules for Class 5
- `GET /api/modules?class=6` - Get modules for Class 6
- `GET /api/modules?class=7` - Get modules for Class 7
- `GET /api/modules?class=8` - Get modules for Class 8
- `GET /api/modules?class=9` - Get modules for Class 9

---

## 6. Questionnaires Endpoints

### Public Questionnaire Endpoints
- `GET /api/questionnaires` - Get all questionnaires
- `GET /api/questionnaires/:id` - Get single questionnaire

### Private Questionnaire Endpoints
- `POST /api/questionnaires/:id/submit` - Submit questionnaire answers

---

## 7. MCQs Endpoints

### Public MCQ Endpoints
- `GET /api/mcqs` - Get all MCQs
- `GET /api/mcqs/:id` - Get single MCQ

### Private MCQ Endpoints
- `POST /api/mcqs/:id/submit` - Submit MCQ answers

---

## 8. Text Content Endpoints

### Public Text Content Endpoints
- `GET /api/text-content/types` - Get available content types
- `GET /api/text-content` - Get all text content
- `GET /api/text-content/:id` - Get single text content

---

## 9. User Management Endpoints

### Private User Endpoints
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/stats` - Get user statistics
- `GET /api/users/watch-history` - Get watch history
- `POST /api/users/favorites` - Add video to favorites
- `DELETE /api/users/favorites/:videoId` - Remove from favorites
- `GET /api/users/favorites` - Get user favorites
- `POST /api/users/bookmarks` - Add video to bookmarks
- `DELETE /api/users/bookmarks/:videoId` - Remove from bookmarks
- `GET /api/users/bookmarks` - Get user bookmarks
- `GET /api/users/me/videos/:videoId/unlock` - Check video access
- `GET /api/users/me/watchlist` - Get user watchlist
- `GET /api/users/me/progress` - Get learning progress

---

## 10. Subscription Endpoints

### Public Subscription Endpoints
- `GET /api/subscriptions/plans` - Get subscription plans

### Private Subscription Endpoints
- `POST /api/subscriptions/create-order` - Create subscription order
- `POST /api/subscriptions/verify-payment` - Verify payment
- `GET /api/subscriptions/status` - Get subscription status
- `POST /api/subscriptions/cancel` - Cancel subscription
- `GET /api/subscriptions/history` - Get subscription history
- `POST /api/subscriptions/reactivate` - Reactivate subscription
- `GET /api/subscriptions/trial-eligibility` - Check trial eligibility
- `POST /api/subscriptions/convert-trial` - Convert trial to paid
- `POST /api/subscriptions/complete-conversion` - Complete trial conversion
- `POST /api/subscriptions/create-trial-with-mandate` - Create trial with UPI mandate
- `POST /api/subscriptions/cancel-razorpay` - Cancel Razorpay subscription

---

## 11. Notification Endpoints

### Private Notification Endpoints
- `GET /api/notifications` - Get user notifications
- `POST /api/notifications/mark-read` - Mark notifications as read
- `GET /api/notifications/unread-count` - Get unread count

---

## 12. Upload Endpoints

### Private Upload Endpoints (Admin only)
- `POST /api/upload/category-thumbnail` - Upload category thumbnail
- `POST /api/upload/topic-thumbnail` - Upload topic thumbnail
- `POST /api/upload/video` - Upload video file
- `POST /api/upload/video-thumbnail` - Upload video thumbnail
- `POST /api/upload/avatar` - Upload user avatar
- `GET /api/upload/files` - List uploaded files
- `DELETE /api/upload/delete` - Delete uploaded file
- `GET /api/upload/check-bucket` - Check S3 bucket status

---

## 13. Onboarding Endpoints

### Private Onboarding Endpoints
- `PUT /api/onboarding` - Update user onboarding data

---

## 14. Webhook Endpoints

### Public Webhook Endpoints
- `POST /api/webhooks/razorpay` - Handle Razorpay webhooks
- `GET /api/webhooks/test` - Test webhook endpoint
- `GET /api/webhooks/debug-subscriptions` - Debug subscriptions
- `POST /api/webhooks/payment/callback/learning` - Payment callback for Seekho
- `POST /api/webhooks/payment/callback/english` - Payment callback for Bolo

---

## 15. Admin Management Endpoints

### Admin Dashboard
- `GET /api/admin/dashboard` - Get dashboard statistics
- `GET /api/admin/users` - Get all users (admin view)
- `POST /api/admin/users/:id/toggle-status` - Toggle user status
- `GET /api/admin/users/:id/analytics` - Get user analytics

### Admin Categories Management
- `GET /api/admin/categories` - Get categories (admin view)
- `POST /api/admin/categories` - Create new category
- `PUT /api/admin/categories/:id` - Update category
- `DELETE /api/admin/categories/:id` - Delete category
- `PUT /api/admin/categories/reorder` - Reorder categories
- `GET /api/admin/categories/:id/analytics` - Get category analytics

### Admin Topics Management
- `GET /api/admin/topics` - Get topics (admin view)
- `GET /api/admin/topics/:id` - Get single topic (admin view)
- `POST /api/admin/topics` - Create new topic
- `PUT /api/admin/topics/:id` - Update topic
- `DELETE /api/admin/topics/:id` - Delete topic

### Admin Videos Management
- `POST /api/admin/videos` - Create new video
- `PUT /api/admin/videos/:id` - Update video
- `DELETE /api/admin/videos/:id` - Delete video

### Admin Learning Modules Management (NEW WITH CLASS FILTERING)
- `GET /api/admin/learning-modules` - Get learning modules (admin view)
  - Supports `classNumber` query parameter for filtering by class (1-9)
- `POST /api/admin/learning-modules` - Create new learning module
  - Supports `classNumber` field in request body
- `PUT /api/admin/learning-modules/:id` - Update learning module
- `DELETE /api/admin/learning-modules/:id` - Delete learning module

### Admin Questionnaires Management
- `GET /api/admin/questionnaires` - Get questionnaires (admin view)
- `POST /api/admin/questionnaires` - Create new questionnaire
- `PUT /api/admin/questionnaires/:id` - Update questionnaire
- `DELETE /api/admin/questionnaires/:id` - Delete questionnaire

### Admin MCQs Management
- `GET /api/admin/mcqs` - Get MCQs (admin view)
- `POST /api/admin/mcqs` - Create new MCQ
- `PUT /api/admin/mcqs/:id` - Update MCQ
- `DELETE /api/admin/mcqs/:id` - Delete MCQ

### Admin Text Content Management
- `GET /api/admin/text-content` - Get text content (admin view)
- `POST /api/admin/text-content` - Create new text content
- `PUT /api/admin/text-content/:id` - Update text content
- `DELETE /api/admin/text-content/:id` - Delete text content

### Admin Analytics
- `GET /api/admin/analytics/content` - Get content analytics
- `GET /api/admin/analytics/engagement` - Get engagement analytics
- `GET /api/admin/answers/analytics` - Get answer analytics

### Admin Notifications
- `POST /api/admin/notifications/send` - Send notification
- `GET /api/admin/notifications` - Get notifications (admin view)
- `GET /api/admin/notifications/analytics` - Get notification analytics

### Admin Subscriptions
- `GET /api/admin/subscriptions/stats` - Get subscription statistics
- `POST /api/admin/subscriptions/maintenance` - Run subscription maintenance
- `GET /api/admin/subscriptions/analytics` - Get subscription analytics
- `GET /api/admin/subscriptions` - Get all subscriptions

### Admin CloudFront Management
- `GET /api/admin/cloudfront/status` - Get CloudFront status
- `POST /api/admin/cloudfront/test-url` - Test CloudFront signed URL
- `POST /api/admin/cloudfront/invalidate` - Invalidate CloudFront cache
- `POST /api/admin/videos/convert-to-cloudfront` - Convert videos to CloudFront

---

## New Features Added

### 1. Class-Based Learning Modules
- **Feature**: Learning modules can now be assigned to specific classes (1-9)
- **Admin Dashboard**: Admins can create modules targeting different classes
- **API Filtering**: New endpoint `/api/modules?class=X` for class-based filtering
- **Database**: Added `classNumber` field to LearningModule model with validation

### 2. Enhanced Admin Dashboard
- **Class Filter**: Admin dashboard now includes class number filtering
- **Module Creation**: Form includes class number selection (1-9 or General)
- **Table Display**: Shows class information in the modules table

### 3. Multi-Tenant Architecture
- **Package Support**: Full support for both Seekho and Bolo apps
- **Data Isolation**: Complete separation of data between apps
- **Shared Features**: Identical feature sets across both apps

---

## Postman Collections

Three Postman collections have been created:

1. **Seekho_Backend_Complete_API_Collection.json** - Main API endpoints
2. **Seekho_Backend_API_Collection_Part2.json** - Videos, Learning Modules, Class-based endpoints
3. **Seekho_Backend_Admin_API_Collection.json** - Complete admin endpoints with new class filtering

Import these collections into Postman to test all endpoints with proper authentication and request examples.

---

## Environment Variables

Set up the following variables in your Postman environment:
- `baseUrl`: http://localhost:8000
- `authToken`: Your JWT authentication token
- `adminToken`: Admin JWT token
- `packageId`: com.gumbo.learning or com.gumbo.english
- `categoryId`, `topicId`, `videoId`, `moduleId`: Object IDs for testing

---

## Testing the New Class-Based Feature

1. **Create modules for different classes** using the admin endpoints
2. **Filter modules by class** using `/api/modules?class=X`
3. **Test admin dashboard** class filtering functionality
4. **Verify multi-tenant support** with different package IDs
