# Pre-Deployment Checklist

Use this checklist before deploying to production to ensure everything is properly configured.

## ✅ Code Quality

- [ ] All tests pass (`npm test`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No linting errors (`npm run lint`)
- [ ] Build succeeds locally (`npm run build`)
- [ ] Application starts correctly (`npm run start`)

## ✅ Environment Configuration

- [ ] All required environment variables are set:
  - [ ] `FUNIFIER_API_KEY=[your_funifier_api_key]`
  - [ ] `FUNIFIER_BASE_URL=https://service2.funifier.com/v3`
  - [ ] `NEXTAUTH_SECRET` (secure 32+ character string)
  - [ ] `NEXTAUTH_URL` (production domain)
- [ ] Environment validation passes (`npm run validate:env`)
- [ ] Production URLs are configured (no localhost)
- [ ] API keys are production-ready
- [ ] NEXTAUTH_SECRET is secure (32+ characters)

## ✅ Vercel Configuration

- [ ] Repository is connected to Vercel
- [ ] Environment variables are set in Vercel dashboard
- [ ] Build settings are configured correctly
- [ ] API routes are working in preview deployments
- [ ] Custom domain is configured (if applicable)

## ✅ Funifier Integration

- [ ] Funifier API key is valid for production
- [ ] Base URL points to production Funifier API
- [ ] Authentication flow works with production credentials
- [ ] Player data retrieval works
- [ ] Report upload and processing works
- [ ] Action log submission works

## ✅ Security

- [ ] No sensitive data in Git repository
- [ ] Environment variables use Vercel's secure storage
- [ ] HTTPS is enforced
- [ ] Security headers are configured
- [ ] CORS is properly configured for API routes

## ✅ Performance

- [ ] Bundle size is optimized
- [ ] Images are optimized
- [ ] API routes respond quickly
- [ ] Loading states are implemented
- [ ] Error boundaries are in place

## ✅ User Experience

- [ ] All user flows work end-to-end
- [ ] Error messages are user-friendly
- [ ] Loading states provide good feedback
- [ ] Responsive design works on all devices
- [ ] Accessibility features are working

## ✅ Monitoring & Analytics

- [ ] Health check endpoint works (`/api/health`)
- [ ] Error tracking is configured
- [ ] Performance monitoring is enabled
- [ ] Vercel Analytics is enabled (optional)

## ✅ Documentation

- [ ] README is updated with deployment info
- [ ] Environment variables are documented
- [ ] API endpoints are documented
- [ ] Deployment process is documented

## ✅ Backup & Recovery

- [ ] Git repository is backed up
- [ ] Environment variables are documented securely
- [ ] Rollback plan is in place
- [ ] Database backup strategy (if applicable)

## ✅ Testing in Production

After deployment, verify:

- [ ] Application loads correctly
- [ ] Authentication works
- [ ] Player dashboard displays data
- [ ] Admin dashboard functions
- [ ] Report upload works
- [ ] All API endpoints respond
- [ ] Error handling works
- [ ] Performance is acceptable

## Emergency Contacts

- **Development Team**: [Your team contact]
- **Vercel Support**: [Vercel support if needed]
- **Funifier Support**: [Funifier API support]

## Rollback Procedure

If issues are found after deployment:

1. **Immediate**: Revert to previous deployment in Vercel dashboard
2. **Code Fix**: Fix issues in code and redeploy
3. **Environment**: Check environment variables if API issues
4. **Communication**: Notify stakeholders of any downtime

## Post-Deployment Tasks

- [ ] Monitor application for first 24 hours
- [ ] Check error logs and metrics
- [ ] Verify all integrations are working
- [ ] Update documentation if needed
- [ ] Communicate successful deployment to stakeholders