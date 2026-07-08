'use client';

import { useAuth } from '@/hooks/useAuth';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Users, Stethoscope, CalendarDays, UserCheck, SkipForward } from 'lucide-react';

interface Stats {
  patients: number;
  consultations: number;
  upcoming_appointments: number;
}

interface QueueEntry {
  id: number;
  patient_id: number;
  patient_name: string;
  patient_unique_id: string | null;
  patient_phone: string | null;
  scheduled_date: string | null;
  preferred_date: string | null;
  notes: string | null;
  patient_checked_in: number;
  queue_skipped: number;
  queue_skip_reason: string | null;
  with_doctor: number;
  is_current: boolean;
}

interface UpcomingAppointment {
  id: number;
  type: 'home' | 'hospital';
  status: string;
  scheduled_date: string | null;
  preferred_date: string | null;
  patient_name: string;
  patient_phone: string | null;
}

function formatUpcomingDate(dt: string) {
  return new Date(dt).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function DoctorPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [queueLoading, setQueueLoading] = useState(true);
  const [skippingId, setSkippingId] = useState<number | null>(null);
  const [skipReason, setSkipReason] = useState('');
  const [queueBusy, setQueueBusy] = useState(false);
  const [upcoming, setUpcoming] = useState<UpcomingAppointment[]>([]);
  const [upcomingLoading, setUpcomingLoading] = useState(true);

  const loadQueue = () => {
    fetch('/api/queue')
      .then(r => r.json())
      .then(data => { if (data.queue) setQueue(data.queue); setQueueLoading(false); })
      .catch(() => setQueueLoading(false));
  };

  const loadStats = () => {
    fetch('/api/doctor/stats')
      .then(r => r.json())
      .then(data => { if (data.stats) setStats(data.stats); setDataLoading(false); })
      .catch(() => setDataLoading(false));
  };

  const loadUpcoming = () => {
    fetch('/api/doctor/appointments')
      .then(r => r.json())
      .then(data => {
        const todayStr = new Date().toISOString().slice(0, 10);
        const list: UpcomingAppointment[] = (data.appointments || [])
          .filter((a: UpcomingAppointment) => {
            const d = a.scheduled_date || a.preferred_date;
            return a.status === 'confirmed' && d && d.slice(0, 10) !== todayStr;
          })
          .sort((a: UpcomingAppointment, b: UpcomingAppointment) => {
            const da = a.scheduled_date || a.preferred_date || '';
            const db_ = b.scheduled_date || b.preferred_date || '';
            return da.localeCompare(db_);
          })
          .slice(0, 5);
        setUpcoming(list);
        setUpcomingLoading(false);
      })
      .catch(() => setUpcomingLoading(false));
  };

  useEffect(() => {
    if (!user) return;
    loadStats();
    loadQueue();
    loadUpcoming();
  }, [user]);

  // The queue especially benefits from a tighter interval than the default
  // 30s — a patient waiting to hear "you're up" shouldn't be stuck behind a
  // slow poll, and this is cheap since it's a single small hospital-scoped
  // query.
  useAutoRefresh(loadQueue, 10000, !!user);
  useAutoRefresh(loadStats, 30000, !!user);
  useAutoRefresh(loadUpcoming, 30000, !!user);

  async function handleSkip(id: number) {
    if (!skipReason.trim()) return;
    setQueueBusy(true);
    await fetch('/api/queue', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointment_id: id, action: 'skip', reason: skipReason.trim() }),
    });
    setSkippingId(null);
    setSkipReason('');
    setQueueBusy(false);
    loadQueue();
  }

  async function handleStart(id: number) {
    setQueueBusy(true);
    await fetch('/api/queue', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointment_id: id, action: 'start' }),
    });
    setQueueBusy(false);
    loadQueue();
  }

  async function handleComplete(id: number) {
    setQueueBusy(true);
    await fetch('/api/queue', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointment_id: id, action: 'complete' }),
    });
    setQueueBusy(false);
    loadQueue();
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      Loading...
    </div>
  );
  if (!user) { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }
  if (user.role !== 'doctor' && !(user.role === 'super_admin' && user.hasDoctorProfile)) { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }

  const STAT_CARDS = [
    { label: 'My Patients',          value: stats?.patients ?? 0,              icon: Users,        color: '#2563eb',       href: '/dashboard/doctor/patients' },
    { label: 'My Consultations',     value: stats?.consultations ?? 0,         icon: Stethoscope,  color: 'var(--primary)', href: '/dashboard/doctor/consultations' },
    { label: 'Upcoming Appointments', value: stats?.upcoming_appointments ?? 0, icon: CalendarDays, color: '#059669',       href: '/dashboard/doctor/appointments' },
  ];

  return (
    <div className="dash-content">
      <div style={{ marginBottom: '28px' }}>
        <h1 className="font-display" style={{ fontSize: '1.9rem', fontWeight: 600, color: 'var(--text-head)', lineHeight: 1.2 }}>
          Doctor Overview
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '6px' }}>
          Your activity summary
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '28px',
        opacity: dataLoading ? 0.5 : 1,
        transition: 'opacity 0.3s',
      }}>
        {STAT_CARDS.map(({ label, value, icon: Icon, color, href }) => (
          <div key={label} className="skeu-card" onClick={() => router.push(href)} style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={20} color={color} />
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-head)', lineHeight: 1 }}>
                {dataLoading ? '\u2014' : value}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="skeu-card" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-head)', marginBottom: 4 }}>Today&apos;s Queue</h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16 }}>First come, first served — patients who aren&apos;t here yet can be skipped without losing their place.</p>

        {queueLoading ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>Loading queue…</div>
        ) : queue.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            No hospital appointments queued for today.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {queue.map((q, i) => (
              <div
                key={q.id}
                style={{
                  padding: '14px 16px', borderRadius: 10,
                  border: q.is_current ? '2px solid #059669' : '1px solid var(--border-card)',
                  background: q.is_current ? 'rgba(5,150,105,0.06)' : q.queue_skipped ? 'rgba(220,38,38,0.03)' : 'var(--bg-base)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>#{i + 1}</span>
                      <span style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-head)' }}>{q.patient_name}</span>
                      {q.is_current && (
                        <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 700, background: '#059669', color: '#fff', textTransform: 'uppercase' }}>Now Serving</span>
                      )}
                      {!!q.with_doctor && (
                        <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 700, background: '#2563eb', color: '#fff', textTransform: 'uppercase' }}>With Doctor</span>
                      )}
                      {q.queue_skipped && !q.is_current && (
                        <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 600, background: 'rgba(220,38,38,0.12)', color: '#dc2626' }}>Skipped</span>
                      )}
                      {!!q.patient_checked_in && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.72rem', color: '#059669' }}><UserCheck size={12} /> Checked in</span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 3 }}>
                      {q.patient_unique_id || '—'}{q.patient_phone ? ` · ${q.patient_phone}` : ''}
                      {q.queue_skip_reason ? ` · Skipped: ${q.queue_skip_reason}` : ''}
                    </div>
                  </div>
                  {q.is_current && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      {q.with_doctor ? (
                        <button
                          onClick={() => handleComplete(q.id)}
                          disabled={queueBusy}
                          style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: 'var(--primary)', color: '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                        >
                          Mark Complete
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleStart(q.id)}
                            disabled={queueBusy}
                            style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: 'var(--primary)', color: '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                          >
                            With Me
                          </button>
                          <button
                            onClick={() => { setSkippingId(q.id); setSkipReason(''); }}
                            disabled={queueBusy}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(220,38,38,0.3)', background: 'rgba(220,38,38,0.06)', color: '#dc2626', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                          >
                            <SkipForward size={13} /> Skip
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {skippingId === q.id && (
                  <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <input
                      className="skeu-input"
                      style={{ flex: 1, minWidth: 200 }}
                      placeholder="Reason — e.g. patient not yet here, cancelled…"
                      value={skipReason}
                      onChange={e => setSkipReason(e.target.value)}
                      autoFocus
                    />
                    <button
                      onClick={() => handleSkip(q.id)}
                      disabled={queueBusy || !skipReason.trim()}
                      style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                    >
                      Confirm Skip
                    </button>
                    <button
                      onClick={() => { setSkippingId(null); setSkipReason(''); }}
                      style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border-card)', background: 'transparent', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-muted)' }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="skeu-card" style={{ padding: '24px', marginTop: 20 }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-head)', marginBottom: 4 }}>Upcoming Appointments</h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16 }}>Patients assigned to you on future dates, so you can prepare ahead of time.</p>

        {upcomingLoading ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>Loading…</div>
        ) : upcoming.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            No upcoming appointments assigned to you yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {upcoming.map(a => (
              <div
                key={a.id}
                onClick={() => router.push('/dashboard/doctor/appointments')}
                style={{ padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border-card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}
              >
                <div>
                  <span style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-head)' }}>{a.patient_name}</span>
                  <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 700, background: a.type === 'home' ? '#05966918' : '#1b3d5e18', color: a.type === 'home' ? '#059669' : 'var(--primary)' }}>
                    {a.type === 'home' ? 'Home Visit' : 'Hospital'}
                  </span>
                  {a.patient_phone && <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 2 }}>{a.patient_phone}</div>}
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)' }}>
                  {formatUpcomingDate((a.scheduled_date || a.preferred_date)!)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
