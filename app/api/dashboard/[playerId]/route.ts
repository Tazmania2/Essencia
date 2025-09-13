import { NextRequest, NextResponse } from 'next/server';
import { DashboardService } from '../../../../services/dashboard.service';
import { FunifierPlayerService } from '../../../../services/funifier-player.service';
import { FunifierDatabaseService } from '../../../../services/funifier-database.service';
import { TeamProcessorFactory } from '../../../../services/team-processor-factory.service';
import { UserIdentificationService } from '../../../../services/user-identification.service';

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

    const dashboardService = new DashboardService(
      FunifierPlayerService.getInstance(),
      FunifierDatabaseService.getInstance(),
      TeamProcessorFactory.getInstance(),
      UserIdentificationService.getInstance()
    );
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