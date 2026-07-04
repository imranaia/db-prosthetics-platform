'use client';

import { useAuth } from '@/hooks/useAuth';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { useEffect, useState } from 'react';
import { CalendarDays, Home, Building2, MapPin, UserCheck } from 'lucide-react';

interface Appointment {
  id: number; patient_name: string; patient_phone: string | null; type: string; status: string;
  scheduled_date: string | null; preferred_date: string | null; notes: string | null;
  quoted_price: number | null; assigned_hospital_id: number | null;
  assigned_doctor_id: number | null; assigned_to_admin: number; created_at: string;
  patient_state: string | null; patient_lga: string | null; patient_address: string | null;
  requested_doctor_id: number | null; requested_doctor_name: string | null;
  assigned_doctor_name: string | null;
}
interface Hospital { id: number; name: string; }
interface Doctor { id: number; full_name: string | null; email: string; specialization: string | null; state: string | null; }

const FILTERS = ['all', 'requested', 'quoted', 'confirmed', 'completed', 'cancelled'];

const S_STYLE: Record<string, { bg: string; color: string }> = {
  requested:  { bg: 'rgba(234,179,8,0.12)',  color: '#a16207' },
  quoted:     { bg: 'rgba(59,130,246,0.12)', color: '#1d4ed8' },
  confirmed:  { bg: 'rgba(99,102,241,0.12)', color: '#4338ca' },
  completed:  { bg: 'rgba(22,163,74,0.12)',  color: '#16a34a' },
  cancelled:  { bg: 'rgba(220,38,38,0.12)',  color: '#b91c1c' },
};

function fmt(kobo: number) { return '₦' + (kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 0 }); }

// Doctors in the patient's own state sort first, so the admin sees the
// closest available doctors without losing the ability to pick anyone.
function sortByProximity(doctors: Doctor[], patientState: string | null) {
  if (!patientState) return doctors;
  return [...doctors].sort((a, b) => {
    const aNear = a.state === patientState ? 0 : 1;
    const bNear = b.state === patientState ? 0 : 1;
    return aNear - bNear;
  });
}

export default function AppointmentsPage() {
  const { user, loading } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filter, setFilter] = useState('all');
  const [quoteId, setQuoteId] = useState<number | null>(null);
  const [quoteAmount, setQuoteAmount] = useState('');
  const [assignId, setAssignId] = useState<number | null>(null);
  const [assignHospital, setAssignHospital] = useState('');
  const [assignDoctorApptId, setAssignDoctorApptId] = useState<number | null>(null);
  const [assignDoctor, setAssignDoctor] = useState('');

  async function load() {
    const [a, h, d] = await Promise.all([
      fetch('/api/admin/appointments').then(r => r.json()),
      fetch('/api/admin/hospitals').then(r => r.json()),
      fetch('/api/admin/doctors').then(r => r.json()),
    ]);
    setAppointments(Array.isArray(a) ? a : []); setHospitals(Array.isArray(h) ? h : []); setDoctors(Array.isArray(d) ? d : []);
  }

  useEffect(() => { if (user) load(); }, [user]);

  useAutoRefresh(load, 30000, !!user);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!user) { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }

  async function submitQuote(id: number) {
    const kobo = Math.round(parseFloat(quoteAmount) * 100);
    await fetch(`/api/admin/appointments/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quoted_price: kobo, status: 'quoted' }),
    });
    setQuoteId(null); setQuoteAmount(''); load();
  }

  async function submitAssign(id: number) {
    await fetch(`/api/admin/appointments/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assigned_hospital_id: parseInt(assignHospital), status: 'confirmed' }),
    });
    setAssignId(null); setAssignHospital(''); load();
  }

  async function submitAssignDoctor(id: number, doctorValue?: string) {
    const value = doctorValue ?? assignDoctor;
    if (!value) return;
    const payload = value === 'self'
      ? { assigned_doctor_id: null, assigned_to_admin: true, status: 'confirmed' }
      : { assigned_doctor_id: parseInt(value), assigned_to_admin: false, status: 'confirmed' };
    await fetch(`/api/admin/appointments/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setAssignDoctorApptId(null); setAssignDoctor(''); load();
  }

  async function updateStatus(id: number, status: string) {
    await fetch(`/api/admin/appointments/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    load();
  }

  const visible = filter === 'all' ? appointments : appointments.filter(a => a.status === filter);

  return (
    <div className="dash-content">
      <div className="dash-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#dc262618', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CalendarDays size={20} color="#dc2626" />
          </div>
          <div>
            <h1 className="font-display" style={{ fontSize: '1.75rem', color: 'var(--text-head)', fontWeight: 600 }}>Appointments</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{appointments.length} total appointments</p>
          </div>
        </div>
      </div>

      <div className="filter-tabs">
        {FILTERS.map(f => (
          <button key={f} className={`filter-tab${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== 'all' && <span style={{ marginLeft: 4, opacity: 0.7 }}>({appointments.filter(a => a.status === f).length})</span>}
          </button>
        ))}
      </div>

      <div className="skeu-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-scroll">
          <table className="dash-table">
            <thead><tr><th>Patient</th><th>Type</th><th>Location</th><th>Status</th><th>Scheduled</th><th>Notes</th><th>Actions</th></tr></thead>
            <tbody>
              {visible.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No appointments in this category.</td></tr>
              ) : visible.map(a => {
                const ss = S_STYLE[a.status] || { bg: '#f3f4f6', color: '#6b7280' };
                const sortedDoctors = sortByProximity(doctors, a.patient_state);
                const hasUnconfirmedRequest = a.type === 'home' && a.requested_doctor_id && !a.assigned_doctor_id && !a.assigned_to_admin;
                return (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-head)' }}>
                      <div>{a.patient_name}</div>
                      {a.patient_phone && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>{a.patient_phone}</div>}
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem', fontWeight: 500, color: a.type === 'home' ? '#7c3aed' : '#1b3d5e' }}>
                        {a.type === 'home' ? <Home size={13} /> : <Building2 size={13} />}
                        {a.type === 'home' ? 'Home Visit' : 'Hospital'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', maxWidth: 160 }}>
                      {a.type === 'home' ? (
                        (a.patient_state || a.patient_lga || a.patient_address) ? (
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                            <MapPin size={12} style={{ marginTop: 2, flexShrink: 0 }} />
                            <span>
                              {[a.patient_lga, a.patient_state].filter(Boolean).join(', ') || '—'}
                              {a.patient_address && <div style={{ fontSize: '0.72rem', opacity: 0.8 }}>{a.patient_address}</div>}
                            </span>
                          </div>
                        ) : <span style={{ opacity: 0.6 }}>No address on file</span>
                      ) : '—'}
                    </td>
                    <td><span className="status-badge" style={{ background: ss.bg, color: ss.color }}>{a.status}</span></td>
                    <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {a.scheduled_date ? new Date(a.scheduled_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
                        : a.preferred_date ? new Date(a.preferred_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td style={{ color: 'var(--text-muted)', maxWidth: 200 }}>
                      <span title={a.notes || ''} style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{a.notes || '—'}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 180 }}>
                        {hasUnconfirmedRequest && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 6, padding: '6px 8px' }}>
                            <UserCheck size={13} color="#7c3aed" style={{ flexShrink: 0 }} />
                            <span style={{ fontSize: '0.75rem', color: '#7c3aed', flex: 1 }}>Patient requested Dr. {a.requested_doctor_name || `#${a.requested_doctor_id}`}</span>
                            <button
                              onClick={() => submitAssignDoctor(a.id, String(a.requested_doctor_id))}
                              style={{ padding: '4px 8px', borderRadius: '5px', background: '#7c3aed', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600, whiteSpace: 'nowrap' }}
                            >
                              Confirm
                            </button>
                          </div>
                        )}
                        {a.status === 'requested' && a.type === 'home' && (
                          quoteId === a.id ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>₦</span>
                              <input type="number" min="0" value={quoteAmount} onChange={e => setQuoteAmount(e.target.value)} placeholder="Amount" style={{ width: 100, padding: '5px 8px', borderRadius: '6px', border: '1px solid var(--border-card)', fontSize: '0.82rem' }} />
                              <button onClick={() => submitQuote(a.id)} style={{ padding: '5px 12px', borderRadius: '6px', background: 'var(--primary)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}>Set</button>
                              <button onClick={() => setQuoteId(null)} style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid var(--border-card)', background: 'transparent', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-muted)' }}>×</button>
                            </div>
                          ) : (
                            <button onClick={() => setQuoteId(a.id)} style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid rgba(124,58,237,0.3)', background: 'rgba(124,58,237,0.08)', color: '#7c3aed', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, whiteSpace: 'nowrap' }}>
                              Set Quote
                            </button>
                          )
                        )}
                        {a.type === 'home' && (a.status === 'requested' || a.status === 'quoted') && (
                          assignDoctorApptId === a.id ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <select value={assignDoctor} onChange={e => setAssignDoctor(e.target.value)} style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid var(--border-card)', fontSize: '0.82rem', maxWidth: 200 }}>
                                <option value="">Select assignee</option>
                                <option value="self">Super Admin (Self)</option>
                                {sortedDoctors.map(d => (
                                  <option key={d.id} value={d.id}>
                                    {d.full_name || d.email}{d.specialization ? ` — ${d.specialization}` : ''}
                                    {a.patient_state && d.state === a.patient_state ? ' (Nearby)' : d.state ? ` (${d.state})` : ''}
                                  </option>
                                ))}
                              </select>
                              <button onClick={() => submitAssignDoctor(a.id)} disabled={!assignDoctor} style={{ padding: '5px 12px', borderRadius: '6px', background: 'var(--primary)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}>Assign</button>
                              <button onClick={() => setAssignDoctorApptId(null)} style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid var(--border-card)', background: 'transparent', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-muted)' }}>×</button>
                            </div>
                          ) : (
                            <button onClick={() => setAssignDoctorApptId(a.id)} style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid rgba(27,61,94,0.3)', background: 'rgba(27,61,94,0.08)', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, whiteSpace: 'nowrap' }}>
                              {a.assigned_doctor_id ? 'Reassign Doctor' : 'Assign Doctor'}
                            </button>
                          )
                        )}
                        {a.status === 'requested' && a.type === 'hospital' && (
                          assignId === a.id ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <select value={assignHospital} onChange={e => setAssignHospital(e.target.value)} style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid var(--border-card)', fontSize: '0.82rem' }}>
                                <option value="">Select hospital</option>
                                {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                              </select>
                              <button onClick={() => submitAssign(a.id)} disabled={!assignHospital} style={{ padding: '5px 12px', borderRadius: '6px', background: 'var(--primary)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}>Assign</button>
                              <button onClick={() => setAssignId(null)} style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid var(--border-card)', background: 'transparent', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-muted)' }}>×</button>
                            </div>
                          ) : (
                            <button onClick={() => setAssignId(a.id)} style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid rgba(27,61,94,0.3)', background: 'rgba(27,61,94,0.08)', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, whiteSpace: 'nowrap' }}>
                              Assign Hospital
                            </button>
                          )
                        )}
                        {(a.status === 'quoted' || a.status === 'confirmed') && a.assigned_to_admin === 1 && (
                          <button onClick={() => updateStatus(a.id, 'completed')} style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid rgba(22,163,74,0.3)', background: 'rgba(22,163,74,0.08)', color: '#16a34a', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, whiteSpace: 'nowrap' }}>
                            Mark Complete
                          </button>
                        )}
                        {a.quoted_price && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Quote: {fmt(a.quoted_price)}</div>}
                        {a.assigned_to_admin ? <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Assigned to Super Admin</div>
                          : a.assigned_doctor_id ? <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Assigned: Dr. {a.assigned_doctor_name || a.assigned_doctor_id}</div> : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
