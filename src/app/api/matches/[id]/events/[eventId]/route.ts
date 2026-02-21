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
    const event = db.prepare('SELECT * FROM match_events WHERE id = ? AND matchId = ?').get(eventId, id);

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    db.prepare('DELETE FROM match_events WHERE id = ?').run(eventId);

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
    const event = db.prepare('SELECT * FROM match_events WHERE id = ? AND matchId = ?').get(eventId, id);

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    db.prepare(
      `UPDATE match_events
       SET ballNumber = ?, bowlerName = ?, batsmanName = ?, bookmaker = ?, favTeam = ?, fancy = ?,
           ballInfo = ?, finalScore = ?, eventOccurred = ?, eventDescription = ?, hasComment = ?, eventComment = ?
       WHERE id = ?`
    ).run(
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
      eventId
    );

    return NextResponse.json({
      id: eventId,
      matchId: id,
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
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}
