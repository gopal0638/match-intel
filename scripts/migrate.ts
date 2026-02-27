import getDb from '../src/lib/db';

async function run() {
  const db = getDb();

  try {
    // the very first query triggers initialization and waits for any
    // schema-related work to complete. because initializeDatabase uses
    // "IF NOT EXISTS" and applies all ALTER statements, this script is
    // safe to call repeatedly.
    console.log('running database migration...');
    await db.query('SELECT 1');

    // some recent schema additions aren't always obvious when debugging
    // migrations, so we explicitly ensure the two new columns in the `matches`
    // table are present. the IF NOT EXISTS guards make this idempotent.
    console.log('applying explicit column migrations');
    await db.query(`
      ALTER TABLE matches ADD COLUMN IF NOT EXISTS "groundName" TEXT;
      ALTER TABLE matches ADD COLUMN IF NOT EXISTS "matchType" TEXT;
    `);

    console.log('migration finished successfully');
    process.exit(0);
  } catch (err) {
    console.error('migration failed', err);
    process.exit(1);
  } finally {
    // make sure the pool is closed before exiting
    try {
      await db.end();
    } catch {
      // ignore
    }
  }
}

run();
