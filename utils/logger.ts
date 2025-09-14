/**
 * Secure logging utility that sanitizes sensitive information
 */

// Patterns to identify sensitive data
const SENSITIVE_PATTERNS = [
  /Basic\s+[A-Za-z0-9+/=]+/gi, // Basic auth tokens
  /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, // Bearer tokens
  /api[_-]?key['":\s=]*[A-Za-z0-9]+/gi, // API keys
  /secret['":\s=]*[A-Za-z0-9]+/gi, // Secrets
  /password['":\s=]*[^\s"',}]+/gi, // Passwords
  /token['":\s=]*[A-Za-z0-9\-._~+/]+=*/gi, // Generic tokens
];

/**
 * Sanitizes sensitive information from strings
 */
function sanitizeString(str: string): string {
  let sanitized = str;
  
  // Handle Basic and Bearer tokens specifically
  sanitized = sanitized.replace(/Basic\s+[A-Za-z0-9+/=]+/gi, 'Basic [REDACTED]');
  sanitized = sanitized.replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, 'Bearer [REDACTED]');
  
  // Handle key=value patterns
  sanitized = sanitized.replace(/api[_-]?key['":\s=]*[A-Za-z0-9]+/gi, 'apiKey=[REDACTED]');
  sanitized = sanitized.replace(/secret['":\s=]*[A-Za-z0-9]+/gi, 'secret=[REDACTED]');
  sanitized = sanitized.replace(/password['":\s=]*[^\s"',}]+/gi, 'password=[REDACTED]');
  sanitized = sanitized.replace(/token['":\s=]*[A-Za-z0-9\-._~+/]+=*/gi, 'token=[REDACTED]');
  
  return sanitized;
}

/**
 * Sanitizes sensitive information from objects
 */
function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    // Check if key suggests sensitive data
    const keyLower = key.toLowerCase();
    if (keyLower.includes('token') || 
        keyLower.includes('secret') || 
        keyLower.includes('password') || 
        keyLower.includes('auth') ||
        keyLower.includes('key')) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = sanitizeObject(value);
    }
  }
  
  return sanitized;
}

/**
 * Secure logger that automatically sanitizes sensitive information
 */
export const secureLogger = {
  log: (...args: any[]) => {
    const sanitizedArgs = args.map(arg => 
      typeof arg === 'object' ? sanitizeObject(arg) : sanitizeString(String(arg))
    );
    console.log(...sanitizedArgs);
  },
  
  error: (...args: any[]) => {
    const sanitizedArgs = args.map(arg => 
      typeof arg === 'object' ? sanitizeObject(arg) : sanitizeString(String(arg))
    );
    console.error(...sanitizedArgs);
  },
  
  warn: (...args: any[]) => {
    const sanitizedArgs = args.map(arg => 
      typeof arg === 'object' ? sanitizeObject(arg) : sanitizeString(String(arg))
    );
    console.warn(...sanitizedArgs);
  },
  
  info: (...args: any[]) => {
    const sanitizedArgs = args.map(arg => 
      typeof arg === 'object' ? sanitizeObject(arg) : sanitizeString(String(arg))
    );
    console.info(...sanitizedArgs);
  },
  
  debug: (...args: any[]) => {
    const sanitizedArgs = args.map(arg => 
      typeof arg === 'object' ? sanitizeObject(arg) : sanitizeString(String(arg))
    );
    console.debug(...sanitizedArgs);
  }
};

/**
 * Helper function to sanitize data before logging
 */
export function sanitizeForLogging(data: any): any {
  return sanitizeObject(data);
}