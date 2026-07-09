'use client';

import { useAuth } from '@/hooks/useAuth';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { useEffect, useState } from 'react';
import { CalendarPlus, Search, X, UserCheck } from 'lucide-react';
import SkeuSelect from '@/components/ui/SkeuSelect';

interface PatientResult {
  id: number;
  full_name: string;
  phone: string | null;
  patient_unique_id: string | null;
  email: string | null;
}

interface Doctor {
  id: number;
  full_name: string | null;
  specialization: string | null;
}

interface POSpecialist {
  id: number;
  full_name: string | null;
  specialization: string | null;
}

interface Appointment {
  id: number;
  patient_name: string;
  patient_unique_id: string | null;
  doctor_name: string | null;
  po_specialist_name: string | null;
  scheduled_date: string | null;
  status: string;
  notes: string | null;
  patient_checked_in?: number;
  with_doctor?: number;
}

export default function ReceptionistAppointmentsPage() {
  const { user, loading } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [poSpecialists, setPOSpecialists] = useState<POSpecialist[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PatientResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientResult | null>(null);

  const [practitionerType, setPractitionerType] = useState<'doctor' | 'po_specialist'>('doctor');
  const [doctorId, setDoctorId] = useState('');
  const [poSpecialistId, setPOSpecialistId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [checkingInId, setCheckingInId] = useState<number | null>(null);

  const load = () => {
    fetch('/api/receptionist/appointments')
      .then(r => r.json())
      .then(data => {
        if (data.appointments) setAppointments(data.appointments);
        if (data.doctors) setDoctors(data.doctors);
        if (data.poSpecialists) setPOSpecialists(data.poSpecialists);
        setDataLoading(false);
      })
      .catch(() => setDataLoading(false));
  };

  async function handleCheckIn(appointmentId: number) {
    setCheckingInId(appointmentId);
    await fetch('/api/queue', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointment_id: appointmentId, action: 'check_in' }),
    });
    setCheckingInId(null);
    load();
  }

  useEffect(() => {
    if (!user || loading) return;
    load();
  }, [user, loading]);

  // Tighter than the default 30s — reception needs to see "with doctor"
  // status change promptly, since that's how they know when a patient's
  // visit is actually finishing up.
  useAutoRefresh(load, 10000, !!user && !loading);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!user) { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }
  if (user.role !== 'receptionist') { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }

  async function runSearch(q: string) {
    setQuery(q);
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/receptionist/patients?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      setResults(data.patients || []);
    } catch {
      setResults([]);
    }
    setSearching(false);
  }

  function pickPatient(p: PatientResult) {
    setSelectedPatient(p);
    setResults([]);
    setQuery('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!selectedPatient) { setError('Please search for and select a patient first.'); return; }
    if (!scheduledDate) { setError('Please choose a date and time.'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/receptionist/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: selectedPatient.id,
          doctor_id: practitionerType === 'doctor' ? (doctorId || undefined) : undefined,
          po_specialist_id: practitionerType === 'po_specialist' ? (poSpecialistId || undefined) : undefined,
          scheduled_date: scheduledDate,
          notes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to book appointment.'); setSubmitting(false); return; }
      setSuccess(`Appointment booked for ${selectedPatient.full_name}.`);
      setSelectedPatient(null);
      setDoctorId(''); setPOSpecialistId(''); setScheduledDate(''); setNotes('');
      load();
    } catch {
      setError('Network error. Please try again.');
    }
    setSubmitting(false);
  }

  return (
    <div className="dash-content">
      <div className="dash-page-header" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <div style={{ width: 46, height: 46, borderRadius: 12, background: '#1b3d5e18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <CalendarPlus size={22} color="var(--primary)" />
        </div>
        <div>
          <h1 className="font-display" style={{ fontSize: '1.7rem', fontWeight: 600, color: 'var(--text-head)', margin: 0 }}>Book Appointment</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 2 }}>For a patient physically present at this hospital.</p>
        </div>
      </div>

      <div className="skeu-card" style={{ padding: 24, marginBottom: 24 }}>
        <form onSubmit={handleSubmit}>
          <label className="skeu-label" style={{ display: 'block', marginBottom: 8 }}>Patient</label>
          {selectedPatient ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 8, background: 'var(--bg-base)', marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-head)' }}>{selectedPatient.full_name}</div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{selectedPatient.patient_unique_id || '—'} {selectedPatient.phone ? `· ${selectedPatient.phone}` : ''}</div>
              </div>
              <button type="button" onClick={() => setSelectedPatient(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
                <X size={16} />
              </button>
            </div>
          ) : (
            <div style={{ marginBottom: 18 }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  className="skeu-input" style={{ paddingLeft: 38 }}
                  placeholder="Search by name, phone, or Patient ID…"
                  value={query} onChange={e => runSearch(e.target.value)}
                />
              </div>
              {searching && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8 }}>Searching…</div>}
              {results.length > 0 && (
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {results.map(r => (
                    <button
                      type="button" key={r.id} onClick={() => pickPatient(r)}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '10px 14px', borderRadius: 8, background: 'var(--bg-base)', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                    >
                      <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-head)' }}>{r.full_name}</span>
                      <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{r.patient_unique_id || '—'} {r.phone ? `· ${r.phone}` : ''}</span>
                    </button>
                  ))}
                </div>
              )}
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 8 }}>
                Not registered yet? <a href="/dashboard/receptionist/patients" style={{ color: 'var(--primary)', fontWeight: 600 }}>Add them first.</a>
              </p>
            </div>
          )}

          <div style={{ marginBottom: 18 }}>
            <label className="skeu-label" style={{ display: 'block', marginBottom: 8 }}>Who will see this patient?</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              {(['doctor', 'po_specialist'] as const).map(pt => (
                <button
                  key={pt} type="button"
                  onClick={() => { setPractitionerType(pt); setDoctorId(''); setPOSpecialistId(''); }}
                  style={{
                    padding: '7px 16px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                    border: `1px solid ${practitionerType === pt ? 'var(--primary)' : 'var(--border-card)'}`,
                    background: practitionerType === pt ? 'var(--primary)' : 'transparent',
                    color: practitionerType === pt ? '#fff' : 'var(--text-body)',
                  }}
                >
                  {pt === 'doctor' ? 'Doctor' : 'P&O Specialist'}
                </button>
              ))}
            </div>
          </div>

          <div className="form-grid-2" style={{ marginBottom: 18 }}>
            <div>
              <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>{practitionerType === 'doctor' ? 'Doctor (optional)' : 'P&O Specialist (optional)'}</label>
              {practitionerType === 'doctor' ? (
                <SkeuSelect
                  value={doctorId} onChange={setDoctorId}
                  options={doctors.map(d => ({ value: String(d.id), label: d.full_name || `Doctor #${d.id}` }))}
                  placeholder="Any available doctor…"
                />
              ) : (
                <SkeuSelect
                  value={poSpecialistId} onChange={setPOSpecialistId}
                  options={poSpecialists.map(p => ({ value: String(p.id), label: p.full_name || `Specialist #${p.id}` }))}
                  placeholder="Any available specialist…"
                />
              )}
            </div>
            <div>
              <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Date &amp; Time</label>
              <input type="datetime-local" className="skeu-input" style={{ width: '100%' }} value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} required />
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Notes</label>
            <textarea className="skeu-input" rows={2} style={{ width: '100%', resize: 'vertical' }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Reason for visit, special instructions…" />
          </div>

          {error && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, fontSize: '0.88rem', marginBottom: 14 }}>{error}</div>}
          {success && <div style={{ background: '#d1fae5', color: '#065f46', padding: '10px 14px', borderRadius: 8, fontSize: '0.88rem', marginBottom: 14 }}>{success}</div>}

          <button type="submit" className="skeu-btn-primary" disabled={submitting}>
            {submitting ? 'Booking…' : 'Book Appointment'}
          </button>
        </form>
      </div>

      <div className="skeu-card" style={{ padding: 24 }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-head)', marginBottom: 16 }}>Queue — Upcoming at This Hospital</h2>
        {dataLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading…</div>
        ) : appointments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>No appointments yet.</div>
        ) : (() => {
          // "Next" = the first appointment that's confirmed for today and
          // not already with the doctor — i.e. the next one actually
          // waiting, not just whoever is first in the list overall.
          const nextIdx = appointments.findIndex(a => {
            const isToday = a.scheduled_date && new Date(a.scheduled_date).toDateString() === new Date().toDateString();
            return a.status === 'confirmed' && isToday && !a.with_doctor;
          });
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {appointments.map((a, i) => {
                const isToday = a.scheduled_date && new Date(a.scheduled_date).toDateString() === new Date().toDateString();
                const showCheckIn = a.status === 'confirmed' && isToday;
                const isNext = i === nextIdx;
                return (
                  <div
                    key={a.id}
                    style={{
                      padding: '10px 12px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10,
                      background: isNext ? 'rgba(208,140,42,0.08)' : 'var(--bg-base)',
                      border: isNext ? '1px solid rgba(208,140,42,0.35)' : '1px solid var(--border-card)',
                    }}
                  >
                    <div style={{
                      width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                      background: isNext ? '#d08c2a' : 'rgba(27,61,94,0.1)', color: isNext ? '#fff' : 'var(--primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.76rem', fontWeight: 700,
                    }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0, fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-head)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.patient_name}
                    </div>
                    {showCheckIn && (
                      a.with_doctor ? (
                        <UserCheck size={16} color="#2563eb" style={{ flexShrink: 0 }} />
                      ) : a.patient_checked_in ? (
                        <UserCheck size={16} color="#059669" style={{ flexShrink: 0 }} />
                      ) : (
                        <button
                          onClick={() => handleCheckIn(a.id)}
                          disabled={checkingInId === a.id}
                          style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid rgba(5,150,105,0.3)', background: 'rgba(5,150,105,0.08)', color: '#059669', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap' }}
                        >
                          {checkingInId === a.id ? '…' : 'Here'}
                        </button>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
