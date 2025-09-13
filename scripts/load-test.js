#!/usr/bin/env node

/**
 * Load Testing Script for Funifier Gamification Dashboard
 * 
 * This script simulates multiple concurrent users accessing the application
 * to test performance under load.
 */

const axios = require('axios');
const { performance } = require('perf_hooks');

// Configuration
const CONFIG = {
  baseURL: process.env.BASE_URL || 'http://localhost:3000',
  concurrentUsers: parseInt(process.env.CONCURRENT_USERS) || 10,
  testDuration: parseInt(process.env.TEST_DURATION) || 60000, // 60 seconds
  rampUpTime: parseInt(process.env.RAMP_UP_TIME) || 10000, // 10 seconds
  thinkTime: parseInt(process.env.THINK_TIME) || 1000, // 1 second between requests
};

// Test scenarios
const SCENARIOS = {
  LOGIN: 'login',
  DASHBOARD: 'dashboard',
  ADMIN: 'admin',
  REPORT_UPLOAD: 'report_upload'
};

// Performance metrics
const metrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  responseTimes: [],
  errors: [],
  startTime: 0,
  endTime: 0
};

// Mock data for testing
const MOCK_USERS = Array.from({ length: 100 }, (_, i) => ({
  username: `testuser${i + 1}@test.com`,
  password: 'testpassword123',
  isAdmin: i % 10 === 0 // Every 10th user is admin
}));

/**
 * Simulate authentication request
 */
async function authenticate(user) {
  const startTime = performance.now();
  
  try {
    const response = await axios.post(`${CONFIG.baseURL}/api/auth/login`, {
      username: user.username,
      password: user.password
    }, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    metrics.totalRequests++;
    metrics.responseTimes.push(responseTime);
    
    if (response.status === 200) {
      metrics.successfulRequests++;
      return {
        success: true,
        token: response.data.access_token,
        responseTime
      };
    } else {
      metrics.failedRequests++;
      return { success: false, responseTime };
    }
  } catch (error) {
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    metrics.totalRequests++;
    metrics.failedRequests++;
    metrics.responseTimes.push(responseTime);
    metrics.errors.push({
      type: 'authentication',
      message: error.message,
      responseTime
    });
    
    return { success: false, error: error.message, responseTime };
  }
}

/**
 * Simulate dashboard data loading
 */
async function loadDashboard(token) {
  const startTime = performance.now();
  
  try {
    // Simulate multiple API calls that happen on dashboard load
    const requests = [
      axios.get(`${CONFIG.baseURL}/api/player/status`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000
      }),
      axios.get(`${CONFIG.baseURL}/api/database/essencia_reports__c`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000
      })
    ];
    
    const responses = await Promise.all(requests);
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    metrics.totalRequests += requests.length;
    metrics.responseTimes.push(responseTime);
    
    const allSuccessful = responses.every(r => r.status === 200);
    if (allSuccessful) {
      metrics.successfulRequests += requests.length;
    } else {
      metrics.failedRequests += requests.length;
    }
    
    return { success: allSuccessful, responseTime };
  } catch (error) {
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    metrics.totalRequests += 2; // We attempted 2 requests
    metrics.failedRequests += 2;
    metrics.responseTimes.push(responseTime);
    metrics.errors.push({
      type: 'dashboard',
      message: error.message,
      responseTime
    });
    
    return { success: false, error: error.message, responseTime };
  }
}

/**
 * Simulate admin operations
 */
async function performAdminOperations(token) {
  const startTime = performance.now();
  
  try {
    // Simulate admin operations: list players, export data
    const requests = [
      axios.get(`${CONFIG.baseURL}/api/admin/players`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 20000
      }),
      axios.get(`${CONFIG.baseURL}/api/admin/export/players`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 30000
      })
    ];
    
    const responses = await Promise.all(requests);
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    metrics.totalRequests += requests.length;
    metrics.responseTimes.push(responseTime);
    
    const allSuccessful = responses.every(r => r.status === 200);
    if (allSuccessful) {
      metrics.successfulRequests += requests.length;
    } else {
      metrics.failedRequests += requests.length;
    }
    
    return { success: allSuccessful, responseTime };
  } catch (error) {
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    metrics.totalRequests += 2;
    metrics.failedRequests += 2;
    metrics.responseTimes.push(responseTime);
    metrics.errors.push({
      type: 'admin',
      message: error.message,
      responseTime
    });
    
    return { success: false, error: error.message, responseTime };
  }
}

/**
 * Simulate report upload
 */
async function uploadReport(token) {
  const startTime = performance.now();
  
  try {
    // Create mock CSV data
    const csvData = `playerId,playerName,team,atividade,reaisPorAtivo,faturamento
player_1,Test Player 1,CARTEIRA_I,85,120,95
player_2,Test Player 2,CARTEIRA_II,75,110,88
player_3,Test Player 3,CARTEIRA_III,90,105,92`;
    
    const formData = new FormData();
    formData.append('file', new Blob([csvData], { type: 'text/csv' }), 'test-report.csv');
    
    const response = await axios.post(`${CONFIG.baseURL}/api/admin/upload/report`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      },
      timeout: 60000 // Longer timeout for file upload
    });
    
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    metrics.totalRequests++;
    metrics.responseTimes.push(responseTime);
    
    if (response.status === 200) {
      metrics.successfulRequests++;
      return { success: true, responseTime };
    } else {
      metrics.failedRequests++;
      return { success: false, responseTime };
    }
  } catch (error) {
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    metrics.totalRequests++;
    metrics.failedRequests++;
    metrics.responseTimes.push(responseTime);
    metrics.errors.push({
      type: 'upload',
      message: error.message,
      responseTime
    });
    
    return { success: false, error: error.message, responseTime };
  }
}

/**
 * Simulate a user session
 */
async function simulateUserSession(userId) {
  const user = MOCK_USERS[userId % MOCK_USERS.length];
  const sessionLog = [];
  
  console.log(`Starting session for user ${userId}: ${user.username}`);
  
  try {
    // Step 1: Authenticate
    const authResult = await authenticate(user);
    sessionLog.push({ step: 'auth', ...authResult });
    
    if (!authResult.success) {
      console.log(`User ${userId} authentication failed`);
      return sessionLog;
    }
    
    // Think time
    await new Promise(resolve => setTimeout(resolve, CONFIG.thinkTime));
    
    // Step 2: Load dashboard or admin panel
    if (user.isAdmin) {
      const adminResult = await performAdminOperations(authResult.token);
      sessionLog.push({ step: 'admin', ...adminResult });
      
      // Think time
      await new Promise(resolve => setTimeout(resolve, CONFIG.thinkTime));
      
      // Step 3: Upload report (admin only)
      const uploadResult = await uploadReport(authResult.token);
      sessionLog.push({ step: 'upload', ...uploadResult });
    } else {
      const dashboardResult = await loadDashboard(authResult.token);
      sessionLog.push({ step: 'dashboard', ...dashboardResult });
    }
    
    console.log(`Completed session for user ${userId}`);
    return sessionLog;
    
  } catch (error) {
    console.error(`Error in user ${userId} session:`, error.message);
    sessionLog.push({ step: 'error', error: error.message });
    return sessionLog;
  }
}

/**
 * Run load test with gradual ramp-up
 */
async function runLoadTest() {
  console.log('Starting load test with configuration:');
  console.log(`- Base URL: ${CONFIG.baseURL}`);
  console.log(`- Concurrent Users: ${CONFIG.concurrentUsers}`);
  console.log(`- Test Duration: ${CONFIG.testDuration}ms`);
  console.log(`- Ramp-up Time: ${CONFIG.rampUpTime}ms`);
  console.log(`- Think Time: ${CONFIG.thinkTime}ms`);
  console.log('');
  
  metrics.startTime = performance.now();
  
  const userSessions = [];
  const rampUpInterval = CONFIG.rampUpTime / CONFIG.concurrentUsers;
  
  // Start users gradually (ramp-up)
  for (let i = 0; i < CONFIG.concurrentUsers; i++) {
    setTimeout(() => {
      const sessionPromise = simulateUserSession(i);
      userSessions.push(sessionPromise);
    }, i * rampUpInterval);
  }
  
  // Wait for test duration
  await new Promise(resolve => setTimeout(resolve, CONFIG.testDuration));
  
  // Wait for all sessions to complete
  console.log('Waiting for all user sessions to complete...');
  await Promise.allSettled(userSessions);
  
  metrics.endTime = performance.now();
  
  // Generate report
  generateReport();
}

/**
 * Generate performance report
 */
function generateReport() {
  const testDuration = (metrics.endTime - metrics.startTime) / 1000; // Convert to seconds
  const throughput = metrics.totalRequests / testDuration;
  const successRate = (metrics.successfulRequests / metrics.totalRequests) * 100;
  
  // Calculate response time statistics
  const sortedTimes = metrics.responseTimes.sort((a, b) => a - b);
  const avgResponseTime = sortedTimes.reduce((sum, time) => sum + time, 0) / sortedTimes.length;
  const minResponseTime = Math.min(...sortedTimes);
  const maxResponseTime = Math.max(...sortedTimes);
  const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)];
  const p90 = sortedTimes[Math.floor(sortedTimes.length * 0.9)];
  const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
  const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)];
  
  console.log('\n=== LOAD TEST RESULTS ===');
  console.log(`Test Duration: ${testDuration.toFixed(2)} seconds`);
  console.log(`Total Requests: ${metrics.totalRequests}`);
  console.log(`Successful Requests: ${metrics.successfulRequests}`);
  console.log(`Failed Requests: ${metrics.failedRequests}`);
  console.log(`Success Rate: ${successRate.toFixed(2)}%`);
  console.log(`Throughput: ${throughput.toFixed(2)} requests/second`);
  console.log('');
  console.log('=== RESPONSE TIME STATISTICS ===');
  console.log(`Average: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`Minimum: ${minResponseTime.toFixed(2)}ms`);
  console.log(`Maximum: ${maxResponseTime.toFixed(2)}ms`);
  console.log(`50th Percentile: ${p50.toFixed(2)}ms`);
  console.log(`90th Percentile: ${p90.toFixed(2)}ms`);
  console.log(`95th Percentile: ${p95.toFixed(2)}ms`);
  console.log(`99th Percentile: ${p99.toFixed(2)}ms`);
  
  if (metrics.errors.length > 0) {
    console.log('\n=== ERRORS ===');
    const errorSummary = {};
    metrics.errors.forEach(error => {
      const key = `${error.type}: ${error.message}`;
      errorSummary[key] = (errorSummary[key] || 0) + 1;
    });
    
    Object.entries(errorSummary).forEach(([error, count]) => {
      console.log(`${error}: ${count} occurrences`);
    });
  }
  
  // Performance assertions
  console.log('\n=== PERFORMANCE ASSERTIONS ===');
  const assertions = [
    { name: 'Success Rate > 95%', condition: successRate > 95, value: `${successRate.toFixed(2)}%` },
    { name: 'Average Response Time < 2000ms', condition: avgResponseTime < 2000, value: `${avgResponseTime.toFixed(2)}ms` },
    { name: '95th Percentile < 5000ms', condition: p95 < 5000, value: `${p95.toFixed(2)}ms` },
    { name: 'Throughput > 1 req/sec', condition: throughput > 1, value: `${throughput.toFixed(2)} req/sec` }
  ];
  
  assertions.forEach(assertion => {
    const status = assertion.condition ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${assertion.name}: ${assertion.value}`);
  });
  
  // Exit with error code if any assertions failed
  const allPassed = assertions.every(a => a.condition);
  if (!allPassed) {
    console.log('\n❌ Some performance assertions failed!');
    process.exit(1);
  } else {
    console.log('\n✅ All performance assertions passed!');
    process.exit(0);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT, generating report...');
  metrics.endTime = performance.now();
  generateReport();
});

process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM, generating report...');
  metrics.endTime = performance.now();
  generateReport();
});

// Start the load test
if (require.main === module) {
  runLoadTest().catch(error => {
    console.error('Load test failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runLoadTest,
  simulateUserSession,
  CONFIG,
  metrics
};