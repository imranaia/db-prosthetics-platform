import type Database from 'better-sqlite3';
import { sendReceiptEmail } from './email';

/** Emails the patient their receipt right after a payment is confirmed paid. */
export async function sendOrderReceiptEmail(db: Database.Database, type: 'order' | 'custom_order', recordId: number): Promise<void> {
  const table = type === 'order' ? 'orders' : 'custom_orders';
  const amountCol = type === 'order'
    ? 'total_amount + service_fee'
    : 'quoted_price + 100000';

  const row = db.prepare(`
    SELECT t.patient_id, u.email, p.full_name, (${amountCol}) AS amount
    FROM ${table} t
    LEFT JOIN patients p ON t.patient_id = p.id
    LEFT JOIN users u ON p.user_id = u.id
    WHERE t.id = ?
  `).get(recordId) as { patient_id: number | null; email: string | null; full_name: string | null; amount: number | null } | undefined;

  if (!row?.email || !row.amount) return;

  try {
    await sendReceiptEmail({
      to: row.email,
      fullName: row.full_name || 'Patient',
      amountKobo: row.amount,
      receiptUrl: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/dashboard/patient/receipt/${type}/${recordId}`,
    });
  } catch (e) {
    console.error('[receipt-notify] failed', e);
  }
}
