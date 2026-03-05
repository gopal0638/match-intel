import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

const ALLOWED_PLAYER_TYPES = [
  'batsman',
  'bowler',
  'all rounder',
  'extra player',
  'impact player',
] as const;

type AllowedPlayerType = (typeof ALLOWED_PLAYER_TYPES)[number];

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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; playerId: string }> }
) {
  try {
    const { id, playerId } = await params;
    const { name, playerType } = await request.json();

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Player name is required' }, { status: 400 });
    }

    let normalizedType: AllowedPlayerType = 'all rounder';
    if (playerType && typeof playerType === 'string') {
      const trimmed = playerType.trim() as AllowedPlayerType;
      if (!ALLOWED_PLAYER_TYPES.includes(trimmed)) {
        return NextResponse.json(
          { error: 'Invalid player type' },
          { status: 400 }
        );
      }
      normalizedType = trimmed;
    }

    const db = getDb();

    const result = await db.query(
      `UPDATE players
       SET name = $1, "playerType" = $2
       WHERE id = $3 AND "teamId" = $4
       RETURNING id, "teamId", name, "playerType"`,
      [name.trim(), normalizedType, playerId, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Player already exists in this team' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Failed to update player' }, { status: 500 });
  }
}
