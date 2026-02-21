import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

interface MatchEventsParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: MatchEventsParams) {
  try {
    const { id } = await params;
    const db = getDb();
    const events = db
      .prepare(
        `SELECT * FROM match_events
         WHERE matchId = ?
         ORDER BY
           CAST(SUBSTR(ballNumber, 1, INSTR(ballNumber, '.') - 1) AS INTEGER),
           CAST(SUBSTR(ballNumber, INSTR(ballNumber, '.') + 1) AS INTEGER)`
      )
      .all(id);
    return NextResponse.json(events);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch match events' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: MatchEventsParams) {
  try {
    const { id } = await params;
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

    if (!ballNumber || !bowlerName || !batsmanName) {
      return NextResponse.json(
        { error: 'Ball number, bowler name, and batsman name are required' },
        { status: 400 }
      );
    }

    const db = getDb();
    const result = db
      .prepare(
        `INSERT INTO match_events (
          matchId, ballNumber, bowlerName, batsmanName, bookmaker, favTeam, fancy, ballInfo,
          finalScore, eventOccurred, eventDescription, hasComment, eventComment
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
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
        eventComment || null
      );

    return NextResponse.json(
      {
        id: result.lastInsertRowid,
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
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error adding match event:', error);
    return NextResponse.json({ error: 'Failed to add match event' }, { status: 500 });
  }
}
