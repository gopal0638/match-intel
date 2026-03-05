import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const result = await db.query('SELECT * FROM championships ORDER BY name');
    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch championships' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, teamIds } = await request.json();

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Championship name is required' }, { status: 400 });
    }

    const db = getDb();

    // normalise teamIds to a unique integer array if provided
    let normalizedTeamIds: number[] = [];
    if (Array.isArray(teamIds)) {
      normalizedTeamIds = Array.from(
        new Set(
          teamIds
            .map((id: any) => parseInt(id, 10))
            .filter((id: number) => Number.isInteger(id) && id > 0)
        )
      );
    }

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const championshipResult = await client.query(
        'INSERT INTO championships (name) VALUES ($1) RETURNING id, name',
        [name]
      );

      const championship = championshipResult.rows[0];

      if (normalizedTeamIds.length > 0) {
        // ensure all provided teams actually exist
        const teamsResult = await client.query(
          'SELECT id FROM teams WHERE id = ANY($1::int[])',
          [normalizedTeamIds]
        );

        if (teamsResult.rows.length !== normalizedTeamIds.length) {
          await client.query('ROLLBACK');
          return NextResponse.json(
            { error: 'One or more selected teams do not exist' },
            { status: 400 }
          );
        }

        // insert championship-team relationships
        await client.query(
          `
          INSERT INTO championship_teams("championshipId", "teamId")
          SELECT $1::int, UNNEST($2::int[])
          ON CONFLICT DO NOTHING
        `,
          [championship.id, normalizedTeamIds]
        );
      }

      await client.query('COMMIT');
      return NextResponse.json(championship, { status: 201 });
    } catch (err: any) {
      await client.query('ROLLBACK');
      if (err.code === '23505') {
        return NextResponse.json(
          { error: 'Championship already exists' },
          { status: 409 }
        );
      }
      throw err;
    } finally {
      client.release();
    }
  } catch (error: any) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Championship already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Failed to add championship' }, { status: 500 });
  }
}
