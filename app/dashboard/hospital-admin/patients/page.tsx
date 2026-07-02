'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { Users, ChevronDown, ChevronUp } from 'lucide-react';

interface Patient {
  id: number;
  full_name: string;
  phone: string;
  dob: string;
  state: string;
  lga: string;
  address: string;
  gender: string;
  occupation: string;
  portal_email: string | null;
  last_consultation: string;
}

function formatDate(dt: string) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function HospitalAdminPatientsPage() {
  const { user, loading } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    fetch('/api/hospital-admin/patients')
      .then(r => r.json())
      .then(data => {
        if (data.patients) setPatients(data.patients);
        setDataLoading(false);
      })
      .catch(() => setDataLoading(false));
  }, [user]);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!user) { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }
  if (user.role !== 'hospital_admin') { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }

  const q = search.toLowerCase();
  const filtered = patients.filter(p =>
    p.full_name?.toLowerCase().includes(q) ||
    p.phone?.toLowerCase().includes(q) ||
    p.state?.toLowerCase().includes(q)
  );

  return (
    <div className="dash-content">
      <div className="dash-page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: '#1b3d5e18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Users size={22} color="var(--primary)" />
          </div>
          <h1 className="font-display" style={{ fontSize: '1.7rem', fontWeight: 600, color: 'var(--text-head)', margin: 0 }}>Patients</h1>
        </div>
        <input
          type="search"
          className="skeu-input"
          placeholder="Search by name, phone, state..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 280 }}
        />
      </div>

      <div className="skeu-card" style={{ padding: 0, overflow: 'hidden' }}>
        {dataLoading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading patients...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            {patients.length === 0 ? 'No patients have been seen at this hospital yet.' : 'No patients match your search.'}
          </div>
        ) : (
          <div className="table-scroll">
            <table className="dash-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-card)', background: 'var(--bg-base)' }}>
                  {['Full Name', 'Phone', 'State', 'Last Consultation', 'Portal Account', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const isExp = expanded === p.id;
                  return (
                    <>
                      <tr
                        key={p.id}
                        style={{ borderBottom: '1px solid var(--border-card)', cursor: 'pointer', background: isExp ? 'rgba(27,61,94,0.04)' : undefined }}
                        onClick={() => setExpanded(isExp ? null : p.id)}
                      >
                        <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-head)' }}>{p.full_name}</td>
                        <td style={{ padding: '14px 16px', color: 'var(--text-body)' }}>{p.phone || '—'}</td>
                        <td style={{ padding: '14px 16px', color: 'var(--text-body)' }}>{p.state || '—'}</td>
                        <td style={{ padding: '14px 16px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(p.last_consultation)}</td>
                        <td style={{ padding: '14px 16px' }}>
                          {p.portal_email ? (
                            <span style={{ background: '#d1fae5', color: '#065f46', padding: '2px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600 }}>Active</span>
                          ) : (
                            <span style={{ background: '#f3f4f6', color: '#6b7280', padding: '2px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600 }}>None</span>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          {isExp ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                        </td>
                      </tr>
                      {isExp && (
                        <tr key={`${p.id}-exp`} style={{ borderBottom: '1px solid var(--border-card)' }}>
                          <td colSpan={6} style={{ padding: '16px 24px', background: 'rgba(27,61,94,0.03)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px 24px', fontSize: '0.85rem' }}>
                              {[
                                { label: 'Date of Birth', value: p.dob || '—' },
                                { label: 'Gender', value: p.gender || '—' },
                                { label: 'LGA', value: p.lga || '—' },
                                { label: 'Occupation', value: p.occupation || '—' },
                                { label: 'Address', value: p.address || '—' },
                                { label: 'Portal Email', value: p.portal_email || 'No portal account' },
                              ].map(f => (
                                <div key={f.label}>
                                  <div style={{ fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 2 }}>{f.label}</div>
                                  <div style={{ color: 'var(--text-body)' }}>{f.value}</div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
