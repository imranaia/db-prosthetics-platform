'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { FileSignature, ChevronDown, ChevronUp } from 'lucide-react';
import SignaturePad from '@/components/forms/SignaturePad';

interface ConsentForm {
  id: number;
  hospital_name: string | null;
  patient_display_id: string | null;
  form_date: string;
  patient_guardian_name: string | null;
  patient_guardian_signature: string | null;
  witness_name: string | null;
  witness_signature: string | null;
  clinician_name: string | null;
  clinician_signature: string | null;
  created_at: string;
}

function formatDate(dt: string | null) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

function ConsentDetail({ cf }: { cf: ConsentForm }) {
  return (
    <div style={{ padding: '16px 0' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>Patient ID</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-body)' }}>{cf.patient_display_id || '—'}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>Date</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-body)' }}>{formatDate(cf.form_date)}</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>Patient / Guardian — {cf.patient_guardian_name || '—'}</div>
          <SignaturePad value={cf.patient_guardian_signature} disabled height={90} />
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>Witness — {cf.witness_name || '—'}</div>
          <SignaturePad value={cf.witness_signature} disabled height={90} />
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>Prosthetist / Clinician — {cf.clinician_name || '—'}</div>
          <SignaturePad value={cf.clinician_signature} disabled height={90} />
        </div>
      </div>
    </div>
  );
}

export default function PatientConsentPage() {
  const { user, loading } = useAuth();
  const [forms, setForms] = useState<ConsentForm[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'patient') return;
    fetch('/api/patient/consent')
      .then(r => r.json())
      .then(data => {
        setForms(data.forms || []);
        setDataLoading(false);
      })
      .catch(() => setDataLoading(false));
  }, [user]);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!user) { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }
  if (user.role !== 'patient') { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }

  return (
    <div className="dash-content">
      <div className="dash-page-header" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <div style={{ width: 46, height: 46, borderRadius: 12, background: '#1b3d5e18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <FileSignature size={22} color="var(--primary)" />
        </div>
        <div>
          <h1 className="font-display" style={{ fontSize: '1.7rem', fontWeight: 600, color: 'var(--text-head)', margin: 0 }}>Consent Forms</h1>
          {!dataLoading && (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 2 }}>{forms.length} form{forms.length !== 1 ? 's' : ''}</div>
          )}
        </div>
      </div>

      {dataLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading...</div>
      ) : forms.length === 0 ? (
        <div className="skeu-card" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <FileSignature size={40} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-head)', marginBottom: 8 }}>No consent forms yet</div>
          <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Consent forms you've signed will appear here.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {forms.map(cf => (
            <div key={cf.id} className="skeu-card" style={{ padding: '18px 20px' }}>
              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', gap: 12 }}
                onClick={() => setExpandedId(expandedId === cf.id ? null : cf.id)}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-head)' }}>
                    {formatDate(cf.form_date)}
                  </span>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {cf.hospital_name || 'DB Prosthetics'} &middot; Clinician: {cf.clinician_name || '—'}
                  </div>
                </div>
                <div style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                  {expandedId === cf.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </div>

              {expandedId === cf.id && (
                <div style={{ marginTop: 16, borderTop: '1px solid var(--border-card)', paddingTop: 4 }}>
                  <ConsentDetail cf={cf} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
