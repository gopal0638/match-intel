import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

interface ScoreboardParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: ScoreboardParams) {
  try {
    const { id } = await params;
    const db = getDb();

    // Aggregate by innings
    const aggResult = await db.query(
      `
      SELECT
        "inningsNumber" as "inningsNumber",
        SUM("runsScored" + "extraRuns")::int as "totalRuns",
        SUM(CASE WHEN "isWicket" = 1 THEN 1 ELSE 0 END)::int as "wickets",
        SUM(CASE WHEN "isWide" = 0 AND "isNoBall" = 0 THEN 1 ELSE 0 END)::int as "legalBalls",
        SUM("extraRuns")::int as "extras"
      FROM match_events
      WHERE "matchId" = $1
      GROUP BY "inningsNumber"
      ORDER BY "inningsNumber"
    `,
      [id]
    );

    const innings = aggResult.rows.map((row) => {
      const legalBalls: number = row.legalBalls ?? 0;
      const oversInt = Math.floor(legalBalls / 6);
      const ballsInOver = legalBalls % 6;
      const overs = `${oversInt}.${ballsInOver}`;
      const totalRuns: number = row.totalRuns ?? 0;
      const runRate =
        oversInt === 0 && ballsInOver === 0
          ? 0
          : totalRuns / (oversInt + ballsInOver / 6);

      return {
        inningsNumber: row.inningsNumber,
        totalRuns,
        wickets: row.wickets ?? 0,
        overs,
        extras: row.extras ?? 0,
        runRate: Number.isFinite(runRate) ? parseFloat(runRate.toFixed(2)) : 0,
      };
    });

    return NextResponse.json({ innings });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to compute scoreboard' },
      { status: 500 }
    );
  }
}

