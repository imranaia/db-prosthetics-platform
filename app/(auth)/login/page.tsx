'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import DBLogo from '@/components/ui/DBLogo';

/* Reads ?error= from URL — must be in its own component wrapped in Suspense */
function LoginError() {
  const params = useSearchParams();
  const error  = params.get('error');
  if (!error) return null;
  return (
    <div style={{
      background: '#fef2f2', border: '1px solid #fecaca',
      borderRadius: '8px', padding: '12px 14px', marginBottom: '20px',
      display: 'flex', alignItems: 'center', gap: '8px',
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c0392b" strokeWidth="2" style={{ flexShrink: 0 }}>
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <span style={{ fontSize: '0.85rem', color: '#c0392b' }}>
        Incorrect email or password. Please try again.
      </span>
    </div>
  );
}

export default function LoginPage() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // redirect: true — NextAuth handles the redirect server-side after auth.
    // On success → goes to /dashboard (which redirects to the right role dashboard).
    // On failure → goes to /login?error=CredentialsSignin (caught by LoginError above).
    await signIn('credentials', {
      email:       email.trim().toLowerCase(),
      password,
      redirect:    true,
      callbackUrl: '/dashboard',
    });

    // Only reached if signIn itself throws — reset the button
    setLoading(false);
  }

  return (
    <div className="auth-bg">
      <div className="auth-card">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <DBLogo size={52} />
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

        {/* Error from URL param (server-side redirect on failed login) */}
        <Suspense fallback={null}>
          <LoginError />
        </Suspense>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: '20px' }}>
            <label className="skeu-label" htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              className="skeu-input"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={loading}
            />
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label className="skeu-label" htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                className="skeu-input"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={loading}
                style={{ paddingRight: '44px' }}
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                style={{
                  position: 'absolute', right: '12px', top: '50%',
                  transform: 'translateY(-50%)', background: 'none',
                  border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                  padding: '4px', display: 'flex',
                }}
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="skeu-btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '15px' }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="skeu-divider" style={{ margin: '28px 0' }} />

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

      <Link
        href="/"
        style={{
          position: 'fixed', top: '20px', left: '24px',
          display: 'flex', alignItems: 'center', gap: '6px',
          color: 'rgba(240,236,228,0.6)', fontSize: '0.85rem', textDecoration: 'none',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back to home
      </Link>
    </div>
  );
}
