import path from 'path';
import fs from 'fs';
import os from 'os';
import getDb from './db';
import cloudinary from './cloudinary';

const RETENTION_COUNT = 14;
const BACKUP_FOLDER = 'db-prosthetics-backups';

/**
 * Takes a consistent hot snapshot of the live SQLite database (safe even
 * with concurrent writes) and uploads it to Cloudinary, so a copy exists
 * off the Railway disk entirely. Older backups beyond RETENTION_COUNT are
 * pruned after each run.
 */
export async function runDatabaseBackup(): Promise<void> {
  const db = getDb();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const tempPath = path.join(os.tmpdir(), `db-backup-${stamp}.sqlite`);

  await db.backup(tempPath);

  try {
    await new Promise<void>((resolve, reject) => {
      cloudinary.uploader.upload(
        tempPath,
        { folder: BACKUP_FOLDER, public_id: `backup-${stamp}`, resource_type: 'raw' },
        (error) => (error ? reject(error) : resolve())
      );
    });
    console.log(`[backup] Uploaded backup-${stamp} to Cloudinary`);
  } finally {
    fs.unlink(tempPath, () => {});
  }

  await pruneOldBackups();
}

async function pruneOldBackups(): Promise<void> {
  try {
    const result = await cloudinary.api.resources({
      type: 'upload',
      resource_type: 'raw',
      prefix: `${BACKUP_FOLDER}/backup-`,
      max_results: 500,
    });
    const resources = (result.resources || []) as { public_id: string; created_at: string }[];
    resources.sort((a, b) => b.created_at.localeCompare(a.created_at));
    const toDelete = resources.slice(RETENTION_COUNT);
    for (const r of toDelete) {
      await cloudinary.uploader.destroy(r.public_id, { resource_type: 'raw' });
    }
    if (toDelete.length > 0) {
      console.log(`[backup] Pruned ${toDelete.length} old backup(s)`);
    }
  } catch (e) {
    console.error('[backup] prune failed:', e);
  }
}
