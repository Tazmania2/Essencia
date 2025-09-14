# Security Guidelines

This document outlines the security measures implemented in the Funifier Gamification Dashboard.

## Environment Variables Security

### Sensitive Credentials
All sensitive credentials are stored as environment variables and never hardcoded in the source code:

- `FUNIFIER_API_KEY`: API key for Funifier service authentication
- `FUNIFIER_BASIC_TOKEN`: Basic authentication token for enhanced database access
- `NEXTAUTH_SECRET`: Secret key for NextAuth.js session encryption

### Best Practices
- ✅ All secrets are stored in environment variables
- ✅ Environment variables are loaded through Next.js configuration
- ✅ Production secrets are managed through Vercel dashboard
- ✅ Development uses `.env.local` (not committed to version control)

## Logging Security

### Secure Logger Implementation
The application uses a custom secure logger (`utils/logger.ts`) that automatically sanitizes sensitive information:

#### Features
- **Automatic Token Redaction**: Detects and redacts Basic/Bearer tokens
- **API Key Protection**: Identifies and masks API keys in logs
- **Password Sanitization**: Removes passwords from log output
- **Object Deep Scanning**: Recursively sanitizes nested objects and arrays

#### Usage
```typescript
import { secureLogger } from '../utils/logger';

// Instead of console.log
secureLogger.log('User data:', userData);

// Automatically sanitizes sensitive fields
secureLogger.error('Auth error:', { token: 'secret123', message: 'Failed' });
// Output: Auth error: { token: '[REDACTED]', message: 'Failed' }
```

### Sensitive Data Patterns
The logger automatically detects and redacts:
- `Basic [token]` - Basic authentication tokens
- `Bearer [token]` - Bearer tokens
- `api_key: [value]` - API keys
- `secret: [value]` - Secret values
- `password: [value]` - Passwords
- `token: [value]` - Generic tokens

## Code Security Measures

### Authentication
- JWT tokens are properly validated and refreshed
- Session management through NextAuth.js
- Automatic token expiration handling
- Secure token storage in HTTP-only cookies (when applicable)

### API Security
- Input validation on all API endpoints
- Proper error handling without information leakage
- Rate limiting considerations for production deployment
- CORS configuration for cross-origin requests

### Data Protection
- Sensitive data is never logged in plain text
- Database queries use parameterized statements
- User input is properly sanitized
- File uploads are validated and restricted

## Production Security Checklist

### Environment Configuration
- [ ] All environment variables are set in Vercel dashboard
- [ ] `NEXTAUTH_SECRET` is unique and secure (32+ characters)
- [ ] `NEXTAUTH_URL` matches the production domain
- [ ] No `.env` files are committed to version control

### Code Review
- [ ] No hardcoded secrets in source code
- [ ] All console.log statements use secure logger
- [ ] Sensitive data is properly sanitized in logs
- [ ] Error messages don't expose internal information

### Deployment
- [ ] HTTPS is enforced in production
- [ ] Security headers are configured (see `next.config.js`)
- [ ] Dependencies are up to date and scanned for vulnerabilities
- [ ] Build process excludes development dependencies

## Security Headers

The application implements security headers through Next.js configuration:

```javascript
// next.config.js
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    },
  ];
}
```

## Incident Response

### If Secrets Are Compromised
1. **Immediate Actions**:
   - Rotate the compromised credentials
   - Update environment variables in Vercel
   - Redeploy the application
   - Review access logs for suspicious activity

2. **Investigation**:
   - Check git history for accidental commits
   - Review application logs for unauthorized access
   - Verify all team members' access levels

3. **Prevention**:
   - Update security guidelines
   - Implement additional monitoring
   - Review code review processes

### Monitoring
- Monitor application logs for authentication failures
- Set up alerts for unusual API usage patterns
- Regular security audits of dependencies
- Periodic review of environment variable access

## Development Security

### Local Development
- Use `.env.local` for local environment variables
- Never commit `.env` files to version control
- Use different credentials for development and production
- Regularly update development dependencies

### Code Practices
- Always use the secure logger for any logging
- Validate all user inputs
- Use TypeScript for type safety
- Implement proper error boundaries

### Testing
- Test security features in isolation
- Verify that sensitive data is properly redacted in logs
- Test authentication and authorization flows
- Validate environment variable handling

## Compliance Notes

### Data Privacy
- User data is processed according to privacy regulations
- Minimal data collection and retention policies
- Secure data transmission (HTTPS)
- Proper data anonymization in logs

### Access Control
- Role-based access control (Admin vs Player)
- Proper session management
- Secure logout functionality
- Protection against session fixation

This security framework ensures that the Funifier Gamification Dashboard maintains high security standards while providing a seamless user experience.