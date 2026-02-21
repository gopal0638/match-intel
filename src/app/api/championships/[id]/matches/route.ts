import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const matches = db
      .prepare(
        `SELECT m.*, t1.name as team1Name, t2.name as team2Name, c.name as championshipName
         FROM matches m
         JOIN teams t1 ON m.team1Id = t1.id
         JOIN teams t2 ON m.team2Id = t2.id
         JOIN championships c ON m.championshipId = c.id
         WHERE m.championshipId = ?
         ORDER BY m.matchDate DESC`
      )
      .all(id);

    return NextResponse.json(matches);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { team1Id, team2Id, matchDate } = await request.json();

    if (!team1Id || !team2Id || !matchDate) {
      return NextResponse.json(
        { error: 'team1Id, team2Id, and matchDate are required' },
        { status: 400 }
      );
    }

    const db = getDb();
    const result = db
      .prepare(
        'INSERT INTO matches (championshipId, team1Id, team2Id, matchDate) VALUES (?, ?, ?, ?)'
      )
      .run(id, team1Id, team2Id, matchDate);

    return NextResponse.json(
      { id: result.lastInsertRowid },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create match' }, { status: 500 });
  }
}
