import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

interface MatchDetailsParams {
  params: Promise<{ id: string }>;
}

interface MatchData {
  id: number;
  team1Id: number;
  team2Id: number;
  team1Name: string;
  team2Name: string;
  [key: string]: any;
}

export async function GET(request: NextRequest, { params }: MatchDetailsParams) {
  try {
    const { id } = await params;
    const db = getDb();

    // Get match details with team info
    const match = db
      .prepare(
        `SELECT m.*,
                t1.name as team1Name,
                t2.name as team2Name
         FROM matches m
         LEFT JOIN teams t1 ON m.team1Id = t1.id
         LEFT JOIN teams t2 ON m.team2Id = t2.id
         WHERE m.id = ?`
      )
      .get(id) as MatchData | undefined;

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Get players from both teams
    const team1Players = db
      .prepare('SELECT id, name, playerType FROM players WHERE teamId = ? ORDER BY name')
      .all(match.team1Id);

    const team2Players = db
      .prepare('SELECT id, name, playerType FROM players WHERE teamId = ? ORDER BY name')
      .all(match.team2Id);

    return NextResponse.json({
      match,
      team1Players,
      team2Players,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch match details' }, { status: 500 });
  }
}
