'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { Users, Search, ChevronDown, ChevronUp, User } from 'lucide-react';

interface Patient {
  id: number; user_id: number | null; full_name: string;
  phone: string; dob: string; address: string; state: string;
  created_at: string; portal_email: string | null;
}

export default function PatientsPage() {
  const { user, loading } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    fetch('/api/admin/patients').then(r => r.json()).then(setPatients);
  }, [user]);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!user) { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }

  const filtered = patients.filter(p =>
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (p.phone || '').includes(search) ||
    (p.state || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="dash-content">
      <div className="dash-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#2563eb18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={20} color="#2563eb" />
          </div>
          <div>
            <h1 className="font-display" style={{ fontSize: '1.75rem', color: 'var(--text-head)', fontWeight: 600 }}>Patients</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{patients.length} registered patients</p>
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input className="skeu-input" placeholder="Search name, phone, state…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36, width: 260, maxWidth: '100%' }} />
        </div>
      </div>

      <div className="skeu-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-scroll">
          <table className="dash-table">
            <thead><tr><th>Full Name</th><th>Phone</th><th>State</th><th>Date of Birth</th><th>Registered</th><th></th></tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  {search ? 'No patients match your search.' : 'No patients yet.'}
                </td></tr>
              ) : filtered.flatMap(p => {
                const rows: React.ReactElement[] = [(
                  <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}>
                    <td style={{ fontWeight: 600, color: 'var(--text-head)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <User size={13} color="#fff" />
                        </div>
                        {p.full_name}
                      </div>
                    </td>
                    <td>{p.phone || '—'}</td>
                    <td>{p.state || '—'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{p.dob ? new Date(p.dob).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
                    <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{new Date(p.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td>{expandedId === p.id ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}</td>
                  </tr>
                )];
                if (expandedId === p.id) {
                  rows.push(
                    <tr key={`${p.id}-exp`}>
                      <td colSpan={6} style={{ padding: 0, background: 'rgba(27,61,94,0.03)', borderBottom: '1px solid var(--border-subtle)' }}>
                        <div style={{ padding: '14px 20px 14px 52px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px 24px' }}>
                          <div>
                            <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '3px' }}>Address</div>
                            <div style={{ fontSize: '0.88rem', color: 'var(--text-body)' }}>{p.address || '—'}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '3px' }}>Portal Email</div>
                            <div style={{ fontSize: '0.88rem', color: 'var(--text-body)' }}>{p.portal_email || 'No portal account'}</div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                }
                return rows;
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
