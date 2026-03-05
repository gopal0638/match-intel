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

    const t1 = parseInt(team1Id, 10);
    const t2 = parseInt(team2Id, 10);

    if (!Number.isInteger(t1) || !Number.isInteger(t2) || t1 <= 0 || t2 <= 0) {
      return NextResponse.json(
        { error: 'team1Id and team2Id must be valid team IDs' },
        { status: 400 }
      );
    }

    if (t1 === t2) {
      return NextResponse.json(
        { error: 'A team cannot play against itself. Choose two different teams.' },
        { status: 400 }
      );
    }

    const db = getDb();

    // validate that both teams belong to this championship
    const membershipResult = await db.query(
      `
        SELECT COUNT(*)::int AS count
        FROM championship_teams
        WHERE "championshipId" = $1
          AND "teamId" = ANY($2::int[])
      `,
      [id, [t1, t2]]
    );

    const count = membershipResult.rows[0]?.count ?? 0;
    if (count !== 2) {
      return NextResponse.json(
        { error: 'Both teams must belong to the selected championship' },
        { status: 400 }
      );
    }

    const result = await db.query(
      'INSERT INTO matches ("championshipId", "team1Id", "team2Id", "matchDate", "groundName", "matchType") VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [id, t1, t2, matchDate, groundName, matchType]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create match' }, { status: 500 });
  }
}
