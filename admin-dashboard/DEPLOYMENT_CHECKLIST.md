# Deployment Checklist for Seekho Admin Dashboard

## Pre-Deployment ✅

- [x] **Environment Configuration Fixed**
  - [x] Updated `.env` to use production API URL
  - [x] Created `.env.production` with correct settings
  - [x] Updated `.env.local` to not override production URL
  - [x] Created `.env.example` for reference

- [x] **Vercel Configuration**
  - [x] Created `vercel.json` with proper build settings
  - [x] Configured routes for SPA routing
  - [x] Set up environment variables in config
  - [x] Added security headers

- [x] **Build Verification**
  - [x] Production build completes successfully
  - [x] API URL correctly embedded in build files
  - [x] No critical build warnings
  - [x] Bundle size optimized

## Deployment Steps

### Option 1: Vercel CLI Deployment
```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy from admin-dashboard directory
cd admin-dashboard
vercel

# 4. Set environment variables
vercel env add REACT_APP_API_URL
# Enter: https://learner.netaapp.in

vercel env add GENERATE_SOURCEMAP
# Enter: false

# 5. Deploy to production
vercel --prod
```

### Option 2: GitHub Integration
1. Push code to GitHub repository
2. Connect repository to Vercel
3. Set root directory to `admin-dashboard`
4. Configure environment variables in Vercel dashboard
5. Deploy

## Post-Deployment Verification

### Functional Testing
- [ ] **Login Functionality**
  - [ ] Admin login works with correct credentials
  - [ ] Invalid credentials show proper error
  - [ ] JWT token stored correctly
  - [ ] Auto-redirect to dashboard after login

- [ ] **API Integration**
  - [ ] All API calls go to `https://learner.netaapp.in`
  - [ ] Authentication headers included in requests
  - [ ] Error handling works for API failures
  - [ ] Loading states display correctly

- [ ] **Multi-Tenant Features**
  - [ ] App selector shows both Seekho and Bolo
  - [ ] Switching apps updates package ID header
  - [ ] Data isolation works between apps
  - [ ] App-specific branding displays correctly

- [ ] **Core Features**
  - [ ] Dashboard loads with statistics
  - [ ] User management functions work
  - [ ] Category and topic management operational
  - [ ] Video management features functional
  - [ ] Analytics pages display data
  - [ ] Subscription management works

### Technical Verification
- [ ] **Performance**
  - [ ] Page load times under 3 seconds
  - [ ] Lighthouse score above 90
  - [ ] No console errors
  - [ ] Responsive design works on mobile

- [ ] **Security**
  - [ ] HTTPS enforced
  - [ ] No sensitive data in client-side code
  - [ ] Proper CORS handling
  - [ ] Security headers present

## Environment Variables Checklist

### Required Variables
- [ ] `REACT_APP_API_URL` = `https://learner.netaapp.in`
- [ ] `GENERATE_SOURCEMAP` = `false`

### Verification Commands
```bash
# Check if API URL is correctly embedded
grep -r "learner.netaapp.in" build/

# Test API connectivity
curl -X POST https://learner.netaapp.in/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -H "X-Package-ID: com.gumbo.learning" \
  -d '{"username":"your-admin-username","password":"your-admin-password"}'
```

## Rollback Plan

If deployment fails:
1. **Immediate Rollback**
   ```bash
   # Revert to previous Vercel deployment
   vercel rollback
   ```

2. **Fix and Redeploy**
   - Identify and fix the issue
   - Test locally with production build
   - Redeploy with fixes

## Monitoring Setup

After successful deployment:
- [ ] Set up Vercel Analytics
- [ ] Configure error tracking
- [ ] Set up uptime monitoring
- [ ] Create admin user accounts
- [ ] Document admin credentials securely

## Success Criteria

Deployment is successful when:
- [ ] Admin dashboard loads without errors
- [ ] Login works with backend API
- [ ] All major features functional
- [ ] Multi-tenant switching works
- [ ] Performance meets requirements
- [ ] Security headers present
- [ ] Mobile responsive design works

## Next Steps

After successful deployment:
1. **User Training**
   - Create admin user accounts
   - Provide training on dashboard features
   - Document common workflows

2. **Maintenance**
   - Set up regular dependency updates
   - Monitor performance metrics
   - Plan feature enhancements

3. **Documentation**
   - Update user manuals
   - Document API changes
   - Maintain deployment procedures

## Emergency Contacts

- **Backend API Issues**: Check backend server status
- **Vercel Issues**: Check Vercel status page
- **DNS Issues**: Check domain configuration
- **Authentication Issues**: Verify admin credentials

---

**Deployment Date**: ___________
**Deployed By**: ___________
**Vercel URL**: ___________
**Status**: ___________
