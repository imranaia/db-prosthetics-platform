'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { Users, ChevronDown, ChevronUp } from 'lucide-react';

interface POPatient {
  id: number;
  full_name: string;
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
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/po-specialist/patients')
      .then(r => r.json())
      .then(data => {
        setPatients(data.patients || []);
        setDataLoading(false);
      })
      .catch(() => setDataLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!user) { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }
  if (user.role !== 'po_specialist') { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }

  const filtered = patients.filter(p => {
    const q = search.toLowerCase();
    return !q || p.full_name.toLowerCase().includes(q) || (p.phone || '').includes(q);
  });

  return (
    <div className="dash-content">
      <div className="dash-page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: '#1b3d5e18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Users size={22} color="var(--primary)" />
          </div>
          <h1 className="font-display" style={{ fontSize: '1.7rem', fontWeight: 600, color: 'var(--text-head)', margin: 0 }}>My Patients</h1>
        </div>
        <input
          className="skeu-input"
          style={{ width: 240 }}
          placeholder="Search by name or phone…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {dataLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="skeu-card" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <Users size={40} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-head)', marginBottom: 8 }}>
            {search ? 'No patients match your search' : 'No patients yet'}
          </div>
          <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            {search ? 'Try a different name or phone number.' : "You'll see patients here once orders are assigned to you."}
          </div>
        </div>
      ) : (
        <div className="skeu-card" style={{ overflow: 'hidden' }}>
          <div className="table-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(27,61,94,0.04)', borderBottom: '1px solid var(--border-card)' }}>
                {['Full Name', 'Phone', 'State', 'Last Order', 'Portal', ''].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <>
                  <tr
                    key={p.id}
                    style={{ borderBottom: '1px solid var(--border-card)', cursor: 'pointer' }}
                    onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                  >
                    <td style={{ padding: '12px 14px', fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-head)' }}>{p.full_name}</td>
                    <td style={{ padding: '12px 14px', fontSize: '0.85rem', color: 'var(--text-body)' }}>{p.phone || '—'}</td>
                    <td style={{ padding: '12px 14px', fontSize: '0.85rem', color: 'var(--text-body)' }}>{p.state || '—'}</td>
                    <td style={{ padding: '12px 14px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>{formatDate(p.last_order)}</td>
                    <td style={{ padding: '12px 14px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>{p.portal_email || '—'}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      {expandedId === p.id ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                    </td>
                  </tr>
                  {expandedId === p.id && (
                    <tr key={`${p.id}-exp`}>
                      <td colSpan={6} style={{ padding: '16px 20px', background: 'rgba(27,61,94,0.02)', borderBottom: '1px solid var(--border-card)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
                          <div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 3 }}>Date of Birth</div>
                            <div style={{ fontSize: '0.88rem', color: 'var(--text-body)' }}>{formatDate(p.dob)}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 3 }}>LGA</div>
                            <div style={{ fontSize: '0.88rem', color: 'var(--text-body)' }}>{p.lga || '—'}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 3 }}>Portal Email</div>
                            <div style={{ fontSize: '0.88rem', color: 'var(--text-body)' }}>{p.portal_email || '—'}</div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
