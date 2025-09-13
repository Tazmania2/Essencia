#!/usr/bin/env node

/**
 * Generate a secure NEXTAUTH_SECRET
 */

const crypto = require('crypto');

function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString('base64');
}

const secret = generateSecret();

console.log('🔑 Generated NEXTAUTH_SECRET:');
console.log(secret);
console.log('\n📋 Copy this value and use it in Vercel environment variables');
console.log('⚠️  Keep this secret secure and don\'t share it publicly!');