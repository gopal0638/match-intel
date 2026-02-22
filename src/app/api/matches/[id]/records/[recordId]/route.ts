import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; recordId: string }> }
) {
  try {
    const { id, recordId } = await params;
    const { reviewed, reviewComment } = await request.json();
    const db = getDb();

    // Try updating batsman record first
    let result = await db.query(
      'UPDATE batsman_records SET reviewed = $1, "reviewComment" = $2 WHERE id = $3 RETURNING id',
      [reviewed ? 1 : 0, reviewComment || null, recordId]
    );

    if (result.rows.length === 0) {
      // Try updating bowler record
      result = await db.query(
        'UPDATE bowler_records SET reviewed = $1, "reviewComment" = $2 WHERE id = $3 RETURNING id',
        [reviewed ? 1 : 0, reviewComment || null, recordId]
      );
    }

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update record' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; recordId: string }> }
) {
  try {
    const { id, recordId } = await params;
    const db = getDb();

    // Try deleting from batsman record first
    let result = await db.query('DELETE FROM batsman_records WHERE id = $1 RETURNING id', [recordId]);

    if (result.rows.length === 0) {
      // Try deleting from bowler record
      result = await db.query('DELETE FROM bowler_records WHERE id = $1 RETURNING id', [recordId]);
    }

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 });
  }
}
