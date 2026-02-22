import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

interface EventParams {
  params: Promise<{ id: string; eventId: string }>;
}

export async function DELETE(request: NextRequest, { params }: EventParams) {
  try {
    const { id, eventId } = await params;
    const db = getDb();

    // Verify event belongs to match
    const eventResult = await db.query(
      'SELECT * FROM match_events WHERE id = $1 AND "matchId" = $2',
      [eventId, id]
    );

    if (eventResult.rows.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    await db.query('DELETE FROM match_events WHERE id = $1', [eventId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: EventParams) {
  try {
    const { id, eventId } = await params;
    const {
      ballNumber,
      bowlerName,
      batsmanName,
      bookmaker,
      favTeam,
      fancy,
      ballInfo,
      finalScore,
      eventOccurred,
      eventDescription,
      hasComment,
      eventComment,
    } = await request.json();

    const db = getDb();

    // Verify event belongs to match
    const eventResult = await db.query(
      'SELECT * FROM match_events WHERE id = $1 AND "matchId" = $2',
      [eventId, id]
    );

    if (eventResult.rows.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const result = await db.query(
      `UPDATE match_events
       SET "ballNumber" = $1, "bowlerName" = $2, "batsmanName" = $3, bookmaker = $4, "favTeam" = $5, fancy = $6,
           "ballInfo" = $7, "finalScore" = $8, "eventOccurred" = $9, "eventDescription" = $10, "hasComment" = $11, "eventComment" = $12
       WHERE id = $13 RETURNING *`,
      [
        ballNumber,
        bowlerName,
        batsmanName,
        bookmaker || null,
        favTeam || null,
        fancy || null,
        ballInfo || null,
        finalScore || null,
        eventOccurred ? 1 : 0,
        eventDescription || null,
        hasComment ? 1 : 0,
        eventComment || null,
        eventId,
      ]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}
