# Seekho Admin Dashboard - Deployment Guide

## Overview
This guide covers deploying the Seekho Admin Dashboard to Vercel with proper environment configuration.

## Prerequisites
- Node.js 18+ installed locally
- Vercel account
- Access to the Seekho backend API at `https://learner.netaapp.in`

## Environment Configuration

### Environment Files Structure
```
admin-dashboard/
├── .env                    # Default production values
├── .env.local             # Local development overrides (gitignored)
├── .env.development       # Development environment
├── .env.production        # Production environment
└── .env.example           # Template for environment variables
```

### Environment Variables
- `REACT_APP_API_URL`: Backend API base URL
- `GENERATE_SOURCEMAP`: Whether to generate source maps (false for production)
- `PORT`: Development server port (3001)

## Local Development Setup

1. **Clone and Install Dependencies**
   ```bash
   cd admin-dashboard
   npm install
   ```

2. **Configure Environment**
   ```bash
   # Copy example environment file
   cp .env.example .env.local
   
   # Edit .env.local for local development
   # Uncomment and set REACT_APP_API_URL=http://localhost:8000 if running backend locally
   ```

3. **Start Development Server**
   ```bash
   npm start
   ```
   The app will run on http://localhost:3001

## Production Build

1. **Build for Production**
   ```bash
   npm run build
   ```

2. **Test Production Build Locally**
   ```bash
   npm install -g serve
   serve -s build
   ```

## Vercel Deployment

### Method 1: Vercel CLI (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   # From admin-dashboard directory
   vercel
   
   # Follow prompts:
   # - Set up and deploy? Yes
   # - Which scope? Select your account/team
   # - Link to existing project? No (for first deployment)
   # - Project name: seekho-admin-dashboard
   # - Directory: ./
   ```

4. **Set Environment Variables**
   ```bash
   vercel env add REACT_APP_API_URL
   # Enter: https://learner.netaapp.in
   
   vercel env add GENERATE_SOURCEMAP
   # Enter: false
   ```

5. **Redeploy with Environment Variables**
   ```bash
   vercel --prod
   ```

### Method 2: GitHub Integration

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Prepare admin dashboard for deployment"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to https://vercel.com/dashboard
   - Click "New Project"
   - Import your GitHub repository
   - Select the `admin-dashboard` folder as root directory

3. **Configure Build Settings**
   - Framework Preset: Create React App
   - Root Directory: admin-dashboard
   - Build Command: `npm run build`
   - Output Directory: build

4. **Set Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add:
     - `REACT_APP_API_URL` = `https://learner.netaapp.in`
     - `GENERATE_SOURCEMAP` = `false`

5. **Deploy**
   - Click "Deploy"
   - Vercel will automatically build and deploy

## Post-Deployment Verification

1. **Check API Connection**
   - Visit your deployed URL
   - Try logging in with admin credentials
   - Verify that API calls are going to `https://learner.netaapp.in`

2. **Test Multi-Tenant Functionality**
   - Switch between Seekho and Bolo apps
   - Verify data isolation works correctly

3. **Performance Check**
   - Check Lighthouse scores
   - Verify all assets load correctly
   - Test on different devices/browsers

## Troubleshooting

### Common Issues

1. **API URL Not Working**
   - Check browser network tab for actual API calls
   - Verify environment variables are set correctly
   - Ensure CORS is configured on backend

2. **Build Failures**
   - Check for TypeScript/ESLint errors
   - Verify all dependencies are installed
   - Check Node.js version compatibility

3. **Environment Variables Not Loading**
   - Ensure variables start with `REACT_APP_`
   - Redeploy after adding environment variables
   - Check Vercel dashboard for variable values

### Debug Commands
```bash
# Check environment variables in build
npm run build && grep -r "learner.netaapp.in" build/

# Test API connectivity
curl -X POST https://learner.netaapp.in/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'
```

## Maintenance

### Regular Updates
1. Keep dependencies updated
2. Monitor Vercel build logs
3. Check API endpoint health
4. Review and rotate admin credentials

### Monitoring
- Set up Vercel Analytics
- Monitor API response times
- Track user engagement metrics
- Set up error tracking (Sentry, etc.)

## Security Considerations
- All sensitive data is handled by backend API
- Frontend only stores JWT tokens in localStorage
- HTTPS enforced by Vercel
- Environment variables are build-time only
- No sensitive keys exposed to client

## Support
For deployment issues, check:
1. Vercel deployment logs
2. Browser console for errors
3. Network tab for API call failures
4. Backend API logs for authentication issues
