import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const batsmenResult = await db.query(
      'SELECT * FROM batsman_records WHERE "matchId" = $1 ORDER BY name',
      [id]
    );

    const bowlersResult = await db.query(
      'SELECT * FROM bowler_records WHERE "matchId" = $1 ORDER BY name',
      [id]
    );

    return NextResponse.json({ batsmen: batsmenResult.rows, bowlers: bowlersResult.rows });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch match records' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { type, name, runsScored, ballsFaced, wicketsTaken, runsConceded } =
      await request.json();

    if (!type || !name) {
      return NextResponse.json(
        { error: 'type and name are required' },
        { status: 400 }
      );
    }

    const db = getDb();

    if (type === 'batsman') {
      if (runsScored === undefined || ballsFaced === undefined) {
        return NextResponse.json(
          { error: 'runsScored and ballsFaced are required for batsman' },
          { status: 400 }
        );
      }

      const result = await db.query(
        'INSERT INTO batsman_records ("matchId", name, "runsScored", "ballsFaced") VALUES ($1, $2, $3, $4) RETURNING id',
        [id, name, runsScored, ballsFaced]
      );

      return NextResponse.json(
        { id: result.rows[0].id, type: 'batsman' },
        { status: 201 }
      );
    } else if (type === 'bowler') {
      if (wicketsTaken === undefined || runsConceded === undefined) {
        return NextResponse.json(
          { error: 'wicketsTaken and runsConceded are required for bowler' },
          { status: 400 }
        );
      }

      const result = await db.query(
        'INSERT INTO bowler_records ("matchId", name, "wicketsTaken", "runsConceded") VALUES ($1, $2, $3, $4) RETURNING id',
        [id, name, wicketsTaken, runsConceded]
      );

      return NextResponse.json(
        { id: result.rows[0].id, type: 'bowler' },
        { status: 201 }
      );
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add record' }, { status: 500 });
  }
}
