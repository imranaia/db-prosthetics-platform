'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Users, ShoppingCart, CalendarDays } from 'lucide-react';

interface Stats {
  patients: number;
  orders: number;
  pending_orders: number;
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

export default function POSpecialistPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({ patients: 0, orders: 0, pending_orders: 0 });
  const [upcoming, setUpcoming] = useState<UpcomingAppointment[]>([]);
  const [upcomingLoading, setUpcomingLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetch('/api/po-specialist/stats')
      .then(r => r.json())
      .then(data => { if (data.stats) setStats(data.stats); })
      .catch(() => {});
    fetch('/api/po-specialist/appointments')
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
  }, [user]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      Loading...
    </div>
  );
  if (!user) { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }
  if (user.role !== 'po_specialist') { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }

  const STAT_CARDS = [
    { label: 'My Patients',    value: stats.patients,      icon: Users,        color: '#2563eb', href: '/dashboard/po-specialist/patients' },
    { label: 'Orders',         value: stats.orders,        icon: ShoppingCart, color: '#d08c2a', href: '/dashboard/po-specialist/orders' },
    { label: 'Pending Orders', value: stats.pending_orders, icon: CalendarDays, color: '#059669', href: '/dashboard/po-specialist/orders' },
  ];

  return (
    <div className="dash-content">
      <div style={{ marginBottom: '28px' }}>
        <h1 className="font-display" style={{ fontSize: '1.9rem', fontWeight: 600, color: 'var(--text-head)', lineHeight: 1.2 }}>
          P&amp;O Specialist Overview
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '6px' }}>
          Your dashboard summary
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {STAT_CARDS.map(({ label, value, icon: Icon, color, href }) => (
          <div key={label} className="skeu-card" onClick={() => router.push(href)} style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={20} color={color} />
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-head)', lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="skeu-card" style={{ padding: '24px' }}>
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
                onClick={() => router.push('/dashboard/po-specialist/appointments')}
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
