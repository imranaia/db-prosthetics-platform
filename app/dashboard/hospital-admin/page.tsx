'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { Users, Stethoscope, CalendarDays, Clock, Users2 } from 'lucide-react';

interface Hospital {
  id: number;
  name: string;
  state: string;
  lga: string;
  address: string;
}

interface Stats {
  patients: number;
  consultations: number;
  doctors: number;
  po_specialists: number;
  upcoming_appointments: number;
  this_month_consultations: number;
}

interface Consultation {
  id: number;
  patient_name: string;
  patient_phone: string;
  chief_complaint: string;
  assessor_name: string;
  recommended_device: string;
  created_at: string;
}

export default function HospitalAdminPage() {
  const { user, loading } = useAuth();
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      fetch('/api/hospital-admin/stats').then(r => r.json()),
      fetch('/api/hospital-admin/consultations').then(r => r.json()),
    ]).then(([statsData, consData]) => {
      if (statsData.hospital) setHospital(statsData.hospital);
      if (statsData.stats) setStats(statsData.stats);
      if (consData.consultations) setConsultations(consData.consultations);
      setDataLoading(false);
    }).catch(() => setDataLoading(false));
  }, [user]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      Loading...
    </div>
  );
  if (!user) { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }
  if (user.role !== 'hospital_admin') { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }

  const STAT_CARDS = [
    { label: 'Patients Seen',         value: stats?.patients ?? 0,                                          icon: Users,        color: '#2563eb' },
    { label: 'Total Consultations',   value: stats?.consultations ?? 0,                                    icon: Stethoscope,  color: 'var(--primary)' },
    { label: 'This Month',            value: stats?.this_month_consultations ?? 0,                         icon: CalendarDays, color: '#d08c2a' },
    { label: 'Upcoming Appointments', value: stats?.upcoming_appointments ?? 0,                            icon: Clock,        color: '#059669' },
    { label: 'Staff',                 value: (stats?.doctors ?? 0) + (stats?.po_specialists ?? 0),        icon: Users2,       color: '#7c3aed' },
  ];

  function formatDate(dt: string) {
    return new Date(dt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  const recentConsultations = consultations.slice(0, 10);

  return (
    <div className="dash-content">
      {/* Header */}
      <div className="dash-page-header" style={{ marginBottom: '28px' }}>
        <h1 className="font-display" style={{ fontSize: '1.9rem', fontWeight: 600, color: 'var(--text-head)', lineHeight: 1.2 }}>
          {dataLoading ? 'Loading...' : (hospital?.name ?? 'Hospital Admin')}
        </h1>
        {hospital && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '6px' }}>
            {hospital.state}{hospital.lga ? ` \u00b7 ${hospital.lga}` : ''}{hospital.address ? ` \u2014 ${hospital.address}` : ''}
          </p>
        )}
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
        gap: '16px',
        marginBottom: '28px',
        opacity: dataLoading ? 0.5 : 1,
        transition: 'opacity 0.3s',
      }}>
        {STAT_CARDS.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="skeu-card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: `${color}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
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

      {/* Recent Consultations */}
      <div className="skeu-card" style={{ padding: '24px' }}>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-head)' }}>Recent Consultations</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>Last 10 consultations at this hospital</div>
        </div>

        {dataLoading ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Loading...
          </div>
        ) : recentConsultations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            No consultations recorded yet.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
            {recentConsultations.map(c => (
              <div key={c.id} style={{ padding: 14, borderRadius: 10, border: '1px solid var(--border-card)', background: 'var(--bg-base)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, gap: 8 }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-head)', fontSize: '0.9rem' }}>{c.patient_name}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(c.created_at)}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-body)', marginBottom: 6, lineHeight: 1.4 }}>{c.chief_complaint || '\u2014'}</div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: c.recommended_device ? 8 : 0 }}>Assessor: {c.assessor_name || '\u2014'}</div>
                {c.recommended_device && (
                  <span style={{ background: '#1b3d5e12', color: 'var(--primary)', padding: '2px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 500 }}>
                    {c.recommended_device}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
