'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';

interface Appointment {
  id: number;
  patient_name: string;
  type: string;
  status: string;
  scheduled_date: string | null;
  notes: string | null;
  quoted_price: number | null;
  assigned_hospital_id: number | null;
  created_at: string;
}

interface Hospital {
  id: number;
  name: string;
}

const FILTER_TABS = ['all', 'requested', 'quoted', 'confirmed', 'completed', 'cancelled'];

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  requested:  { bg: 'rgba(234,179,8,0.12)',  color: '#a16207' },
  quoted:     { bg: 'rgba(59,130,246,0.12)', color: '#1d4ed8' },
  confirmed:  { bg: 'rgba(99,102,241,0.12)', color: '#4338ca' },
  completed:  { bg: 'rgba(22,163,74,0.12)',  color: '#16a34a' },
  cancelled:  { bg: 'rgba(220,38,38,0.12)',  color: '#b91c1c' },
};

export default function AppointmentsPage() {
  const { user, loading } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [filter, setFilter] = useState('all');
  const [quoteInputs, setQuoteInputs] = useState<Record<number, string>>({});
  const [hospitalSelects, setHospitalSelects] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState<Record<number, boolean>>({});

  async function fetchAppointments() {
    const res = await fetch('/api/admin/appointments');
    if (res.ok) setAppointments(await res.json());
  }

  useEffect(() => {
    if (!user) return;
    fetchAppointments();
    fetch('/api/admin/hospitals').then((r) => r.json()).then(setHospitals);
  }, [user]);

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }
  if (!user) {
    if (typeof window !== 'undefined') window.location.href = '/login';
    return null;
  }

  const filtered = filter === 'all' ? appointments : appointments.filter((a) => a.status === filter);

  async function handleSetQuote(id: number) {
    const price = parseFloat(quoteInputs[id] ?? '');
    if (isNaN(price) || price <= 0) return;
    setSubmitting((s) => ({ ...s, [id]: true }));
    await fetch(`/api/admin/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quoted_price: price, status: 'quoted' }),
    });
    setSubmitting((s) => ({ ...s, [id]: false }));
    setQuoteInputs((q) => { const c = { ...q }; delete c[id]; return c; });
    fetchAppointments();
  }

  async function handleAssignHospital(id: number) {
    const hospId = parseInt(hospitalSelects[id] ?? '');
    if (!hospId) return;
    setSubmitting((s) => ({ ...s, [id]: true }));
    await fetch(`/api/admin/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assigned_hospital_id: hospId, status: 'confirmed' }),
    });
    setSubmitting((s) => ({ ...s, [id]: false }));
    setHospitalSelects((h) => { const c = { ...h }; delete c[id]; return c; });
    fetchAppointments();
  }

  return (
    <div style={{ padding: '40px 36px' }}>
      <h1 className="font-display" style={{ fontSize: '1.9rem', color: 'var(--text-head)', fontWeight: 600, marginBottom: '24px' }}>
        Appointments
      </h1>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {FILTER_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            style={{
              padding: '7px 16px',
              borderRadius: '20px',
              border: '1px solid',
              fontSize: '0.82rem',
              fontWeight: 600,
              textTransform: 'capitalize',
              cursor: 'pointer',
              transition: 'all 0.15s',
              background: filter === tab ? 'var(--primary)' : 'rgba(255,255,255,0.6)',
              color: filter === tab ? '#fff' : 'var(--text-muted)',
              borderColor: filter === tab ? 'var(--primary)' : 'rgba(0,0,0,0.12)',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="skeu-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(27,61,94,0.06)', borderBottom: '1px solid var(--border-card)' }}>
              {['Patient', 'Type', 'Status', 'Date', 'Notes', 'Actions'].map((h) => (
                <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No appointments found.</td></tr>
            )}
            {filtered.map((a, i) => (
              <tr key={a.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                <td style={{ padding: '14px 16px', fontWeight: 500, color: 'var(--text-head)', fontSize: '0.88rem' }}>{a.patient_name || '—'}</td>
                <td style={{ padding: '14px 16px', color: 'var(--text-body)', fontSize: '0.85rem', textTransform: 'capitalize' }}>{a.type}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 600, ...(STATUS_COLORS[a.status] ?? { bg: '#eee', color: '#333' }), background: STATUS_COLORS[a.status]?.bg }}>
                    {a.status}
                  </span>
                </td>
                <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: '0.83rem' }}>
                  {a.scheduled_date ? new Date(a.scheduled_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </td>
                <td style={{ padding: '14px 16px', color: 'var(--text-body)', fontSize: '0.83rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {a.notes || '—'}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {a.status === 'requested' && a.type === 'home' && (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        className="skeu-input"
                        type="number"
                        min="0"
                        placeholder="₦ amount"
                        value={quoteInputs[a.id] ?? ''}
                        onChange={(e) => setQuoteInputs((q) => ({ ...q, [a.id]: e.target.value }))}
                        style={{ width: '110px', padding: '5px 10px', fontSize: '0.82rem' }}
                      />
                      <button
                        className="skeu-btn-accent"
                        onClick={() => handleSetQuote(a.id)}
                        disabled={submitting[a.id]}
                        style={{ padding: '5px 14px', fontSize: '0.8rem' }}
                      >
                        {submitting[a.id] ? '…' : 'Set Quote'}
                      </button>
                    </div>
                  )}
                  {a.status === 'requested' && a.type === 'hospital' && (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <select
                        className="skeu-select"
                        value={hospitalSelects[a.id] ?? ''}
                        onChange={(e) => setHospitalSelects((h) => ({ ...h, [a.id]: e.target.value }))}
                        style={{ padding: '5px 10px', fontSize: '0.82rem' }}
                      >
                        <option value="">Select hospital</option>
                        {hospitals.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                      </select>
                      <button
                        className="skeu-btn-primary"
                        onClick={() => handleAssignHospital(a.id)}
                        disabled={submitting[a.id]}
                        style={{ padding: '5px 14px', fontSize: '0.8rem' }}
                      >
                        {submitting[a.id] ? '…' : 'Assign'}
                      </button>
                    </div>
                  )}
                  {a.status !== 'requested' && (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
