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
      // Search within a specific match - search in match_events table
      batsmen = db
        .prepare(
          `SELECT DISTINCT
            ROW_NUMBER() OVER (ORDER BY me.id) as id,
            me.matchId,
            me.batsmanName as name,
            'batsman' as role
          FROM match_events me
          WHERE me.matchId = ? AND me.batsmanName LIKE ?
          ORDER BY me.id`
        )
        .all(matchId, searchPattern);

      bowlers = db
        .prepare(
          `SELECT DISTINCT
            ROW_NUMBER() OVER (ORDER BY me.id) as id,
            me.matchId,
            me.bowlerName as name,
            'bowler' as role
          FROM match_events me
          WHERE me.matchId = ? AND me.bowlerName LIKE ?
          ORDER BY me.id`
        )
        .all(matchId, searchPattern);
    } else if (scope === 'championship' && championshipId) {
      // Search within a championship
      batsmen = db
        .prepare(
          `SELECT DISTINCT
            ROW_NUMBER() OVER (ORDER BY me.id) as id,
            me.matchId,
            me.batsmanName as name,
            'batsman' as role
          FROM match_events me
          JOIN matches m ON me.matchId = m.id
          WHERE m.championshipId = ? AND me.batsmanName LIKE ?
          ORDER BY me.id`
        )
        .all(championshipId, searchPattern);

      bowlers = db
        .prepare(
          `SELECT DISTINCT
            ROW_NUMBER() OVER (ORDER BY me.id) as id,
            me.matchId,
            me.bowlerName as name,
            'bowler' as role
          FROM match_events me
          JOIN matches m ON me.matchId = m.id
          WHERE m.championshipId = ? AND me.bowlerName LIKE ?
          ORDER BY me.id`
        )
        .all(championshipId, searchPattern);
    } else {
      // Global search
      batsmen = db
        .prepare(
          `SELECT DISTINCT
            ROW_NUMBER() OVER (ORDER BY me.id) as id,
            me.matchId,
            me.batsmanName as name,
            'batsman' as role
          FROM match_events me
          WHERE me.batsmanName LIKE ?
          ORDER BY me.id`
        )
        .all(searchPattern);

      bowlers = db
        .prepare(
          `SELECT DISTINCT
            ROW_NUMBER() OVER (ORDER BY me.id) as id,
            me.matchId,
            me.bowlerName as name,
            'bowler' as role
          FROM match_events me
          WHERE me.bowlerName LIKE ?
          ORDER BY me.id`
        )
        .all(searchPattern);
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
