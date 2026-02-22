import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const result = await db.query(
      `SELECT m.*, t1.name as "team1Name", t2.name as "team2Name", c.name as "championshipName"
       FROM matches m
       JOIN teams t1 ON m."team1Id" = t1.id
       JOIN teams t2 ON m."team2Id" = t2.id
       JOIN championships c ON m."championshipId" = c.id
       WHERE m."championshipId" = $1
       ORDER BY m."matchDate" DESC`,
      [id]
    );

    return NextResponse.json(result.rows);
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
    const { team1Id, team2Id, matchDate, groundName, matchType } = await request.json();

    if (!team1Id || !team2Id || !matchDate || !groundName || !matchType) {
      return NextResponse.json(
        { error: 'team1Id, team2Id, matchDate, groundName and matchType are required' },
        { status: 400 }
      );
    }

    const db = getDb();
    const result = await db.query(
      'INSERT INTO matches ("championshipId", "team1Id", "team2Id", "matchDate", "groundName", "matchType") VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [id, team1Id, team2Id, matchDate, groundName, matchType]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create match' }, { status: 500 });
  }
}
