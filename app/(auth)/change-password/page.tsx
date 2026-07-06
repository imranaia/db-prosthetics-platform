'use client';

import { useState, useEffect } from 'react';
import DBLogo from '@/components/ui/DBLogo';
import { isPasswordValid, PASSWORD_REQUIREMENT_MESSAGE } from '@/lib/password';

const ROLE_REDIRECTS: Record<string, string> = {
  super_admin: '/dashboard/super-admin',
  hospital_admin: '/dashboard/hospital-admin',
  doctor: '/dashboard/doctor',
  po_specialist: '/dashboard/po-specialist',
  patient: '/dashboard/patient',
  receptionist: '/dashboard/receptionist',
};

export default function ChangePasswordPage() {
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [role, setRole] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (d.user?.role) setRole(d.user.role);
        else window.location.href = '/login';
      })
      .catch(() => { window.location.href = '/login'; });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (!isPasswordValid(form.password)) { setError(PASSWORD_REQUIREMENT_MESSAGE); return; }
    setLoading(true);
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ new_password: form.password }),
    });
    setLoading(false);
    if (res.ok) {
      window.location.href = ROLE_REDIRECTS[role] || '/dashboard';
    } else {
      const d = await res.json();
      setError(d.error || 'Failed to update password.');
    }
  }

  const eyeIcon = (visible: boolean) => visible
    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;

  return (
    <div className="auth-bg">
      <div className="auth-card">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <DBLogo size={64} />
          <h1
            className="font-display font-semibold mt-4 text-center"
            style={{ fontSize: '1.5rem', color: 'var(--text-head)', letterSpacing: '-0.01em' }}
          >
            Set your password
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '8px', textAlign: 'center', lineHeight: 1.6 }}>
            Your account was created by an administrator.<br />
            Please choose a secure password to continue.
          </p>
        </div>

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

        <form onSubmit={handleSubmit} noValidate>
          {/* New Password */}
          <div style={{ marginBottom: '18px' }}>
            <label className="skeu-label" htmlFor="new-password">New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="new-password"
                type={showPass ? 'text' : 'password'}
                className="skeu-input"
                placeholder="At least 8 chars, mixed case, number & symbol"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
                disabled={loading}
                style={{ paddingRight: '44px' }}
              />
              <button type="button" onClick={() => setShowPass(p => !p)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', display: 'flex' }}
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                {eyeIcon(showPass)}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: '28px' }}>
            <label className="skeu-label" htmlFor="confirm-password">Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="confirm-password"
                type={showConfirm ? 'text' : 'password'}
                className="skeu-input"
                placeholder="Re-enter your new password"
                value={form.confirm}
                onChange={e => setForm({ ...form, confirm: e.target.value })}
                required
                disabled={loading}
                style={{ paddingRight: '44px' }}
              />
              <button type="button" onClick={() => setShowConfirm(p => !p)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', display: 'flex' }}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {eyeIcon(showConfirm)}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="skeu-btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '15px' }}
            disabled={loading || !role}
          >
            {loading ? 'Saving…' : 'Set Password & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
