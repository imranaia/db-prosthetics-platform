'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';

interface Consultation {
  id: number;
  patient_name: string;
  doctor_email: string | null;
  conducted_by_role: string;
  notes: string | null;
  created_at: string;
}

export default function ConsultationsPage() {
  const { user, loading } = useAuth();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    fetch('/api/admin/consultations')
      .then((r) => r.json())
      .then(setConsultations);
  }, [user]);

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }
  if (!user) {
    if (typeof window !== 'undefined') window.location.href = '/login';
    return null;
  }

  return (
    <div style={{ padding: '40px 36px' }}>
      <h1 className="font-display" style={{ fontSize: '1.9rem', color: 'var(--text-head)', fontWeight: 600, marginBottom: '28px' }}>
        Consultations
      </h1>

      <div className="skeu-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(27,61,94,0.06)', borderBottom: '1px solid var(--border-card)' }}>
              {['Patient', 'Doctor', 'Date', 'Notes Preview'].map((h) => (
                <th key={h} style={{ padding: '14px 18px', textAlign: 'left', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {consultations.length === 0 && (
              <tr><td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No consultations yet.</td></tr>
            )}
            {consultations.map((c, i) => (
              <>
                <tr
                  key={c.id}
                  onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                  style={{ borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}
                >
                  <td style={{ padding: '14px 18px', fontWeight: 500, color: 'var(--text-head)', fontSize: '0.9rem' }}>{c.patient_name || '—'}</td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-body)', fontSize: '0.88rem' }}>
                    {c.doctor_email ?? (c.conducted_by_role === 'super_admin' ? 'Super Admin' : c.conducted_by_role)}
                  </td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {new Date(c.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-body)', fontSize: '0.85rem' }}>
                    {c.notes ? c.notes.substring(0, 80) + (c.notes.length > 80 ? '…' : '') : '—'}
                  </td>
                </tr>
                {expandedId === c.id && (
                  <tr key={`${c.id}-expanded`} style={{ background: 'rgba(27,61,94,0.03)', borderBottom: i < consultations.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                    <td colSpan={4} style={{ padding: '20px 28px' }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', fontWeight: 600 }}>Full Notes</div>
                      <div style={{ color: 'var(--text-body)', fontSize: '0.88rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                        {c.notes || 'No notes recorded.'}
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
