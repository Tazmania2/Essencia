#!/usr/bin/env node

/**
 * Performance Monitoring Script
 * 
 * This script monitors the application's performance metrics in real-time
 * and can be used during development to identify performance bottlenecks.
 */

const axios = require('axios');
const { performance } = require('perf_hooks');

// Configuration
const CONFIG = {
  baseURL: process.env.BASE_URL || 'http://localhost:3000',
  monitorInterval: parseInt(process.env.MONITOR_INTERVAL) || 5000, // 5 seconds
  alertThresholds: {
    responseTime: parseInt(process.env.RESPONSE_TIME_THRESHOLD) || 2000, // 2 seconds
    errorRate: parseFloat(process.env.ERROR_RATE_THRESHOLD) || 0.05, // 5%
    memoryUsage: parseInt(process.env.MEMORY_THRESHOLD) || 500 * 1024 * 1024, // 500MB
  }
};

// Monitoring state
const monitoringState = {
  isRunning: false,
  startTime: 0,
  metrics: {
    requests: [],
    errors: [],
    responseTimes: [],
    memoryUsage: [],
    cpuUsage: []
  },
  alerts: []
};

/**
 * Test endpoint performance
 */
async function testEndpoint(endpoint, method = 'GET', data = null) {
  const startTime = performance.now();
  
  try {
    const config = {
      method,
      url: `${CONFIG.baseURL}${endpoint}`,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    return {
      endpoint,
      method,
      success: true,
      status: response.status,
      responseTime,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    return {
      endpoint,
      method,
      success: false,
      status: error.response?.status || 0,
      responseTime,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Get system metrics
 */
function getSystemMetrics() {
  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  return {
    memory: {
      rss: memUsage.rss,
      heapTotal: memUsage.heapTotal,
      heapUsed: memUsage.heapUsed,
      external: memUsage.external,
      arrayBuffers: memUsage.arrayBuffers
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system
    },
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  };
}

/**
 * Check for performance alerts
 */
function checkAlerts(metrics) {
  const alerts = [];
  const now = new Date().toISOString();
  
  // Check response time alerts
  const recentRequests = metrics.requests.filter(r => 
    new Date(r.timestamp) > new Date(Date.now() - 60000) // Last minute
  );
  
  if (recentRequests.length > 0) {
    const avgResponseTime = recentRequests.reduce((sum, r) => sum + r.responseTime, 0) / recentRequests.length;
    
    if (avgResponseTime > CONFIG.alertThresholds.responseTime) {
      alerts.push({
        type: 'HIGH_RESPONSE_TIME',
        message: `Average response time (${avgResponseTime.toFixed(2)}ms) exceeds threshold (${CONFIG.alertThresholds.responseTime}ms)`,
        value: avgResponseTime,
        threshold: CONFIG.alertThresholds.responseTime,
        timestamp: now
      });
    }
    
    // Check error rate
    const errorCount = recentRequests.filter(r => !r.success).length;
    const errorRate = errorCount / recentRequests.length;
    
    if (errorRate > CONFIG.alertThresholds.errorRate) {
      alerts.push({
        type: 'HIGH_ERROR_RATE',
        message: `Error rate (${(errorRate * 100).toFixed(2)}%) exceeds threshold (${(CONFIG.alertThresholds.errorRate * 100).toFixed(2)}%)`,
        value: errorRate,
        threshold: CONFIG.alertThresholds.errorRate,
        timestamp: now
      });
    }
  }
  
  // Check memory usage
  const recentMemory = metrics.memoryUsage.filter(m => 
    new Date(m.timestamp) > new Date(Date.now() - 60000)
  );
  
  if (recentMemory.length > 0) {
    const latestMemory = recentMemory[recentMemory.length - 1];
    
    if (latestMemory.memory.heapUsed > CONFIG.alertThresholds.memoryUsage) {
      alerts.push({
        type: 'HIGH_MEMORY_USAGE',
        message: `Heap memory usage (${(latestMemory.memory.heapUsed / 1024 / 1024).toFixed(2)}MB) exceeds threshold (${(CONFIG.alertThresholds.memoryUsage / 1024 / 1024).toFixed(2)}MB)`,
        value: latestMemory.memory.heapUsed,
        threshold: CONFIG.alertThresholds.memoryUsage,
        timestamp: now
      });
    }
  }
  
  return alerts;
}

/**
 * Generate performance report
 */
function generateReport() {
  const { metrics } = monitoringState;
  const now = new Date();
  const duration = (now.getTime() - monitoringState.startTime) / 1000;
  
  console.log('\n=== PERFORMANCE MONITORING REPORT ===');
  console.log(`Monitoring Duration: ${duration.toFixed(2)} seconds`);
  console.log(`Report Generated: ${now.toISOString()}`);
  
  if (metrics.requests.length > 0) {
    const successfulRequests = metrics.requests.filter(r => r.success);
    const failedRequests = metrics.requests.filter(r => !r.success);
    const successRate = (successfulRequests.length / metrics.requests.length) * 100;
    
    console.log('\n=== REQUEST STATISTICS ===');
    console.log(`Total Requests: ${metrics.requests.length}`);
    console.log(`Successful: ${successfulRequests.length}`);
    console.log(`Failed: ${failedRequests.length}`);
    console.log(`Success Rate: ${successRate.toFixed(2)}%`);
    
    if (successfulRequests.length > 0) {
      const responseTimes = successfulRequests.map(r => r.responseTime);
      const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      const minResponseTime = Math.min(...responseTimes);
      const maxResponseTime = Math.max(...responseTimes);
      
      console.log('\n=== RESPONSE TIME STATISTICS ===');
      console.log(`Average: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`Minimum: ${minResponseTime.toFixed(2)}ms`);
      console.log(`Maximum: ${maxResponseTime.toFixed(2)}ms`);
    }
    
    // Endpoint breakdown
    const endpointStats = {};
    metrics.requests.forEach(r => {
      const key = `${r.method} ${r.endpoint}`;
      if (!endpointStats[key]) {
        endpointStats[key] = { total: 0, successful: 0, avgResponseTime: 0, responseTimes: [] };
      }
      endpointStats[key].total++;
      if (r.success) {
        endpointStats[key].successful++;
        endpointStats[key].responseTimes.push(r.responseTime);
      }
    });
    
    console.log('\n=== ENDPOINT BREAKDOWN ===');
    Object.entries(endpointStats).forEach(([endpoint, stats]) => {
      const successRate = (stats.successful / stats.total) * 100;
      const avgResponseTime = stats.responseTimes.length > 0 
        ? stats.responseTimes.reduce((sum, time) => sum + time, 0) / stats.responseTimes.length 
        : 0;
      
      console.log(`${endpoint}:`);
      console.log(`  Requests: ${stats.total}, Success Rate: ${successRate.toFixed(2)}%, Avg Response: ${avgResponseTime.toFixed(2)}ms`);
    });
  }
  
  if (metrics.memoryUsage.length > 0) {
    const latestMemory = metrics.memoryUsage[metrics.memoryUsage.length - 1];
    
    console.log('\n=== MEMORY USAGE ===');
    console.log(`RSS: ${(latestMemory.memory.rss / 1024 / 1024).toFixed(2)}MB`);
    console.log(`Heap Total: ${(latestMemory.memory.heapTotal / 1024 / 1024).toFixed(2)}MB`);
    console.log(`Heap Used: ${(latestMemory.memory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    console.log(`External: ${(latestMemory.memory.external / 1024 / 1024).toFixed(2)}MB`);
  }
  
  if (monitoringState.alerts.length > 0) {
    console.log('\n=== ALERTS ===');
    const alertSummary = {};
    monitoringState.alerts.forEach(alert => {
      alertSummary[alert.type] = (alertSummary[alert.type] || 0) + 1;
    });
    
    Object.entries(alertSummary).forEach(([type, count]) => {
      console.log(`${type}: ${count} occurrences`);
    });
    
    console.log('\nRecent Alerts:');
    monitoringState.alerts.slice(-5).forEach(alert => {
      console.log(`[${alert.timestamp}] ${alert.type}: ${alert.message}`);
    });
  }
}

/**
 * Monitor application performance
 */
async function monitorPerformance() {
  if (!monitoringState.isRunning) {
    return;
  }
  
  console.log(`[${new Date().toISOString()}] Running performance check...`);
  
  // Test critical endpoints
  const endpoints = [
    { path: '/api/health', method: 'GET' },
    { path: '/api/auth/status', method: 'GET' },
    { path: '/login', method: 'GET' },
    { path: '/dashboard', method: 'GET' }
  ];
  
  // Test endpoints
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint.path, endpoint.method);
    monitoringState.metrics.requests.push(result);
    
    if (!result.success) {
      monitoringState.metrics.errors.push(result);
    }
  }
  
  // Collect system metrics
  const systemMetrics = getSystemMetrics();
  monitoringState.metrics.memoryUsage.push(systemMetrics);
  
  // Check for alerts
  const newAlerts = checkAlerts(monitoringState.metrics);
  monitoringState.alerts.push(...newAlerts);
  
  // Display alerts
  newAlerts.forEach(alert => {
    console.log(`🚨 ALERT: ${alert.message}`);
  });
  
  // Clean up old metrics (keep last hour)
  const oneHourAgo = new Date(Date.now() - 3600000);
  monitoringState.metrics.requests = monitoringState.metrics.requests.filter(r => 
    new Date(r.timestamp) > oneHourAgo
  );
  monitoringState.metrics.memoryUsage = monitoringState.metrics.memoryUsage.filter(m => 
    new Date(m.timestamp) > oneHourAgo
  );
  
  // Schedule next check
  setTimeout(monitorPerformance, CONFIG.monitorInterval);
}

/**
 * Start performance monitoring
 */
function startMonitoring() {
  console.log('Starting performance monitoring...');
  console.log(`Base URL: ${CONFIG.baseURL}`);
  console.log(`Monitor Interval: ${CONFIG.monitorInterval}ms`);
  console.log(`Response Time Threshold: ${CONFIG.alertThresholds.responseTime}ms`);
  console.log(`Error Rate Threshold: ${(CONFIG.alertThresholds.errorRate * 100).toFixed(2)}%`);
  console.log(`Memory Threshold: ${(CONFIG.alertThresholds.memoryUsage / 1024 / 1024).toFixed(2)}MB`);
  console.log('Press Ctrl+C to stop monitoring and generate report\n');
  
  monitoringState.isRunning = true;
  monitoringState.startTime = Date.now();
  
  // Start monitoring
  monitorPerformance();
}

/**
 * Stop performance monitoring
 */
function stopMonitoring() {
  console.log('\nStopping performance monitoring...');
  monitoringState.isRunning = false;
  generateReport();
}

// Handle graceful shutdown
process.on('SIGINT', stopMonitoring);
process.on('SIGTERM', stopMonitoring);

// Start monitoring if run directly
if (require.main === module) {
  startMonitoring();
}

module.exports = {
  startMonitoring,
  stopMonitoring,
  testEndpoint,
  getSystemMetrics,
  CONFIG,
  monitoringState
};