import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; playerId: string }> }
) {
  try {
    const { id, playerId } = await params;
    const db = getDb();

    const result = await db.query(
      'DELETE FROM players WHERE id = $1 AND "teamId" = $2 RETURNING id',
      [playerId, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete player' }, { status: 500 });
  }
}
