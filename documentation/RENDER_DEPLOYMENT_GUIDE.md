# Render Deployment Guide for Mela Sharetribe Web Client

This guide walks through deploying the Mela Sharetribe web client to Render for full-stack production deployment.

## ✅ Why Render for Sharetribe

Render is ideal for your Sharetribe web client because it supports:
- **Full-stack deployment** - Both frontend and backend in one service
- **Node.js runtime** - Perfect for your Express server
- **Environment variables** - Secure handling of both public and private secrets
- **Automatic deployments** - GitHub integration with branch deployments
- **Server-side rendering** - Full SSR support for better SEO
- **Custom domains** - Professional URLs for your marketplace

## Prerequisites

### 1. Required Accounts & Tools
- [Render account](https://render.com) (free tier available)
- [GitHub account](https://github.com) (for code repository)
- Node.js 16+ installed locally
- Git installed locally

### 2. Sharetribe Requirements
- Active Sharetribe Console account
- Marketplace configured in Sharetribe Console
- API keys and configuration from Sharetribe

## Step 1: Prepare Your Repository

### 1.1 Initialize Git Repository (if not already done)
```bash
cd /Users/parinjogani/Documents/Mela/web-client
git init
git add .
git commit -m "feat: implement SEO optimization strategy for product pages"
```

### 1.2 Create GitHub Repository
1. Go to [GitHub.com](https://github.com) and create a new repository
2. Name it something like `mela-web-client` or `mela-marketplace`
3. Make it private for production security
4. Don't initialize with README (since you already have code)

### 1.3 Push Code to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/mela-web-client.git
git branch -M main
git push -u origin main
```

## Step 2: Understanding Environment Configuration

### 2.1 Environment File Structure
Your project has these environment files:
```
web-client/
├── .env-template          # Template with all possible variables
├── .env.development       # Development-specific overrides
├── .env                  # Local environment (gitignored)
└── .gitignore            # Excludes .env from version control
```

### 2.2 Environment File Analysis

#### .env-template (Documentation)
- **Purpose**: Documentation of all available environment variables
- **Key Variables**:
  - `REACT_APP_SHARETRIBE_SDK_CLIENT_ID=change-me` (public, required)
  - `SHARETRIBE_SDK_CLIENT_SECRET=` (private, server-side only)
  - `REACT_APP_MARKETPLACE_ROOT_URL=http://localhost:3000`
  - `REACT_APP_ENV=production`

#### .env.development (Committed to Git)
- **Purpose**: Development-specific overrides
- **Settings**: `REACT_APP_ENV=development`, debug mode enabled

### 2.3 Client ID vs Client Secret - Critical Understanding

#### REACT_APP_SHARETRIBE_SDK_CLIENT_ID
- ✅ **Public variable** - exposed to browser/frontend
- ✅ **Required for Render** - add to Render environment variables
- ✅ **Used by**: Frontend SDK for API calls
- ❌ **NOT secret** - visible in browser source code

#### SHARETRIBE_SDK_CLIENT_SECRET  
- ✅ **Private variable** - server-side only, safe on Render
- ✅ **REQUIRED for Render deployment** - add to Render environment variables
- ✅ **Used by**: Server-side privileged transitions, social auth, SSR
- ✅ **Keep secret** - Render handles this securely
- ✅ **Full functionality** - All server-side features work with this included

### 2.4 Create Your Local .env File
Create `/web-client/.env` (this will be gitignored):

```env
# Mandatory - get from Sharetribe Console -> Build -> Applications
REACT_APP_SHARETRIBE_SDK_CLIENT_ID=your-actual-client-id-here

# Optional - only if using Stripe
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key

# Optional - only if using Mapbox
REACT_APP_MAPBOX_ACCESS_TOKEN=your-mapbox-token

# Will be updated for Render deployment URL
REACT_APP_MARKETPLACE_ROOT_URL=http://localhost:3000

# Mandatory - your marketplace name
REACT_APP_MARKETPLACE_NAME=mela-marketplace

# Required for full-stack deployment on Render
SHARETRIBE_SDK_CLIENT_SECRET=your-actual-client-secret-here
```

## Step 3: Configure Build Settings

### 3.1 Check Package.json Scripts
Your package.json has these build scripts:

```json
{
  "scripts": {
    "build": "yarn build-web&&yarn build-server",     // Full-stack build
    "build-web": "sharetribe-scripts build",          // Frontend only
    "build-server": "sharetribe-scripts build-server" // Backend only
  }
}
```

**For Render**: Use the full `build` command (full-stack build).

### 3.2 Render Configuration (Optional)
Create `render.yaml` in web-client root for advanced configuration:

```yaml
services:
  - type: web
    name: mela-marketplace
    env: node
    buildCommand: yarn install && yarn build
    startCommand: yarn start
    plan: starter
    envVars:
      - key: NODE_ENV
        value: production
```

## Step 4: Deploy to Render

### 4.1 Connect GitHub to Render
1. Go to [render.com](https://render.com) and sign up/login
2. Click "New +" → "Web Service"
3. Choose "Connect a repository"
4. Select your `mela-web-client` repository
5. Click "Connect"

### 4.2 Configure Service Settings
In Render's service configuration:
- **Name**: `mela-marketplace` (or your preferred name)
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `main`
- **Root Directory**: `./` (leave blank if deploying from root)
- **Build Command**: `yarn install && yarn build`
- **Start Command**: `yarn start`
- **Plan**: Free tier or paid tier based on needs

### 4.3 Add Environment Variables to Render

#### Required Variables:
```env
# Frontend variables (public)
REACT_APP_SHARETRIBE_SDK_CLIENT_ID=your-actual-client-id-here
REACT_APP_MARKETPLACE_ROOT_URL=https://your-service-name.onrender.com
REACT_APP_MARKETPLACE_NAME=mela-marketplace
REACT_APP_ENV=production

# Backend variables (private - secure on Render)
SHARETRIBE_SDK_CLIENT_SECRET=your-actual-client-secret-here
NODE_ENV=production
```

#### Optional Variables (add only if using these features):
```env
# Payment processing
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_key

# Maps integration  
REACT_APP_MAPBOX_ACCESS_TOKEN=your-mapbox-token

# Marketplace branding
REACT_APP_MARKETPLACE_NAME=mela-marketplace

# Analytics
REACT_APP_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX

# Social login (both public and secret keys needed)
REACT_APP_FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id  
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

#### Environment Variable Setup:
1. In Render's service configuration, scroll to "Environment Variables"
2. Add each required variable above  
3. Important: Set `REACT_APP_MARKETPLACE_ROOT_URL` to your Render URL
   - Use: `https://your-service-name.onrender.com`
   - You'll get the exact URL after creating the service

### 4.4 Deploy
1. Click "Create Web Service"
2. Render will start the deployment automatically
3. Wait for build to complete (usually 3-7 minutes for first deployment)
4. Note your assigned URL (e.g., `https://mela-marketplace.onrender.com`)

## Step 5: Update Configuration

### 5.1 Update Marketplace Root URL
1. Go to Render Dashboard → Your Service → Environment
2. Update `REACT_APP_MARKETPLACE_ROOT_URL` with your actual Render URL
3. Render will automatically redeploy when you save environment variable changes

### 5.2 Configure Sharetribe Console
1. Log into [Sharetribe Console](https://console.sharetribe.com)
2. Go to your marketplace → Build → General → Domains
3. Add your Render domain to allowed domains
4. Update any webhook URLs if needed

## Step 6: Testing

### 6.1 Basic Functionality Test
Visit your Render URL and test:
- [ ] Site loads without errors
- [ ] Product listings display
- [ ] Search functionality works
- [ ] User can view product details
- [ ] SEO optimizations are working (check page titles, meta descriptions)

### 6.2 SEO Testing
Use browser dev tools to verify:
- [ ] Page titles show optimized format: "[Product] by [Brand] - Authentic Indian Baby Products | Laem"
- [ ] Meta descriptions include cultural relevance
- [ ] Internal links appear and work ("Explore more [Brand]", "Shop more in [Category]")
- [ ] Structured data is present (check page source for JSON-LD)

### 6.3 Performance Testing
- [ ] Lighthouse audit scores
- [ ] Load times acceptable
- [ ] Mobile responsiveness

## Step 7: Ongoing Deployment

### 7.1 Automatic Deployments
Render automatically deploys when you push to your main branch:
```bash
git add .
git commit -m "fix: update styling for mobile devices"
git push origin main
# Render will automatically deploy
```

### 7.2 Branch Deployments (Render Pro)
Create preview deployments for feature branches:
```bash
git checkout -b feature/new-seo-improvements
# Make changes
git push origin feature/new-seo-improvements
# Create a new preview service in Render for this branch
```

### 7.3 Manual Deployments
You can trigger manual deployments from Render Dashboard:
1. Go to your service dashboard
2. Click "Manual Deploy" → "Deploy latest commit"
3. Or deploy specific commit/branch

## Environment Variable Security

### ✅ Safe for Frontend (REACT_APP_ prefix):
- Client IDs
- Publishable API keys (Stripe pk_)
- Public tokens (Mapbox, Analytics)
- Configuration flags
- Public URLs

### ❌ Never in Frontend:
- Client secrets
- Server-side API keys
- Database credentials  
- Private tokens
- Webhook secrets

### Why This Matters:
All `REACT_APP_` variables become visible in:
- Browser developer tools
- JavaScript source code
- Network requests
- Built application bundle

## Troubleshooting

### Common Issues

#### Issue 1: "Client ID not found" 
**Cause**: Missing `REACT_APP_SHARETRIBE_SDK_CLIENT_ID`
**Solution**: Add to Render environment variables and redeploy

#### Issue 2: "Marketplace URL mismatch"
**Cause**: `REACT_APP_MARKETPLACE_ROOT_URL` doesn't match deployed URL
**Solution**: Update Render environment variable to exact Render URL

#### Issue 3: "Environment variables not working"
**Causes & Solutions**:
- Missing `REACT_APP_` prefix → Add prefix for frontend variables
- Typo in variable name → Check exact spelling
- Not redeployed after adding → Render auto-redeploys, check logs
- Case sensitivity → Environment variable names are case-sensitive

#### Issue 4: "Build fails on Render"
**Causes & Solutions**:
- Missing dependencies → Ensure `yarn.lock` or `package-lock.json` is committed
- Node.js version mismatch → Specify Node version in package.json engines
- Memory issues → Upgrade to higher tier plan
- Build timeout → Check for slow dependencies or infinite loops

#### Issue 5: "Server won't start"
**Causes & Solutions**:
- Port configuration → Render provides `PORT` environment variable automatically
- Missing client secret → Add `SHARETRIBE_SDK_CLIENT_SECRET` to environment
- Database connection → Check database service status if using one

#### Build Fails
- Check build logs in Render dashboard under "Events" tab
- Ensure all dependencies are in `package.json`
- Verify Node.js version in package.json `engines` field
- Check for build script errors

#### Sharetribe API Errors
- Verify both `REACT_APP_SHARETRIBE_SDK_CLIENT_ID` and `SHARETRIBE_SDK_CLIENT_SECRET` are correct
- Check Sharetribe Console → Build → API settings
- Ensure your Render domain is whitelisted in Sharetribe Console

#### Application Crashes
- Check Render logs for error messages
- Verify all required environment variables are set
- Check Node.js version compatibility
- Monitor memory usage (upgrade plan if needed)

### Debugging Steps
1. Check Render deployment logs under "Events" and "Logs" tabs
2. Use Render's integrated logging to debug runtime issues
3. Check browser console for frontend errors
4. Verify API responses in Network tab
5. Test locally with production build: `npm run build && npm start`
6. Verify environment variables are loaded in Render dashboard

## Security Considerations

### For Production Environment
- Use production API keys from Sharetribe Console
- Configure production payment processors (Stripe)
- Ensure all secrets are properly configured in Render environment variables

### Environment Variables
- Never commit `.env` files to git
- Use production API keys for live deployment
- Regularly rotate API keys

## ✅ Full Functionality with Render

### Features Available:
- ✅ **Server-side rendering (SSR)** - Excellent SEO and initial load performance
- ✅ **Social login** (Google, Facebook) - Complete server-side auth flows
- ✅ **Privileged transitions** - Full marketplace operations supported
- ✅ **Server-side API endpoints** - Custom backend logic fully functional
- ✅ **Environment security** - Client secrets handled securely
- ✅ **Full-stack deployment** - Frontend and backend together

### Render Advantages:
- **Free tier** with generous limits
- **Automatic HTTPS** and SSL certificates
- **Global CDN** for fast asset delivery
- **Automatic deployments** from GitHub
- **Zero-config** for most Node.js apps
- **Live logs** for debugging
- **Custom domains** supported

## Next Steps

### Enhancing Render Deployment  
- Use custom domain instead of .onrender.com
- Set up monitoring and error tracking (Sentry)
- Configure environment-specific variables
- Set up database connections if needed
- Configure proper health checks

### Performance Optimization
- Monitor Render metrics and logs
- Set up proper caching headers in Express
- Optimize images and assets
- Monitor Core Web Vitals
- Configure Redis for session storage (optional)

## Quick Reference: Environment Setup

### Step-by-Step Render Environment Setup:

1. **Get Your Sharetribe Credentials**
   - Log into [Sharetribe Console](https://console.sharetribe.com)
   - Go to **Build → Applications**  
   - Find your Client ID and Client Secret
   - Both are needed for full-stack Render deployment

2. **Configure Render Environment Variables**
   - Go to Render Dashboard → Your Service → Environment
   - Add **minimum required variables**:
     ```
     REACT_APP_SHARETRIBE_SDK_CLIENT_ID = your-client-id
     SHARETRIBE_SDK_CLIENT_SECRET = your-client-secret
     REACT_APP_MARKETPLACE_ROOT_URL = https://your-service.onrender.com
     REACT_APP_MARKETPLACE_NAME = mela-marketplace
     REACT_APP_ENV = production
     NODE_ENV = production
     ```

3. **Deploy and Test**
   - Render automatically deploys on environment variable changes
   - Check build and runtime logs in Render dashboard
   - Test your deployed app with full functionality
   - Verify both frontend and backend features work

### Environment-Specific Behavior

#### Local Development (`npm start`)
- Loads: `.env.development` + `.env` (your local file)
- Result: `REACT_APP_ENV=development` with your local secrets

#### Render Production (`npm run build && npm start`)  
- Loads: Render environment variables for both frontend and backend
- Result: `REACT_APP_ENV=production` with full-stack functionality

## Support

### Resources
- [Render Documentation](https://render.com/docs)
- [Sharetribe Developer Documentation](https://www.sharetribe.com/docs/)
- [Create React App Deployment Guide](https://create-react-app.dev/docs/deployment/)

### Getting Help
- Render Support (for deployment issues)
- Sharetribe Community (for marketplace configuration)
- GitHub Issues (for code-specific problems)