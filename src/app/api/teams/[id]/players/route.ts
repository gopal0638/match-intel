import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const players = db
      .prepare('SELECT * FROM players WHERE teamId = ? ORDER BY name')
      .all(id);
    return NextResponse.json(players);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name, playerType } = await request.json();

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Player name is required' }, { status: 400 });
    }

    const db = getDb();
    const result = db
      .prepare('INSERT INTO players (teamId, name, playerType) VALUES (?, ?, ?)')
      .run(id, name, playerType || 'all rounder');

    return NextResponse.json(
      { id: result.lastInsertRowid, teamId: id, name, playerType: playerType || 'all rounder' },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message.includes('UNIQUE')) {
      return NextResponse.json(
        { error: 'Player already exists in this team' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Failed to add player' }, { status: 500 });
  }
}
