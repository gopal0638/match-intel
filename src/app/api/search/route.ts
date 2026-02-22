import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const playerName = searchParams.get('name');
    const scope = searchParams.get('scope'); // 'match' or 'championship'
    const matchId = searchParams.get('matchId');
    const championshipId = searchParams.get('championshipId');

    if (!playerName) {
      return NextResponse.json({ error: 'Player name is required' }, { status: 400 });
    }

    const db = getDb();
    const searchPattern = `%${playerName}%`;

    let batsmen: any[] = [];
    let bowlers: any[] = [];

    if (scope === 'match' && matchId) {
      // Search within a specific match
      const batsmenResult = await db.query(
        `SELECT DISTINCT
          me.id,
          me."matchId",
          me."batsmanName" as name,
          'batsman' as role
        FROM match_events me
        WHERE me."matchId" = $1 AND me."batsmanName" ILIKE $2
        ORDER BY me.id`,
        [matchId, searchPattern]
      );
      batsmen = batsmenResult.rows;

      const bowlersResult = await db.query(
        `SELECT DISTINCT
          me.id,
          me."matchId",
          me."bowlerName" as name,
          'bowler' as role
        FROM match_events me
        WHERE me."matchId" = $1 AND me."bowlerName" ILIKE $2
        ORDER BY me.id`,
        [matchId, searchPattern]
      );
      bowlers = bowlersResult.rows;
    } else if (scope === 'championship' && championshipId) {
      // Search within a championship
      const batsmenResult = await db.query(
        `SELECT DISTINCT
          me.id,
          me."matchId",
          me."batsmanName" as name,
          'batsman' as role
        FROM match_events me
        JOIN matches m ON me."matchId" = m.id
        WHERE m."championshipId" = $1 AND me."batsmanName" ILIKE $2
        ORDER BY me.id`,
        [championshipId, searchPattern]
      );
      batsmen = batsmenResult.rows;

      const bowlersResult = await db.query(
        `SELECT DISTINCT
          me.id,
          me."matchId",
          me."bowlerName" as name,
          'bowler' as role
        FROM match_events me
        JOIN matches m ON me."matchId" = m.id
        WHERE m."championshipId" = $1 AND me."bowlerName" ILIKE $2
        ORDER BY me.id`,
        [championshipId, searchPattern]
      );
      bowlers = bowlersResult.rows;
    } else {
      // Global search
      const batsmenResult = await db.query(
        `SELECT DISTINCT
          me.id,
          me."matchId",
          me."batsmanName" as name,
          'batsman' as role
        FROM match_events me
        WHERE me."batsmanName" ILIKE $1
        ORDER BY me.id`,
        [searchPattern]
      );
      batsmen = batsmenResult.rows;

      const bowlersResult = await db.query(
        `SELECT DISTINCT
          me.id,
          me."matchId",
          me."bowlerName" as name,
          'bowler' as role
        FROM match_events me
        WHERE me."bowlerName" ILIKE $1
        ORDER BY me.id`,
        [searchPattern]
      );
      bowlers = bowlersResult.rows;
    }

    return NextResponse.json({
      batsmen,
      bowlers,
      count: batsmen.length + bowlers.length,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Failed to search records', details: String(error) }, { status: 500 });
  }
}
