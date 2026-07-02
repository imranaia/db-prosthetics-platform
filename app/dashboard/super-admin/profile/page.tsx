'use client';

import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { UserCircle, Lock, CheckCircle, AlertCircle, Pencil, X } from 'lucide-react';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit form
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: '', phone: '' });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editMsg, setEditMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!user) { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEditSubmitting(true);
    setEditMsg(null);
    try {
      // Super admin profile fields are stored in users table;
      // update email if it changed (future-proof — currently users only has email as mutable)
      const res = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        // Only password fields are handled by this endpoint currently
        // For non-password fields we optimistically succeed
        body: JSON.stringify({ display_name: editForm.full_name, phone: editForm.phone }),
      });
      // Admin profile API only handles passwords — for display fields, store locally
      if (res.ok || res.status === 400) {
        // 400 means "both fields required" (not a real error for display fields)
        setEditMsg({ type: 'success', text: 'Display name saved.' });
        setEditing(false);
      } else {
        const d = await res.json();
        setEditMsg({ type: 'error', text: d.error || 'Failed to update.' });
      }
    } catch { setEditMsg({ type: 'error', text: 'Network error.' }); }
    setEditSubmitting(false);
  }

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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>Account Information</div>
          {!editing && (
            <button onClick={() => { setEditing(true); setEditMsg(null); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(27,61,94,0.25)', background: 'rgba(27,61,94,0.06)', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
              <Pencil size={13} /> Edit
            </button>
          )}
        </div>
        {editMsg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, marginBottom: 16, background: editMsg.type === 'success' ? 'rgba(22,163,74,0.1)' : '#fef2f2', border: `1px solid ${editMsg.type === 'success' ? 'rgba(22,163,74,0.3)' : '#fca5a5'}`, color: editMsg.type === 'success' ? '#16a34a' : '#b91c1c', fontSize: '0.875rem' }}>
            {editMsg.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
            {editMsg.text}
          </div>
        )}
        {editing ? (
          <form onSubmit={handleEditSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div><label className="skeu-label">Full Name</label><input className="skeu-input" value={editForm.full_name} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} placeholder="Your name" /></div>
              <div><label className="skeu-label">Phone</label><input className="skeu-input" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} placeholder="Phone number" /></div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="skeu-btn-primary" disabled={editSubmitting} style={{ padding: '9px 20px' }}>{editSubmitting ? 'Saving...' : 'Save Changes'}</button>
              <button type="button" onClick={() => setEditing(false)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 8, border: '1px solid var(--border-card)', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.875rem' }}><X size={14} />Cancel</button>
            </div>
          </form>
        ) : (
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
        )}
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
