'use client';

import { useState } from 'react';
import Link from 'next/link';
import DBLogo from '@/components/ui/DBLogo';
import { NIGERIA_STATES } from '@/lib/nigeria-states';

const ROLE_REDIRECTS: Record<string, string> = {
  super_admin:    '/dashboard/super-admin',
  hospital_admin: '/dashboard/hospital-admin',
  doctor:         '/dashboard/doctor',
  po_specialist:  '/dashboard/po-specialist',
  patient:        '/dashboard/patient',
};

export default function RegisterPage() {

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    phone: '',
    dob: '',
    state: '',
    address: '',
  });

  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm_password) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: form.full_name.trim(),
        email:     form.email.trim().toLowerCase(),
        password:  form.password,
        phone:     form.phone.trim(),
        dob:       form.dob || null,
        state:     form.state,
        address:   form.address.trim(),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setLoading(false);
      setError(data.error || 'Registration failed. Please try again.');
      return;
    }

    // Auto sign-in after successful registration
    const loginRes = await fetch('/api/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        email:    form.email.trim().toLowerCase(),
        password: form.password,
      }),
    });

    setLoading(false);

    if (loginRes.ok) {
      const loginData = await loginRes.json();
      window.location.href = ROLE_REDIRECTS[loginData.role] || '/dashboard/patient';
    } else {
      // Registered but sign-in failed — just send to login
      window.location.href = '/login';
    }
  }

  return (
    <div className="auth-bg" style={{ alignItems: 'flex-start' }}>
      <div className="auth-card" style={{ maxWidth: '520px' }}>

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <DBLogo size={48} />
          <h1
            className="font-display font-semibold mt-4 text-center"
            style={{ fontSize: '1.55rem', color: 'var(--text-head)', letterSpacing: '-0.01em' }}
          >
            Create your account
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.87rem', marginTop: '6px', textAlign: 'center' }}>
            Patient self-registration. Doctors and specialists are added by their hospital.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '12px 14px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c0392b" strokeWidth="2" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span style={{ fontSize: '0.85rem', color: '#c0392b' }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>

          {/* Full name */}
          <div style={{ marginBottom: '18px' }}>
            <label className="skeu-label" htmlFor="full_name">Full name</label>
            <input
              id="full_name"
              type="text"
              className="skeu-input"
              placeholder="e.g. Amaka Okafor"
              value={form.full_name}
              onChange={e => update('full_name', e.target.value)}
              required
              disabled={loading}
              autoComplete="name"
            />
          </div>

          {/* Email */}
          <div style={{ marginBottom: '18px' }}>
            <label className="skeu-label" htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              className="skeu-input"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => update('email', e.target.value)}
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>

          {/* Password row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ marginBottom: '18px' }}>
            <div>
              <label className="skeu-label" htmlFor="password">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  className="skeu-input"
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={e => update('password', e.target.value)}
                  required
                  disabled={loading}
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
                >
                  {showPass
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>
            <div>
              <label className="skeu-label" htmlFor="confirm_password">Confirm password</label>
              <input
                id="confirm_password"
                type={showPass ? 'text' : 'password'}
                className="skeu-input"
                placeholder="Repeat password"
                value={form.confirm_password}
                onChange={e => update('confirm_password', e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Phone + DOB row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ marginBottom: '18px' }}>
            <div>
              <label className="skeu-label" htmlFor="phone">Phone number</label>
              <input
                id="phone"
                type="tel"
                className="skeu-input"
                placeholder="080X XXX XXXX"
                value={form.phone}
                onChange={e => update('phone', e.target.value)}
                disabled={loading}
                autoComplete="tel"
              />
            </div>
            <div>
              <label className="skeu-label" htmlFor="dob">Date of birth</label>
              <input
                id="dob"
                type="date"
                className="skeu-input"
                value={form.dob}
                onChange={e => update('dob', e.target.value)}
                disabled={loading}
                style={{ colorScheme: 'light' }}
              />
            </div>
          </div>

          {/* State */}
          <div style={{ marginBottom: '18px' }}>
            <label className="skeu-label" htmlFor="state">State</label>
            <select
              id="state"
              className="skeu-select"
              value={form.state}
              onChange={e => update('state', e.target.value)}
              disabled={loading}
            >
              <option value="">Select your state</option>
              {NIGERIA_STATES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Address */}
          <div style={{ marginBottom: '28px' }}>
            <label className="skeu-label" htmlFor="address">Home address <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--text-muted)', opacity: 0.7 }}>(optional)</span></label>
            <input
              id="address"
              type="text"
              className="skeu-input"
              placeholder="Street address"
              value={form.address}
              onChange={e => update('address', e.target.value)}
              disabled={loading}
              autoComplete="street-address"
            />
          </div>

          <button
            type="submit"
            className="skeu-btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '15px' }}
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        {/* OAuth */}
        <div style={{ margin: '24px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border-card)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>or sign up with</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border-card)' }} />
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <a href="/api/auth/google" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '11px', borderRadius: '9px', border: '1px solid var(--border-card)', background: 'linear-gradient(145deg, #fff, #f5f5f5)', boxShadow: '2px 2px 6px rgba(0,0,0,0.08)', textDecoration: 'none', color: '#374151', fontSize: '0.875rem', fontWeight: 500 }}>
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Google
            </a>
            <a href="/api/auth/apple" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '11px', borderRadius: '9px', border: '1px solid var(--border-card)', background: 'linear-gradient(145deg, #1a1a1a, #000)', boxShadow: '2px 2px 6px rgba(0,0,0,0.15)', textDecoration: 'none', color: '#fff', fontSize: '0.875rem', fontWeight: 500 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
              Apple
            </a>
          </div>
        </div>

        <div className="skeu-divider" style={{ margin: '24px 0' }} />

        <p style={{ textAlign: 'center', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
            Sign in
          </Link>
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
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to home
      </Link>
    </div>
  );
}
