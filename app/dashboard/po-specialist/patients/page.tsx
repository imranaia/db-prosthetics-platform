'use client';

import { useAuth } from '@/hooks/useAuth';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, ChevronDown, ChevronUp, User, Search, History } from 'lucide-react';

interface POPatient {
  id: number;
  full_name: string;
  patient_unique_id: string | null;
  phone: string | null;
  state: string | null;
  lga: string | null;
  dob: string | null;
  portal_email: string | null;
  last_order: string | null;
}

function formatDate(dt: string | null) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function POPatientsPage() {
  const { user, loading } = useAuth();
  const [patients, setPatients] = useState<POPatient[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);

  const load = () => {
    fetch('/api/po-specialist/patients')
      .then(r => r.json())
      .then(data => {
        if (data.patients) setPatients(data.patients);
        setDataLoading(false);
      })
      .catch(() => setDataLoading(false));
  };

  useEffect(() => {
    if (!user) return;
    load();
  }, [user]);

  useAutoRefresh(load, 30000, !!user);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!user) { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }
  if (user.role !== 'po_specialist') { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }

  const q = search.toLowerCase();
  const filtered = patients.filter(p =>
    p.full_name?.toLowerCase().includes(q) ||
    p.phone?.toLowerCase().includes(q) ||
    p.patient_unique_id?.toLowerCase().includes(q)
  );

  return (
    <div className="dash-content">
      <div className="dash-page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: '#1b3d5e18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Users size={22} color="var(--primary)" />
          </div>
          <h1 className="font-display" style={{ fontSize: '1.7rem', fontWeight: 600, color: 'var(--text-head)', margin: 0 }}>My Patients</h1>
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            type="search"
            className="skeu-input"
            placeholder="Search by name, phone, or Patient ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: 280, paddingLeft: 36 }}
          />
        </div>
      </div>

      {dataLoading ? (
        <div className="skeu-card" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading patients...</div>
      ) : filtered.length === 0 ? (
        <div className="skeu-card" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          {patients.length === 0 ? "You'll see patients here once orders are assigned to you." : 'No patients match your search.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16, alignItems: 'start' }}>
          {filtered.map(p => {
            const isExp = expanded === p.id;
            return (
              <div
                key={p.id}
                className="skeu-card"
                style={{ padding: 16, gridColumn: isExp ? '1 / -1' : undefined, cursor: 'pointer' }}
                onClick={() => setExpanded(isExp ? null : p.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <User size={14} color="#fff" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-head)', fontSize: '0.9rem' }}>{p.full_name}</div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--primary)', fontWeight: 600 }}>{p.patient_unique_id || '—'}</div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{p.phone || '—'}{p.state ? ` · ${p.state}` : ''}</div>
                    </div>
                  </div>
                  {isExp ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Last order: {formatDate(p.last_order)}</span>
                  {p.portal_email ? (
                    <span style={{ background: '#d1fae5', color: '#065f46', padding: '2px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600 }}>Portal Active</span>
                  ) : (
                    <span style={{ background: '#f3f4f6', color: '#6b7280', padding: '2px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600 }}>No Portal</span>
                  )}
                </div>

                {isExp && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px 24px', fontSize: '0.85rem', marginBottom: 16 }}>
                      {[
                        { label: 'Date of Birth', value: formatDate(p.dob) },
                        { label: 'LGA', value: p.lga || '—' },
                        { label: 'State', value: p.state || '—' },
                        { label: 'Portal Email', value: p.portal_email || 'No portal account' },
                      ].map(f => (
                        <div key={f.label}>
                          <div style={{ fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 2 }}>{f.label}</div>
                          <div style={{ color: 'var(--text-body)' }}>{f.value}</div>
                        </div>
                      ))}
                    </div>
                    <Link
                      href={`/dashboard/po-specialist/patients/${p.id}`}
                      onClick={e => e.stopPropagation()}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary)', textDecoration: 'none' }}
                    >
                      <History size={14} /> View full history — past consultations &amp; orders
                    </Link>
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
