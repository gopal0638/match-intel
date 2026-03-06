import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

interface MatchEventsParams {
  params: Promise<{ id: string }>;
}

async function getMatchTeams(matchId: string) {
  const db = getDb();
  const result = await db.query(
    'SELECT id, "team1Id", "team2Id", "tossWinnerTeamId", "tossDecision" FROM matches WHERE id = $1',
    [matchId]
  );
  return result.rows[0] as
    | {
        id: number;
        team1Id: number;
        team2Id: number;
        tossWinnerTeamId: number | null;
        tossDecision: string | null;
      }
    | undefined;
}

function getBattingAndBowlingTeams(match: {
  team1Id: number;
  team2Id: number;
  tossWinnerTeamId: number | null;
  tossDecision: string | null;
}, inningsNumber: number) {
  const { team1Id, team2Id, tossWinnerTeamId, tossDecision } = match;

  if (!tossWinnerTeamId || !tossDecision) {
    // Fallback: assume team1 bats first, then team2
    if (inningsNumber === 1) {
      return { battingTeamId: team1Id, bowlingTeamId: team2Id };
    }
    return { battingTeamId: team2Id, bowlingTeamId: team1Id };
  }

  const otherTeamId = tossWinnerTeamId === team1Id ? team2Id : team1Id;
  const decision = tossDecision.toLowerCase();

  if (decision === 'bat') {
    if (inningsNumber === 1) {
      return { battingTeamId: tossWinnerTeamId, bowlingTeamId: otherTeamId };
    }
    return { battingTeamId: otherTeamId, bowlingTeamId: tossWinnerTeamId };
  }

  // decision === 'bowl'
  if (inningsNumber === 1) {
    return { battingTeamId: otherTeamId, bowlingTeamId: tossWinnerTeamId };
  }
  return { battingTeamId: tossWinnerTeamId, bowlingTeamId: otherTeamId };
}

async function validatePlayersForSides(
  matchId: string,
  inningsNumber: number,
  batsmanName: string,
  nonStrikerName: string | null,
  bowlerName: string
) {
  const match = await getMatchTeams(matchId);
  if (!match) {
    return { ok: false, error: 'Match not found' as const };
  }

  const { battingTeamId, bowlingTeamId } = getBattingAndBowlingTeams(
    match,
    inningsNumber
  );

  const db = getDb();

  const names: string[] = [batsmanName, bowlerName];
  if (nonStrikerName) {
    names.push(nonStrikerName);
  }

  const playersResult = await db.query(
    `SELECT id, name, "teamId"
     FROM players
     WHERE "teamId" IN ($1, $2)
       AND name = ANY($3::text[])`,
    [battingTeamId, bowlingTeamId, names]
  );

  const players = playersResult.rows as { id: number; name: string; teamId: number }[];

  const findPlayerTeam = (name: string, expectedTeamId: number) => {
    const found = players.find((p) => p.name === name && p.teamId === expectedTeamId);
    return !!found;
  };

  if (!findPlayerTeam(batsmanName, battingTeamId)) {
    return {
      ok: false as const,
      error: 'Batsman must belong to the batting team for this innings',
    };
  }

  if (nonStrikerName && !findPlayerTeam(nonStrikerName, battingTeamId)) {
    return {
      ok: false as const,
      error: 'Non-striker must belong to the batting team for this innings',
    };
  }

  if (!findPlayerTeam(bowlerName, bowlingTeamId)) {
    return {
      ok: false as const,
      error: 'Bowler must belong to the bowling team for this innings',
    };
  }

  return { ok: true as const };
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
    } = await request.json();

    if (!ballNumber || !bowlerName || !batsmanName) {
      return NextResponse.json(
        { error: 'Ball number, bowler name, and batsman name are required' },
        { status: 400 }
      );
    }

    const innings = typeof inningsNumber === 'number' && inningsNumber >= 1 ? inningsNumber : 1;

    // Validate players against batting/bowling teams for this innings
    const playerValidation = await validatePlayersForSides(
      id,
      innings,
      batsmanName,
      nonStrikerName || null,
      bowlerName
    );
    if (!playerValidation.ok) {
      return NextResponse.json({ error: playerValidation.error }, { status: 400 });
    }

    const safeRunsScored = Number.isFinite(runsScored) && runsScored >= 0 ? runsScored : 0;
    const safeExtraRuns = Number.isFinite(extraRuns) && extraRuns >= 0 ? extraRuns : 0;
    const wide = !!isWide;
    const noBall = !!isNoBall;
    const bye = !!isBye;
    const legBye = !!isLegBye;
    const wicket = !!isWicket;
    const inningsComplete = !!isInningsComplete;

    const db = getDb();
    const result = await db.query(
      `INSERT INTO match_events (
        "matchId", "ballNumber", "bowlerName", "batsmanName", "nonStrikerName", "inningsNumber",
        bookmaker, "favTeam", fancy1, fancy2, "ballInfo",
        "finalScore", "eventOccurred", "eventDescription", "hasComment", "eventComment",
        "runsScored", "extraRuns", "isWide", "isNoBall", "isBye", "isLegBye", "isWicket", "isInningsComplete"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24) RETURNING *`,
      [
        id,
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
      ]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    console.error('Error adding match event:', error);
    return NextResponse.json({ error: 'Failed to add match event' }, { status: 500 });
  }
}
