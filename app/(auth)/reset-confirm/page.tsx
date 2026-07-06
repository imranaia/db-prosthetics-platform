'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import DBLogo from '@/components/ui/DBLogo';

function ResetConfirmInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('This link is missing its confirmation token.');
      return;
    }
    fetch('/api/auth/confirm-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async r => {
        const d = await r.json();
        if (!r.ok) { setError(d.error || 'Failed to confirm reset.'); setStatus('error'); }
        else setStatus('success');
      })
      .catch(() => { setError('Network error. Please try again.'); setStatus('error'); });
  }, [token]);

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="flex flex-col items-center mb-8">
          <DBLogo size={64} />
          <h1
            className="font-display font-semibold mt-4 text-center"
            style={{ fontSize: '1.5rem', color: 'var(--text-head)', letterSpacing: '-0.01em' }}
          >
            {status === 'loading' ? 'Confirming…' : status === 'success' ? 'Account Unlocked' : 'Could Not Confirm'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '8px', textAlign: 'center', lineHeight: 1.6 }}>
            {status === 'loading' && 'Please wait while we confirm your request.'}
            {status === 'success' && 'A new temporary password has been emailed to you. Check your inbox to sign in.'}
            {status === 'error' && error}
          </p>
        </div>

        {status !== 'loading' && (
          <Link href="/login" className="skeu-btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '15px', display: 'flex', textDecoration: 'none' }}>
            Go to Sign In
          </Link>
        )}
      </div>
    </div>
  );
}

export default function ResetConfirmPage() {
  return (
    <Suspense fallback={<div className="auth-bg"><div className="auth-card">Loading…</div></div>}>
      <ResetConfirmInner />
    </Suspense>
  );
}
