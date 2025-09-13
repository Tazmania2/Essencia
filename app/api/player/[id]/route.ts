import { NextRequest, NextResponse } from 'next/server';
import { FunifierPlayerService } from '../../../../services/funifier-player.service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    const playerId = params.id;

    const playerService = FunifierPlayerService.getInstance();
    const playerData = await playerService.getPlayerStatus(playerId);

    return NextResponse.json(playerData);
  } catch (error) {
    console.error('Player data error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player data' },
      { status: 500 }
    );
  }
}