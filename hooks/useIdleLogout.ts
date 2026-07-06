'use client';

import { useEffect } from 'react';

const IDLE_LIMIT_MS = 15 * 60 * 1000;
const STORAGE_KEY = 'dbp_last_activity';
const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'] as const;

async function logoutForInactivity() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } finally {
    window.location.href = '/login?timeout=1';
  }
}

// Signs the user out after 15 minutes with no activity. Foreground timers
// alone aren't enough — browsers throttle timers in a backgrounded/minimized
// tab, so "minimize for a long time and come back" wouldn't reliably fire a
// setTimeout on schedule. Recording a timestamp on every activity event and
// re-checking the elapsed time on visibilitychange/focus catches that case
// immediately once the tab is looked at again, regardless of throttling.
export function useIdleLogout() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    function recordActivity() {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    }

    function elapsedExceeded() {
      const last = Number(localStorage.getItem(STORAGE_KEY)) || Date.now();
      return Date.now() - last >= IDLE_LIMIT_MS;
    }

    function resetTimer() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(logoutForInactivity, IDLE_LIMIT_MS);
    }

    function handleActivity() {
      recordActivity();
      resetTimer();
    }

    function handleVisible() {
      if (document.visibilityState !== 'visible') return;
      if (elapsedExceeded()) {
        logoutForInactivity();
      } else {
        handleActivity();
      }
    }

    recordActivity();
    resetTimer();

    ACTIVITY_EVENTS.forEach(evt => window.addEventListener(evt, handleActivity, { passive: true }));
    document.addEventListener('visibilitychange', handleVisible);
    window.addEventListener('focus', handleVisible);

    return () => {
      if (timer) clearTimeout(timer);
      ACTIVITY_EVENTS.forEach(evt => window.removeEventListener(evt, handleActivity));
      document.removeEventListener('visibilitychange', handleVisible);
      window.removeEventListener('focus', handleVisible);
    };
  }, []);
}
