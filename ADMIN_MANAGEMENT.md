# 👨‍💼 Admin Management System

Complete guide for managing admin users in the Seekho backend system.

## 🔐 Admin Authentication System

### Hardcoded Super Admin
The system includes a hardcoded super admin account that cannot be deleted:

```
Username: superadmin
Password: SuperAdmin@123
Email: superadmin@seekho.com
Role: admin
```

**Important**: This super admin is created automatically on first login and has full system access.

## 🚀 Admin Authentication Endpoints

### 1. Admin Login
```http
POST /api/auth/admin/login
Content-Type: application/json

{
  "username": "superadmin",
  "password": "SuperAdmin@123"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Super Administrator",
      "email": "superadmin@seekho.com",
      "role": "admin",
      "provider": "local",
      "isVerified": true,
      "lastLogin": "2024-01-15T10:30:00.000Z",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### 2. Create New Admin
```http
POST /api/auth/admin/create
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
Content-Type: application/json

{
  "name": "John Admin",
  "email": "john.admin@seekho.com",
  "password": "AdminPass@123",
  "username": "johnadmin"
}
```

**Password Requirements**:
- Minimum 6 characters
- At least one uppercase letter
- At least one lowercase letter  
- At least one number

### 3. List All Admins
```http
GET /api/auth/admin/list?page=1&limit=10
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
```

### 4. Remove Admin
```http
DELETE /api/auth/admin/remove/USER_ID
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
```

**Restrictions**:
- Cannot remove super admin
- Cannot remove yourself
- Only removes admin users (soft delete)

### 5. Change Password
```http
PUT /api/auth/admin/change-password
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
Content-Type: application/json

{
  "currentPassword": "OldPassword@123",
  "newPassword": "NewPassword@123"
}
```

## 🧪 Testing Admin System

### 1. Using cURL

**Login as Super Admin**:
```bash
curl -X POST http://localhost:8000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "superadmin",
    "password": "SuperAdmin@123"
  }'
```

**Create New Admin**:
```bash
# First, get the token from login response
TOKEN="your_jwt_token_here"

curl -X POST http://localhost:8000/api/auth/admin/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Test Admin",
    "email": "test.admin@seekho.com",
    "password": "TestAdmin@123",
    "username": "testadmin"
  }'
```

**List Admins**:
```bash
curl -X GET http://localhost:8000/api/auth/admin/list \
  -H "Authorization: Bearer $TOKEN"
```

### 2. Using Swagger UI

1. Open `http://localhost:8000/api-docs`
2. Navigate to "Admin Authentication" section
3. Use the "Try it out" feature for each endpoint
4. For protected endpoints, click "Authorize" and enter: `Bearer YOUR_JWT_TOKEN`

## 🔒 Security Features

### 1. Password Security
- Passwords are hashed using bcrypt with salt rounds of 12
- Strong password requirements enforced
- Current password verification for changes

### 2. Access Control
- JWT token-based authentication
- Role-based authorization (admin only)
- Super admin protection (cannot be deleted)
- Self-protection (cannot delete own account)

### 3. Audit Trail
- Last login tracking
- Soft delete for admin removal
- Creation timestamps

## 📱 Frontend Integration

### 1. Admin Login Flow
```javascript
// Admin login function
const adminLogin = async (username, password) => {
  try {
    const response = await fetch('/api/auth/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Store JWT token
      localStorage.setItem('adminToken', data.data.token);
      
      // Store user data
      localStorage.setItem('adminUser', JSON.stringify(data.data.user));
      
      return { success: true, user: data.data.user };
    } else {
      return { success: false, message: data.message };
    }
  } catch (error) {
    return { success: false, message: 'Network error' };
  }
};
```

### 2. Admin Management Component
```javascript
// React component example
const AdminManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/auth/admin/list', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setAdmins(data.data);
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const createAdmin = async (adminData) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/auth/admin/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(adminData)
      });
      
      const data = await response.json();
      if (data.success) {
        fetchAdmins(); // Refresh list
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  };
  
  // Component JSX...
};
```

## 🛡️ Best Practices

### 1. Password Management
- Use strong passwords for all admin accounts
- Change default super admin password in production
- Implement password rotation policies
- Consider 2FA for additional security

### 2. Access Control
- Regularly audit admin accounts
- Remove unused admin accounts
- Use principle of least privilege
- Monitor admin activities

### 3. Production Security
- Change super admin credentials
- Use environment variables for sensitive data
- Enable HTTPS in production
- Implement rate limiting for login attempts
- Set up monitoring and alerting

## 🔧 Configuration

### Environment Variables
```env
# Admin Configuration
ADMIN_EMAIL=superadmin@seekho.com
ADMIN_PASSWORD=SuperAdmin@123

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
```

### Database Indexes
The system automatically creates indexes for:
- Email (unique)
- Role
- Active status
- Creation date

## 📊 Admin Dashboard Integration

The admin authentication system integrates seamlessly with the existing admin dashboard:

1. **Login** → Get JWT token
2. **Access Dashboard** → Use token for all admin API calls
3. **Manage Content** → Create categories, topics, videos
4. **Manage Users** → View and manage regular users
5. **Manage Admins** → Create and remove other admin accounts

## 🚨 Troubleshooting

### Common Issues

**1. Login Failed**
- Check username/password
- Verify super admin credentials
- Check if user is active

**2. Cannot Create Admin**
- Verify JWT token is valid
- Check if email/username already exists
- Validate password requirements

**3. Cannot Remove Admin**
- Cannot remove super admin
- Cannot remove yourself
- User must be admin role

### Debug Commands
```bash
# Check if super admin exists
curl -X POST http://localhost:8000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username": "superadmin", "password": "SuperAdmin@123"}'

# Test token validity
curl -X GET http://localhost:8000/api/auth/admin/list \
  -H "Authorization: Bearer YOUR_TOKEN"
```

The admin management system is now fully functional and ready for production use! 🎉
