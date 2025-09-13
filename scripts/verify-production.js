#!/usr/bin/env node

/**
 * Production verification script
 * Tests all critical functionality after deployment
 */

const axios = require('axios');

class ProductionVerifier {
  constructor(baseUrl) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.results = [];
  }

  async log(test, status, message, details = null) {
    const result = {
      test,
      status,
      message,
      details,
      timestamp: new Date().toISOString()
    };
    
    this.results.push(result);
    
    const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
    console.log(`${icon} ${test}: ${message}`);
    
    if (details && status === 'fail') {
      console.log(`   Details: ${JSON.stringify(details, null, 2)}`);
    }
  }

  async testHealthCheck() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/health`, {
        timeout: 10000
      });
      
      if (response.status === 200 && response.data.status === 'healthy') {
        await this.log('Health Check', 'pass', 'API is healthy');
        return true;
      } else {
        await this.log('Health Check', 'fail', 'API returned unhealthy status', response.data);
        return false;
      }
    } catch (error) {
      await this.log('Health Check', 'fail', 'Health check failed', {
        message: error.message,
        code: error.code
      });
      return false;
    }
  }

  async testPageLoad(path, expectedTitle) {
    try {
      const response = await axios.get(`${this.baseUrl}${path}`, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Production-Verifier/1.0'
        }
      });
      
      if (response.status === 200) {
        const hasExpectedContent = expectedTitle ? 
          response.data.includes(expectedTitle) : 
          response.data.includes('<!DOCTYPE html>');
          
        if (hasExpectedContent) {
          await this.log(`Page Load ${path}`, 'pass', 'Page loads successfully');
          return true;
        } else {
          await this.log(`Page Load ${path}`, 'fail', 'Page content unexpected');
          return false;
        }
      } else {
        await this.log(`Page Load ${path}`, 'fail', `HTTP ${response.status}`);
        return false;
      }
    } catch (error) {
      await this.log(`Page Load ${path}`, 'fail', 'Page failed to load', {
        message: error.message,
        status: error.response?.status
      });
      return false;
    }
  }

  async testAPIEndpoint(path, method = 'GET', expectedStatus = 401) {
    try {
      const config = {
        method: method.toLowerCase(),
        url: `${this.baseUrl}/api${path}`,
        timeout: 10000,
        validateStatus: () => true // Don't throw on any status
      };
      
      const response = await axios(config);
      
      if (response.status === expectedStatus) {
        await this.log(`API ${method} ${path}`, 'pass', `Returns expected status ${expectedStatus}`);
        return true;
      } else {
        await this.log(`API ${method} ${path}`, 'warn', `Status ${response.status}, expected ${expectedStatus}`);
        return false;
      }
    } catch (error) {
      await this.log(`API ${method} ${path}`, 'fail', 'API request failed', {
        message: error.message
      });
      return false;
    }
  }

  async testSecurityHeaders() {
    try {
      const response = await axios.get(this.baseUrl, {
        timeout: 10000
      });
      
      const headers = response.headers;
      const securityHeaders = [
        'x-frame-options',
        'x-content-type-options',
        'referrer-policy'
      ];
      
      let missingHeaders = [];
      securityHeaders.forEach(header => {
        if (!headers[header]) {
          missingHeaders.push(header);
        }
      });
      
      if (missingHeaders.length === 0) {
        await this.log('Security Headers', 'pass', 'All security headers present');
        return true;
      } else {
        await this.log('Security Headers', 'warn', 'Some security headers missing', {
          missing: missingHeaders
        });
        return false;
      }
    } catch (error) {
      await this.log('Security Headers', 'fail', 'Could not check security headers', {
        message: error.message
      });
      return false;
    }
  }

  async testHTTPS() {
    if (this.baseUrl.startsWith('https://')) {
      await this.log('HTTPS', 'pass', 'Using HTTPS');
      return true;
    } else {
      await this.log('HTTPS', 'fail', 'Not using HTTPS');
      return false;
    }
  }

  async runAllTests() {
    console.log(`🚀 Starting production verification for: ${this.baseUrl}\n`);
    
    const tests = [
      () => this.testHTTPS(),
      () => this.testHealthCheck(),
      () => this.testPageLoad('/', 'Funifier'),
      () => this.testPageLoad('/login', 'Login'),
      () => this.testAPIEndpoint('/auth', 'POST', 400), // Should return 400 for missing body
      () => this.testAPIEndpoint('/player/test', 'GET', 401), // Should return 401 for missing auth
      () => this.testAPIEndpoint('/dashboard/test', 'GET', 401), // Should return 401 for missing auth
      () => this.testSecurityHeaders()
    ];
    
    let passed = 0;
    let failed = 0;
    let warnings = 0;
    
    for (const test of tests) {
      try {
        const result = await test();
        if (result === true) passed++;
        else if (result === false) failed++;
        else warnings++;
      } catch (error) {
        console.error('Test execution error:', error);
        failed++;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 VERIFICATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  Warnings: ${warnings}`);
    console.log(`📝 Total: ${passed + failed + warnings}`);
    
    if (failed === 0) {
      console.log('\n🎉 All critical tests passed! Production deployment verified.');
      return true;
    } else {
      console.log('\n🚨 Some tests failed. Please review and fix issues before proceeding.');
      return false;
    }
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      baseUrl: this.baseUrl,
      summary: {
        total: this.results.length,
        passed: this.results.filter(r => r.status === 'pass').length,
        failed: this.results.filter(r => r.status === 'fail').length,
        warnings: this.results.filter(r => r.status === 'warn').length
      },
      results: this.results
    };
    
    return report;
  }
}

// Main execution
async function main() {
  const baseUrl = process.argv[2];
  
  if (!baseUrl) {
    console.error('❌ Usage: node verify-production.js <base-url>');
    console.error('   Example: node verify-production.js https://your-app.vercel.app');
    process.exit(1);
  }
  
  const verifier = new ProductionVerifier(baseUrl);
  const success = await verifier.runAllTests();
  
  // Generate report
  const report = verifier.generateReport();
  const reportFile = `verification-report-${Date.now()}.json`;
  
  try {
    const fs = require('fs');
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportFile}`);
  } catch (error) {
    console.warn('⚠️  Could not save report file:', error.message);
  }
  
  process.exit(success ? 0 : 1);
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

if (require.main === module) {
  main();
}

module.exports = ProductionVerifier;