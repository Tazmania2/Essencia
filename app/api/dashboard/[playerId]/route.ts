import { NextRequest, NextResponse } from 'next/server';
import { DashboardService } from '../../../../services/dashboard.service';

export async function GET(
  request: NextRequest,
  { params }: { params: { playerId: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const playerId = params.playerId;

    const dashboardService = new DashboardService();
    const dashboardData = await dashboardService.getDashboardData(playerId, token);

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Dashboard data error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}