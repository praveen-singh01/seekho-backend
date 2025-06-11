# 🔔 Notification API Documentation for Flutter Frontend

## 🌐 Base URL
```
Production: https://your-api-domain.com
Development: http://localhost:8000
```

## 🔐 Authentication
All endpoints require JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 📋 **USER NOTIFICATION ENDPOINTS**

### 1. Get User Notifications
Get all notifications for the authenticated user with pagination and filtering.

```http
GET /api/notifications?page=1&limit=20&type=info&isRead=false
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 50)
- `type` (optional): Filter by notification type
- `isRead` (optional): Filter by read status (true/false)

**Response:**
```json
{
  "success": true,
  "count": 15,
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  },
  "data": [
    {
      "id": "notif_xyz123",
      "title": "New Course Available!",
      "message": "Check out our latest JavaScript course",
      "type": "new_content",
      "priority": "medium",
      "isRead": false,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "readAt": null,
      "data": {
        "courseId": "course_123",
        "category": "Programming"
      }
    }
  ]
}
```

### 2. Mark Notification as Read
Mark a specific notification as read.

```http
PUT /api/notifications/:id/read
```

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": {
    "id": "notif_xyz123",
    "isRead": true,
    "readAt": "2024-01-15T11:00:00.000Z"
  }
}
```

### 3. Mark All Notifications as Read
Mark all notifications for the user as read.

```http
PUT /api/notifications/read-all
```

**Response:**
```json
{
  "success": true,
  "message": "All notifications marked as read",
  "data": {
    "updatedCount": 12
  }
}
```

### 4. Delete Notification
Delete a specific notification.

```http
DELETE /api/notifications/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Notification deleted successfully"
}
```

### 5. Get Notification Count
Get unread notification count for badge display.

```http
GET /api/notifications/count
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 45,
    "unread": 12,
    "byType": {
      "info": 5,
      "new_content": 4,
      "subscription": 2,
      "achievement": 1
    }
  }
}
```

### 6. Get Notification Settings
Get user's notification preferences.

```http
GET /api/notifications/settings
```

**Response:**
```json
{
  "success": true,
  "data": {
    "pushNotifications": true,
    "emailNotifications": false,
    "types": {
      "new_content": true,
      "subscription": true,
      "achievement": true,
      "info": false,
      "warning": true,
      "error": true
    },
    "quietHours": {
      "enabled": true,
      "startTime": "22:00",
      "endTime": "08:00"
    }
  }
}
```

### 7. Update Notification Settings
Update user's notification preferences.

```http
PUT /api/notifications/settings
```

**Request Body:**
```json
{
  "pushNotifications": true,
  "emailNotifications": false,
  "types": {
    "new_content": true,
    "subscription": true,
    "achievement": true,
    "info": false
  },
  "quietHours": {
    "enabled": true,
    "startTime": "22:00",
    "endTime": "08:00"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notification settings updated successfully",
  "data": {
    "pushNotifications": true,
    "emailNotifications": false,
    "types": {
      "new_content": true,
      "subscription": true,
      "achievement": true,
      "info": false
    }
  }
}
```

### 8. Register FCM Token
Register Firebase Cloud Messaging token for push notifications.

```http
POST /api/notifications/fcm-token
```

**Request Body:**
```json
{
  "token": "fcm_token_xyz123",
  "platform": "android"
}
```

**Response:**
```json
{
  "success": true,
  "message": "FCM token registered successfully"
}
```

### 9. Remove FCM Token
Remove FCM token (on logout or app uninstall).

```http
DELETE /api/notifications/fcm-token
```

**Request Body:**
```json
{
  "token": "fcm_token_xyz123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "FCM token removed successfully"
}
```

---

## 📱 **NOTIFICATION TYPES**

### Available Types
- `info` - General information
- `success` - Success messages
- `warning` - Warning messages
- `error` - Error notifications
- `new_content` - New course/video available
- `subscription` - Subscription related
- `achievement` - User achievements
- `reminder` - Study reminders
- `system` - System announcements

### Priority Levels
- `low` - Non-urgent notifications
- `medium` - Standard notifications
- `high` - Important notifications

---

## 🔄 **REAL-TIME NOTIFICATIONS**

### WebSocket Connection
For real-time notifications, connect to WebSocket:

```
ws://localhost:8000/notifications
```

**Connection with Auth:**
```javascript
const socket = io('http://localhost:8000/notifications', {
  auth: {
    token: 'your_jwt_token'
  }
});
```

### WebSocket Events

#### Listen for New Notifications
```javascript
socket.on('new_notification', (notification) => {
  // Handle new notification
  console.log('New notification:', notification);
});
```

#### Listen for Notification Updates
```javascript
socket.on('notification_updated', (data) => {
  // Handle notification read/deleted
  console.log('Notification updated:', data);
});
```

---

## 📊 **DATA MODELS**

### Notification Model
```dart
class Notification {
  final String id;
  final String title;
  final String message;
  final String type;
  final String priority;
  final bool isRead;
  final DateTime createdAt;
  final DateTime? readAt;
  final Map<String, dynamic>? data;
  
  Notification({
    required this.id,
    required this.title,
    required this.message,
    required this.type,
    required this.priority,
    required this.isRead,
    required this.createdAt,
    this.readAt,
    this.data,
  });
  
  factory Notification.fromJson(Map<String, dynamic> json) {
    return Notification(
      id: json['id'],
      title: json['title'],
      message: json['message'],
      type: json['type'],
      priority: json['priority'],
      isRead: json['isRead'],
      createdAt: DateTime.parse(json['createdAt']),
      readAt: json['readAt'] != null ? DateTime.parse(json['readAt']) : null,
      data: json['data'],
    );
  }
  
  String get timeAgo {
    final now = DateTime.now();
    final difference = now.difference(createdAt);
    
    if (difference.inDays > 0) {
      return '${difference.inDays}d ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours}h ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes}m ago';
    } else {
      return 'Just now';
    }
  }
}
```

### Notification Settings Model
```dart
class NotificationSettings {
  final bool pushNotifications;
  final bool emailNotifications;
  final Map<String, bool> types;
  final QuietHours? quietHours;
  
  NotificationSettings({
    required this.pushNotifications,
    required this.emailNotifications,
    required this.types,
    this.quietHours,
  });
  
  factory NotificationSettings.fromJson(Map<String, dynamic> json) {
    return NotificationSettings(
      pushNotifications: json['pushNotifications'],
      emailNotifications: json['emailNotifications'],
      types: Map<String, bool>.from(json['types']),
      quietHours: json['quietHours'] != null 
        ? QuietHours.fromJson(json['quietHours']) 
        : null,
    );
  }
}

class QuietHours {
  final bool enabled;
  final String startTime;
  final String endTime;
  
  QuietHours({
    required this.enabled,
    required this.startTime,
    required this.endTime,
  });
  
  factory QuietHours.fromJson(Map<String, dynamic> json) {
    return QuietHours(
      enabled: json['enabled'],
      startTime: json['startTime'],
      endTime: json['endTime'],
    );
  }
}
```

---

## 🔧 **FLUTTER IMPLEMENTATION**

### 1. Notification Service
```dart
class NotificationService {
  static const String baseUrl = 'http://localhost:8000/api/notifications';
  
  Future<List<Notification>> getNotifications({
    int page = 1,
    int limit = 20,
    String? type,
    bool? isRead,
  }) async {
    final queryParams = <String, String>{
      'page': page.toString(),
      'limit': limit.toString(),
    };
    
    if (type != null) queryParams['type'] = type;
    if (isRead != null) queryParams['isRead'] = isRead.toString();
    
    final uri = Uri.parse(baseUrl).replace(queryParameters: queryParams);
    final response = await http.get(
      uri,
      headers: {'Authorization': 'Bearer $token'},
    );
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return (data['data'] as List)
          .map((json) => Notification.fromJson(json))
          .toList();
    }
    throw Exception('Failed to load notifications');
  }
  
  Future<void> markAsRead(String notificationId) async {
    final response = await http.put(
      Uri.parse('$baseUrl/$notificationId/read'),
      headers: {'Authorization': 'Bearer $token'},
    );
    
    if (response.statusCode != 200) {
      throw Exception('Failed to mark notification as read');
    }
  }
  
  Future<int> getUnreadCount() async {
    final response = await http.get(
      Uri.parse('$baseUrl/count'),
      headers: {'Authorization': 'Bearer $token'},
    );
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['data']['unread'];
    }
    return 0;
  }
}
```

### 2. FCM Integration
```dart
class FCMService {
  static Future<void> initialize() async {
    FirebaseMessaging messaging = FirebaseMessaging.instance;
    
    // Request permission
    NotificationSettings settings = await messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );
    
    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      // Get FCM token
      String? token = await messaging.getToken();
      if (token != null) {
        await _registerToken(token);
      }
      
      // Listen for token refresh
      messaging.onTokenRefresh.listen(_registerToken);
      
      // Handle foreground messages
      FirebaseMessaging.onMessage.listen(_handleForegroundMessage);
      
      // Handle background messages
      FirebaseMessaging.onBackgroundMessage(_handleBackgroundMessage);
    }
  }
  
  static Future<void> _registerToken(String token) async {
    await http.post(
      Uri.parse('http://localhost:8000/api/notifications/fcm-token'),
      headers: {
        'Authorization': 'Bearer $userToken',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'token': token,
        'platform': Platform.isAndroid ? 'android' : 'ios',
      }),
    );
  }
  
  static void _handleForegroundMessage(RemoteMessage message) {
    // Show in-app notification
    Get.snackbar(
      message.notification?.title ?? 'Notification',
      message.notification?.body ?? '',
      snackPosition: SnackPosition.TOP,
    );
  }
  
  static Future<void> _handleBackgroundMessage(RemoteMessage message) async {
    // Handle background notification
    print('Background message: ${message.messageId}');
  }
}
```

---

## ⚠️ **ERROR HANDLING**

### Common Error Responses
```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE"
}
```

### Error Codes
| Code | Description | Action |
|------|-------------|---------|
| `NOTIFICATION_NOT_FOUND` | Notification doesn't exist | Refresh list |
| `INVALID_FCM_TOKEN` | Invalid FCM token | Re-register token |
| `PERMISSION_DENIED` | No permission for notifications | Request permission |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Implement retry logic |

---

## 🔒 **SECURITY & PRIVACY**

1. **Token Security** - FCM tokens are encrypted and stored securely
2. **User Privacy** - Users can opt-out of any notification type
3. **Data Minimization** - Only necessary data is included in notifications
4. **Quiet Hours** - Respect user's quiet hours settings
5. **Permission Based** - All notifications require user consent

---

---

## 🎯 **NOTIFICATION UI COMPONENTS**

### 1. Notification List Widget
```dart
class NotificationListWidget extends StatefulWidget {
  @override
  _NotificationListWidgetState createState() => _NotificationListWidgetState();
}

class _NotificationListWidgetState extends State<NotificationListWidget> {
  final ScrollController _scrollController = ScrollController();
  final NotificationService _notificationService = NotificationService();
  List<Notification> notifications = [];
  bool isLoading = false;
  int currentPage = 1;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
    _scrollController.addListener(_onScroll);
  }

  Future<void> _loadNotifications() async {
    if (isLoading) return;

    setState(() => isLoading = true);

    try {
      final newNotifications = await _notificationService.getNotifications(
        page: currentPage,
        limit: 20,
      );

      setState(() {
        if (currentPage == 1) {
          notifications = newNotifications;
        } else {
          notifications.addAll(newNotifications);
        }
        currentPage++;
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to load notifications')),
      );
    } finally {
      setState(() => isLoading = false);
    }
  }

  void _onScroll() {
    if (_scrollController.position.pixels ==
        _scrollController.position.maxScrollExtent) {
      _loadNotifications();
    }
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: () async {
        currentPage = 1;
        await _loadNotifications();
      },
      child: ListView.builder(
        controller: _scrollController,
        itemCount: notifications.length + (isLoading ? 1 : 0),
        itemBuilder: (context, index) {
          if (index == notifications.length) {
            return Center(child: CircularProgressIndicator());
          }

          return NotificationTile(
            notification: notifications[index],
            onTap: () => _handleNotificationTap(notifications[index]),
            onMarkAsRead: () => _markAsRead(notifications[index]),
          );
        },
      ),
    );
  }
}
```

### 2. Notification Tile Widget
```dart
class NotificationTile extends StatelessWidget {
  final Notification notification;
  final VoidCallback onTap;
  final VoidCallback onMarkAsRead;

  const NotificationTile({
    Key? key,
    required this.notification,
    required this.onTap,
    required this.onMarkAsRead,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: ListTile(
        leading: _buildIcon(),
        title: Text(
          notification.title,
          style: TextStyle(
            fontWeight: notification.isRead ? FontWeight.normal : FontWeight.bold,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(notification.message),
            SizedBox(height: 4),
            Text(
              notification.timeAgo,
              style: TextStyle(fontSize: 12, color: Colors.grey),
            ),
          ],
        ),
        trailing: notification.isRead
          ? null
          : IconButton(
              icon: Icon(Icons.mark_email_read),
              onPressed: onMarkAsRead,
            ),
        onTap: onTap,
      ),
    );
  }

  Widget _buildIcon() {
    IconData iconData;
    Color color;

    switch (notification.type) {
      case 'new_content':
        iconData = Icons.video_library;
        color = Colors.blue;
        break;
      case 'achievement':
        iconData = Icons.emoji_events;
        color = Colors.amber;
        break;
      case 'subscription':
        iconData = Icons.payment;
        color = Colors.green;
        break;
      case 'warning':
        iconData = Icons.warning;
        color = Colors.orange;
        break;
      case 'error':
        iconData = Icons.error;
        color = Colors.red;
        break;
      default:
        iconData = Icons.info;
        color = Colors.blue;
    }

    return CircleAvatar(
      backgroundColor: color.withOpacity(0.1),
      child: Icon(iconData, color: color),
    );
  }
}
```

### 3. Notification Badge Widget
```dart
class NotificationBadge extends StatefulWidget {
  final Widget child;

  const NotificationBadge({Key? key, required this.child}) : super(key: key);

  @override
  _NotificationBadgeState createState() => _NotificationBadgeState();
}

class _NotificationBadgeState extends State<NotificationBadge> {
  int unreadCount = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _updateUnreadCount();
    _timer = Timer.periodic(Duration(minutes: 1), (_) => _updateUnreadCount());
  }

  Future<void> _updateUnreadCount() async {
    try {
      final count = await NotificationService().getUnreadCount();
      if (mounted) {
        setState(() => unreadCount = count);
      }
    } catch (e) {
      // Handle error silently
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        widget.child,
        if (unreadCount > 0)
          Positioned(
            right: 0,
            top: 0,
            child: Container(
              padding: EdgeInsets.all(2),
              decoration: BoxDecoration(
                color: Colors.red,
                borderRadius: BorderRadius.circular(10),
              ),
              constraints: BoxConstraints(
                minWidth: 16,
                minHeight: 16,
              ),
              child: Text(
                unreadCount > 99 ? '99+' : unreadCount.toString(),
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ),
      ],
    );
  }
}
```

---

## 🔄 **STATE MANAGEMENT**

### Notification Provider
```dart
class NotificationProvider extends ChangeNotifier {
  List<Notification> _notifications = [];
  int _unreadCount = 0;
  bool _isLoading = false;

  List<Notification> get notifications => _notifications;
  int get unreadCount => _unreadCount;
  bool get isLoading => _isLoading;

  Future<void> loadNotifications() async {
    _isLoading = true;
    notifyListeners();

    try {
      _notifications = await NotificationService().getNotifications();
      _unreadCount = _notifications.where((n) => !n.isRead).length;
    } catch (e) {
      // Handle error
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> markAsRead(String notificationId) async {
    try {
      await NotificationService().markAsRead(notificationId);

      final index = _notifications.indexWhere((n) => n.id == notificationId);
      if (index != -1) {
        _notifications[index] = _notifications[index].copyWith(
          isRead: true,
          readAt: DateTime.now(),
        );
        _unreadCount = _notifications.where((n) => !n.isRead).length;
        notifyListeners();
      }
    } catch (e) {
      // Handle error
    }
  }

  void addNotification(Notification notification) {
    _notifications.insert(0, notification);
    if (!notification.isRead) {
      _unreadCount++;
    }
    notifyListeners();
  }
}
```

---

## 🎨 **NOTIFICATION SETTINGS UI**

### Settings Page
```dart
class NotificationSettingsPage extends StatefulWidget {
  @override
  _NotificationSettingsPageState createState() => _NotificationSettingsPageState();
}

class _NotificationSettingsPageState extends State<NotificationSettingsPage> {
  NotificationSettings? settings;
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    try {
      settings = await NotificationService().getSettings();
    } catch (e) {
      // Handle error
    } finally {
      setState(() => isLoading = false);
    }
  }

  Future<void> _updateSettings() async {
    try {
      await NotificationService().updateSettings(settings!);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Settings updated successfully')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to update settings')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return Scaffold(
        appBar: AppBar(title: Text('Notification Settings')),
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text('Notification Settings'),
        actions: [
          TextButton(
            onPressed: _updateSettings,
            child: Text('Save', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
      body: ListView(
        children: [
          SwitchListTile(
            title: Text('Push Notifications'),
            subtitle: Text('Receive notifications on your device'),
            value: settings!.pushNotifications,
            onChanged: (value) {
              setState(() {
                settings = settings!.copyWith(pushNotifications: value);
              });
            },
          ),
          Divider(),
          Text('Notification Types', style: Theme.of(context).textTheme.headline6),
          ...settings!.types.entries.map((entry) => SwitchListTile(
            title: Text(_getTypeDisplayName(entry.key)),
            value: entry.value,
            onChanged: (value) {
              setState(() {
                final newTypes = Map<String, bool>.from(settings!.types);
                newTypes[entry.key] = value;
                settings = settings!.copyWith(types: newTypes);
              });
            },
          )),
        ],
      ),
    );
  }

  String _getTypeDisplayName(String type) {
    switch (type) {
      case 'new_content': return 'New Content';
      case 'subscription': return 'Subscription Updates';
      case 'achievement': return 'Achievements';
      default: return type.toUpperCase();
    }
  }
}
```

---

## 🚀 **ADVANCED FEATURES**

### 1. Local Notifications
```dart
class LocalNotificationService {
  static final FlutterLocalNotificationsPlugin _notifications =
      FlutterLocalNotificationsPlugin();

  static Future<void> initialize() async {
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = IOSInitializationSettings();
    const settings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _notifications.initialize(settings);
  }

  static Future<void> showNotification({
    required int id,
    required String title,
    required String body,
    String? payload,
  }) async {
    const androidDetails = AndroidNotificationDetails(
      'default_channel',
      'Default Channel',
      importance: Importance.high,
      priority: Priority.high,
    );

    const iosDetails = IOSNotificationDetails();
    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _notifications.show(id, title, body, details, payload: payload);
  }
}
```

### 2. Notification Deep Linking
```dart
class NotificationHandler {
  static void handleNotificationTap(Notification notification) {
    if (notification.data != null) {
      final data = notification.data!;

      switch (notification.type) {
        case 'new_content':
          if (data.containsKey('courseId')) {
            Get.toNamed('/course/${data['courseId']}');
          }
          break;
        case 'achievement':
          Get.toNamed('/achievements');
          break;
        case 'subscription':
          Get.toNamed('/subscription');
          break;
        default:
          Get.toNamed('/notifications');
      }
    }
  }
}
```

---

## 📞 **SUPPORT**

For integration support, contact:
- **Backend Team**: backend@yourcompany.com
- **FCM Documentation**: [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- **Flutter FCM Plugin**: [firebase_messaging](https://pub.dev/packages/firebase_messaging)
- **Local Notifications**: [flutter_local_notifications](https://pub.dev/packages/flutter_local_notifications)

---

## 📝 **CHANGELOG**

### v1.2.0 (Latest)
- Added notification settings management
- Implemented quiet hours feature
- Added WebSocket real-time notifications

### v1.1.0
- Added FCM token management
- Implemented notification filtering
- Added unread count endpoint

### v1.0.0
- Initial notification system
- Basic CRUD operations
- Push notification support
