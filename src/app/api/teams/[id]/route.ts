import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const result = await db.query('SELECT id, name FROM teams WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { confirmName } = await request.json();

    const db = getDb();

    // verify team exists and fetch its name
    const teamRes = await db.query('SELECT name FROM teams WHERE id = $1', [id]);
    if (teamRes.rows.length === 0) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const teamName: string = teamRes.rows[0].name;

    // verify confirmation name
    if (!confirmName || confirmName.trim() !== teamName) {
      return NextResponse.json(
        { error: 'Name confirmation does not match' },
        { status: 400 }
      );
    }

    // check for any matches that reference this team
    const usedResult = await db.query(
      `SELECT m.id,
              t1.name as "team1Name",
              t2.name as "team2Name",
              c.name as "championshipName"
       FROM matches m
       JOIN teams t1 ON m."team1Id" = t1.id
       JOIN teams t2 ON m."team2Id" = t2.id
       JOIN championships c ON m."championshipId" = c.id
       WHERE m."team1Id" = $1 OR m."team2Id" = $1
       LIMIT 1`,
      [id]
    );

    if (usedResult.rows.length > 0) {
      const r = usedResult.rows[0];
      return NextResponse.json(
        {
          error: `Cannot delete team; it is used in match ${r.id} (${r.team1Name} vs ${r.team2Name}) of championship ${r.championshipName}`,
        },
        { status: 400 }
      );
    }

    // safe to delete
    await db.query('DELETE FROM teams WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete team' }, { status: 500 });
  }
}
