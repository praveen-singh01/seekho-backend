# 🚀 Multi-Tenant Production Deployment Checklist

## ✅ PRE-DEPLOYMENT CHECKLIST

### 1. **Environment Setup**
- [ ] Update environment variables in production
- [ ] Add new package configuration variables
- [ ] Verify Google OAuth credentials for both apps
- [ ] Test database connection

### 2. **Database Preparation**
- [ ] **CRITICAL**: Backup production database
- [ ] Test migration script on staging environment
- [ ] Verify all existing data has packageId field after migration
- [ ] Check database indexes are created properly

### 3. **Code Review**
- [ ] All controllers updated with package ID filtering
- [ ] All model static methods accept package ID
- [ ] File upload segregation implemented
- [ ] Authentication system validates package ID
- [ ] Error handling for package ID mismatches

### 4. **Testing**
- [ ] Run multi-tenant test script
- [ ] Test both Seekho and Bolo app functionality
- [ ] Verify data isolation between apps
- [ ] Test backward compatibility
- [ ] Validate file upload segregation

## 🔧 DEPLOYMENT STEPS

### Step 1: Environment Variables
Add these to your production environment:

```env
# Multi-Tenant Configuration
SUPPORTED_PACKAGES=com.gumbo.learning,com.gumbo.english
DEFAULT_PACKAGE_ID=com.gumbo.learning

# Bolo App Configuration
BOLO_ANDROID_CLIENT_ID=your-bolo-google-client-id.apps.googleusercontent.com
BOLO_PACKAGE_NAME=com.gumbo.english
```

### Step 2: Database Migration
```bash
# 1. Backup database
mongodump --uri="your-production-mongodb-uri" --out=backup-$(date +%Y%m%d)

# 2. Run migration script
node scripts/migrate-package-id.js

# 3. Verify migration
# Check that all records have packageId field set to 'com.gumbo.learning'
```

### Step 3: Deploy Code
```bash
# 1. Deploy new code to production
# 2. Restart application servers
# 3. Verify application starts successfully
```

### Step 4: Verification
```bash
# 1. Run test script
node scripts/test-multi-tenant.js

# 2. Test API endpoints manually
curl -H "X-Package-ID: com.gumbo.learning" https://your-api.com/api/categories
curl -H "X-Package-ID: com.gumbo.english" https://your-api.com/api/categories
```

## 📱 ANDROID APP CONFIGURATION

### Seekho App (Existing)
- Package ID: `com.gumbo.learning`
- No changes required
- Continues working as before

### Bolo App (New)
- Package ID: `com.gumbo.english`
- Must send `X-Package-ID: com.gumbo.english` header
- Requires new Google OAuth client ID

## 🔍 POST-DEPLOYMENT MONITORING

### Immediate Checks (First 24 hours)
- [ ] Monitor error logs for package ID validation errors
- [ ] Check that existing Seekho users can still access their data
- [ ] Verify new Bolo registrations work correctly
- [ ] Monitor database performance with new indexes
- [ ] Check file upload segregation is working

### Performance Monitoring
- [ ] Database query performance with new compound indexes
- [ ] API response times for both packages
- [ ] Memory usage and server performance
- [ ] File storage organization in S3

### Data Integrity Checks
- [ ] No cross-tenant data access
- [ ] All new records have correct packageId
- [ ] User authentication works for both apps
- [ ] Subscription system works for both apps

## 🚨 ROLLBACK PLAN

If issues are detected:

### Immediate Rollback
1. **Revert code deployment** to previous version
2. **Restore database** from backup if data corruption detected
3. **Update DNS/load balancer** to route to previous version

### Partial Rollback
1. **Disable Bolo app** by removing package ID from SUPPORTED_PACKAGES
2. **Keep Seekho app** running normally
3. **Investigate and fix** issues before re-enabling Bolo

## 📊 SUCCESS METRICS

### Technical Metrics
- [ ] 0% cross-tenant data access
- [ ] 100% backward compatibility for Seekho app
- [ ] <100ms additional latency for package ID validation
- [ ] All database queries include packageId filter

### Business Metrics
- [ ] Seekho app users unaffected
- [ ] Bolo app registrations working
- [ ] Payment system working for both apps
- [ ] File uploads segregated correctly

## 🔧 TROUBLESHOOTING

### Common Issues

**Package ID Validation Errors**
- Check X-Package-ID header is being sent
- Verify package ID is in SUPPORTED_PACKAGES list
- Check middleware order in server.js

**Cross-Tenant Data Access**
- Verify all database queries include packageId filter
- Check model static methods accept packageId parameter
- Review controller implementations

**Authentication Issues**
- Verify user lookup includes package ID validation
- Check JWT token generation and validation
- Ensure Google OAuth configured for both apps

**File Upload Issues**
- Check S3 bucket permissions
- Verify file path generation includes package ID
- Test upload endpoints with both package IDs

## 📞 SUPPORT CONTACTS

- **Backend Team**: [Your team contact]
- **DevOps Team**: [DevOps contact]
- **Database Admin**: [DBA contact]
- **Mobile Team**: [Mobile team contact]

## 📝 DEPLOYMENT LOG

```
Date: ___________
Deployed by: ___________
Version: ___________
Migration completed: ___________
Tests passed: ___________
Issues found: ___________
Resolution: ___________
```

---

## ⚠️ CRITICAL REMINDERS

1. **ALWAYS backup database before migration**
2. **Test on staging environment first**
3. **Monitor logs closely after deployment**
4. **Have rollback plan ready**
5. **Coordinate with mobile team for Bolo app release**

## 🎯 NEXT STEPS AFTER DEPLOYMENT

1. **Monitor system for 48 hours**
2. **Coordinate Bolo app release with mobile team**
3. **Update API documentation**
4. **Train support team on multi-tenant architecture**
5. **Plan for additional apps if needed**
