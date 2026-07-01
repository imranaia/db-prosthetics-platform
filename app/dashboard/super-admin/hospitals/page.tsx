'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { NIGERIA_STATES } from '@/lib/nigeria-states';

interface Hospital {
  id: number;
  name: string;
  state: string;
  address: string;
  admin_email: string;
  created_at: string;
}

const emptyForm = { name: '', state: '', address: '', admin_email: '', admin_password: '' };

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

  useEffect(() => {
    if (user) fetchHospitals();
  }, [user]);

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }
  if (!user) {
    if (typeof window !== 'undefined') window.location.href = '/login';
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const res = await fetch('/api/admin/hospitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSubmitting(false);
    if (res.ok) {
      setForm(emptyForm);
      setShowForm(false);
      fetchHospitals();
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to create hospital');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this hospital?')) return;
    await fetch(`/api/admin/hospitals/${id}`, { method: 'DELETE' });
    fetchHospitals();
  }

  return (
    <div style={{ padding: '40px 36px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <h1 className="font-display" style={{ fontSize: '1.9rem', color: 'var(--text-head)', fontWeight: 600 }}>
          Hospitals
        </h1>
        <button className="skeu-btn-primary" onClick={() => setShowForm((s) => !s)} style={{ padding: '10px 22px' }}>
          {showForm ? 'Cancel' : '+ Add Hospital'}
        </button>
      </div>

      {showForm && (
        <div className="skeu-card" style={{ padding: '28px', marginBottom: '28px' }}>
          <h2 className="font-display" style={{ fontSize: '1.2rem', color: 'var(--text-head)', marginBottom: '20px' }}>
            New Hospital
          </h2>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label className="skeu-label">Hospital Name</label>
              <input
                className="skeu-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label className="skeu-label">State</label>
              <select
                className="skeu-select"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                required
                style={{ width: '100%' }}
              >
                <option value="">Select state</option>
                {NIGERIA_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="skeu-label">Address</label>
              <input
                className="skeu-input"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                required
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label className="skeu-label">Admin Email</label>
              <input
                className="skeu-input"
                type="email"
                value={form.admin_email}
                onChange={(e) => setForm({ ...form, admin_email: e.target.value })}
                required
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label className="skeu-label">Admin Password</label>
              <input
                className="skeu-input"
                type="password"
                value={form.admin_password}
                onChange={(e) => setForm({ ...form, admin_password: e.target.value })}
                required
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '12px' }}>
              <button className="skeu-btn-primary" type="submit" disabled={submitting} style={{ padding: '10px 24px' }}>
                {submitting ? 'Creating…' : 'Create Hospital'}
              </button>
              <button className="skeu-btn-ghost" type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 20px', background: 'rgba(0,0,0,0.06)', color: 'var(--text-body)', border: '1px solid rgba(0,0,0,0.12)' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="skeu-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(27,61,94,0.06)', borderBottom: '1px solid var(--border-card)' }}>
              {['Name', 'State', 'Admin Email', 'Date Added', ''].map((h) => (
                <th key={h} style={{ padding: '14px 18px', textAlign: 'left', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hospitals.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  No hospitals yet.
                </td>
              </tr>
            )}
            {hospitals.map((h, i) => (
              <tr
                key={h.id}
                style={{ borderBottom: i < hospitals.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}
              >
                <td style={{ padding: '14px 18px', fontWeight: 500, color: 'var(--text-head)', fontSize: '0.9rem' }}>{h.name}</td>
                <td style={{ padding: '14px 18px', color: 'var(--text-body)', fontSize: '0.88rem' }}>{h.state}</td>
                <td style={{ padding: '14px 18px', color: 'var(--text-body)', fontSize: '0.88rem' }}>{h.admin_email || '—'}</td>
                <td style={{ padding: '14px 18px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {new Date(h.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
                <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                  <button
                    className="skeu-btn-ghost"
                    onClick={() => handleDelete(h.id)}
                    style={{ padding: '6px 14px', fontSize: '0.8rem', background: 'rgba(220,38,38,0.08)', color: '#b91c1c', border: '1px solid rgba(220,38,38,0.2)', borderRadius: '6px' }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
