import { Pool, QueryResult } from 'pg';

let pool: Pool | null = null;
let initPromise: Promise<void> | null = null;

function getDb() {
  if (!pool) {
    pool = new Pool({
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'cricket_db',
    });

    // start initialization and remember the promise
    initPromise = initializeDatabase(pool).catch((err) => {
      console.error('database initialization failed', err);
    });

    // wrap the pool.query method so callers automatically wait for init
    const originalQuery = pool.query.bind(pool);
    pool.query = async (...args: any[]) => {
      // wait for initialization to finish before running any query
      if (initPromise) {
        await initPromise;
      }
      // @ts-ignore
      return originalQuery(...args);
    };
  }

  return pool;
}

async function initializeDatabase(database: Pool) {
  // Create tables if they don't exist
  await database.query(`
    CREATE TABLE IF NOT EXISTS teams (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS players (
      id SERIAL PRIMARY KEY,
      "teamId" INTEGER NOT NULL,
      name TEXT NOT NULL,
      "playerType" TEXT DEFAULT 'all rounder',
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("teamId") REFERENCES teams(id) ON DELETE CASCADE,
      UNIQUE("teamId", name)
    );

    CREATE TABLE IF NOT EXISTS championships (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS matches (
      id SERIAL PRIMARY KEY,
      "championshipId" INTEGER NOT NULL,
      "team1Id" INTEGER NOT NULL,
      "team2Id" INTEGER NOT NULL,
      "matchDate" TIMESTAMP NOT NULL,
      "groundName" TEXT,
      "matchType" TEXT,
    CREATE TABLE IF NOT EXISTS batsman_records (
      id SERIAL PRIMARY KEY,
      "matchId" INTEGER NOT NULL,
      name TEXT NOT NULL,
      "runsScored" INTEGER NOT NULL,
      "ballsFaced" INTEGER NOT NULL,
      reviewed INTEGER DEFAULT 0,
      "reviewComment" TEXT,
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("matchId") REFERENCES matches(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS bowler_records (
      id SERIAL PRIMARY KEY,
      "matchId" INTEGER NOT NULL,
      name TEXT NOT NULL,
      "wicketsTaken" INTEGER NOT NULL,
      "runsConceded" INTEGER NOT NULL,
      reviewed INTEGER DEFAULT 0,
      "reviewComment" TEXT,
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("matchId") REFERENCES matches(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_players_teamId ON players("teamId");
    CREATE INDEX IF NOT EXISTS idx_batsman_matchId ON batsman_records("matchId");
    CREATE INDEX IF NOT EXISTS idx_bowler_matchId ON bowler_records("matchId");
    CREATE INDEX IF NOT EXISTS idx_matches_championshipId ON matches("championshipId");
    -- ensure new columns exist if database already created
    ALTER TABLE matches ADD COLUMN IF NOT EXISTS "groundName" TEXT;
    ALTER TABLE matches ADD COLUMN IF NOT EXISTS "matchType" TEXT;

    CREATE TABLE IF NOT EXISTS match_events (
      id SERIAL PRIMARY KEY,
      "matchId" INTEGER NOT NULL,
      "ballNumber" TEXT NOT NULL,
      "bowlerName" TEXT NOT NULL,
      "batsmanName" TEXT NOT NULL,
      "nonStrikerName" TEXT,
      bookmaker TEXT,
      "favTeam" TEXT,
      fancy1 TEXT,
      fancy2 TEXT,
      "ballInfo" TEXT,
      "finalScore" TEXT,
      "eventOccurred" INTEGER DEFAULT 0,
      "eventDescription" TEXT,
      "hasComment" INTEGER DEFAULT 0,
      "eventComment" TEXT,
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("matchId") REFERENCES matches(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_match_events_matchId ON match_events("matchId");
    CREATE INDEX IF NOT EXISTS idx_match_events_ballNumber ON match_events("ballNumber");
    -- ensure new columns exist if database already created
    ALTER TABLE match_events ADD COLUMN IF NOT EXISTS "nonStrikerName" TEXT;
    ALTER TABLE match_events ADD COLUMN IF NOT EXISTS fancy1 TEXT;
    ALTER TABLE match_events ADD COLUMN IF NOT EXISTS fancy2 TEXT;
  `);
}

export default getDb;
export type { Pool, QueryResult };
