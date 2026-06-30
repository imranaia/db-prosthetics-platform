'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DBLogo from '@/components/ui/DBLogo';
import { NIGERIA_STATES } from '@/lib/nigeria-states';

export default function RegisterPage() {
  const router = useRouter();

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
    const result = await signIn('credentials', {
      email:    form.email.trim().toLowerCase(),
      password: form.password,
      redirect: false,
    });

    setLoading(false);

    if (result?.ok) {
      router.replace('/dashboard/patient');
    } else {
      // Registered but sign-in failed — just send to login
      router.replace('/login');
    }
  }

  return (
    <div className="auth-bg" style={{ alignItems: 'flex-start', paddingTop: '40px', paddingBottom: '40px' }}>
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
