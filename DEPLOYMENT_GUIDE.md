# Deployment Guide

## 🚀 Overview

This guide provides comprehensive instructions for deploying the Funifier Gamification Dashboard to production environments, with a focus on Vercel deployment as the recommended platform.

## 🏗️ Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Production Architecture                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │ Vercel Edge     │  │ Next.js         │  │ Serverless  │ │
│  │ Network         │  │ Application     │  │ Functions   │ │
│  │ (CDN)           │  │                 │  │ (API Routes)│ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
│           │                     │                   │       │
│           ▼                     ▼                   ▼       │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Funifier Platform                          │ │
│  │  • REST API v3                                          │ │
│  │  • Database Collections                                 │ │
│  │  • Authentication Services                              │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Pre-Deployment Checklist

### 1. Environment Configuration

Ensure all required environment variables are configured:

```bash
# Required Environment Variables
FUNIFIER_API_KEY=your_funifier_api_key_here
FUNIFIER_BASE_URL=https://service2.funifier.com/v3
FUNIFIER_BASIC_TOKEN=Basic_your_encoded_credentials
NEXTAUTH_SECRET=your_secure_random_string_32_chars_min
NEXTAUTH_URL=https://your-production-domain.vercel.app
NODE_ENV=production
```

### 2. Code Quality Checks

Run all quality checks before deployment:

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build test
npm run build

# Unit tests
npm run test

# E2E tests (optional)
npm run test:e2e
```

### 3. Security Validation

- [ ] All sensitive data stored in environment variables
- [ ] No hardcoded API keys or secrets in code
- [ ] HTTPS enforced for all endpoints
- [ ] Proper CORS configuration
- [ ] Input validation implemented
- [ ] Error messages don't expose sensitive information

## 🌐 Vercel Deployment (Recommended)

### Quick Deployment

1. **Connect Repository**
   ```bash
   # Install Vercel CLI (optional)
   npm i -g vercel
   
   # Login to Vercel
   vercel login
   
   # Deploy from repository root
   vercel --prod
   ```

2. **Or Deploy via Vercel Dashboard**
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your Git repository
   - Configure environment variables
   - Deploy

### Detailed Vercel Configuration

#### 1. Project Settings

Create `vercel.json` in project root:

```json
{
  "version": 2,
  "name": "funifier-gamification-dashboard",
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "regions": ["gru1", "iad1"],
  "framework": "nextjs"
}
```

#### 2. Environment Variables Configuration

In Vercel Dashboard → Project Settings → Environment Variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| `FUNIFIER_API_KEY` | `your_api_key` | Production |
| `FUNIFIER_BASE_URL` | `https://service2.funifier.com/v3` | Production |
| `FUNIFIER_BASIC_TOKEN` | `Basic your_token` | Production |
| `NEXTAUTH_SECRET` | `your_32_char_secret` | Production |
| `NEXTAUTH_URL` | `https://your-domain.vercel.app` | Production |
| `NODE_ENV` | `production` | Production |

#### 3. Build Configuration

Update `next.config.js` for production:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  
  // Environment variables
  env: {
    FUNIFIER_API_KEY: process.env.FUNIFIER_API_KEY,
    FUNIFIER_BASE_URL: process.env.FUNIFIER_BASE_URL,
    FUNIFIER_BASIC_TOKEN: process.env.FUNIFIER_BASIC_TOKEN,
  },
  
  // Image optimization
  images: {
    domains: ['service2.funifier.com'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
```

#### 4. Custom Domain Configuration

1. **Add Domain in Vercel Dashboard**
   - Go to Project Settings → Domains
   - Add your custom domain
   - Configure DNS records as instructed

2. **DNS Configuration Example**
   ```
   Type: CNAME
   Name: dashboard (or @)
   Value: cname.vercel-dns.com
   ```

3. **SSL Certificate**
   - Vercel automatically provisions SSL certificates
   - Certificates auto-renew

### Performance Optimization

#### 1. Build Optimization

```javascript
// next.config.js additions
module.exports = {
  // ... existing config
  
  // Bundle analyzer (development only)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config) => {
      config.plugins.push(
        new (require('@next/bundle-analyzer'))({
          enabled: true,
        })
      );
      return config;
    },
  }),
  
  // Experimental features
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react'],
  },
}
```

#### 2. Caching Strategy

```javascript
// API route caching example
export async function GET(request) {
  const response = await fetchData();
  
  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
```

## 🐳 Docker Deployment (Alternative)

### Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set permissions
USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  dashboard:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - FUNIFIER_API_KEY=${FUNIFIER_API_KEY}
      - FUNIFIER_BASE_URL=${FUNIFIER_BASE_URL}
      - FUNIFIER_BASIC_TOKEN=${FUNIFIER_BASIC_TOKEN}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Docker Deployment Commands

```bash
# Build image
docker build -t funifier-dashboard .

# Run container
docker run -d \
  --name funifier-dashboard \
  -p 3000:3000 \
  --env-file .env.production \
  funifier-dashboard

# Using Docker Compose
docker-compose up -d
```

## ☁️ AWS Deployment (Alternative)

### AWS Amplify Deployment

1. **Connect Repository**
   - Go to AWS Amplify Console
   - Connect your Git repository
   - Configure build settings

2. **Build Configuration**

Create `amplify.yml`:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

3. **Environment Variables**
   - Configure in Amplify Console
   - Same variables as Vercel deployment

### AWS ECS Deployment

1. **Create Task Definition**

```json
{
  "family": "funifier-dashboard",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "dashboard",
      "image": "your-account.dkr.ecr.region.amazonaws.com/funifier-dashboard:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "FUNIFIER_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:funifier-api-key"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/funifier-dashboard",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

## 📊 Monitoring and Observability

### Health Checks

Implement health check endpoint:

```typescript
// app/api/health/route.ts
export async function GET() {
  try {
    // Check Funifier API connectivity
    const funifierHealth = await checkFunifierAPI();
    
    // Check database connectivity
    const dbHealth = await checkDatabase();
    
    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        funifier_api: funifierHealth,
        database: dbHealth,
      },
      version: process.env.npm_package_version,
    });
  } catch (error) {
    return Response.json(
      {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
```

### Logging Configuration

```typescript
// utils/logger.ts
export class ProductionLogger {
  static log(level: 'info' | 'warn' | 'error', message: string, data?: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data: this.sanitizeData(data),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version,
    };
    
    console.log(JSON.stringify(logEntry));
  }
  
  private static sanitizeData(data: any): any {
    // Remove sensitive information
    if (!data) return data;
    
    const sanitized = { ...data };
    const sensitiveFields = ['password', 'token', 'apiKey', 'secret'];
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }
}
```

### Performance Monitoring

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const start = Date.now();
  
  const response = NextResponse.next();
  
  // Add performance headers
  response.headers.set('X-Response-Time', `${Date.now() - start}ms`);
  response.headers.set('X-Request-ID', crypto.randomUUID());
  
  return response;
}

export const config = {
  matcher: '/api/:path*',
};
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run type check
        run: npm run type-check
      
      - name: Run linting
        run: npm run lint
      
      - name: Run tests
        run: npm run test
      
      - name: Build application
        run: npm run build
        env:
          FUNIFIER_API_KEY: ${{ secrets.FUNIFIER_API_KEY }}
          FUNIFIER_BASE_URL: ${{ secrets.FUNIFIER_BASE_URL }}
          FUNIFIER_BASIC_TOKEN: ${{ secrets.FUNIFIER_BASIC_TOKEN }}
          NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
          NEXTAUTH_URL: ${{ secrets.NEXTAUTH_URL }}

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## 🚨 Troubleshooting

### Common Deployment Issues

#### 1. Build Failures

**Issue**: TypeScript compilation errors
```bash
# Solution: Fix type errors locally first
npm run type-check
npm run lint:fix
```

**Issue**: Missing environment variables
```bash
# Solution: Verify all required variables are set
npm run validate:env
```

#### 2. Runtime Errors

**Issue**: 500 Internal Server Error
```bash
# Check logs in Vercel Dashboard → Functions tab
# Or use Vercel CLI
vercel logs
```

**Issue**: API connection failures
```bash
# Verify Funifier API connectivity
curl -H "Authorization: $FUNIFIER_BASIC_TOKEN" \
     https://service2.funifier.com/v3/player
```

#### 3. Performance Issues

**Issue**: Slow API responses
```bash
# Check function execution time in Vercel Dashboard
# Optimize database queries and caching
```

**Issue**: High memory usage
```bash
# Analyze bundle size
npm run build -- --analyze
# Optimize imports and dependencies
```

### Rollback Procedures

#### Vercel Rollback

```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]
```

#### Manual Rollback

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or reset to specific commit
git reset --hard [commit-hash]
git push --force origin main
```

## 📋 Post-Deployment Checklist

### Verification Steps

- [ ] Application loads successfully
- [ ] Authentication works correctly
- [ ] Dashboard data displays properly
- [ ] Admin interface functions correctly
- [ ] CSV upload processes successfully
- [ ] All API endpoints respond correctly
- [ ] Health check endpoint returns healthy status
- [ ] SSL certificate is valid
- [ ] Custom domain resolves correctly
- [ ] Performance metrics are acceptable

### Monitoring Setup

- [ ] Set up uptime monitoring
- [ ] Configure error alerting
- [ ] Set up performance monitoring
- [ ] Configure log aggregation
- [ ] Set up backup procedures

### Documentation Updates

- [ ] Update deployment documentation
- [ ] Update API documentation
- [ ] Update environment variable documentation
- [ ] Update troubleshooting guide

## 🔐 Security Considerations

### Production Security Checklist

- [ ] All secrets stored in environment variables
- [ ] HTTPS enforced for all connections
- [ ] Security headers configured
- [ ] Input validation implemented
- [ ] Rate limiting configured
- [ ] Error messages sanitized
- [ ] Dependency vulnerabilities checked
- [ ] Access logs configured
- [ ] Backup procedures implemented

### Security Headers

```javascript
// next.config.js security headers
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
];
```

This deployment guide provides comprehensive instructions for deploying the Funifier Gamification Dashboard to production environments with proper security, monitoring, and maintenance procedures.