import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

// Database file lives at the project root in development,
// and at /data/db.sqlite on Railway (persistent disk).
const DB_PATH =
  process.env.DATABASE_PATH ||
  path.join(process.cwd(), 'db.sqlite');

// Singleton — reuse one connection across the process lifetime.
let db: Database.Database;

function getDb(): Database.Database {
  if (db) return db;

  // Ensure the directory exists (important for /data/db.sqlite on Railway)
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  console.log(`[db] Opening database at: ${DB_PATH}`);
  db = new Database(DB_PATH);

  // Enable WAL mode for better concurrent read performance.
  db.pragma('journal_mode = WAL');

  // Enforce foreign key constraints (SQLite turns these off by default).
  db.pragma('foreign_keys = ON');

  // Run migrations on first connect.
  migrate(db);

  // Seed Super Admin if no users exist yet.
  seedAdmin(db);

  return db;
}

function migrate(database: Database.Database): void {
  const migrationsDir = path.join(process.cwd(), 'migrations');

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

    database.transaction(() => {
      database.exec(sql);
      database.prepare('INSERT INTO _migrations (filename) VALUES (?)').run(file);
    })();

    console.log(`[db] Applied migration: ${file}`);
  }
}

// Creates the Super Admin account on first startup if no users exist.
// Reads credentials from environment variables so they can be changed
// without touching code.
function seedAdmin(database: Database.Database): void {
  const existing = database
    .prepare(`SELECT id FROM users WHERE role = 'super_admin' LIMIT 1`)
    .get();

  if (existing) return; // already seeded

  const email    = process.env.ADMIN_SEED_EMAIL    || 'admin@dbprosthetics.com';
  const password = process.env.ADMIN_SEED_PASSWORD || 'ChangeMe123!';

  // bcryptjs sync hash — fine for a one-time startup operation
  const hash = bcrypt.hashSync(password, 12);

  database
    .prepare(`INSERT INTO users (email, password_hash, role) VALUES (?, ?, 'super_admin')`)
    .run(email, hash);

  console.log(`[db] Super Admin seeded: ${email}`);
}

export default getDb;
