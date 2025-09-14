# Vercel Environment Variables Setup

This document explains how to configure environment variables for the Funifier Gamification Dashboard on Vercel.

## Required Environment Variables

### 1. Funifier API Configuration

```bash
FUNIFIER_API_KEY=68a6737a6e1d0e2196db1b1e
FUNIFIER_BASE_URL=https://service2.funifier.com/v3
FUNIFIER_BASIC_TOKEN=Basic [your_basic_token_here]
```

### 2. NextAuth Configuration

```bash
NEXTAUTH_SECRET=your_super_secure_nextauth_secret_key_here_32_chars_minimum
NEXTAUTH_URL=https://your-app-name.vercel.app
```

## Setting Up Environment Variables in Vercel

### Option 1: Vercel Dashboard (Recommended)

1. Go to your project in the [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:

   **FUNIFIER_API_KEY**
   - Value: `68a6737a6e1d0e2196db1b1e`
   - Environment: Production, Preview, Development

   **FUNIFIER_BASE_URL**
   - Value: `https://service2.funifier.com/v3`
   - Environment: Production, Preview, Development

   **FUNIFIER_BASIC_TOKEN**
   - Value: `Basic [your_basic_token_here]`
   - Environment: Production, Preview, Development
   - **Important**: This is a sensitive credential for enhanced database access - use the actual token provided by Funifier

   **NEXTAUTH_SECRET**
   - Value: Generate a secure 32+ character string
   - Environment: Production, Preview, Development
   - **Important**: Use a different secret for each environment

   **NEXTAUTH_URL**
   - Value: `https://your-app-name.vercel.app` (replace with your actual domain)
   - Environment: Production
   - For Preview: `https://your-app-name-git-branch.vercel.app`
   - For Development: `http://localhost:3000`

### Option 2: Vercel CLI

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Set environment variables
vercel env add FUNIFIER_API_KEY
# Enter: 68a6737a6e1d0e2196db1b1e
# Select: Production, Preview, Development

vercel env add FUNIFIER_BASE_URL
# Enter: https://service2.funifier.com/v3
# Select: Production, Preview, Development

vercel env add FUNIFIER_BASIC_TOKEN
# Enter: Basic [your_basic_token_here]
# Select: Production, Preview, Development

vercel env add NEXTAUTH_SECRET
# Enter: your_generated_secret_here
# Select: Production, Preview, Development

vercel env add NEXTAUTH_URL
# Enter: https://your-app-name.vercel.app
# Select: Production (adjust for other environments)
```

### Option 3: Environment Variables File (for CLI deployment)

Create a `.env.production` file (do not commit this):

```bash
FUNIFIER_API_KEY=68a6737a6e1d0e2196db1b1e
FUNIFIER_BASE_URL=https://service2.funifier.com/v3
FUNIFIER_BASIC_TOKEN=Basic [your_basic_token_here]
NEXTAUTH_SECRET=your_super_secure_nextauth_secret_key_here_32_chars_minimum
NEXTAUTH_URL=https://your-app-name.vercel.app
```

## Generating NEXTAUTH_SECRET

You can generate a secure secret using:

```bash
# Option 1: OpenSSL
openssl rand -base64 32

# Option 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Online generator
# Visit: https://generate-secret.vercel.app/32
```

## Environment-Specific URLs

### Production

- **NEXTAUTH_URL**: `https://your-production-domain.com`

### Preview (Branch Deployments)

- **NEXTAUTH_URL**: `https://your-app-name-git-branch-name.vercel.app`

### Development

- **NEXTAUTH_URL**: `http://localhost:3000`

## Verification

After setting up the environment variables:

1. **Redeploy your application** to apply the new environment variables
2. **Run the validation script**:
   ```bash
   npm run validate:env
   ```
3. **Check the deployment logs** in Vercel dashboard for any environment-related errors

## Security Notes

- ✅ **FUNIFIER_API_KEY**: Already provided and safe to use
- ⚠️ **NEXTAUTH_SECRET**: Generate a unique, secure secret for each environment
- 🔒 **Never commit** `.env.local` or `.env.production` files to version control
- 🔄 **Rotate secrets** periodically for enhanced security

## Troubleshooting

### Common Issues

1. **"NEXTAUTH_SECRET is missing"**
   - Ensure NEXTAUTH_SECRET is set in Vercel environment variables
   - Redeploy after adding the variable

2. **"Invalid NEXTAUTH_URL"**
   - Make sure NEXTAUTH_URL matches your actual domain
   - Use HTTPS for production environments

3. **"Funifier API authentication failed"**
   - Verify FUNIFIER_API_KEY is correctly set
   - Check FUNIFIER_BASE_URL is accessible

### Debugging

Enable debug mode by adding:

```bash
NEXTAUTH_DEBUG=true
```

This will provide more detailed logs in the Vercel function logs.
