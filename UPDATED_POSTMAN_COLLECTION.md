# 📮 Updated Postman Collection - Complete API Documentation

## 📋 **OVERVIEW**

The Postman collection has been **completely updated** to include all new admin analytics and notification management endpoints alongside the existing user endpoints. This provides a comprehensive testing suite for the entire Seekho Backend API.

---

## 🔧 **COLLECTION STRUCTURE**

### **📁 Organized by Priority & Function**

#### **1. Critical Priority**
- Get Complete Category Data
- Get Video Stream URL  
- Get Popular Videos
- Get New Videos

#### **2. High Priority**
- Record Video Progress
- Get Watch History
- Add/Remove Favorites
- Favorites Management

#### **3. Medium Priority**
- User Profile Management
- User Statistics
- Bookmark Management
- Related Content Discovery

#### **4. Low Priority**
- Category Updates
- User Notifications
- Notification Management

#### **5. 🆕 Admin Analytics & Management** *(NEW SECTION)*
- **Admin Authentication**
- **User Analytics**
- **Content Analytics** 
- **Notification Management**
- **Content Management (Delete)**

---

## 🆕 **NEW ADMIN ENDPOINTS ADDED**

### **🔐 Admin Authentication**
```http
POST /api/auth/admin/login
```
**Purpose**: Get admin JWT token for accessing admin endpoints
**Body**:
```json
{
  "username": "superadmin",
  "password": "SuperAdmin@123"
}
```

### **📊 User Analytics**
```http
GET /api/admin/users/{userId}/analytics
```
**Purpose**: Get comprehensive analytics for individual users
**Features**: Watch history, completion rates, favorites, bookmarks

### **📈 Content Analytics**
```http
GET /api/admin/analytics/content
GET /api/admin/analytics/engagement?days=30
```
**Purpose**: 
- Content performance metrics
- User engagement patterns
- Popular content identification

### **📧 Notification Management**
```http
POST /api/admin/notifications/send
GET /api/admin/notifications
GET /api/admin/notifications/analytics
```
**Features**:
- Send notifications to all users or specific users
- View all sent notifications with filtering
- Notification performance analytics

**Send Notification Examples**:

**To All Users**:
```json
{
  "title": "New Course Available!",
  "message": "Check out our latest course on Advanced JavaScript",
  "type": "new_content",
  "sendToAll": true,
  "priority": "medium"
}
```

**To Specific Users**:
```json
{
  "title": "Premium Feature Update",
  "message": "Your premium subscription includes new features",
  "type": "subscription",
  "sendToAll": false,
  "userIds": ["user_id_1", "user_id_2"],
  "priority": "high"
}
```

### **🗑️ Content Management (Delete)**
```http
DELETE /api/admin/categories/{categoryId}
DELETE /api/admin/topics/{topicId}
DELETE /api/admin/videos/{videoId}
```
**Purpose**: Soft delete content (sets isActive: false)
**Security**: Admin authentication required

---

## 🔧 **COLLECTION VARIABLES**

### **Updated Variables**
```json
{
  "base_url": "http://localhost:8000/api",
  "jwt_token": "YOUR_JWT_TOKEN_HERE",
  "admin_token": "YOUR_ADMIN_JWT_TOKEN_HERE",
  "sample_category_id": "673b8b8b8b8b8b8b8b8b8b8b",
  "sample_video_id": "673b8b8b8b8b8b8b8b8b8b8b",
  "sample_topic_id": "673b8b8b8b8b8b8b8b8b8b8b",
  "sample_user_id": "673b8b8b8b8b8b8b8b8b8b8b"
}
```

### **🔑 How to Set Up Authentication**

#### **For User Endpoints**:
1. Use any user login endpoint to get JWT token
2. Set `jwt_token` variable with the received token
3. User endpoints will automatically use this token

#### **For Admin Endpoints**:
1. Use `Admin Login` request in the collection
2. Copy the received admin token
3. Set `admin_token` variable with the admin token
4. Admin endpoints will automatically use this token

---

## 🎯 **TESTING WORKFLOW**

### **📋 Recommended Testing Order**

#### **1. Setup Authentication**
```
1. Admin Login → Get admin_token
2. User Login → Get jwt_token  
3. Update collection variables
```

#### **2. Test User Features**
```
1. Critical Priority endpoints
2. High Priority endpoints (favorites, progress)
3. Medium Priority endpoints (profile, bookmarks)
4. Low Priority endpoints (notifications)
```

#### **3. Test Admin Features**
```
1. User Analytics → Test individual user insights
2. Content Analytics → Test platform-wide metrics
3. Notification Management → Test sending notifications
4. Content Management → Test delete operations
```

### **🔍 Key Test Scenarios**

#### **User Journey Testing**:
1. **Content Discovery**: Popular videos → Category data → Related content
2. **Learning Progress**: Video progress → Watch history → Statistics
3. **Personal Management**: Favorites → Bookmarks → Profile updates
4. **Notifications**: Get notifications → Mark as read → Unread count

#### **Admin Management Testing**:
1. **Analytics Review**: Content performance → User engagement → Individual user analytics
2. **Communication**: Send notifications → View sent notifications → Analytics
3. **Content Management**: Delete content → Verify soft delete behavior

---

## 📊 **NOTIFICATION TYPES SUPPORTED**

### **Available Types**:
- `info` - General information
- `success` - Success messages
- `warning` - Warning alerts
- `error` - Error notifications
- `new_content` - New course/video announcements
- `subscription` - Subscription-related updates
- `achievement` - User achievement notifications

### **Priority Levels**:
- `low` - Non-urgent notifications
- `medium` - Standard notifications
- `high` - Important/urgent notifications

---

## 🚀 **IMPORT INSTRUCTIONS**

### **How to Import the Collection**:

1. **Open Postman**
2. **Click Import** button
3. **Select File** → Choose `New_Endpoints_Postman_Collection.json`
4. **Import** the collection
5. **Set Environment Variables**:
   - `base_url`: `http://localhost:8000/api`
   - `admin_token`: Get from admin login
   - `jwt_token`: Get from user login

### **Quick Start Testing**:

1. **Start Backend Server**: `npm start` (port 8000)
2. **Import Collection** into Postman
3. **Run Admin Login** → Copy admin token
4. **Set admin_token** variable
5. **Test Admin Endpoints** → Analytics, Notifications, etc.
6. **Run User Login** → Copy user token  
7. **Set jwt_token** variable
8. **Test User Endpoints** → Progress, Favorites, etc.

---

## 🎉 **COLLECTION BENEFITS**

### **For Developers**:
- ✅ **Complete API Coverage** - All endpoints in one collection
- ✅ **Organized Structure** - Logical grouping by priority and function
- ✅ **Ready-to-Use** - Pre-configured with sample data
- ✅ **Authentication Handled** - Automatic token management
- ✅ **Documentation Included** - Clear descriptions and examples

### **For Testing**:
- ✅ **End-to-End Testing** - Complete user and admin workflows
- ✅ **Analytics Validation** - Test all analytics endpoints
- ✅ **Notification Testing** - Send and track notifications
- ✅ **Content Management** - Test CRUD operations
- ✅ **Error Scenarios** - Test authentication and validation

### **For API Documentation**:
- ✅ **Live Examples** - Working requests with sample data
- ✅ **Response Formats** - See actual API responses
- ✅ **Parameter Options** - All query parameters documented
- ✅ **Authentication Patterns** - Clear auth requirements

The updated Postman collection now provides comprehensive testing capabilities for the entire Seekho Backend API, including all new admin analytics and notification management features! 🎯
