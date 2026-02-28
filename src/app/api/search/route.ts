import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

// Advanced search supporting optional filters:
// batsmanOnStrike, batsmanNonStrike, bowler, ground, championship (id or name), limit, offset
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;

    const batsmanOnStrike = params.get('batsmanOnStrike') || undefined;
    const batsmanNonStrike = params.get('batsmanNonStrike') || undefined;
    const bowler = params.get('bowler') || undefined;
    const ground = params.get('ground') || undefined;
    const championship = params.get('championship') || undefined; // may be id or name
    const limit = Math.min(parseInt(params.get('limit') || '100', 10) || 100, 1000);
    const offset = Math.max(parseInt(params.get('offset') || '0', 10) || 0, 0);

    const db = getDb();

    // Build dynamic WHERE clause safely using parameterized queries
    const whereClauses: string[] = [];
    const values: any[] = [];

    // join match table to allow ground and championship filtering
    // we'll always join matches (and championships) for richer context

    if (batsmanOnStrike) {
      values.push(`%${batsmanOnStrike}%`);
      whereClauses.push(`me."batsmanName" ILIKE $${values.length}`);
    }

    if (batsmanNonStrike) {
      values.push(`%${batsmanNonStrike}%`);
      whereClauses.push(`me."nonStrikerName" ILIKE $${values.length}`);
    }

    if (bowler) {
      values.push(`%${bowler}%`);
      whereClauses.push(`me."bowlerName" ILIKE $${values.length}`);
    }

    if (ground) {
      values.push(`%${ground}%`);
      whereClauses.push(`m."groundName" ILIKE $${values.length}`);
    }

    if (championship) {
      // if numeric, match by id; otherwise by championship name
      const maybeId = Number(championship);
      if (!Number.isNaN(maybeId) && String(maybeId) === championship) {
        values.push(maybeId);
        whereClauses.push(`m."championshipId" = $${values.length}`);
      } else {
        values.push(`%${championship}%`);
        whereClauses.push(`c.name ILIKE $${values.length}`);
      }
    }

    // Compose final query
    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Select useful fields and join match/championship/team info for context
    const sql = `
      SELECT me.id, me."matchId", me."ballNumber", me."bowlerName", me."batsmanName", me."nonStrikerName",
             me."eventDescription", me."finalScore", m."matchDate", m."groundName", m."championshipId",
             c.name as "championshipName",
             t1.name as "team1Name", t2.name as "team2Name"
      FROM match_events me
      JOIN matches m ON me."matchId" = m.id
      LEFT JOIN championships c ON m."championshipId" = c.id
      LEFT JOIN teams t1 ON m."team1Id" = t1.id
      LEFT JOIN teams t2 ON m."team2Id" = t2.id
      ${whereSQL}
      ORDER BY m."matchDate" DESC, me.id DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const result = await db.query(sql, values);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Advanced search error:', error);
    return NextResponse.json({ error: 'Failed to run advanced search' }, { status: 500 });
  }
}
