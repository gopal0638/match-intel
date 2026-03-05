import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    // Verify championship exists (optional but returns clearer 404)
    const champResult = await db.query('SELECT id FROM championships WHERE id = $1', [id]);
    if (champResult.rows.length === 0) {
      return NextResponse.json({ error: 'Championship not found' }, { status: 404 });
    }

    const result = await db.query(
      `SELECT t.id, t.name
       FROM championship_teams ct
       JOIN teams t ON ct."teamId" = t.id
       WHERE ct."championshipId" = $1
       ORDER BY t.name`,
      [id]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch championship teams' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { teamIds } = await request.json();

    if (!Array.isArray(teamIds)) {
      return NextResponse.json(
        { error: 'teamIds must be an array of team IDs' },
        { status: 400 }
      );
    }

    const normalizedTeamIds: number[] = Array.from(
      new Set(
        teamIds
          .map((val: any) => parseInt(val, 10))
          .filter((val: number) => Number.isInteger(val) && val > 0)
      )
    );

    const db = getDb();
    const client = await db.connect();

    try {
      await client.query('BEGIN');

      // Verify championship exists
      const champResult = await client.query('SELECT id FROM championships WHERE id = $1', [id]);
      if (champResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Championship not found' }, { status: 404 });
      }

      // Ensure all provided teams exist
      if (normalizedTeamIds.length > 0) {
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
      }

      // Determine which teams would be removed
      const currentResult = await client.query(
        'SELECT "teamId" FROM championship_teams WHERE "championshipId" = $1',
        [id]
      );
      const currentIds = currentResult.rows.map((r) => r.teamId as number);
      const toRemove = currentIds.filter((teamId) => !normalizedTeamIds.includes(teamId));

      // Prevent removing a team that is already used in matches for this championship
      if (toRemove.length > 0) {
        const usedResult = await client.query(
          `
          SELECT id
          FROM matches
          WHERE "championshipId" = $1
            AND ("team1Id" = ANY($2::int[]) OR "team2Id" = ANY($2::int[]))
          LIMIT 1
        `,
          [id, toRemove]
        );

        if (usedResult.rows.length > 0) {
          await client.query('ROLLBACK');
          return NextResponse.json(
            {
              error:
                'Cannot remove one or more teams because they are already used by matches in this championship',
            },
            { status: 400 }
          );
        }
      }

      // Replace relationships: delete removed, insert new (keep existing)
      if (toRemove.length > 0) {
        await client.query(
          `
          DELETE FROM championship_teams
          WHERE "championshipId" = $1
            AND "teamId" = ANY($2::int[])
        `,
          [id, toRemove]
        );
      }

      if (normalizedTeamIds.length > 0) {
        await client.query(
          `
          INSERT INTO championship_teams("championshipId", "teamId")
          SELECT $1::int, UNNEST($2::int[])
          ON CONFLICT DO NOTHING
        `,
          [id, normalizedTeamIds]
        );
      }

      await client.query('COMMIT');

      // Return the updated list
      const updated = await db.query(
        `SELECT t.id, t.name
         FROM championship_teams ct
         JOIN teams t ON ct."teamId" = t.id
         WHERE ct."championshipId" = $1
         ORDER BY t.name`,
        [id]
      );

      return NextResponse.json(updated.rows);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update championship teams' },
      { status: 500 }
    );
  }
}

