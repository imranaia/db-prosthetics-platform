'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { Stethoscope, ChevronDown, ChevronUp } from 'lucide-react';
import SignaturePad from '@/components/forms/SignaturePad';

interface BodyPartItem {
  region: string;
  label: string;
  subParts?: string[];
}

interface PhotoItem {
  type: 'injury' | 'existing';
  url: string;
}

interface PARow {
  label: string;
  findings: string;
  notes: string;
}

interface Consultation {
  id: number;
  assessor_name: string;
  chief_complaint: string;
  medical_history: string;
  physical_assessment: string | null;
  patient_goals: string;
  recommended_device: string;
  followup_date: string;
  notes: string;
  body_parts: string | null;
  photos: string | null;
  consent_given: number;
  assessor_signature: string | null;
  patient_signature: string | null;
  created_at: string;
  hospital_name: string;
  hospital_state: string;
}

function tryParse<T>(str: string | null, fallback: T): T {
  if (!str) return fallback;
  try { return JSON.parse(str) as T; } catch { return fallback; }
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

function formatDate(dt: string) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

const PA_LABELS = ['Residual Limb', 'ROM', 'Muscle Strength', 'Sensation/Pain', 'Gait', 'Functional Mobility'];

function ConsultationDetail({ c }: { c: Consultation }) {
  const bodyParts = tryParse<BodyPartItem[]>(c.body_parts, []);
  const photos = tryParse<PhotoItem[]>(c.photos, []);
  const pa = tryParse<PARow[]>(c.physical_assessment, []);
  const injuryPhotos = photos.filter(p => p.type === 'injury');
  const existingPhotos = photos.filter(p => p.type === 'existing');

  return (
    <div style={{ borderTop: '1px solid var(--border-card)', paddingTop: 18, marginTop: 14 }}>
      {/* Section 1 */}
      <SectionHeader number="1" title="Assessment Details" />
      <div className="form-grid-2" style={{ gap: '0 24px' }}>
        <Field label="Assessor" value={c.assessor_name} />
        <Field label="Hospital" value={c.hospital_name || '—'} />
        <Field label="Date" value={formatDate(c.created_at)} />
        <Field label="Follow-up Date" value={c.followup_date ? formatDate(c.followup_date) : '—'} />
      </div>

      {/* Section 2 */}
      <SectionHeader number="2" title="Chief Complaint & History" />
      <Field label="Chief Complaint" value={c.chief_complaint} />
      <Field label="Medical History" value={c.medical_history} />

      {/* Section 3 */}
      <SectionHeader number="3" title="Affected Body Parts" />
      {bodyParts.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: 14 }}>None recorded.</div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {bodyParts.map((bp, i) => (
            <span key={i} style={{ background: '#1b3d5e12', color: 'var(--primary)', border: '1px solid #1b3d5e30', padding: '4px 12px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 500 }}>
              {bp.label}{bp.subParts && bp.subParts.length > 0 ? ` (${bp.subParts.join(', ')})` : ''}
            </span>
          ))}
        </div>
      )}

      {/* Section 4 */}
      <SectionHeader number="4" title="Physical Assessment" />
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

      {/* Section 5 */}
      <SectionHeader number="5" title="Patient Goals & Device" />
      <div className="form-grid-2" style={{ gap: '0 24px' }}>
        <Field label="Patient Goals" value={c.patient_goals} />
        <Field label="Recommended Device" value={c.recommended_device} />
      </div>

      {/* Section 6 */}
      <SectionHeader number="6" title="Clinical Photos" />
      {photos.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: 14 }}>No photos uploaded.</div>
      ) : (
        <div style={{ marginBottom: 16 }}>
          {injuryPhotos.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Injury Photos</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {injuryPhotos.map((p, i) => (
                  <img key={i} src={p.url} alt="" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border-card)' }} />
                ))}
              </div>
            </div>
          )}
          {existingPhotos.length > 0 && (
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Existing Limb Photos</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {existingPhotos.map((p, i) => (
                  <img key={i} src={p.url} alt="" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border-card)' }} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Section 7 */}
      <SectionHeader number="7" title="Notes & Consent" />
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

export default function PatientRecordsPage() {
  const { user, loading } = useAuth();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    fetch('/api/patient/consultations')
      .then(r => r.json())
      .then(data => {
        if (data.consultations) setConsultations(data.consultations);
        setDataLoading(false);
      })
      .catch(() => setDataLoading(false));
  }, [user]);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!user) { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }
  if (user.role !== 'patient') { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }

  return (
    <div className="dash-content">
      <div className="dash-page-header" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: '#1b3d5e18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Stethoscope size={22} color="var(--primary)" />
          </div>
          <div>
            <h1 className="font-display" style={{ fontSize: '1.7rem', fontWeight: 600, color: 'var(--text-head)', margin: 0 }}>My Consultation Records</h1>
            {!dataLoading && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: 4 }}>
                {consultations.length} record{consultations.length !== 1 ? 's' : ''} total
              </p>
            )}
          </div>
        </div>
      </div>

      {dataLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading records...</div>
      ) : consultations.length === 0 ? (
        <div className="skeu-card" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <Stethoscope size={40} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-head)', marginBottom: 8 }}>No consultation records yet</div>
          <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Your consultation records will appear here after your first visit.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {consultations.map(c => {
            const isExpanded = expanded === c.id;
            return (
              <div key={c.id} className="skeu-card" style={{ padding: 20 }}>
                {/* Card top row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                      {formatDate(c.created_at)}
                    </span>
                    {c.hospital_name && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 500 }}>· {c.hospital_name}</span>
                    )}
                    {c.consent_given ? (
                      <span style={{ background: '#d1fae5', color: '#065f46', padding: '2px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600 }}>Consent Given</span>
                    ) : null}
                  </div>
                </div>

                {/* Chief complaint heading */}
                <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-head)', margin: '0 0 10px' }}>
                  {c.chief_complaint || 'No complaint recorded'}
                </h2>

                {/* Recommended device chip */}
                {c.recommended_device && (
                  <div style={{ marginBottom: 12 }}>
                    <span style={{ background: '#d08c2a18', color: '#d08c2a', border: '1px solid #d08c2a40', padding: '3px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600 }}>
                      {c.recommended_device}
                    </span>
                  </div>
                )}

                {/* Toggle button */}
                <button
                  onClick={() => setExpanded(isExpanded ? null : c.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid var(--border-card)', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary)', marginTop: 4 }}
                >
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {isExpanded ? 'Hide Full Record' : 'View Full Record'}
                </button>

                {/* Expanded detail */}
                {isExpanded && <ConsultationDetail c={c} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
