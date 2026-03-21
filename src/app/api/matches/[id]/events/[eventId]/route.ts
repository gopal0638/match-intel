import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

interface EventParams {
  params: Promise<{ id: string; eventId: string }>;
}

async function getDismissedBatsmen(
  matchId: string,
  inningsNumber: number,
  excludeEventId?: string
) {
  const db = getDb();
  const query = excludeEventId
    ? `SELECT "batsmanName", "nonStrikerName", "dismissalType", "runOutBatsman"
       FROM match_events
       WHERE "matchId" = $1 AND "inningsNumber" = $2 AND "isWicket" = 1 AND id <> $3`
    : `SELECT "batsmanName", "nonStrikerName", "dismissalType", "runOutBatsman"
       FROM match_events
       WHERE "matchId" = $1 AND "inningsNumber" = $2 AND "isWicket" = 1`;
  const params = excludeEventId ? [matchId, inningsNumber, excludeEventId] : [matchId, inningsNumber];
  const result = await db.query(query, params);

  const dismissed = new Set<string>();
  for (const row of result.rows as {
    batsmanName: string;
    nonStrikerName: string | null;
    dismissalType: string | null;
    runOutBatsman: string | null;
  }[]) {
    const isRunOutNonStriker =
      row.dismissalType === 'Run out' && row.runOutBatsman === 'nonStriker';
    const outPlayer = isRunOutNonStriker ? row.nonStrikerName : row.batsmanName;
    if (outPlayer) dismissed.add(outPlayer);
  }
  return dismissed;
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
      nonStrikerName,
      bookmaker,
      favTeam,
      fancy1,
      fancy2,
      ballInfo,
      eventOccurred,
      eventDescription,
      hasComment,
      eventComment,
      inningsNumber,
      runsScored,
      extraRuns,
      isWide,
      isNoBall,
      isBye,
      isLegBye,
      isWicket,
      isInningsComplete,
      dismissalType,
      runOutBatsman,
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

    const innings =
      typeof inningsNumber === 'number' && inningsNumber >= 1
        ? inningsNumber
        : eventResult.rows[0].inningsNumber || 1;

    const dismissedBatsmen = await getDismissedBatsmen(id, innings, eventId);
    if (dismissedBatsmen.has(batsmanName)) {
      return NextResponse.json(
        { error: 'Selected batsman is already out in this innings' },
        { status: 400 }
      );
    }
    if (nonStrikerName && dismissedBatsmen.has(nonStrikerName)) {
      return NextResponse.json(
        { error: 'Selected non-striker is already out in this innings' },
        { status: 400 }
      );
    }

    const safeRunsScored = Number.isFinite(runsScored) && runsScored >= 0 ? runsScored : 0;
    let safeExtraRuns = Number.isFinite(extraRuns) && extraRuns >= 0 ? extraRuns : 0;
    const wide = !!isWide;
    const noBall = !!isNoBall;
    const bye = !!isBye;
    const legBye = !!isLegBye;
    const wicket = !!isWicket;
    const inningsComplete = !!isInningsComplete;

    if (wide || noBall) {
      safeExtraRuns += 1;
    }

    const runOutValue =
      dismissalType === 'Run out' && (runOutBatsman === 'striker' || runOutBatsman === 'nonStriker')
        ? runOutBatsman
        : null;

    const result = await db.query(
      `UPDATE match_events
       SET "ballNumber" = $1,
           "bowlerName" = $2,
           "batsmanName" = $3,
           "nonStrikerName" = $4,
           "inningsNumber" = $5,
           bookmaker = $6,
           "favTeam" = $7,
           fancy1 = $8,
           fancy2 = $9,
           "ballInfo" = $10,
           "finalScore" = $11,
           "eventOccurred" = $12,
           "eventDescription" = $13,
           "hasComment" = $14,
           "eventComment" = $15,
           "runsScored" = $16,
           "extraRuns" = $17,
           "isWide" = $18,
           "isNoBall" = $19,
           "isBye" = $20,
           "isLegBye" = $21,
           "isWicket" = $22,
           "isInningsComplete" = $23,
           "dismissalType" = $24,
           "runOutBatsman" = $25
       WHERE id = $26 RETURNING *`,
      [
        ballNumber,
        bowlerName,
        batsmanName,
        nonStrikerName || null,
        innings,
        bookmaker || null,
        favTeam || null,
        fancy1 || null,
        fancy2 || null,
        ballInfo || null,
        null,
        eventOccurred ? 1 : 0,
        eventDescription || null,
        hasComment ? 1 : 0,
        eventComment || null,
        safeRunsScored,
        safeExtraRuns,
        wide ? 1 : 0,
        noBall ? 1 : 0,
        bye ? 1 : 0,
        legBye ? 1 : 0,
        wicket ? 1 : 0,
        inningsComplete ? 1 : 0,
        dismissalType && String(dismissalType).trim() ? String(dismissalType).trim() : null,
        runOutValue,
        eventId,
      ]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}
