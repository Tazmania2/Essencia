#!/usr/bin/env node

/**
 * Environment setup script
 * Helps set up environment variables for local development
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString('base64');
}

function createEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (fs.existsSync(envPath)) {
    console.log('⚠️  .env.local already exists. Skipping creation.');
    return;
  }

  const nextAuthSecret = generateSecret();
  
  const envContent = `# Funifier API Configuration
FUNIFIER_API_KEY=[your_funifier_api_key]
FUNIFIER_BASE_URL=https://service2.funifier.com/v3

# NextAuth Configuration
NEXTAUTH_SECRET=${nextAuthSecret}
NEXTAUTH_URL=http://localhost:3000

# Environment
NODE_ENV=development
`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env.local with default values');
  console.log('🔑 Generated secure NEXTAUTH_SECRET');
}

function displayVercelInstructions() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 VERCEL DEPLOYMENT SETUP');
  console.log('='.repeat(60));
  console.log('\nTo deploy to Vercel, set these environment variables:');
  console.log('\n📋 Required Variables:');
  console.log('FUNIFIER_API_KEY=[your_funifier_api_key]');
  console.log('FUNIFIER_BASE_URL=https://service2.funifier.com/v3');
  console.log('NEXTAUTH_SECRET=<generate-a-secure-32-char-secret>');
  console.log('NEXTAUTH_URL=https://your-app-name.vercel.app');
  
  console.log('\n🔧 Vercel CLI Commands:');
  console.log('vercel env add FUNIFIER_API_KEY');
  console.log('vercel env add FUNIFIER_BASE_URL');
  console.log('vercel env add NEXTAUTH_SECRET');
  console.log('vercel env add NEXTAUTH_URL');
  
  console.log('\n📖 For detailed instructions, see: VERCEL_ENV_SETUP.md');
  console.log('🔍 To validate setup, run: npm run validate:env');
}

function main() {
  console.log('🔧 Setting up environment variables...\n');
  
  createEnvFile();
  displayVercelInstructions();
  
  console.log('\n✅ Environment setup complete!');
}

main();