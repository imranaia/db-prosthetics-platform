'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { UserCircle, Pencil } from 'lucide-react';

function SectionHeader({ number, title }: { number: string; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, marginTop: 8 }}>
      <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>{number}</div>
      <h3 className="font-display" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-head)', margin: 0 }}>{title}</h3>
      <div style={{ flex: 1, height: 1, background: 'var(--border-card)' }} />
    </div>
  );
}

export default function POSpecialistProfilePage() {
  const { user, loading } = useAuth();
  const [profileData, setProfileData] = useState<{ email: string; role: string } | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: '', phone: '' });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editMsg, setEditMsg] = useState('');
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [pwSubmitting, setPwSubmitting] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  useEffect(() => {
    if (!user || loading) return;
    fetch('/api/profile')
      .then(r => r.json())
      .then(data => setProfileData(data))
      .catch(() => {});
  }, [user, loading]);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!user) { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }
  if (user.role !== 'po_specialist') { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEditSubmitting(true);
    setEditMsg('');
    try {
      const res = await fetch('/api/po-specialist/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (res.ok) { setEditMsg('Profile updated.'); setEditing(false); }
      else { const d = await res.json(); setEditMsg(d.error || 'Failed.'); }
    } catch { setEditMsg('Network error.'); }
    setEditSubmitting(false);
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    if (pwForm.new_password !== pwForm.confirm_password) { setPwError('New passwords do not match.'); return; }
    if (pwForm.new_password.length < 8) { setPwError('New password must be at least 8 characters.'); return; }
    setPwSubmitting(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: pwForm.current_password, new_password: pwForm.new_password }),
      });
      const data = await res.json();
      if (!res.ok) { setPwError(data.error || 'Failed to update password.'); }
      else { setPwSuccess('Password updated successfully.'); setPwForm({ current_password: '', new_password: '', confirm_password: '' }); }
    } catch { setPwError('Network error. Please try again.'); }
    setPwSubmitting(false);
  }

  return (
    <div className="dash-content">
      <div className="dash-page-header" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: '#1b3d5e18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <UserCircle size={22} color="var(--primary)" />
          </div>
          <h1 className="font-display" style={{ fontSize: '1.7rem', fontWeight: 600, color: 'var(--text-head)', margin: 0 }}>My Profile</h1>
        </div>
      </div>

      {/* Account Info */}
      <div className="skeu-card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <SectionHeader number="1" title="Account Information" />
          {!editing && (
            <button onClick={() => { setEditing(true); setEditMsg(''); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(27,61,94,0.25)', background: 'rgba(27,61,94,0.06)', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, marginTop: -8 }}>
              <Pencil size={13} /> Edit
            </button>
          )}
        </div>
        {editMsg && <div style={{ background: editMsg.includes('updated') ? '#d1fae5' : '#fee2e2', color: editMsg.includes('updated') ? '#065f46' : '#b91c1c', padding: '10px 14px', borderRadius: 8, fontSize: '0.88rem', marginBottom: 14 }}>{editMsg}</div>}
        {editing ? (
          <form onSubmit={handleEditSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div><label className="skeu-label" style={{ display: 'block', marginBottom: 4 }}>Display Name</label><input className="skeu-input" value={editForm.full_name} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} placeholder="Your name" /></div>
              <div><label className="skeu-label" style={{ display: 'block', marginBottom: 4 }}>Phone</label><input className="skeu-input" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} placeholder="Phone number" /></div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="skeu-btn-primary" disabled={editSubmitting}>{editSubmitting ? 'Saving...' : 'Save Changes'}</button>
              <button type="button" onClick={() => setEditing(false)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border-card)', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Cancel</button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 3 }}>Email Address</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-body)' }}>{profileData?.email || user.email || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 3 }}>Role</div>
              <span style={{ background: '#f3e8ff', color: '#6d28d9', padding: '3px 12px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600 }}>
                P&O Specialist
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Change Password */}
      <div className="skeu-card" style={{ padding: 24 }}>
        <SectionHeader number="2" title="Change Password" />
        <form onSubmit={handlePasswordSubmit} style={{ maxWidth: 480 }}>
          <div style={{ marginBottom: 14 }}>
            <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Current Password</label>
            <input type="password" className="skeu-input" style={{ width: '100%' }} value={pwForm.current_password} onChange={e => setPwForm({ ...pwForm, current_password: e.target.value })} required />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>New Password</label>
            <input type="password" className="skeu-input" style={{ width: '100%' }} value={pwForm.new_password} onChange={e => setPwForm({ ...pwForm, new_password: e.target.value })} required minLength={8} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Confirm New Password</label>
            <input type="password" className="skeu-input" style={{ width: '100%' }} value={pwForm.confirm_password} onChange={e => setPwForm({ ...pwForm, confirm_password: e.target.value })} required />
          </div>
          {pwError && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, fontSize: '0.88rem', marginBottom: 16 }}>{pwError}</div>}
          {pwSuccess && <div style={{ background: '#d1fae5', color: '#065f46', padding: '10px 14px', borderRadius: 8, fontSize: '0.88rem', marginBottom: 16 }}>{pwSuccess}</div>}
          <button type="submit" className="skeu-btn-primary" disabled={pwSubmitting}>
            {pwSubmitting ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
