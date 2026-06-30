/**
 * Run once to create the Super Admin account.
 * Usage: npx tsx scripts/seed-admin.ts
 *
 * Set ADMIN_EMAIL and ADMIN_PASSWORD as env vars, or edit the defaults below.
 */

import bcrypt from 'bcryptjs';
import getDb from '../lib/db';

const EMAIL = process.env.ADMIN_EMAIL || 'admin@dbprosthetics.com';
const PASSWORD = process.env.ADMIN_PASSWORD || 'ChangeMe123!';

async function main() {
  const db = getDb();

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(EMAIL);
  if (existing) {
    console.log(`Super Admin already exists: ${EMAIL}`);
    process.exit(0);
  }

  const hash = await bcrypt.hash(PASSWORD, 12);

  db.prepare(`
    INSERT INTO users (email, password_hash, role)
    VALUES (?, ?, 'super_admin')
  `).run(EMAIL, hash);

  console.log(`Super Admin created: ${EMAIL}`);
  console.log('Change the password immediately after first login.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
