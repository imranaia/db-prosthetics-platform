'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { Stethoscope, Plus, X, ChevronDown, ChevronUp, User, Search } from 'lucide-react';

interface Consultation {
  id: number; patient_name: string; doctor_email: string | null;
  conducted_by_role: string; notes: string | null; created_at: string;
}
interface Patient { id: number; full_name: string; }

export default function ConsultationsPage() {
  const { user, loading } = useAuth();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ patient_id: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  async function load() {
    const [c, p] = await Promise.all([
      fetch('/api/admin/consultations').then(r => r.json()),
      fetch('/api/admin/patients').then(r => r.json()),
    ]);
    setConsultations(c); setPatients(p);
  }

  useEffect(() => { if (user) load(); }, [user]);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!user) { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSubmitting(true); setError('');
    const r = await fetch('/api/admin/consultations', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patient_id: parseInt(form.patient_id), notes: form.notes }),
    });
    setSubmitting(false);
    if (r.ok) { setForm({ patient_id: '', notes: '' }); setShowForm(false); load(); }
    else { const d = await r.json(); setError(d.error || 'Failed to save consultation'); }
  }

  const filtered = consultations.filter(c =>
    c.patient_name.toLowerCase().includes(search.toLowerCase()) ||
    (c.notes || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="dash-content">
      <div className="dash-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#7c3aed18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Stethoscope size={20} color="#7c3aed" />
          </div>
          <div>
            <h1 className="font-display" style={{ fontSize: '1.75rem', color: 'var(--text-head)', fontWeight: 600 }}>Consultations</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Full doctor-patient communication history</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input className="skeu-input" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 32, width: 200, maxWidth: '100%' }} />
          </div>
          <button className="skeu-btn-primary" onClick={() => setShowForm(s => !s)} style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '7px' }}>
            {showForm ? <><X size={15} />Cancel</> : <><Plus size={15} />New Consultation</>}
          </button>
        </div>
      </div>

      {/* New Consultation Form — Super Admin acting as Doctor */}
      {showForm && (
        <div className="inline-form-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#7c3aed18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Stethoscope size={17} color="#7c3aed" />
            </div>
            <div>
              <h2 className="font-display" style={{ fontSize: '1.15rem', color: 'var(--text-head)', fontWeight: 600 }}>New Consultation</h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Conducted by Super Admin</p>
            </div>
          </div>

          {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label className="skeu-label">Patient</label>
              <select className="skeu-select" value={form.patient_id} onChange={e => setForm({ ...form, patient_id: e.target.value })} required>
                <option value="">Select a patient…</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label className="skeu-label">Consultation Notes</label>
              <textarea
                className="skeu-input"
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                rows={5}
                required
                placeholder="Describe findings, recommendations, and next steps…"
                style={{ resize: 'vertical' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="skeu-btn-primary" type="submit" disabled={submitting} style={{ padding: '10px 24px' }}>
                {submitting ? 'Saving…' : 'Save Consultation'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border-card)', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="skeu-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-scroll">
          <table className="dash-table">
            <thead><tr><th>Patient</th><th>Conducted By</th><th>Notes Preview</th><th>Date</th><th></th></tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No consultations yet.</td></tr>
              ) : filtered.flatMap(c => {
                const rows: React.ReactElement[] = [(
                  <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}>
                    <td style={{ fontWeight: 600, color: 'var(--text-head)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <User size={12} color="#fff" />
                        </div>
                        {c.patient_name}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.82rem', fontWeight: 500, color: c.conducted_by_role === 'super_admin' ? '#7c3aed' : 'var(--primary)' }}>
                        {c.conducted_by_role === 'super_admin' ? 'Super Admin' : (c.doctor_email || 'Doctor')}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', maxWidth: 240 }}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>
                        {c.notes ? c.notes.slice(0, 80) + (c.notes.length > 80 ? '…' : '') : '—'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{new Date(c.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td>{expandedId === c.id ? <ChevronUp size={15} color="var(--text-muted)" /> : <ChevronDown size={15} color="var(--text-muted)" />}</td>
                  </tr>
                )];
                if (expandedId === c.id && c.notes) {
                  rows.push(
                    <tr key={`${c.id}-exp`}>
                      <td colSpan={5} style={{ padding: 0, background: 'rgba(124,58,237,0.03)', borderBottom: '1px solid var(--border-subtle)' }}>
                        <div style={{ padding: '16px 24px 16px 52px' }}>
                          <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '8px' }}>Full Notes</div>
                          <div style={{ fontSize: '0.9rem', color: 'var(--text-body)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{c.notes}</div>
                        </div>
                      </td>
                    </tr>
                  );
                }
                return rows;
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
