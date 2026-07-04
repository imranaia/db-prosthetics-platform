import bcrypt from 'bcryptjs';
import getDb from './db';
import { sendPasswordReset } from './email';

/**
 * Generates a new temp password for a user account, forces a password
 * change on next login, and emails the new credentials. Shared by every
 * "reset password" admin action (hospitals, staff, patients) so they all
 * behave identically.
 */
export async function resetUserPassword(userId: number, fullName?: string | null): Promise<{ tempPassword: string } | { error: string }> {
  const db = getDb();
  const user = db.prepare('SELECT id, email FROM users WHERE id = ?').get(userId) as { id: number; email: string } | undefined;
  if (!user) return { error: 'User not found' };

  const tempPassword = Math.random().toString(36).slice(2, 10).toUpperCase() + Math.floor(Math.random() * 900 + 100);
  const hash = await bcrypt.hash(tempPassword, 12);

  db.prepare('UPDATE users SET password_hash = ?, must_change_password = 1 WHERE id = ?').run(hash, userId);

  try {
    await sendPasswordReset({
      to: user.email,
      fullName,
      tempPassword,
      loginUrl: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/login`,
    });
  } catch (e) {
    console.error('[reset-password] email failed', e);
  }

  return { tempPassword };
}
