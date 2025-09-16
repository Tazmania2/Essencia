# Deployment Guide - Vercel

This guide covers deploying the Funifier Gamification Dashboard to Vercel.

## Prerequisites

1. **Git Repository**: Ensure your code is pushed to GitHub, GitLab, or Bitbucket
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **Environment Variables**: Have your Funifier API credentials ready

## Step 1: Connect Repository to Vercel

### Option A: Vercel Dashboard (Recommended)

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your Git repository
4. Select the repository containing this project
5. Vercel will automatically detect it's a Next.js project

### Option B: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project root
vercel
```

## Step 2: Configure Environment Variables

In the Vercel dashboard, go to your project settings and add these environment variables:

### Required Environment Variables

```bash
# Funifier API Configuration
FUNIFIER_API_KEY=[your_funifier_api_key]
FUNIFIER_BASE_URL=https://service2.funifier.com/v3

# Next.js Authentication
NEXTAUTH_SECRET=your_secure_random_string_here
NEXTAUTH_URL=https://your-domain.vercel.app

# Environment
NODE_ENV=production

# Team Configuration (New Dashboard Types)
# Note: These are configured in the application code, not as environment variables
# Carteira 0 Team ID: E6F5k30
# ER Team ID: E500AbT
# Challenge IDs - Conversões: E6GglPq, UPA: E62x2PW
```

### Setting Environment Variables in Vercel Dashboard

1. Go to Project Settings → Environment Variables
2. Add each variable with appropriate values:
   - **Name**: Variable name (e.g., `FUNIFIER_API_KEY`)
   - **Value**: Variable value
   - **Environment**: Select Production, Preview, and Development as needed

### Setting Environment Variables via CLI

```bash
# Set production environment variables
vercel env add FUNIFIER_API_KEY production
vercel env add FUNIFIER_BASE_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add NEXTAUTH_URL production
vercel env add NODE_ENV production
```

## Step 3: Configure Build Settings

The project includes a `vercel.json` configuration file that sets:

- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Framework**: Next.js
- **Node.js Runtime**: 18.x for API routes
- **Region**: `iad1` (US East)

### Custom Build Configuration

If you need to modify build settings:

1. Go to Project Settings → General
2. Update Build & Output Settings:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

## Step 4: Configure Automatic Deployments

### Branch Configuration

1. **Production Branch**: `main` or `master`
   - Automatic deployments to production domain
   - Environment variables from "Production" scope

2. **Preview Branches**: All other branches
   - Automatic preview deployments
   - Environment variables from "Preview" scope

### Deployment Settings

In Project Settings → Git:

- ✅ **Automatically expose System Environment Variables**
- ✅ **Auto-deploy only Production Branch**
- ✅ **Enable Preview Deployments**

## Step 5: Test Staging Environment

### Create Staging Branch

```bash
# Create and push staging branch
git checkout -b staging
git push origin staging
```

### Staging Environment Variables

Add staging-specific environment variables:

```bash
# Use staging/sandbox Funifier endpoints if available
FUNIFIER_BASE_URL=https://staging.funifier.com/v3  # If available
NEXTAUTH_URL=https://your-project-git-staging.vercel.app
```

### Test Staging Deployment

1. Push changes to staging branch
2. Vercel automatically creates preview deployment
3. Test all functionality:
   - Authentication flow
   - Player dashboard
   - Admin dashboard
   - Report upload
   - API routes

## Step 6: Production Deployment

### Deploy to Production

```bash
# Merge staging to main for production deployment
git checkout main
git merge staging
git push origin main
```

### Verify Production Deployment

1. **Domain Access**: Visit your production URL
2. **API Health**: Test `/api/health` endpoint (if implemented)
3. **Authentication**: Test login flow
4. **Funifier Integration**: Verify API connections work
5. **Dashboard Types**: Test all dashboard types (Carteira 0, I, II, III, IV, ER)
6. **Multi-Team Selection**: Test team selection modal for users with multiple teams
7. **New Metrics**: Verify Conversões and UPA metrics display correctly
8. **CSV Upload**: Test CSV upload with new metric columns
9. **Error Handling**: Check error boundaries and fallbacks

## Step 7: Configure Custom Domain (Optional)

### Add Custom Domain

1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed by Vercel
4. Update `NEXTAUTH_URL` environment variable

### DNS Configuration

For domain `dashboard.yourdomain.com`:

```
Type: CNAME
Name: dashboard
Value: cname.vercel-dns.com
```

## Step 8: Set Up Monitoring and Analytics

### Vercel Analytics

1. Go to Project → Analytics
2. Enable Vercel Analytics
3. Add analytics script to your app (optional)

### Performance Monitoring

The project includes performance monitoring:

- **Web Vitals**: Automatically tracked by Vercel
- **Custom Metrics**: Via `usePerformance` hook
- **Error Tracking**: Via error boundaries

### Logging

- **Build Logs**: Available in Vercel dashboard
- **Function Logs**: Real-time logs for API routes
- **Runtime Logs**: Application errors and warnings

## Step 9: Configure Branch Previews

### Preview Deployment Workflow

1. **Feature Branch**: Create feature branch
2. **Push Changes**: Push to feature branch
3. **Auto Preview**: Vercel creates preview deployment
4. **Test & Review**: Test changes in preview environment
5. **Merge**: Merge to main for production deployment

### Preview Environment Variables

Set preview-specific variables if needed:

```bash
vercel env add FUNIFIER_BASE_URL preview
vercel env add NEXTAUTH_URL preview
```

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check build logs in Vercel dashboard
   - Verify all dependencies are in `package.json`
   - Ensure TypeScript compilation passes

2. **Environment Variable Issues**
   - Verify all required variables are set
   - Check variable names match exactly
   - Redeploy after adding new variables

3. **API Route Errors**
   - Check function logs in Vercel dashboard
   - Verify serverless function configuration
   - Test API routes locally first

4. **Funifier API Connection Issues**
   - Verify API key and base URL
   - Check network connectivity from Vercel
   - Test with staging environment first

### Debug Commands

```bash
# Check deployment status
vercel ls

# View deployment logs
vercel logs [deployment-url]

# Pull environment variables locally
vercel env pull .env.local

# Test build locally
npm run build
npm run start
```

## Security Considerations

1. **Environment Variables**: Never commit sensitive data to Git
2. **API Keys**: Use Vercel's encrypted environment variables
3. **HTTPS**: Vercel provides automatic HTTPS
4. **CORS**: Configure appropriate CORS headers for API routes
5. **Rate Limiting**: Consider implementing rate limiting for API routes

## Performance Optimization

1. **Edge Functions**: API routes run on Vercel's Edge Network
2. **Static Generation**: Next.js pages are statically generated when possible
3. **Image Optimization**: Use Next.js Image component for optimized images
4. **Bundle Analysis**: Use `@next/bundle-analyzer` to optimize bundle size

## Maintenance

### Regular Tasks

1. **Dependency Updates**: Keep dependencies updated
2. **Security Patches**: Monitor and apply security updates
3. **Performance Monitoring**: Review analytics and performance metrics
4. **Log Review**: Regularly check function logs for errors

### Backup Strategy

1. **Code**: Git repository serves as code backup
2. **Environment Variables**: Document all environment variables
3. **Configuration**: Keep deployment configuration in version control