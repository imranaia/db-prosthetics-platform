'use client';

import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { UserCircle, Lock, CheckCircle, AlertCircle } from 'lucide-react';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!user) { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (form.new_password !== form.confirm) { setMessage({ type: 'error', text: 'New passwords do not match.' }); return; }
    setSubmitting(true);
    const r = await fetch('/api/admin/profile', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_password: form.current_password, new_password: form.new_password }),
    });
    const d = await r.json();
    setSubmitting(false);
    if (r.ok) { setMessage({ type: 'success', text: 'Password updated successfully.' }); setForm({ current_password: '', new_password: '', confirm: '' }); }
    else setMessage({ type: 'error', text: d.error || 'Failed to update password.' });
  }

  return (
    <div className="dash-content" style={{ maxWidth: 640 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#1b3d5e18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <UserCircle size={22} color="var(--primary)" />
        </div>
        <div>
          <h1 className="font-display" style={{ fontSize: '1.75rem', color: 'var(--text-head)', fontWeight: 600 }}>My Profile</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Manage your account settings</p>
        </div>
      </div>

      {/* Account info card */}
      <div className="skeu-card" style={{ padding: '24px', marginBottom: '24px', cursor: 'default' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '16px' }}>Account Information</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '3px' }}>Email</div>
            <div style={{ fontWeight: 500, color: 'var(--text-head)' }}>{user.email}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '3px' }}>Role</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 12px', borderRadius: '50px', background: 'rgba(27,61,94,0.1)', color: 'var(--primary)', fontSize: '0.82rem', fontWeight: 600 }}>
              Super Admin
            </div>
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="skeu-card" style={{ padding: '24px', cursor: 'default' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <Lock size={16} color="var(--primary)" />
          <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-head)' }}>Change Password</div>
        </div>

        {message && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 14px', borderRadius: '8px', marginBottom: '20px', background: message.type === 'success' ? 'rgba(22,163,74,0.1)' : '#fef2f2', border: `1px solid ${message.type === 'success' ? 'rgba(22,163,74,0.3)' : '#fca5a5'}`, color: message.type === 'success' ? '#16a34a' : '#b91c1c', fontSize: '0.875rem' }}>
            {message.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label className="skeu-label">Current Password</label>
            <input className="skeu-input" type="password" value={form.current_password} onChange={e => setForm({ ...form, current_password: e.target.value })} required placeholder="Your current password" />
          </div>
          <div className="form-grid-2">
            <div>
              <label className="skeu-label">New Password</label>
              <input className="skeu-input" type="password" value={form.new_password} onChange={e => setForm({ ...form, new_password: e.target.value })} required placeholder="Min. 8 characters" />
            </div>
            <div>
              <label className="skeu-label">Confirm New Password</label>
              <input className="skeu-input" type="password" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} required placeholder="Repeat new password" />
            </div>
          </div>
          <div style={{ marginTop: '20px' }}>
            <button className="skeu-btn-primary" type="submit" disabled={submitting} style={{ padding: '10px 24px' }}>
              {submitting ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
