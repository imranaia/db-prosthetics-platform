'use client';

import { useState, useEffect } from 'react';
import type { SessionPayload } from '@/lib/jwt';

interface AuthState {
  user:    SessionPayload | null;
  loading: boolean;
}

/**
 * Client hook — reads the current session from /api/auth/me.
 * Use this in client components instead of next-auth's useSession.
 */
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => setState({ user: data.user, loading: false }))
      .catch(() => setState({ user: null, loading: false }));
  }, []);

  return state;
}
