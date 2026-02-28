import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const result = await db.query('SELECT id, name FROM championships WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Championship not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch championship' }, { status: 500 });
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

    const champRes = await db.query('SELECT name FROM championships WHERE id = $1', [id]);
    if (champRes.rows.length === 0) {
      return NextResponse.json({ error: 'Championship not found' }, { status: 404 });
    }

    const champName: string = champRes.rows[0].name;

    if (!confirmName || confirmName.trim() !== champName) {
      return NextResponse.json(
        { error: 'Name confirmation does not match' },
        { status: 400 }
      );
    }

    // ensure no matches exist in this championship
    const used = await db.query(
      'SELECT id FROM matches WHERE "championshipId" = $1 LIMIT 1',
      [id]
    );
    if (used.rows.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete championship; matches still exist' },
        { status: 400 }
      );
    }

    await db.query('DELETE FROM championships WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete championship' }, { status: 500 });
  }
}
