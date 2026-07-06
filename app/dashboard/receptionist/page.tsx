'use client';

import { useAuth } from '@/hooks/useAuth';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Stethoscope, CalendarClock, CalendarDays } from 'lucide-react';

interface Stats {
  hospital_name: string;
  doctors: number;
  patients_registered: number;
  today_appointments: number;
  upcoming_appointments: number;
}

const STAT_CARDS = [
  { key: 'doctors',              label: 'Available Doctors',   icon: Stethoscope,   color: '#1b3d5e', href: null },
  { key: 'patients_registered',  label: 'Patients Registered',  icon: Users,         color: '#2e6499', href: '/dashboard/receptionist/patients' },
  { key: 'today_appointments',   label: "Today's Appointments", icon: CalendarClock, color: '#059669', href: '/dashboard/receptionist/appointments' },
  { key: 'upcoming_appointments', label: 'Upcoming Appointments', icon: CalendarDays, color: '#7c3aed', href: '/dashboard/receptionist/appointments' },
] as const;

export default function ReceptionistOverviewPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  const load = () => {
    fetch('/api/receptionist/stats')
      .then(r => r.json())
      .then(data => { if (!data.error) setStats(data); setDataLoading(false); })
      .catch(() => setDataLoading(false));
  };

  useEffect(() => {
    if (!user || loading) return;
    load();
  }, [user, loading]);

  useAutoRefresh(load, 30000, !!user && !loading);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!user) { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }
  if (user.role !== 'receptionist') { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }

  return (
    <div className="dash-content">
      <div className="dash-page-header">
        <div>
          <h1 className="font-display" style={{ fontSize: '1.75rem', color: 'var(--text-head)', fontWeight: 600 }}>
            {stats?.hospital_name ? `${stats.hospital_name} — Reception` : 'Reception Overview'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Doctor availability, patient registrations, and today&apos;s schedule.</p>
        </div>
      </div>

      {dataLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading overview...</div>
      ) : (
        <div className="stat-grid">
          {STAT_CARDS.map(card => {
            const Icon = card.icon;
            const value = stats ? stats[card.key] : 0;
            return (
              <div
                key={card.key}
                className="skeu-card"
                onClick={card.href ? () => router.push(card.href) : undefined}
                style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: 14, cursor: card.href ? 'pointer' : 'default' }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${card.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={20} color={card.color} />
                </div>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-head)', lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>{card.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="skeu-card" style={{ padding: 24, marginTop: 24 }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-head)', marginBottom: 8 }}>Quick Actions</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>
          Register a new walk-in patient and generate their Patient ID, or book an appointment for a patient at this hospital.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="skeu-btn-primary" onClick={() => router.push('/dashboard/receptionist/patients')}>Add Patient</button>
          <button className="skeu-btn-accent" onClick={() => router.push('/dashboard/receptionist/appointments')}>Book Appointment</button>
        </div>
      </div>
    </div>
  );
}
