'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { Stethoscope, ChevronDown, ChevronUp } from 'lucide-react';
import SignaturePad from '@/components/forms/SignaturePad';

interface Consultation {
  id: number;
  patient_name: string;
  patient_phone: string;
  assessor_name: string;
  chief_complaint: string;
  medical_history: string;
  physical_assessment: string | null;
  patient_goals: string;
  recommended_device: string;
  notes: string;
  consent_given: number;
  assessor_signature: string | null;
  patient_signature: string | null;
  created_at: string;
}

function SectionHeader({ number, title }: { number: string; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, marginTop: 8 }}>
      <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>{number}</div>
      <h3 className="font-display" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-head)', margin: 0 }}>{title}</h3>
      <div style={{ flex: 1, height: 1, background: 'var(--border-card)' }} />
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: '0.9rem', color: 'var(--text-body)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{value || '—'}</div>
    </div>
  );
}

function tryParse<T>(str: string | null, fallback: T): T {
  if (!str) return fallback;
  try { return JSON.parse(str) as T; } catch { return fallback; }
}

interface PARow { label: string; findings: string; notes: string; }
const PA_LABELS = ['Residual Limb', 'ROM', 'Muscle Strength', 'Sensation/Pain', 'Gait', 'Functional Mobility'];

function formatDate(dt: string) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

function ConsultationDetail({ c }: { c: Consultation }) {
  const pa = tryParse<PARow[]>(c.physical_assessment, []);
  return (
    <div style={{ borderTop: '1px solid var(--border-card)', paddingTop: 18, marginTop: 0 }}>
      <SectionHeader number="1" title="Chief Complaint & History" />
      <Field label="Chief Complaint" value={c.chief_complaint} />
      <Field label="Medical History" value={c.medical_history} />

      <SectionHeader number="2" title="Physical Assessment" />
      {pa.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: 14 }}>No data recorded.</div>
      ) : (
        <div style={{ overflowX: 'auto', marginBottom: 16 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-base)' }}>
                {['Category', 'Findings', 'Notes'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-card)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PA_LABELS.map((label, i) => {
                const row = pa[i] || { label, findings: '', notes: '' };
                return (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-card)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-head)', whiteSpace: 'nowrap' }}>{label}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-body)' }}>{row.findings || '—'}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-body)' }}>{row.notes || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <SectionHeader number="3" title="Patient Goals & Device" />
      <div className="form-grid-2" style={{ gap: '0 24px' }}>
        <Field label="Patient Goals" value={c.patient_goals} />
        <Field label="Recommended Device" value={c.recommended_device} />
      </div>

      <SectionHeader number="4" title="Notes & Consent" />
      <Field label="General Notes" value={c.notes} />
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 3 }}>Consent</div>
        {c.consent_given ? (
          <span style={{ color: '#059669', fontWeight: 600, fontSize: '0.9rem' }}>Given</span>
        ) : (
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Not recorded</span>
        )}
      </div>
      {(c.assessor_signature || c.patient_signature) && (
        <div className="form-grid-2" style={{ gap: 14, marginTop: 12 }}>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 4 }}>Prosthetist / Orthotist Signature</div>
            <SignaturePad value={c.assessor_signature} disabled height={80} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 4 }}>Patient / Guardian Signature</div>
            <SignaturePad value={c.patient_signature} disabled height={80} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function HospitalAdminConsultationsPage() {
  const { user, loading } = useAuth();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    fetch('/api/hospital-admin/consultations')
      .then(r => r.json())
      .then(data => {
        if (data.consultations) setConsultations(data.consultations);
        setDataLoading(false);
      })
      .catch(() => setDataLoading(false));
  }, [user]);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!user) { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }
  if (user.role !== 'hospital_admin') { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }

  const q = search.toLowerCase();
  const filtered = consultations.filter(c =>
    c.patient_name?.toLowerCase().includes(q) ||
    c.chief_complaint?.toLowerCase().includes(q)
  );

  return (
    <div className="dash-content">
      <div className="dash-page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: '#1b3d5e18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Stethoscope size={22} color="var(--primary)" />
          </div>
          <h1 className="font-display" style={{ fontSize: '1.7rem', fontWeight: 600, color: 'var(--text-head)', margin: 0 }}>Consultations</h1>
        </div>
        <input
          type="search"
          className="skeu-input"
          placeholder="Search patient or complaint..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 280 }}
        />
      </div>

      <div className="skeu-card" style={{ padding: 0, overflow: 'hidden' }}>
        {dataLoading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading consultations...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            {consultations.length === 0 ? 'No consultations recorded yet.' : 'No consultations match your search.'}
          </div>
        ) : (
          <div className="table-scroll">
            <table className="dash-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-card)', background: 'var(--bg-base)' }}>
                  {['Patient', 'Chief Complaint', 'Assessor', 'Recommended Device', 'Date', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const isExp = expanded === c.id;
                  return (
                    <>
                      <tr
                        key={c.id}
                        style={{ borderBottom: '1px solid var(--border-card)', cursor: 'pointer', background: isExp ? 'rgba(27,61,94,0.04)' : undefined }}
                        onClick={() => setExpanded(isExp ? null : c.id)}
                      >
                        <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-head)' }}>{c.patient_name || '—'}</td>
                        <td style={{ padding: '14px 16px', color: 'var(--text-body)', maxWidth: 200 }}>{c.chief_complaint || '—'}</td>
                        <td style={{ padding: '14px 16px', color: 'var(--text-body)' }}>{c.assessor_name || '—'}</td>
                        <td style={{ padding: '14px 16px', color: 'var(--text-body)' }}>
                          {c.recommended_device ? (
                            <span style={{ background: '#1b3d5e12', color: 'var(--primary)', padding: '2px 8px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 500 }}>
                              {c.recommended_device}
                            </span>
                          ) : '—'}
                        </td>
                        <td style={{ padding: '14px 16px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(c.created_at)}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          {isExp ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                        </td>
                      </tr>
                      {isExp && (
                        <tr key={`${c.id}-exp`} style={{ borderBottom: '1px solid var(--border-card)' }}>
                          <td colSpan={6} style={{ padding: '20px 24px', background: 'rgba(27,61,94,0.02)' }}>
                            <ConsultationDetail c={c} />
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
