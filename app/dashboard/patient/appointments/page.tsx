'use client';

import { useAuth } from '@/hooks/useAuth';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { useEffect, useState } from 'react';
import { CalendarDays } from 'lucide-react';

interface Appointment {
  id: number;
  type: 'home' | 'hospital';
  status: string;
  notes: string;
  preferred_date: string;
  scheduled_date: string;
  quoted_price: number | null;
  service_fee: number;
  payment_status: string;
  created_at: string;
  hospital_name: string | null;
  requested_doctor_name: string | null;
  assigned_doctor_name: string | null;
}
interface Doctor { id: number; full_name: string | null; specialization: string | null; state: string | null; hospital_name: string | null; }

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    requested:  { bg: '#fef3c7', color: '#b45309' },
    quoted:     { bg: '#dbeafe', color: '#1d4ed8' },
    confirmed:  { bg: '#d1fae5', color: '#065f46' },
    completed:  { bg: '#f3f4f6', color: '#374151' },
    cancelled:  { bg: '#fee2e2', color: '#b91c1c' },
    pending:    { bg: '#fef3c7', color: '#b45309' },
    processing: { bg: '#dbeafe', color: '#1d4ed8' },
    fulfilled:  { bg: '#d1fae5', color: '#065f46' },
  };
  const c = colors[status] || { bg: '#f3f4f6', color: '#374151' };
  return <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, background: c.bg, color: c.color, whiteSpace: 'nowrap' }}>{status.replace('_', ' ')}</span>;
}

function formatDate(dt: string) {
  if (!dt) return 'No date set';
  return new Date(dt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

const INITIAL_FORM = { type: 'hospital' as 'hospital' | 'home', notes: '', preferred_date: '', requested_doctor_id: '' };

export default function PatientAppointmentsPage() {
  const { user, loading } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [paying, setPaying] = useState<number | null>(null);
  const { alertUser, dialog } = useConfirmDialog();
  const [paymentResult, setPaymentResult] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('payment');
      setPaymentResult(p);
    }
  }, []);

  const load = () => {
    fetch('/api/patient/appointments')
      .then(r => r.json())
      .then(data => {
        if (data.appointments) setAppointments(data.appointments);
        setDataLoading(false);
      })
      .catch(() => setDataLoading(false));
  };

  useEffect(() => {
    if (!user) return;
    load();
    fetch('/api/patient/doctors').then(r => r.json()).then(d => setDoctors(Array.isArray(d) ? d : [])).catch(() => {});
  }, [user]);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!user) { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }
  if (user.role !== 'patient') { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/patient/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: form.type,
          notes: form.notes,
          preferred_date: form.preferred_date,
          requested_doctor_id: form.type === 'home' && form.requested_doctor_id ? form.requested_doctor_id : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error || 'Failed to book appointment.'); setSubmitting(false); return; }
      setForm(INITIAL_FORM);
      setShowForm(false);
      setDataLoading(true);
      load();
    } catch {
      setFormError('Network error. Please try again.');
    }
    setSubmitting(false);
  }

  async function handlePayNow(id: number) {
    setPaying(id);
    const res = await fetch('/api/payment/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointment_id: id }),
    });
    const data = await res.json();
    setPaying(null);
    if (data.authorization_url) {
      window.location.href = data.authorization_url;
    } else {
      await alertUser(data.error || 'Failed to initialize payment', { title: 'Payment Error' });
    }
  }

  return (
    <div className="dash-content">
      {dialog}
      {/* Payment result banners */}
      {paymentResult === 'success' && (
        <div style={{ background: '#d1fae5', border: '1px solid #6ee7b7', color: '#065f46', padding: '12px 16px', borderRadius: 10, marginBottom: 16, fontSize: '0.9rem', fontWeight: 500 }}>
          ✓ Payment successful! Your appointment has been confirmed.
        </div>
      )}
      {paymentResult === 'failed' && (
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '12px 16px', borderRadius: 10, marginBottom: 16, fontSize: '0.9rem', fontWeight: 500 }}>
          Payment was not completed. Please try again or contact us.
        </div>
      )}

      {/* Header */}
      <div className="dash-page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: '#1b3d5e18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CalendarDays size={22} color="var(--primary)" />
          </div>
          <h1 className="font-display" style={{ fontSize: '1.7rem', fontWeight: 600, color: 'var(--text-head)', margin: 0 }}>My Appointments</h1>
        </div>
        <button
          className="skeu-btn-accent"
          onClick={() => { setShowForm(!showForm); setFormError(''); }}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <CalendarDays size={16} />
          {showForm ? 'Cancel' : 'Book Appointment'}
        </button>
      </div>

      {/* Booking Form */}
      {showForm && (
        <div className="skeu-card" style={{ padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-head)', marginBottom: 20 }}>New Appointment Request</h2>
          <form onSubmit={handleSubmit}>
            {/* Type toggle */}
            <div style={{ marginBottom: 18 }}>
              <label className="skeu-label" style={{ display: 'block', marginBottom: 10 }}>Appointment Type</label>
              <div style={{ display: 'flex', gap: 12 }}>
                {(['hospital', 'home'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, type: t })}
                    style={{ flex: 1, padding: '14px', borderRadius: 10, border: `2px solid ${form.type === t ? 'var(--primary)' : 'var(--border-card)'}`, background: form.type === t ? 'rgba(27,61,94,0.07)' : 'transparent', cursor: 'pointer', textAlign: 'center' }}
                  >
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: form.type === t ? 'var(--primary)' : 'var(--text-body)' }}>
                      {t === 'hospital' ? 'Hospital Visit' : 'Home Visit'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      {t === 'hospital' ? 'Visit a DB Prosthetics facility' : 'We come to you (quote provided)'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Doctor preference — home visits only */}
            {form.type === 'home' && (
              <div style={{ marginBottom: 16 }}>
                <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Preferred Doctor (optional)</label>
                <select
                  className="skeu-input"
                  style={{ width: '100%' }}
                  value={form.requested_doctor_id}
                  onChange={e => setForm({ ...form, requested_doctor_id: e.target.value })}
                >
                  <option value="">No preference — let DB Prosthetics assign</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.full_name || `Doctor #${d.id}`}
                      {d.specialization ? ` — ${d.specialization}` : ''}
                      {d.state ? ` (${d.state})` : ''}
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
                  If you know a doctor you'd like to see, pick them here. Otherwise, DB Prosthetics will assign the best available doctor near you.
                </div>
              </div>
            )}

            {/* Preferred date */}
            <div style={{ marginBottom: 16 }}>
              <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Preferred Date</label>
              <input
                type="date"
                className="skeu-input"
                style={{ width: '100%' }}
                value={form.preferred_date}
                onChange={e => setForm({ ...form, preferred_date: e.target.value })}
              />
            </div>

            {/* Notes */}
            <div style={{ marginBottom: 20 }}>
              <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Notes / Comments</label>
              <textarea
                className="skeu-input"
                rows={3}
                style={{ width: '100%', resize: 'vertical' }}
                placeholder="Any additional information..."
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            {formError && (
              <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, fontSize: '0.88rem', marginBottom: 16 }}>
                {formError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" className="skeu-btn-primary" disabled={submitting} style={{ flex: 1 }}>
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setFormError(''); setForm(INITIAL_FORM); }}
                style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid var(--border-card)', background: 'transparent', cursor: 'pointer', fontWeight: 600, color: 'var(--text-body)' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Appointments list */}
      {dataLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading...</div>
      ) : appointments.length === 0 ? (
        <div className="skeu-card" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <CalendarDays size={40} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-head)', marginBottom: 8 }}>No appointments yet</div>
          <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Book your first appointment using the button above.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {appointments.map(appt => (
            <div key={appt.id} className="skeu-card" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{
                    padding: '3px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600,
                    background: appt.type === 'home' ? '#05966918' : '#1b3d5e18',
                    color: appt.type === 'home' ? '#059669' : 'var(--primary)',
                  }}>
                    {appt.type === 'home' ? 'Home Visit' : 'Hospital Visit'}
                  </span>
                  <StatusBadge status={appt.status} />
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{formatDate(appt.created_at)}</div>
              </div>

              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-head)', fontWeight: 500 }}>
                  {appt.type === 'home'
                    ? (appt.assigned_doctor_name ? `Dr. ${appt.assigned_doctor_name}` : 'Pending doctor assignment')
                    : (appt.hospital_name || 'Pending assignment')}
                </div>
                {appt.type === 'home' && appt.requested_doctor_name && !appt.assigned_doctor_name && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    You requested: Dr. {appt.requested_doctor_name}
                  </div>
                )}
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Preferred: {appt.scheduled_date ? formatDate(appt.scheduled_date) : (appt.preferred_date ? formatDate(appt.preferred_date) : 'No date set')}
                </div>
                {appt.notes && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-body)', marginTop: 4 }}>{appt.notes}</div>
                )}
                {appt.status === 'quoted' && appt.quoted_price != null && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                      Quoted: ₦{(appt.quoted_price / 100).toLocaleString('en-NG')} + ₦{((appt.service_fee || 100000) / 100).toLocaleString('en-NG')} service fee
                      {' = '}
                      <strong style={{ color: 'var(--text-head)' }}>₦{((appt.quoted_price + (appt.service_fee || 100000)) / 100).toLocaleString('en-NG')} total</strong>
                    </div>
                    <button
                      className="skeu-btn-accent"
                      style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                      onClick={() => handlePayNow(appt.id)}
                      disabled={paying === appt.id}
                    >
                      {paying === appt.id ? 'Redirecting\u2026' : `Pay \u20a6${((appt.quoted_price + (appt.service_fee || 100000)) / 100).toLocaleString('en-NG')}`}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
