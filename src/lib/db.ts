import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let db: Database.Database | null = null;

function getDb() {
  if (!db) {
    const dbPath = path.join(process.cwd(), 'data', 'cricket.db');

    // Create data directory if it doesn't exist
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    initializeDatabase(db);
  }

  return db;
}

function initializeDatabase(database: Database.Database) {
  // Create tables if they don't exist
  database.exec(`
    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      teamId INTEGER NOT NULL,
      name TEXT NOT NULL,
      playerType TEXT DEFAULT 'all rounder',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (teamId) REFERENCES teams(id) ON DELETE CASCADE,
      UNIQUE(teamId, name)
    );

    CREATE TABLE IF NOT EXISTS championships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      championshipId INTEGER NOT NULL,
      team1Id INTEGER NOT NULL,
      team2Id INTEGER NOT NULL,
      matchDate DATETIME NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (championshipId) REFERENCES championships(id),
      FOREIGN KEY (team1Id) REFERENCES teams(id),
      FOREIGN KEY (team2Id) REFERENCES teams(id)
    );

    CREATE TABLE IF NOT EXISTS batsman_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      matchId INTEGER NOT NULL,
      name TEXT NOT NULL,
      runsScored INTEGER NOT NULL,
      ballsFaced INTEGER NOT NULL,
      reviewed INTEGER DEFAULT 0,
      reviewComment TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (matchId) REFERENCES matches(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS bowler_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      matchId INTEGER NOT NULL,
      name TEXT NOT NULL,
      wicketsTaken INTEGER NOT NULL,
      runsConceded INTEGER NOT NULL,
      reviewed INTEGER DEFAULT 0,
      reviewComment TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (matchId) REFERENCES matches(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_players_teamId ON players(teamId);
    CREATE INDEX IF NOT EXISTS idx_batsman_matchId ON batsman_records(matchId);
    CREATE INDEX IF NOT EXISTS idx_bowler_matchId ON bowler_records(matchId);
    CREATE INDEX IF NOT EXISTS idx_matches_championshipId ON matches(championshipId);

    CREATE TABLE IF NOT EXISTS match_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      matchId INTEGER NOT NULL,
      ballNumber TEXT NOT NULL,
      bowlerName TEXT NOT NULL,
      batsmanName TEXT NOT NULL,
      bookmaker TEXT,
      favTeam TEXT,
      fancy TEXT,
      ballInfo TEXT,
      finalScore TEXT,
      eventOccurred INTEGER DEFAULT 0,
      eventDescription TEXT,
      hasComment INTEGER DEFAULT 0,
      eventComment TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (matchId) REFERENCES matches(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_match_events_matchId ON match_events(matchId);
    CREATE INDEX IF NOT EXISTS idx_match_events_ballNumber ON match_events(ballNumber);
  `);

  // Migration: Add playerType column if it doesn't exist
  try {
    const tableInfo = database.prepare("PRAGMA table_info(players)").all();
    const hasPlayerType = (tableInfo as any[]).some((col: any) => col.name === 'playerType');

    if (!hasPlayerType) {
      console.log('Adding playerType column to existing players table...');
      database.exec(`
        ALTER TABLE players ADD COLUMN playerType TEXT DEFAULT 'all rounder';
      `);
    }
  } catch (error) {
    console.log('Migration check for playerType column completed');
  }

  // Migration: Add new columns to match_events if they don't exist
  try {
    const eventTableInfo = database.prepare("PRAGMA table_info(match_events)").all();
    const eventColumns = (eventTableInfo as any[]).map((col: any) => col.name);

    const newColumns = [
      { name: 'bookmaker', sql: 'ALTER TABLE match_events ADD COLUMN bookmaker TEXT;' },
      { name: 'favTeam', sql: 'ALTER TABLE match_events ADD COLUMN favTeam TEXT;' },
      { name: 'fancy', sql: 'ALTER TABLE match_events ADD COLUMN fancy TEXT;' },
      { name: 'ballInfo', sql: 'ALTER TABLE match_events ADD COLUMN ballInfo TEXT;' },
      { name: 'finalScore', sql: 'ALTER TABLE match_events ADD COLUMN finalScore TEXT;' },
      { name: 'hasComment', sql: 'ALTER TABLE match_events ADD COLUMN hasComment INTEGER DEFAULT 0;' },
      { name: 'eventComment', sql: 'ALTER TABLE match_events ADD COLUMN eventComment TEXT;' },
    ];

    newColumns.forEach((col) => {
      if (!eventColumns.includes(col.name)) {
        console.log(`Adding ${col.name} column to match_events table...`);
        database.exec(col.sql);
      }
    });
  } catch (error) {
    console.log('Migration check for match_events columns completed');
  }
}

export default getDb;
