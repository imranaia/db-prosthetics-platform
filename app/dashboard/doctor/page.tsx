'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { Users, Stethoscope, CalendarDays } from 'lucide-react';

interface Stats {
  patients: number;
  consultations: number;
  upcoming_appointments: number;
}

export default function DoctorPage() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetch('/api/doctor/stats')
      .then(r => r.json())
      .then(data => { if (data.stats) setStats(data.stats); setDataLoading(false); })
      .catch(() => setDataLoading(false));
  }, [user]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      Loading...
    </div>
  );
  if (!user) { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }
  if (user.role !== 'doctor') { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }

  const STAT_CARDS = [
    { label: 'My Patients',          value: stats?.patients ?? 0,              icon: Users,        color: '#2563eb' },
    { label: 'My Consultations',     value: stats?.consultations ?? 0,         icon: Stethoscope,  color: 'var(--primary)' },
    { label: 'Upcoming Appointments', value: stats?.upcoming_appointments ?? 0, icon: CalendarDays, color: '#059669' },
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
        {STAT_CARDS.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="skeu-card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
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

      <div className="skeu-card" style={{ padding: '28px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Use the navigation to view your patients, consultations, and appointments.
        </p>
      </div>
    </div>
  );
}
