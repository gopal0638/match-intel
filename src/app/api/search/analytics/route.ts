import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

/**
 * Analytics API: same filters as /api/search, but returns aggregated stats
 * instead of raw records. Uses the filtered dataset for all calculations.
 */
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;

    const batsmanOnStrike = (params.get('batsmanOnStrike') || '').trim() || undefined;
    const batsmanNonStrike = (params.get('batsmanNonStrike') || '').trim() || undefined;
    const bowler = (params.get('bowler') || '').trim() || undefined;
    const ground = (params.get('ground') || '').trim() || undefined;
    const championship = params.get('championship') || undefined;

    const db = getDb();

    // Reuse same filter logic as search route (parameterized)
    const whereClauses: string[] = [];
    const values: (string | number)[] = [];

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
      const maybeId = Number(championship);
      if (!Number.isNaN(maybeId) && String(maybeId) === championship) {
        values.push(maybeId);
        whereClauses.push(`m."championshipId" = $${values.length}`);
      } else {
        values.push(`%${championship}%`);
        whereClauses.push(`c.name ILIKE $${values.length}`);
      }
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const sql = `
      SELECT
        COUNT(DISTINCT me."matchId")::int AS "matchCount",
        COALESCE(SUM(me."runsScored" + me."extraRuns"), 0)::bigint AS "totalRuns",
        COALESCE(SUM(CASE WHEN me."isWicket" = 1 THEN 1 ELSE 0 END), 0)::bigint AS "wicketCount",
        COUNT(*)::bigint AS "ballCount"
      FROM match_events me
      JOIN matches m ON me."matchId" = m.id
      LEFT JOIN championships c ON m."championshipId" = c.id
      ${whereSQL}
    `;

    const result = await db.query(sql, values);
    const row = result.rows[0] as {
      matchCount: number;
      totalRuns: string;
      wicketCount: string;
      ballCount: string;
    };

    const matchCount = Number(row?.matchCount ?? 0);
    const totalRuns = Number(row?.totalRuns ?? 0);
    const wicketCount = Number(row?.wicketCount ?? 0);
    const ballCount = Number(row?.ballCount ?? 0);

    // Build a human-readable summary sentence based on active filters
    const summarySentence = buildSummarySentence({
      matchCount,
      totalRuns,
      wicketCount,
      ballCount,
      batsmanOnStrike,
      batsmanNonStrike,
      bowler,
      ground,
      championship,
    });

    return NextResponse.json({
      matchCount,
      totalRuns,
      wicketCount,
      ballCount,
      summarySentence,
      filters: {
        batsmanOnStrike: batsmanOnStrike || null,
        batsmanNonStrike: batsmanNonStrike || null,
        bowler: bowler || null,
        ground: ground || null,
        championship: championship || null,
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed to compute analytics' }, { status: 500 });
  }
}

function buildSummarySentence(ctx: {
  matchCount: number;
  totalRuns: number;
  wicketCount: number;
  ballCount: number;
  batsmanOnStrike?: string;
  batsmanNonStrike?: string;
  bowler?: string;
  ground?: string;
  championship?: string;
}): string {
  const {
    matchCount,
    totalRuns,
    wicketCount,
    batsmanOnStrike,
    bowler,
    ground,
    championship,
  } = ctx;

  if (matchCount === 0) {
    const parts: string[] = [];
    if (batsmanOnStrike) parts.push(`No balls found for batsman "${batsmanOnStrike}"`);
    else parts.push('No balls found');
    if (bowler) parts.push(`against bowler "${bowler}"`);
    if (ground) parts.push(`on ground "${ground}"`);
    if (championship) parts.push(`in championship "${championship}"`);
    return parts.join(' ') + '.';
  }

  const segments: string[] = [];

  if (batsmanOnStrike && bowler) {
    segments.push(
      `This batsman (${batsmanOnStrike}) has played ${matchCount} match${matchCount !== 1 ? 'es' : ''} against this bowler (${bowler})`
    );
  } else if (batsmanOnStrike) {
    segments.push(
      `This batsman (${batsmanOnStrike}) has played in ${matchCount} match${matchCount !== 1 ? 'es' : ''}`
    );
  } else if (bowler) {
    segments.push(
      `Against this bowler (${bowler}), there are ${matchCount} match${matchCount !== 1 ? 'es' : ''} in the filtered set`
    );
  } else {
    segments.push(`The filtered set covers ${matchCount} match${matchCount !== 1 ? 'es' : ''}`);
  }

  if (ground) {
    segments.push(`on this ground (${ground})`);
  }
  if (championship) {
    segments.push(`in this championship`);
  }

  segments.push(`, got out ${wicketCount} time${wicketCount !== 1 ? 's' : ''}, and scored ${totalRuns} run${totalRuns !== 1 ? 's' : ''}.`);
  return segments.join(' ');
}
