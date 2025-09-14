import { NextRequest, NextResponse } from 'next/server';
import { FunifierAuthService } from '../../../services/funifier-auth.service';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const authService = FunifierAuthService.getInstance();
    const authResponse = await authService.authenticate({ username, password });

    console.log('🔐 API Route - Auth response type:', typeof authResponse);
    console.log('🔐 API Route - Auth response:', authResponse);

    return NextResponse.json(authResponse);
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    );
  }
}