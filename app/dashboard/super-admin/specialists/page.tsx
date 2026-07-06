'use client';

import { useAuth } from '@/hooks/useAuth';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { useEffect, useState } from 'react';
import { UserPlus, Trash2 } from 'lucide-react';
import { isPasswordValid, PASSWORD_REQUIREMENT_MESSAGE } from '@/lib/password';
import SkeuSelect from '@/components/ui/SkeuSelect';

interface Specialist {
  id: number;
  user_id: number;
  email: string;
  hospital_id: number | null;
  hospital_name: string | null;
}

interface Hospital { id: number; name: string; }

export default function SuperAdminSpecialistsPage() {
  const { user, loading } = useAuth();
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hospitalId, setHospitalId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { confirm, dialog } = useConfirmDialog();

  const load = () => {
    Promise.all([
      fetch('/api/admin/specialists').then(r => r.json()),
      fetch('/api/admin/hospitals').then(r => r.json()),
    ]).then(([specData, hospData]) => {
      if (specData.specialists) setSpecialists(specData.specialists);
      if (Array.isArray(hospData)) setHospitals(hospData);
      else if (hospData.hospitals) setHospitals(hospData.hospitals);
      setDataLoading(false);
    }).catch(() => setDataLoading(false));
  };

  useEffect(() => { if (user) load(); }, [user]);
  useAutoRefresh(load, 30000, !!user);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!user) { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }
  if (user.role !== 'super_admin') { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!isPasswordValid(password)) { setError(PASSWORD_REQUIREMENT_MESSAGE); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/specialists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, hospital_id: hospitalId ? Number(hospitalId) : undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to add P&O Specialist.'); }
      else {
        setEmail(''); setPassword(''); setHospitalId(''); setShowForm(false);
        load();
      }
    } catch {
      setError('Network error. Please try again.');
    }
    setSubmitting(false);
  }

  async function handleDelete(s: Specialist) {
    const ok = await confirm(`Remove ${s.email} as a P&O Specialist? This cannot be undone.`, { title: 'Remove P&O Specialist', confirmLabel: 'Remove', danger: true });
    if (!ok) return;
    setDeletingId(s.id);
    try {
      await fetch('/api/admin/specialists', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ specialist_id: s.id }),
      });
      load();
    } catch { /* silently fail */ }
    setDeletingId(null);
  }

  return (
    <div className="dash-content">
      {dialog}
      <div className="dash-page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: '#1b3d5e18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <UserPlus size={22} color="var(--primary)" />
          </div>
          <h1 className="font-display" style={{ fontSize: '1.7rem', fontWeight: 600, color: 'var(--text-head)', margin: 0 }}>P&O Specialists</h1>
        </div>
        <button className="skeu-btn-accent" onClick={() => { setShowForm(!showForm); setError(''); }} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <UserPlus size={16} />{showForm ? 'Cancel' : 'Add P&O Specialist'}
        </button>
      </div>

      {showForm && (
        <div className="skeu-card" style={{ padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-head)', marginBottom: 20 }}>Add P&O Specialist</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14 }}>
              <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Email Address</label>
              <input type="email" className="skeu-input" style={{ width: '100%' }} value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Temporary Password</label>
              <input type="password" className="skeu-input" style={{ width: '100%' }} value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>They will be asked to change this on first login.</div>
            </div>
            <div style={{ marginBottom: 18 }}>
              <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Hospital (optional)</label>
              <SkeuSelect
                value={hospitalId} onChange={setHospitalId}
                options={hospitals.map(h => ({ value: String(h.id), label: h.name }))}
                placeholder="Independent — not tied to a hospital"
              />
            </div>

            {error && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, fontSize: '0.88rem', marginBottom: 14 }}>{error}</div>}

            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" className="skeu-btn-primary" disabled={submitting} style={{ flex: 1 }}>
                {submitting ? 'Adding...' : 'Add P&O Specialist'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setError(''); }} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid var(--border-card)', background: 'transparent', cursor: 'pointer', fontWeight: 600, color: 'var(--text-body)' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="skeu-card" style={{ padding: 24 }}>
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-head)', margin: 0 }}>All P&O Specialists</h2>
          <span style={{ background: '#f3e8ff', color: '#6d28d9', padding: '2px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600 }}>{specialists.length}</span>
        </div>
        {dataLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading...</div>
        ) : specialists.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>No P&O Specialists yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {specialists.map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', padding: '14px 18px', borderRadius: 10, border: '1px solid var(--border-card)', background: 'var(--bg-base)', gap: 12 }}>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-head)' }}>{s.email}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.hospital_name || 'Independent'}</div>
                </div>
                <button
                  onClick={() => handleDelete(s)}
                  disabled={deletingId === s.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: '1px solid #fee2e2', background: '#fee2e2', color: '#b91c1c', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                >
                  <Trash2 size={14} />{deletingId === s.id ? 'Removing...' : 'Remove'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
