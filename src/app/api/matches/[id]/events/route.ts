import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

interface MatchEventsParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: MatchEventsParams) {
  try {
    const { id } = await params;
    const db = getDb();
    const result = await db.query(
      `SELECT * FROM match_events
       WHERE "matchId" = $1
       ORDER BY
         CAST(SPLIT_PART("ballNumber", '.', 1) AS INTEGER),
         CAST(SPLIT_PART("ballNumber", '.', 2) AS INTEGER)`,
      [id]
    );
    return NextResponse.json(result.rows);
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
      nonStrikerName,
      bookmaker,
      favTeam,
      fancy1,
      fancy2,
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
    const result = await db.query(
      `INSERT INTO match_events (
        "matchId", "ballNumber", "bowlerName", "batsmanName", "nonStrikerName", bookmaker, "favTeam", fancy1, fancy2, "ballInfo",
        "finalScore", "eventOccurred", "eventDescription", "hasComment", "eventComment"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
      [
        id,
        ballNumber,
        bowlerName,
        batsmanName,
        nonStrikerName || null,
        bookmaker || null,
        favTeam || null,
        fancy1 || null,
        fancy2 || null,
        ballInfo || null,
        finalScore || null,
        eventOccurred ? 1 : 0,
        eventDescription || null,
        hasComment ? 1 : 0,
        eventComment || null,
      ]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    console.error('Error adding match event:', error);
    return NextResponse.json({ error: 'Failed to add match event' }, { status: 500 });
  }
}
