import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Database file lives at the project root in development,
// and at /data/db.sqlite on Railway (persistent disk).
const DB_PATH =
  process.env.DATABASE_PATH ||
  path.join(process.cwd(), 'db.sqlite');

// Singleton — reuse one connection across the process lifetime.
let db: Database.Database;

function getDb(): Database.Database {
  if (db) return db;

  db = new Database(DB_PATH);

  // Enable WAL mode for better concurrent read performance.
  db.pragma('journal_mode = WAL');

  // Enforce foreign key constraints (SQLite turns these off by default).
  db.pragma('foreign_keys = ON');

  // Run migrations on first connect.
  migrate(db);

  return db;
}

function migrate(database: Database.Database): void {
  const migrationsDir = path.join(process.cwd(), 'migrations');

  // Create a simple tracking table if it doesn't exist.
  database.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      filename TEXT PRIMARY KEY,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const applied = new Set(
    database
      .prepare('SELECT filename FROM _migrations')
      .all()
      .map((row: any) => row.filename)
  );

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (applied.has(file)) continue;

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

    // Run the entire migration file as one transaction.
    database.transaction(() => {
      database.exec(sql);
      database.prepare('INSERT INTO _migrations (filename) VALUES (?)').run(file);
    })();

    console.log(`[db] Applied migration: ${file}`);
  }
}

export default getDb;
