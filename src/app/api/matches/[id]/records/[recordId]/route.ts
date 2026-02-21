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
    let result = db
      .prepare(
        'UPDATE batsman_records SET reviewed = ?, reviewComment = ? WHERE id = ?'
      )
      .run(reviewed ? 1 : 0, reviewComment || null, recordId);

    if (result.changes === 0) {
      // Try updating bowler record
      result = db
        .prepare(
          'UPDATE bowler_records SET reviewed = ?, reviewComment = ? WHERE id = ?'
        )
        .run(reviewed ? 1 : 0, reviewComment || null, recordId);
    }

    if (result.changes === 0) {
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
    let result = db.prepare('DELETE FROM batsman_records WHERE id = ?').run(recordId);

    if (result.changes === 0) {
      // Try deleting from bowler record
      result = db.prepare('DELETE FROM bowler_records WHERE id = ?').run(recordId);
    }

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 });
  }
}
