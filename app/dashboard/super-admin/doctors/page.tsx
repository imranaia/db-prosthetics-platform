'use client';

import { useAuth } from '@/hooks/useAuth';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { useEffect, useState } from 'react';
import { Stethoscope, Plus, X, Search, Building2 } from 'lucide-react';
import { isPasswordValid, PASSWORD_REQUIREMENT_MESSAGE } from '@/lib/password';

interface Doctor {
  id: number;
  full_name: string | null;
  specialization: string | null;
  state: string | null;
  phone: string | null;
  email: string;
  hospital_name: string | null;
}

interface Hospital {
  id: number;
  name: string;
}

const emptyForm = { full_name: '', email: '', password: '', hospital_id: '', specialization: '' };

export default function DoctorsPage() {
  const { user, loading } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { dialog } = useConfirmDialog();

  async function fetchDoctors() {
    const res = await fetch('/api/admin/doctors');
    if (res.ok) setDoctors(await res.json());
  }

  async function fetchHospitals() {
    const res = await fetch('/api/admin/hospitals');
    if (res.ok) setHospitals(await res.json());
  }

  useEffect(() => { if (user) { fetchDoctors(); fetchHospitals(); } }, [user]);

  useAutoRefresh(fetchDoctors, 30000, !!user);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!user) { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }

  const filteredDoctors = doctors.filter(d =>
    (d.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    d.email.toLowerCase().includes(search.toLowerCase()) ||
    (d.hospital_name || '').toLowerCase().includes(search.toLowerCase())
  );

  function openAddForm() {
    setForm(emptyForm);
    setError('');
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isPasswordValid(form.password)) { setError(PASSWORD_REQUIREMENT_MESSAGE); return; }
    setSubmitting(true); setError('');
    const res = await fetch('/api/admin/doctors', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: form.full_name,
        email: form.email,
        password: form.password,
        hospital_id: form.hospital_id ? Number(form.hospital_id) : null,
        specialization: form.specialization || undefined,
      }),
    });
    setSubmitting(false);
    if (res.ok) { setForm(emptyForm); setShowForm(false); fetchDoctors(); }
    else { const d = await res.json(); setError(d.error || 'Failed to create doctor'); }
  }

  return (
    <div className="dash-content">
      {dialog}

      <div className="dash-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#7c3aed18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Stethoscope size={20} color="#7c3aed" />
          </div>
          <div>
            <h1 className="font-display" style={{ fontSize: '1.75rem', color: 'var(--text-head)', fontWeight: 600 }}>Doctors</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{doctors.length} registered</p>
          </div>
        </div>
        <button className="skeu-btn-primary" onClick={() => (showForm ? setShowForm(false) : openAddForm())} style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '7px' }}>
          {showForm ? <><X size={15} /> Cancel</> : <><Plus size={15} /> Add Doctor</>}
        </button>
      </div>

      {showForm && (
        <div className="inline-form-card">
          <h2 className="font-display" style={{ fontSize: '1.2rem', color: 'var(--text-head)', marginBottom: '20px', fontWeight: 600 }}>New Doctor</h2>
          {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-grid-2">
              <div>
                <label className="skeu-label">Full Name</label>
                <input className="skeu-input" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required placeholder="e.g. Dr. Musa Bello" />
              </div>
              <div>
                <label className="skeu-label">Email</label>
                <input className="skeu-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required placeholder="doctor@example.com" />
              </div>
            </div>
            <div className="form-grid-2" style={{ marginTop: 14 }}>
              <div>
                <label className="skeu-label">Hospital<span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '4px' }}>(optional — leave blank for an independent doctor)</span></label>
                <select className="skeu-select" value={form.hospital_id} onChange={e => setForm({ ...form, hospital_id: e.target.value })}>
                  <option value="">No hospital (independent)</option>
                  {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
              </div>
              <div>
                <label className="skeu-label">Specialization<span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '4px' }}>(optional)</span></label>
                <input className="skeu-input" value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })} placeholder="e.g. Orthopedics" />
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <label className="skeu-label">Temporary Password</label>
              <input className="skeu-input" type="text" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required placeholder="Emailed to the doctor — they'll be asked to change it" />
            </div>
            <button type="submit" className="skeu-btn-primary" disabled={submitting} style={{ marginTop: 18 }}>
              {submitting ? 'Creating…' : 'Create Doctor'}
            </button>
          </form>
        </div>
      )}

      <div style={{ position: 'relative', maxWidth: 320, margin: '20px 0' }}>
        <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
        <input className="skeu-input" placeholder="Search doctors or hospitals…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 34, width: '100%' }} />
      </div>

      {filteredDoctors.length === 0 ? (
        <div className="skeu-card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          {doctors.length === 0 ? 'No doctors yet. Add the first one above.' : 'No doctors match your search.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {filteredDoctors.map(d => (
            <div key={d.id} className="skeu-card" style={{ padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Stethoscope size={15} color="#7c3aed" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-head)' }}>{d.full_name || '—'}</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4 }}>{d.email}</div>
              {d.specialization && <div style={{ fontSize: '0.78rem', color: 'var(--text-body)', marginBottom: 4 }}>{d.specialization}</div>}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, padding: '6px 10px', borderRadius: 8, background: d.hospital_name ? 'rgba(27,61,94,0.06)' : 'rgba(107,114,128,0.08)' }}>
                <Building2 size={13} color={d.hospital_name ? 'var(--primary)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.78rem', color: d.hospital_name ? 'var(--text-body)' : 'var(--text-muted)', fontStyle: d.hospital_name ? 'normal' : 'italic' }}>
                  {d.hospital_name || 'Independent — no hospital'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
