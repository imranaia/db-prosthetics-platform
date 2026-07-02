'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { NIGERIA_STATES } from '@/lib/nigeria-states';
import { getLGAs } from '@/lib/nigeria-lgas';
import { Building2, Plus, Trash2, X } from 'lucide-react';

interface Hospital {
  id: number; name: string; state: string; lga?: string;
  landmark?: string; address: string; admin_email: string; created_at: string;
}

const emptyForm = { name: '', state: '', lga: '', landmark: '', address: '', admin_email: '', admin_password: '' };

const optionalStyle: React.CSSProperties = { fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '4px' };

export default function HospitalsPage() {
  const { user, loading } = useAuth();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function fetchHospitals() {
    const res = await fetch('/api/admin/hospitals');
    if (res.ok) setHospitals(await res.json());
  }

  useEffect(() => { if (user) fetchHospitals(); }, [user]);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!user) { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true); setError('');
    const res = await fetch('/api/admin/hospitals', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSubmitting(false);
    if (res.ok) { setForm(emptyForm); setShowForm(false); fetchHospitals(); }
    else { const d = await res.json(); setError(d.error || 'Failed to create hospital'); }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this hospital? This cannot be undone.')) return;
    await fetch(`/api/admin/hospitals/${id}`, { method: 'DELETE' });
    fetchHospitals();
  }

  return (
    <div className="dash-content">
      <div className="dash-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#1b3d5e18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={20} color="var(--primary)" />
          </div>
          <div>
            <h1 className="font-display" style={{ fontSize: '1.75rem', color: 'var(--text-head)', fontWeight: 600 }}>Hospitals</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{hospitals.length} registered</p>
          </div>
        </div>
        <button className="skeu-btn-primary" onClick={() => setShowForm(s => !s)} style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '7px' }}>
          {showForm ? <><X size={15} /> Cancel</> : <><Plus size={15} /> Add Hospital</>}
        </button>
      </div>

      {showForm && (
        <div className="inline-form-card">
          <h2 className="font-display" style={{ fontSize: '1.2rem', color: 'var(--text-head)', marginBottom: '20px', fontWeight: 600 }}>New Hospital</h2>
          {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-grid-2">
              <div>
                <label className="skeu-label">Hospital Name</label>
                <input className="skeu-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Lagos General Hospital" />
              </div>
              <div>
                <label className="skeu-label">State</label>
                <select className="skeu-select" value={form.state} onChange={e => setForm({ ...form, state: e.target.value, lga: '' })} required>
                  <option value="">Select state</option>
                  {NIGERIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="skeu-label">LGA<span style={optionalStyle}>(optional)</span></label>
                <select className="skeu-select" value={form.lga} onChange={e => setForm({ ...form, lga: e.target.value })} disabled={!form.state}>
                  <option value="">Select LGA</option>
                  {getLGAs(form.state).map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="skeu-label">Address<span style={optionalStyle}>(optional)</span></label>
                <input className="skeu-input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Full street address" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="skeu-label">Landmark<span style={optionalStyle}>(optional)</span></label>
                <input className="skeu-input" value={form.landmark} onChange={e => setForm({ ...form, landmark: e.target.value })} placeholder="e.g. Near Central Mosque, opposite Shoprite" />
              </div>
              <div>
                <label className="skeu-label">Admin Email</label>
                <input className="skeu-input" type="email" value={form.admin_email} onChange={e => setForm({ ...form, admin_email: e.target.value })} required placeholder="admin@hospital.com" />
              </div>
              <div>
                <label className="skeu-label">Admin Password</label>
                <input className="skeu-input" type="password" value={form.admin_password} onChange={e => setForm({ ...form, admin_password: e.target.value })} required placeholder="Temporary login password" />
                <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  The hospital admin will receive a login email and be prompted to change this password on first login.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button className="skeu-btn-primary" type="submit" disabled={submitting} style={{ padding: '10px 24px' }}>
                {submitting ? 'Creating…' : 'Create Hospital'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border-card)', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="skeu-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-scroll">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>State / LGA</th>
                <th>Admin Email</th>
                <th>Date Added</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {hospitals.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No hospitals yet. Add your first one above.</td></tr>
              ) : hospitals.map(h => (
                <tr key={h.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-head)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Building2 size={14} color="var(--primary)" style={{ flexShrink: 0 }} />
                      {h.name}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500, color: 'var(--text-body)' }}>{h.state}</div>
                    {h.lga && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{h.lga}</div>}
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{h.admin_email || '—'}</td>
                  <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{new Date(h.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td>
                    <button onClick={() => handleDelete(h.id)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(220,38,38,0.2)', background: 'rgba(220,38,38,0.07)', color: '#b91c1c', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, whiteSpace: 'nowrap' }}>
                      <Trash2 size={13} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
