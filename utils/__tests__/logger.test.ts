import { secureLogger, sanitizeForLogging } from '../logger';

// Mock console methods
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info,
  debug: console.debug,
};

beforeEach(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
  console.info = jest.fn();
  console.debug = jest.fn();
});

afterEach(() => {
  Object.assign(console, originalConsole);
});

describe('Secure Logger', () => {
  describe('sanitizeForLogging', () => {
    it('should redact Basic auth tokens', () => {
      const input = 'Authorization: Basic NjhhNjczN2E2ZTFkMGUyMTk2ZGIxYjFlOjY3ZWM0ZTRhMjMyN2Y3NGYzYTJmOTZmNQ==';
      const result = sanitizeForLogging(input);
      expect(result).toBe('Authorization: Basic [REDACTED]');
    });

    it('should redact Bearer tokens', () => {
      const input = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
      const result = sanitizeForLogging(input);
      expect(result).toBe('Bearer [REDACTED]');
    });

    it('should redact API keys in objects', () => {
      const input = {
        apiKey: 'secret123',
        data: 'public data',
        authorization: 'Basic token123'
      };
      const result = sanitizeForLogging(input);
      expect(result).toEqual({
        apiKey: '[REDACTED]',
        data: 'public data',
        authorization: '[REDACTED]'
      });
    });

    it('should redact sensitive keys in nested objects', () => {
      const input = {
        user: {
          name: 'John',
          token: 'secret123',
          password: 'mypassword'
        },
        config: {
          secret: 'topsecret',
          publicData: 'visible'
        }
      };
      const result = sanitizeForLogging(input);
      expect(result).toEqual({
        user: {
          name: 'John',
          token: '[REDACTED]',
          password: '[REDACTED]'
        },
        config: {
          secret: '[REDACTED]',
          publicData: 'visible'
        }
      });
    });

    it('should handle arrays with sensitive data', () => {
      const input = [
        'Basic token123',
        { apiKey: 'secret', data: 'public' },
        'normal string'
      ];
      const result = sanitizeForLogging(input);
      expect(result).toEqual([
        'Basic [REDACTED]',
        { apiKey: '[REDACTED]', data: 'public' },
        'normal string'
      ]);
    });

    it('should preserve non-sensitive data', () => {
      const input = {
        name: 'John Doe',
        email: 'john@example.com',
        data: ['item1', 'item2'],
        config: {
          timeout: 5000,
          retries: 3
        }
      };
      const result = sanitizeForLogging(input);
      expect(result).toEqual(input);
    });
  });

  describe('secureLogger methods', () => {
    it('should sanitize log messages', () => {
      secureLogger.log('User token:', 'Basic secret123');
      expect(console.log).toHaveBeenCalledWith('User token:', 'Basic [REDACTED]');
    });

    it('should sanitize error messages', () => {
      const error = { message: 'Auth failed', token: 'Bearer secret123' };
      secureLogger.error('Error occurred:', error);
      expect(console.error).toHaveBeenCalledWith('Error occurred:', {
        message: 'Auth failed',
        token: '[REDACTED]'
      });
    });

    it('should sanitize warning messages', () => {
      secureLogger.warn('API key detected:', { apiKey: 'secret123' });
      expect(console.warn).toHaveBeenCalledWith('API key detected:', {
        apiKey: '[REDACTED]'
      });
    });

    it('should sanitize info messages', () => {
      secureLogger.info('Config loaded:', { secret: 'topsecret', port: 3000 });
      expect(console.info).toHaveBeenCalledWith('Config loaded:', {
        secret: '[REDACTED]',
        port: 3000
      });
    });

    it('should sanitize debug messages', () => {
      secureLogger.debug('Debug info:', 'password=secret123');
      expect(console.debug).toHaveBeenCalledWith('Debug info:', 'password=[REDACTED]');
    });
  });
});