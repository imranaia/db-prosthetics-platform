'use client';

import { useEffect, useState } from 'react';

/**
 * Persists a form's state to sessionStorage so navigating away to another
 * page and back restores what was typed, instead of starting over. Clears
 * automatically at tab close (sessionStorage), not indefinitely — this is a
 * short-lived "don't lose my typing" safety net, not a long-term draft.
 *
 * Restore happens once on mount; the draft is only (re)written once that
 * restore has settled, so an empty initial value can't race ahead and
 * clobber a just-restored draft.
 */
export function useFormDraft<T>(key: string, value: T, setValue: (v: T) => void, enabled = true) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!enabled) { setHydrated(true); return; }
    try {
      const raw = sessionStorage.getItem(key);
      if (raw) setValue(JSON.parse(raw));
    } catch { /* ignore corrupt/unavailable storage */ }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);

  useEffect(() => {
    if (!enabled || !hydrated) return;
    try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* storage full/unavailable */ }
  }, [key, value, enabled, hydrated]);

  function clearDraft() {
    try { sessionStorage.removeItem(key); } catch { /* storage unavailable */ }
  }

  return { clearDraft, hydrated };
}
