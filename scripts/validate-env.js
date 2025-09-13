#!/usr/bin/env node

/**
 * Environment validation script for production deployment
 * Validates that all required environment variables are set
 */

// Load environment variables from .env files
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const requiredEnvVars = [
  'FUNIFIER_API_KEY',
  'FUNIFIER_BASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL'
];

const optionalEnvVars = [
  'NODE_ENV',
  'VERCEL_URL',
  'VERCEL_ENV'
];

function validateEnvironment() {
  console.log('🔍 Validating environment variables...\n');
  
  let hasErrors = false;
  
  // Check required variables
  console.log('📋 Required Variables:');
  requiredEnvVars.forEach(varName => {
    const value = process.env[varName];
    if (!value) {
      console.log(`❌ ${varName}: Missing`);
      hasErrors = true;
    } else {
      // Mask sensitive values
      const displayValue = varName.includes('SECRET') || varName.includes('KEY') 
        ? '***' + value.slice(-4)
        : value;
      console.log(`✅ ${varName}: ${displayValue}`);
    }
  });
  
  // Check optional variables
  console.log('\n📋 Optional Variables:');
  optionalEnvVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: ${value}`);
    } else {
      console.log(`⚠️  ${varName}: Not set`);
    }
  });
  
  // Validate specific values
  console.log('\n🔧 Configuration Validation:');
  
  // Validate Funifier Base URL
  const funifierUrl = process.env.FUNIFIER_BASE_URL;
  if (funifierUrl && !funifierUrl.startsWith('https://')) {
    console.log('❌ FUNIFIER_BASE_URL: Must use HTTPS');
    hasErrors = true;
  } else if (funifierUrl) {
    console.log('✅ FUNIFIER_BASE_URL: Valid HTTPS URL');
  }
  
  // Validate NextAuth URL
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  if (nextAuthUrl && !nextAuthUrl.startsWith('http')) {
    console.log('❌ NEXTAUTH_URL: Must be a valid URL');
    hasErrors = true;
  } else if (nextAuthUrl) {
    console.log('✅ NEXTAUTH_URL: Valid URL');
  }
  
  // Validate NextAuth Secret length
  const nextAuthSecret = process.env.NEXTAUTH_SECRET;
  if (nextAuthSecret && nextAuthSecret.length < 32) {
    console.log('❌ NEXTAUTH_SECRET: Should be at least 32 characters');
    hasErrors = true;
  } else if (nextAuthSecret) {
    console.log('✅ NEXTAUTH_SECRET: Adequate length');
  }
  
  // Environment-specific checks
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv === 'production') {
    console.log('\n🚀 Production Environment Checks:');
    
    if (nextAuthUrl && nextAuthUrl.includes('localhost')) {
      console.log('❌ NEXTAUTH_URL: Should not use localhost in production');
      hasErrors = true;
    } else {
      console.log('✅ NEXTAUTH_URL: Production-ready');
    }
    
    if (nextAuthSecret === 'your_nextauth_secret_here') {
      console.log('❌ NEXTAUTH_SECRET: Using default value');
      hasErrors = true;
    } else {
      console.log('✅ NEXTAUTH_SECRET: Custom value set');
    }
  }
  
  console.log('\n' + '='.repeat(50));
  
  if (hasErrors) {
    console.log('❌ Environment validation failed!');
    console.log('Please fix the issues above before deploying.');
    process.exit(1);
  } else {
    console.log('✅ Environment validation passed!');
    console.log('Ready for deployment.');
  }
}

// Run validation
validateEnvironment();