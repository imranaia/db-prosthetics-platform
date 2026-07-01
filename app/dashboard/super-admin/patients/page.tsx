'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';

interface Patient {
  id: number;
  user_id: number | null;
  full_name: string;
  phone: string;
  dob: string;
  address: string;
  state: string;
  created_at: string;
  portal_email: string | null;
}

export default function PatientsPage() {
  const { user, loading } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    fetch('/api/admin/patients')
      .then((r) => r.json())
      .then(setPatients);
  }, [user]);

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }
  if (!user) {
    if (typeof window !== 'undefined') window.location.href = '/login';
    return null;
  }

  const filtered = patients.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.full_name.toLowerCase().includes(q) ||
      p.phone.toLowerCase().includes(q) ||
      (p.state ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ padding: '40px 36px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <h1 className="font-display" style={{ fontSize: '1.9rem', color: 'var(--text-head)', fontWeight: 600 }}>
          Patients
        </h1>
        <input
          className="skeu-input"
          placeholder="Search by name, phone, state…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '280px', padding: '9px 14px', fontSize: '0.875rem' }}
        />
      </div>

      <div className="skeu-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(27,61,94,0.06)', borderBottom: '1px solid var(--border-card)' }}>
              {['Full Name', 'Phone', 'State', 'Date of Birth', 'Registered'].map((h) => (
                <th key={h} style={{ padding: '14px 18px', textAlign: 'left', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No patients found.</td></tr>
            )}
            {filtered.map((p, i) => (
              <>
                <tr
                  key={p.id}
                  onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                  style={{ borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}
                >
                  <td style={{ padding: '14px 18px', fontWeight: 500, color: 'var(--text-head)', fontSize: '0.9rem' }}>{p.full_name}</td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-body)', fontSize: '0.88rem' }}>{p.phone}</td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-body)', fontSize: '0.88rem' }}>{p.state}</td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-body)', fontSize: '0.88rem' }}>{p.dob ? new Date(p.dob).toLocaleDateString('en-NG') : '—'}</td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(p.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                </tr>
                {expandedId === p.id && (
                  <tr key={`${p.id}-expanded`} style={{ background: 'rgba(27,61,94,0.03)', borderBottom: i < filtered.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                    <td colSpan={5} style={{ padding: '16px 28px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', fontSize: '0.85rem' }}>
                        <div>
                          <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '2px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Address</span>
                          <span style={{ color: 'var(--text-body)' }}>{p.address || '—'}</span>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '2px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date of Birth</span>
                          <span style={{ color: 'var(--text-body)' }}>{p.dob || '—'}</span>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '2px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Portal Email</span>
                          <span style={{ color: 'var(--text-body)' }}>{p.portal_email || 'Not linked'}</span>
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
  );
}
