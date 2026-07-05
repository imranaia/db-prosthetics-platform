// Central hook for uncaught errors across every API route, server
// component, and server action. Next.js calls onRequestError itself —
// nothing needs to import or invoke this file.
// https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation

const ALERT_THROTTLE_MS = 5 * 60 * 1000;
let lastAlertSentAt = 0;

const BACKUP_INTERVAL_MS = 24 * 60 * 60 * 1000;
const FIRST_BACKUP_DELAY_MS = 30 * 1000;

export async function register() {
  // better-sqlite3 is a native Node module — only the nodejs runtime
  // (not edge, e.g. middleware) can load it.
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const { runDatabaseBackup } = await import('@/lib/backup');
  const runBackup = () => {
    runDatabaseBackup().catch(e => console.error('[backup] scheduled run failed:', e));
  };
  setTimeout(runBackup, FIRST_BACKUP_DELAY_MS);
  setInterval(runBackup, BACKUP_INTERVAL_MS);
}

export async function onRequestError(
  err: unknown,
  request: { path: string; method: string },
  context: { routerKind: string; routePath: string; routeType: string }
) {
  console.error(`[onRequestError] ${request.method} ${request.path}:`, err);

  const now = Date.now();
  if (now - lastAlertSentAt < ALERT_THROTTLE_MS) return;
  lastAlertSentAt = now;

  try {
    const { sendErrorAlert } = await import('@/lib/email');
    await sendErrorAlert({
      message: err instanceof Error ? err.message : String(err),
      routePath: context.routePath,
      routeType: context.routeType,
    });
  } catch (e) {
    console.error('[onRequestError] failed to send alert email:', e);
  }
}
