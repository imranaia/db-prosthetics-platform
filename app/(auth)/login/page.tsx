'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DBLogo from '@/components/ui/DBLogo';

const ROLE_REDIRECTS: Record<string, string> = {
  super_admin:    '/dashboard/super-admin',
  hospital_admin: '/dashboard/hospital-admin',
  doctor:         '/dashboard/doctor',
  po_specialist:  '/dashboard/po-specialist',
  patient:        '/dashboard/patient',
};

export default function LoginPage() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('timeout') === '1') {
      setTimedOut(true);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          email:    email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Incorrect email or password. Please try again.');
        setLoading(false);
        return;
      }

      // Hard navigate so the cookie is picked up fresh by the browser
      if (data.must_change_password) {
        window.location.href = '/change-password';
      } else {
        window.location.href = ROLE_REDIRECTS[data.role] || '/dashboard';
      }

    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="auth-bg">
      <div className="auth-card">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <DBLogo size={64} />
          <h1
            className="font-display font-semibold mt-4 text-center"
            style={{ fontSize: '1.6rem', color: 'var(--text-head)', letterSpacing: '-0.01em' }}
          >
            Welcome back
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '6px', textAlign: 'center' }}>
            Sign in to your DB Prosthetics account
          </p>
        </div>

        {timedOut && !error && (
          <div style={{
            background: '#fffbeb', border: '1px solid #fde68a',
            borderRadius: '8px', padding: '12px 14px', marginBottom: '20px',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span style={{ fontSize: '0.85rem', color: '#b45309' }}>You were signed out after 15 minutes of inactivity. Please sign in again.</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: '8px', padding: '12px 14px', marginBottom: '20px',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c0392b" strokeWidth="2" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span style={{ fontSize: '0.85rem', color: '#c0392b' }}>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: '20px' }}>
            <label className="skeu-label" htmlFor="email">Email address</label>
            <input
              id="email" type="email" className="skeu-input"
              placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)}
              required autoComplete="email" disabled={loading}
            />
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label className="skeu-label" htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password" type={showPass ? 'text' : 'password'}
                className="skeu-input" placeholder="Enter your password"
                value={password} onChange={e => setPassword(e.target.value)}
                required autoComplete="current-password" disabled={loading}
                style={{ paddingRight: '44px' }}
              />
              <button type="button" onClick={() => setShowPass(p => !p)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', display: 'flex' }}
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>

          <button type="submit" className="skeu-btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '15px' }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* OAuth */}
        <div style={{ margin: '24px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border-card)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>or continue with</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border-card)' }} />
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <a
              href="/api/auth/google"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '11px', borderRadius: '9px', border: '1px solid var(--border-card)', background: 'linear-gradient(145deg, #fff, #f5f5f5)', boxShadow: '2px 2px 6px rgba(0,0,0,0.08)', textDecoration: 'none', color: '#374151', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continue with Google
            </a>
          </div>
        </div>

        <div className="skeu-divider" style={{ margin: '24px 0' }} />

        <p style={{ textAlign: 'center', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          New patient?{' '}
          <Link href="/register" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
            Create an account
          </Link>
        </p>
        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '10px' }}>
          Hospital or specialist? Your credentials are sent by your administrator.
        </p>
      </div>

      <Link href="/" style={{
        position: 'fixed', top: '20px', left: '24px',
        display: 'flex', alignItems: 'center', gap: '6px',
        color: 'rgba(240,236,228,0.6)', fontSize: '0.85rem', textDecoration: 'none',
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back to home
      </Link>
    </div>
  );
}
