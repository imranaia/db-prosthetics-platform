'use client';

import { useAuth } from '@/hooks/useAuth';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { useEffect, useState } from 'react';
import { CalendarDays, ChevronDown, ChevronUp } from 'lucide-react';

interface Appointment {
  id: number;
  type: 'home' | 'hospital';
  status: string;
  notes: string;
  scheduled_date: string;
  preferred_date: string;
  quoted_price: number | null;
  payment_status: string;
  created_at: string;
  patient_name: string;
  patient_phone: string;
  assigned_doctor_id: number | null;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    requested:  { bg: '#fef3c7', color: '#b45309' },
    quoted:     { bg: '#dbeafe', color: '#1d4ed8' },
    confirmed:  { bg: '#d1fae5', color: '#065f46' },
    completed:  { bg: '#f3f4f6', color: '#374151' },
    cancelled:  { bg: '#fee2e2', color: '#b91c1c' },
  };
  const c = colors[status] || { bg: '#f3f4f6', color: '#374151' };
  return <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, background: c.bg, color: c.color, whiteSpace: 'nowrap' }}>{status.replace('_', ' ')}</span>;
}

function formatDate(dt: string) {
  if (!dt) return 'No date set';
  return new Date(dt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

function effectiveDate(a: Appointment): string | null {
  return a.scheduled_date || a.preferred_date || null;
}

function isToday(a: Appointment): boolean {
  const d = effectiveDate(a);
  if (!d || a.status !== 'confirmed') return false;
  const todayStr = new Date().toISOString().slice(0, 10);
  return d.slice(0, 10) === todayStr;
}

function isUpcoming(a: Appointment): boolean {
  return a.status === 'confirmed' && !isToday(a);
}

const TABS = ['today', 'upcoming', 'requested', 'completed', 'all'] as const;
type Tab = typeof TABS[number];
const TAB_LABELS: Record<Tab, string> = {
  today: 'Today', upcoming: 'Upcoming', requested: 'Requested', completed: 'Completed', all: 'All',
};

export default function DoctorAppointmentsPage() {
  const { user, loading } = useAuth();
  const { alertUser, dialog } = useConfirmDialog();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('today');
  const [expanded, setExpanded] = useState<number | null>(null);

  function load() {
    fetch('/api/doctor/appointments')
      .then(r => r.json())
      .then(data => {
        if (data.appointments) setAppointments(data.appointments);
        if (data.doctorId) setDoctorId(data.doctorId);
        setDataLoading(false);
      })
      .catch(() => setDataLoading(false));
  }

  useEffect(() => {
    if (!user) return;
    load();
  }, [user]);

  useAutoRefresh(load, 30000, !!user);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!user) { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }
  if (user.role !== 'doctor' && !(user.role === 'super_admin' && user.hasDoctorProfile)) { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }

  async function markComplete(id: number) {
    const res = await fetch('/api/doctor/appointments', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'completed' }),
    });
    if (!res.ok) { const d = await res.json(); await alertUser(d.error || 'Failed to update appointment.', { title: 'Could Not Update' }); return; }
    load();
  }

  function matchesTab(a: Appointment, tab: Tab): boolean {
    if (tab === 'all') return true;
    if (tab === 'today') return isToday(a);
    if (tab === 'upcoming') return isUpcoming(a);
    if (tab === 'requested') return a.status === 'requested' || a.status === 'quoted';
    return a.status === tab;
  }

  const filtered = appointments
    .filter(a => matchesTab(a, activeTab))
    .sort((a, b) => {
      const da = effectiveDate(a); const db_ = effectiveDate(b);
      if (!da && !db_) return 0;
      if (!da) return 1;
      if (!db_) return -1;
      return da.localeCompare(db_);
    });

  return (
    <div className="dash-content">
      {dialog}
      <div className="dash-page-header" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <div style={{ width: 46, height: 46, borderRadius: 12, background: '#1b3d5e18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <CalendarDays size={22} color="var(--primary)" />
        </div>
        <h1 className="font-display" style={{ fontSize: '1.7rem', fontWeight: 600, color: 'var(--text-head)', margin: 0 }}>Appointments</h1>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map(tab => {
          const count = tab === 'all' ? appointments.length : appointments.filter(a => matchesTab(a, tab)).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '7px 16px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                border: `1px solid ${activeTab === tab ? 'var(--primary)' : 'var(--border-card)'}`,
                background: activeTab === tab ? 'var(--primary)' : 'transparent',
                color: activeTab === tab ? '#fff' : 'var(--text-body)',
              }}
            >
              {TAB_LABELS[tab]}
              <span style={{ marginLeft: 6, background: activeTab === tab ? 'rgba(255,255,255,0.3)' : 'var(--border-card)', padding: '1px 7px', borderRadius: 20, fontSize: '0.72rem' }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {dataLoading ? (
        <div className="skeu-card" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading appointments...</div>
      ) : filtered.length === 0 ? (
        <div className="skeu-card" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          {appointments.length === 0 ? 'No appointments assigned to you yet.' : 'No appointments in this category.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, alignItems: 'start' }}>
          {filtered.map(a => {
            const isExp = expanded === a.id;
            return (
              <div
                key={a.id}
                className="skeu-card"
                style={{ padding: 16, gridColumn: isExp ? '1 / -1' : undefined, cursor: 'pointer' }}
                onClick={() => setExpanded(isExp ? null : a.id)}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-head)', fontSize: '0.92rem' }}>{a.patient_name || '—'}</div>
                    {a.patient_phone && <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 2 }}>{a.patient_phone}</div>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <StatusBadge status={a.status} />
                    {isExp ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                  <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, background: a.type === 'home' ? '#05966918' : '#1b3d5e18', color: a.type === 'home' ? '#059669' : 'var(--primary)' }}>
                    {a.type === 'home' ? 'Home' : 'Hospital'}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {a.scheduled_date ? formatDate(a.scheduled_date) : (a.preferred_date ? formatDate(a.preferred_date) : 'No date set')}
                  </span>
                </div>

                {a.notes && !isExp && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-body)', marginTop: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.notes}</div>
                )}

                {a.status === 'confirmed' && a.assigned_doctor_id === doctorId && (
                  <div onClick={e => e.stopPropagation()} style={{ marginTop: 10 }}>
                    {a.payment_status !== 'unpaid' ? (
                      <button
                        onClick={() => markComplete(a.id)}
                        style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #059669', background: '#05966912', color: '#059669', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}
                      >
                        Mark Complete
                      </button>
                    ) : (
                      <div style={{ fontSize: '0.75rem', color: '#b91c1c' }}>Unpaid — cannot mark complete</div>
                    )}
                  </div>
                )}

                {isExp && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px 24px', fontSize: '0.85rem' }}>
                      {[
                        { label: 'Patient', value: a.patient_name || '—' },
                        { label: 'Phone', value: a.patient_phone || '—' },
                        { label: 'Type', value: a.type === 'home' ? 'Home Visit' : 'Hospital Visit' },
                        { label: 'Status', value: a.status },
                        { label: 'Scheduled Date', value: a.scheduled_date ? formatDate(a.scheduled_date) : '—' },
                        { label: 'Preferred Date', value: a.preferred_date ? formatDate(a.preferred_date) : '—' },
                        { label: 'Payment Status', value: a.payment_status || '—' },
                        ...(a.quoted_price != null ? [{ label: 'Quoted Price', value: `₦${(a.quoted_price / 100).toLocaleString('en-NG')}` }] : []),
                      ].map(f => (
                        <div key={f.label}>
                          <div style={{ fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 2 }}>{f.label}</div>
                          <div style={{ color: 'var(--text-body)' }}>{f.value}</div>
                        </div>
                      ))}
                    </div>
                    {a.notes && (
                      <div style={{ marginTop: 14 }}>
                        <div style={{ fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 4 }}>Notes</div>
                        <div style={{ fontSize: '0.88rem', color: 'var(--text-body)', lineHeight: 1.6 }}>{a.notes}</div>
                      </div>
                    )}
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
