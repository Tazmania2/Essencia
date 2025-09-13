#!/bin/bash

# Vercel Environment Variables Setup Script
# Run this script to set up all required environment variables

echo "🔧 Setting up Vercel environment variables..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Login to Vercel (if not already logged in)
echo "🔐 Logging into Vercel..."
vercel login

# Set FUNIFIER_API_KEY
echo "📝 Setting FUNIFIER_API_KEY..."
echo "68a6737a6e1d0e2196db1b1e" | vercel env add FUNIFIER_API_KEY production
echo "68a6737a6e1d0e2196db1b1e" | vercel env add FUNIFIER_API_KEY preview
echo "68a6737a6e1d0e2196db1b1e" | vercel env add FUNIFIER_API_KEY development

# Set FUNIFIER_BASE_URL
echo "📝 Setting FUNIFIER_BASE_URL..."
echo "https://service2.funifier.com/v3" | vercel env add FUNIFIER_BASE_URL production
echo "https://service2.funifier.com/v3" | vercel env add FUNIFIER_BASE_URL preview
echo "https://service2.funifier.com/v3" | vercel env add FUNIFIER_BASE_URL development

# Generate and set NEXTAUTH_SECRET
echo "📝 Generating and setting NEXTAUTH_SECRET..."
NEXTAUTH_SECRET=$(openssl rand -base64 32)
echo "$NEXTAUTH_SECRET" | vercel env add NEXTAUTH_SECRET production
echo "$NEXTAUTH_SECRET" | vercel env add NEXTAUTH_SECRET preview
echo "$NEXTAUTH_SECRET" | vercel env add NEXTAUTH_SECRET development

# Set NEXTAUTH_URL (you'll need to update this with your actual domain)
echo "📝 Setting NEXTAUTH_URL..."
echo "⚠️  Please update NEXTAUTH_URL with your actual domain after deployment"
echo "https://your-app-name.vercel.app" | vercel env add NEXTAUTH_URL production

echo "✅ Environment variables setup complete!"
echo "🔄 Please redeploy your application for changes to take effect"
echo "📝 Don't forget to update NEXTAUTH_URL with your actual domain"