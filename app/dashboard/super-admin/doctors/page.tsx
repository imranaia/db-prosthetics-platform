'use client';

import { useAuth } from '@/hooks/useAuth';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { useEffect, useState } from 'react';
import { Stethoscope, Plus, X, Search, Building2, ChevronDown, ChevronUp } from 'lucide-react';
import { isPasswordValid, PASSWORD_REQUIREMENT_MESSAGE } from '@/lib/password';

interface Doctor {
  id: number;
  full_name: string | null;
  specialization: string | null;
  state: string | null;
  lga: string | null;
  address: string | null;
  phone: string | null;
  years_experience: number | null;
  qualifications: string | null;
  dob: string | null;
  gender: string | null;
  marital_status: string | null;
  occupation: string | null;
  religion: string | null;
  next_of_kin_name: string | null;
  next_of_kin_relationship: string | null;
  next_of_kin_phone: string | null;
  profile_completed_at: string | null;
  email: string;
  hospital_name: string | null;
}

interface Hospital {
  id: number;
  name: string;
}

const emptyForm = { full_name: '', email: '', password: '', hospital_id: '', specialization: '' };

function formatDate(dt: string | null) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <div style={{ fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-body)' }}>{value || '—'}</div>
    </div>
  );
}

export default function DoctorsPage() {
  const { user, loading } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredDoctors.map(d => {
            const isExp = expandedId === d.id;
            return (
              <div key={d.id} className="skeu-card" style={{ padding: 18 }}>
                <div
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, cursor: 'pointer', flexWrap: 'wrap' }}
                  onClick={() => setExpandedId(isExp ? null : d.id)}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Stethoscope size={15} color="#7c3aed" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-head)' }}>{d.full_name || '—'}</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>{d.email}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    {d.specialization && <span style={{ fontSize: '0.78rem', color: 'var(--text-body)' }}>{d.specialization}</span>}
                    {isExp ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, padding: '6px 10px', borderRadius: 8, background: d.hospital_name ? 'rgba(27,61,94,0.06)' : 'rgba(107,114,128,0.08)', width: 'fit-content' }}>
                  <Building2 size={13} color={d.hospital_name ? 'var(--primary)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '0.78rem', color: d.hospital_name ? 'var(--text-body)' : 'var(--text-muted)', fontStyle: d.hospital_name ? 'normal' : 'italic' }}>
                    {d.hospital_name || 'Independent — no hospital'}
                  </span>
                </div>

                {isExp && (
                  <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border-card)' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 10 }}>
                      Professional
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px 20px', marginBottom: 18 }}>
                      <Field label="Phone" value={d.phone} />
                      <Field label="Years of Experience" value={d.years_experience != null ? String(d.years_experience) : null} />
                      <Field label="State" value={d.state} />
                      <Field label="LGA" value={d.lga} />
                      <Field label="Address" value={d.address} />
                      <Field label="Qualifications" value={d.qualifications} />
                    </div>

                    <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 10 }}>
                      Personal
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px 20px', marginBottom: 18 }}>
                      <Field label="Date of Birth" value={formatDate(d.dob)} />
                      <Field label="Gender" value={d.gender} />
                      <Field label="Marital Status" value={d.marital_status} />
                      <Field label="Occupation" value={d.occupation} />
                      <Field label="Religion" value={d.religion} />
                    </div>

                    <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 10 }}>
                      Next of Kin
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px 20px', marginBottom: 18 }}>
                      <Field label="Full Name" value={d.next_of_kin_name} />
                      <Field label="Relationship" value={d.next_of_kin_relationship} />
                      <Field label="Phone" value={d.next_of_kin_phone} />
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {d.profile_completed_at ? `Profile completed ${formatDate(d.profile_completed_at)}` : 'Profile not yet completed'}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
