'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';

interface Stats {
  hospitals: number;
  patients: number;
  doctors: number;
  pending_orders: number;
  pending_appointments: number;
  products: number;
}

const STAT_CARDS = [
  { key: 'hospitals',           label: 'Total Hospitals' },
  { key: 'patients',            label: 'Total Patients' },
  { key: 'doctors',             label: 'Total Doctors' },
  { key: 'pending_orders',      label: 'Pending Orders' },
  { key: 'pending_appointments', label: 'Pending Appointments' },
  { key: 'products',            label: 'Total Products' },
] as const;

export default function SuperAdminOverview() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((data) => { setStats(data); setStatsLoading(false); })
      .catch(() => setStatsLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    if (typeof window !== 'undefined') window.location.href = '/login';
    return null;
  }

  return (
    <div style={{ padding: '40px 36px' }}>
      <h1
        className="font-display"
        style={{ fontSize: '2rem', color: 'var(--text-head)', marginBottom: '8px', fontWeight: 600 }}
      >
        Good morning, Super Admin
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '36px', fontSize: '0.9rem' }}>
        Here&apos;s what&apos;s happening on the platform today.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '24px',
        }}
      >
        {STAT_CARDS.map(({ key, label }) => (
          <div
            key={key}
            className="skeu-card"
            style={{ padding: '28px 24px', opacity: statsLoading ? 0.5 : 1, transition: 'opacity 0.3s' }}
          >
            <div
              style={{
                fontSize: '2.6rem',
                fontWeight: 700,
                color: 'var(--primary)',
                lineHeight: 1,
                marginBottom: '10px',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {statsLoading ? '—' : (stats?.[key] ?? 0).toLocaleString()}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>
              {label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
