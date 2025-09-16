# Quick Deploy Guide to Vercel

Follow these steps to deploy the Funifier Gamification Dashboard to Vercel.

## Prerequisites

- Vercel account
- GitHub repository connected to Vercel
- Funifier API key: `[provided_by_funifier]`

## Step 1: Set Environment Variables in Vercel

Go to your Vercel project dashboard → Settings → Environment Variables and add:

### Required Variables

| Variable | Value | Environment |
|----------|-------|-------------|
| `FUNIFIER_API_KEY` | `[your_funifier_api_key]` | Production, Preview, Development |
| `FUNIFIER_BASE_URL` | `https://service2.funifier.com/v3` | Production, Preview, Development |
| `NEXTAUTH_SECRET` | [Generate secure 32+ char string] | Production, Preview, Development |
| `NEXTAUTH_URL` | `https://your-app-name.vercel.app` | Production |

### Generate NEXTAUTH_SECRET

Use one of these methods:

```bash
# Option 1: OpenSSL
openssl rand -base64 32

# Option 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Online
# Visit: https://generate-secret.vercel.app/32
```

## Step 2: Deploy

### Option A: Automatic Deployment (Recommended)

1. Push your code to the main branch
2. Vercel will automatically deploy
3. Check deployment status in Vercel dashboard

### Option B: Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

## Step 3: Verify Deployment

1. Visit your deployed URL
2. Test login functionality
3. Check dashboard displays for all team types:
   - Carteira 0 (with Conversões metric)
   - Carteira I, II, III, IV
   - ER (with UPA metric and Medalhas button)
4. Test multi-team selection modal (if applicable)
5. Verify CSV upload with new metrics
6. Verify API endpoints work

## Step 4: Monitor

- Check Vercel function logs for errors
- Monitor performance metrics
- Test all user flows

## Troubleshooting

### Common Issues

**"NEXTAUTH_SECRET is missing"**
- Add NEXTAUTH_SECRET in Vercel environment variables
- Redeploy after adding

**"Authentication failed"**
- Verify FUNIFIER_API_KEY is correct
- Check FUNIFIER_BASE_URL is accessible

**"Invalid redirect URI"**
- Ensure NEXTAUTH_URL matches your domain
- Use HTTPS for production

### Debug Mode

Add this environment variable for detailed logs:
```
NEXTAUTH_DEBUG=true
```

## Support

- Check deployment logs in Vercel dashboard
- Review error messages in browser console
- Validate environment with: `npm run validate:env`

## Quick Commands

```bash
# Local setup
npm run setup:env

# Validate environment
npm run validate:env

# Build locally
npm run build

# Deploy to Vercel
vercel --prod
```