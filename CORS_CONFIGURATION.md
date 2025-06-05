# 🌐 CORS Configuration Guide

This document explains the CORS (Cross-Origin Resource Sharing) configuration for the Seekho Backend API, ensuring seamless integration with web platforms.

## 📋 Overview

The API is configured with comprehensive CORS support to allow web applications from different origins to access the backend services securely.

## ✅ Supported Origins

### Development Origins (Automatically Allowed)
- `http://localhost:3000` (default frontend)
- `http://localhost:3001`
- `http://localhost:8080`
- `http://localhost:8081`
- `http://127.0.0.1:3000`
- `http://127.0.0.1:8080`
- Any `localhost` or `127.0.0.1` with any port (development mode only)

### Environment-Based Origins
- `CLIENT_URL` environment variable
- `FRONTEND_URL` environment variable
- `WEB_URL` environment variable
- `CORS_ORIGINS` environment variable (comma-separated list)

### Production Origins
Configure production domains in your `.env` file:
```bash
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,https://admin.yourdomain.com
```

## 🔧 Configuration Details

### Allowed Methods
- `GET`
- `POST`
- `PUT`
- `DELETE`
- `PATCH`
- `OPTIONS`

### Allowed Headers
- `Origin`
- `X-Requested-With`
- `Content-Type`
- `Accept`
- `Authorization`
- `Cache-Control`
- `X-Access-Token`
- `X-Key`
- `X-Auth-Token`

### Exposed Headers
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

### Additional Settings
- **Credentials**: `true` (allows cookies and authorization headers)
- **Max Age**: `86400` seconds (24 hours cache for preflight requests)
- **Options Success Status**: `200` (for legacy browser compatibility)

## 🚀 Quick Setup

### 1. Development Setup
No additional configuration needed! All localhost origins are automatically allowed in development mode.

### 2. Production Setup
Add your production domains to `.env`:
```bash
# Production CORS Origins
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,https://admin.yourdomain.com

# Frontend URLs
CLIENT_URL=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com
WEB_URL=https://admin.yourdomain.com
```

## 🧪 Testing CORS

### Automated Testing
Run the CORS test script:
```bash
./test-cors.sh
```

### Browser Testing
Open the CORS test page:
```bash
open cors-test.html
```

### Manual Testing
Test preflight request:
```bash
curl -I -X OPTIONS \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  http://localhost:8000/api/auth/admin/login
```

Test actual request:
```bash
curl -H "Origin: http://localhost:3000" \
  http://localhost:8000/health
```

## 📱 Frontend Integration Examples

### JavaScript Fetch API
```javascript
// Basic API call
const response = await fetch('http://localhost:8000/api/categories', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Authenticated API call
const response = await fetch('http://localhost:8000/api/upload/avatar', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

### Axios Configuration
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### React Example
```jsx
import React, { useEffect, useState } from 'react';

function ApiTest() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/categories')
      .then(response => response.json())
      .then(data => setData(data))
      .catch(error => console.error('CORS Error:', error));
  }, []);

  return (
    <div>
      {data ? JSON.stringify(data) : 'Loading...'}
    </div>
  );
}
```

## 🔒 Security Considerations

### Development vs Production
- **Development**: Permissive CORS for localhost origins
- **Production**: Strict whitelist of allowed domains

### Best Practices
1. **Whitelist specific domains** instead of using wildcards
2. **Use HTTPS** for production origins
3. **Regularly review** allowed origins
4. **Monitor CORS logs** for blocked requests

## 🐛 Troubleshooting

### Common Issues

**1. CORS Error in Browser Console**
```
Access to fetch at 'http://localhost:8000/api/...' from origin 'http://localhost:3001' has been blocked by CORS policy
```
**Solution**: Add your origin to the allowed list or use a supported localhost port.

**2. Preflight Request Failing**
**Solution**: Ensure your origin is in the whitelist and the server is running.

**3. Credentials Not Included**
**Solution**: Set `withCredentials: true` in your fetch/axios configuration.

### Debug Commands
Check CORS headers:
```bash
curl -I -H "Origin: http://localhost:3000" http://localhost:8000/health
```

Check server logs for blocked origins:
```bash
# Look for: "🚫 CORS blocked origin: ..."
npm start
```

## 📊 Monitoring

### CORS Logs
The server logs blocked CORS requests:
```
🚫 CORS blocked origin: https://unauthorized-domain.com
```

### Rate Limiting
CORS requests are subject to rate limiting:
- **Limit**: 100 requests per 15 minutes per IP
- **Headers**: `X-RateLimit-*` headers in responses

## 🔄 Updates and Maintenance

### Adding New Origins
1. Update `.env` file with new domains
2. Restart the server
3. Test with the CORS test script

### Environment Variables
```bash
# Current CORS-related environment variables
CLIENT_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000
WEB_URL=http://localhost:3000
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

## 🎯 Summary

✅ **CORS is fully configured** for web platform integration
✅ **Development-friendly** with automatic localhost support
✅ **Production-ready** with environment-based configuration
✅ **Secure** with domain whitelisting
✅ **Tested** with comprehensive test suite

Your API is now ready for seamless integration with web platforms without CORS issues! 🚀
