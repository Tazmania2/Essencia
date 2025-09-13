# Performance Testing Guide

This document describes the performance testing strategy and tools for the Funifier Gamification Dashboard.

## Overview

The performance testing suite includes:

1. **Performance Tests** - Automated tests that measure application performance metrics
2. **Load Testing** - Simulates multiple concurrent users to test system capacity
3. **Performance Monitoring** - Real-time monitoring during development

## Performance Tests

### Running Performance Tests

```bash
# Run all performance tests
npm run test:performance

# Run with specific browser
npx playwright test e2e/performance.spec.ts --project=chromium

# Run with headed browser to see visual feedback
npx playwright test e2e/performance.spec.ts --headed
```

### Performance Test Coverage

The performance tests cover:

- **Page Load Performance**: Measures initial page load times
- **Authentication Flow**: Times the complete login process
- **Dashboard Loading**: Tests dashboard performance with realistic data sizes
- **Navigation Performance**: Measures rapid user interactions
- **Memory Usage**: Monitors memory consumption during extended sessions
- **Concurrent Requests**: Tests API performance under concurrent load
- **Core Web Vitals**: Measures LCP, FID, CLS, and TTFB

### Performance Budgets

The tests enforce the following performance budgets:

| Metric | Threshold | Description |
|--------|-----------|-------------|
| Login Page Load | < 2 seconds | Initial page load time |
| Authentication Flow | < 3 seconds | Complete login process |
| Dashboard Load (Large Data) | < 4 seconds | Dashboard with realistic data |
| Rapid Navigation | < 5 seconds | Multiple quick interactions |
| Memory Increase | < 50MB or 100% | Memory growth during session |
| Average Request Time | < 1 second | API response times |
| Largest Contentful Paint (LCP) | < 2.5 seconds | Core Web Vital |
| First Input Delay (FID) | < 100ms | Core Web Vital |
| Cumulative Layout Shift (CLS) | < 0.1 | Core Web Vital |
| Time to First Byte (TTFB) | < 800ms | Server response time |

## Load Testing

### Running Load Tests

```bash
# Run load test with default settings (10 users, 60 seconds)
npm run test:load

# Run with custom settings
CONCURRENT_USERS=20 TEST_DURATION=120000 npm run test:load

# Run with specific configuration
BASE_URL=https://your-app.com CONCURRENT_USERS=50 npm run test:load
```

### Load Test Configuration

Environment variables:

- `BASE_URL`: Application URL (default: http://localhost:3000)
- `CONCURRENT_USERS`: Number of concurrent users (default: 10)
- `TEST_DURATION`: Test duration in milliseconds (default: 60000)
- `RAMP_UP_TIME`: Time to gradually start users (default: 10000)
- `THINK_TIME`: Delay between user actions (default: 1000)

### Load Test Scenarios

The load test simulates realistic user behavior:

1. **Player Users (90%)**:
   - Login authentication
   - Dashboard data loading
   - Goal interactions

2. **Admin Users (10%)**:
   - Login authentication
   - Admin panel access
   - Player data export
   - Report upload

### Load Test Metrics

The load test measures:

- **Throughput**: Requests per second
- **Response Times**: Average, min, max, percentiles (50th, 90th, 95th, 99th)
- **Success Rate**: Percentage of successful requests
- **Error Analysis**: Breakdown of error types and frequencies

### Performance Assertions

Load tests fail if:

- Success rate < 95%
- Average response time > 2000ms
- 95th percentile response time > 5000ms
- Throughput < 1 request/second

## Performance Monitoring

### Running Performance Monitor

```bash
# Start real-time performance monitoring
npm run monitor:performance

# Monitor with custom settings
MONITOR_INTERVAL=10000 RESPONSE_TIME_THRESHOLD=3000 npm run monitor:performance
```

### Monitoring Configuration

Environment variables:

- `BASE_URL`: Application URL to monitor
- `MONITOR_INTERVAL`: Check interval in milliseconds (default: 5000)
- `RESPONSE_TIME_THRESHOLD`: Alert threshold for response time (default: 2000ms)
- `ERROR_RATE_THRESHOLD`: Alert threshold for error rate (default: 0.05 = 5%)
- `MEMORY_THRESHOLD`: Alert threshold for memory usage (default: 500MB)

### Monitoring Features

- **Real-time Metrics**: Continuous monitoring of key endpoints
- **Alert System**: Automatic alerts when thresholds are exceeded
- **System Metrics**: Memory and CPU usage tracking
- **Historical Data**: Keeps metrics for the last hour
- **Endpoint Breakdown**: Performance statistics per endpoint

## Performance Optimization Guidelines

### Frontend Optimization

1. **Code Splitting**: Implement route-based code splitting
2. **Lazy Loading**: Load components and data on demand
3. **Memoization**: Use React.memo and useMemo for expensive operations
4. **Bundle Analysis**: Regularly analyze bundle size
5. **Image Optimization**: Optimize images and use appropriate formats
6. **Caching**: Implement proper caching strategies

### Backend Optimization

1. **API Response Times**: Keep API responses under 500ms
2. **Database Queries**: Optimize database queries and use indexes
3. **Caching**: Implement Redis caching for frequently accessed data
4. **Connection Pooling**: Use connection pooling for database connections
5. **Rate Limiting**: Implement rate limiting to prevent abuse
6. **Compression**: Enable gzip compression for responses

### Funifier API Integration

1. **Request Batching**: Batch multiple API calls when possible
2. **Caching**: Cache Funifier responses with appropriate TTL
3. **Error Handling**: Implement proper retry logic with exponential backoff
4. **Timeout Configuration**: Set appropriate timeouts for different operations
5. **Connection Reuse**: Reuse HTTP connections when possible

## Continuous Performance Testing

### CI/CD Integration

Add performance tests to your CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
name: Performance Tests
on: [push, pull_request]

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm start &
      - run: npm run test:performance
      - run: npm run test:load
```

### Performance Regression Detection

1. **Baseline Metrics**: Establish performance baselines for each release
2. **Automated Alerts**: Set up alerts for performance regressions
3. **Performance Budgets**: Enforce performance budgets in CI/CD
4. **Regular Monitoring**: Run performance tests on schedule

## Troubleshooting Performance Issues

### Common Performance Problems

1. **Slow API Responses**:
   - Check Funifier API status
   - Verify network connectivity
   - Review database query performance
   - Check for memory leaks

2. **High Memory Usage**:
   - Look for memory leaks in React components
   - Check for large data structures in memory
   - Review caching strategies
   - Monitor garbage collection

3. **Slow Page Loads**:
   - Analyze bundle size
   - Check for render-blocking resources
   - Review image optimization
   - Verify CDN configuration

4. **Poor User Experience**:
   - Measure Core Web Vitals
   - Check for layout shifts
   - Review loading states
   - Optimize critical rendering path

### Performance Debugging Tools

1. **Browser DevTools**: Use Performance tab for detailed analysis
2. **Lighthouse**: Run Lighthouse audits for comprehensive insights
3. **React DevTools Profiler**: Analyze React component performance
4. **Network Tab**: Monitor network requests and responses
5. **Memory Tab**: Investigate memory usage and leaks

## Performance Benchmarks

### Target Performance Metrics

| Environment | Page Load | API Response | Memory Usage | Success Rate |
|-------------|-----------|--------------|--------------|--------------|
| Development | < 3s | < 1s | < 200MB | > 95% |
| Staging | < 2s | < 500ms | < 150MB | > 98% |
| Production | < 1.5s | < 300ms | < 100MB | > 99% |

### Load Testing Targets

| User Load | Response Time (95th) | Throughput | Success Rate |
|-----------|---------------------|------------|--------------|
| 10 users | < 2s | > 5 req/s | > 95% |
| 50 users | < 3s | > 20 req/s | > 95% |
| 100 users | < 5s | > 30 req/s | > 90% |

## Best Practices

1. **Regular Testing**: Run performance tests regularly, not just before releases
2. **Realistic Data**: Use realistic data sizes and user scenarios
3. **Environment Consistency**: Test in environments similar to production
4. **Gradual Load**: Use gradual ramp-up in load tests
5. **Monitoring**: Implement continuous performance monitoring
6. **Documentation**: Document performance requirements and results
7. **Team Awareness**: Share performance results with the development team
8. **Proactive Optimization**: Address performance issues before they impact users

## Resources

- [Web Performance Best Practices](https://web.dev/performance/)
- [Core Web Vitals](https://web.dev/vitals/)
- [React Performance](https://reactjs.org/docs/optimizing-performance.html)
- [Playwright Performance Testing](https://playwright.dev/docs/test-performance)
- [Load Testing Best Practices](https://k6.io/docs/testing-guides/load-testing-best-practices/)