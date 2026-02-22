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
    const matchResult = await db.query(
      `SELECT m.*,
              t1.name as "team1Name",
              t2.name as "team2Name"
       FROM matches m
       LEFT JOIN teams t1 ON m."team1Id" = t1.id
       LEFT JOIN teams t2 ON m."team2Id" = t2.id
       WHERE m.id = $1`,
      [id]
    );

    const match = matchResult.rows[0] as MatchData | undefined;

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Get players from both teams
    const team1Result = await db.query(
      'SELECT id, name, "playerType" FROM players WHERE "teamId" = $1 ORDER BY name',
      [match.team1Id]
    );

    const team2Result = await db.query(
      'SELECT id, name, "playerType" FROM players WHERE "teamId" = $1 ORDER BY name',
      [match.team2Id]
    );

    return NextResponse.json({
      match,
      team1Players: team1Result.rows,
      team2Players: team2Result.rows,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch match details' }, { status: 500 });
  }
}
