'use client';

import { useEffect, useRef } from 'react';

/**
 * Silently re-runs `callback` when the tab regains focus/visibility and on
 * a periodic interval, so pages showing live data (orders, appointments)
 * pick up changes made elsewhere without the user having to hit reload.
 */
export function useAutoRefresh(callback: () => void, intervalMs = 30000, enabled = true) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled) return;

    function run() { callbackRef.current(); }
    function onVisibility() { if (document.visibilityState === 'visible') run(); }

    window.addEventListener('focus', run);
    document.addEventListener('visibilitychange', onVisibility);
    const interval = setInterval(run, intervalMs);

    return () => {
      window.removeEventListener('focus', run);
      document.removeEventListener('visibilitychange', onVisibility);
      clearInterval(interval);
    };
  }, [enabled, intervalMs]);
}
