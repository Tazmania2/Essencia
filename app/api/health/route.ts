import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Basic health check
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        funifier: {
          configured: !!process.env.FUNIFIER_API_KEY && !!process.env.FUNIFIER_BASE_URL && !!process.env.FUNIFIER_BASIC_TOKEN,
          baseUrl: process.env.FUNIFIER_BASE_URL || 'not configured'
        },
        auth: {
          configured: !!process.env.NEXTAUTH_SECRET
        }
      }
    };

    return NextResponse.json(health);
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed'
      },
      { status: 500 }
    );
  }
}