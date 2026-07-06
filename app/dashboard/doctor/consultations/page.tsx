'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useRef, useState } from 'react';
import { Stethoscope, Plus, X, ChevronDown, ChevronUp, Upload, Trash2 } from 'lucide-react';
import BodySelector, { BodyPart } from '@/components/consultation/BodySelector';
import SignaturePad from '@/components/forms/SignaturePad';

/* ─── Types ─── */
interface PhysicalRow { findings: string; notes: string; }
interface PhysicalAssessment {
  residual_limb: PhysicalRow;
  rom: PhysicalRow;
  muscle_strength: PhysicalRow;
  sensation_pain: PhysicalRow;
  gait: PhysicalRow;
  functional_mobility: PhysicalRow;
}

const EMPTY_PA: PhysicalAssessment = {
  residual_limb:       { findings: '', notes: '' },
  rom:                 { findings: '', notes: '' },
  muscle_strength:     { findings: '', notes: '' },
  sensation_pain:      { findings: '', notes: '' },
  gait:                { findings: '', notes: '' },
  functional_mobility: { findings: '', notes: '' },
};

const PA_ROWS: { key: keyof PhysicalAssessment; label: string }[] = [
  { key: 'residual_limb',       label: 'Residual Limb: Condition, Length, Shape, Skin' },
  { key: 'rom',                 label: 'Range of Motion (ROM)' },
  { key: 'muscle_strength',     label: 'Muscle Strength' },
  { key: 'sensation_pain',      label: 'Sensation / Pain' },
  { key: 'gait',                label: 'Gait Analysis (if applicable)' },
  { key: 'functional_mobility', label: 'Functional Mobility (e.g., Transfers, Balance)' },
];

interface Patient { id: number; full_name: string; }
interface Hospital { id: number; name: string; }

interface Consultation {
  id: number;
  patient_name: string;
  assessor_name: string | null;
  chief_complaint: string | null;
  medical_history: string | null;
  physical_assessment: string | null;
  patient_goals: string | null;
  recommended_device: string | null;
  followup_date: string | null;
  notes: string | null;
  body_parts: string | null;
  photos: string | null;
  consent_given: number;
  assessor_signature: string | null;
  patient_signature: string | null;
  created_at: string;
}

interface PhotoEntry { type: 'injury' | 'existing'; url: string; }

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

function formatDate(dt: string | null) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

function ConsultationDetail({ c }: { c: Consultation }) {
  const bodyParts: BodyPart[] = tryParse(c.body_parts, []);
  const photos: { type: string; url: string }[] = tryParse(c.photos, []);
  const pa: PhysicalAssessment = tryParse(c.physical_assessment, EMPTY_PA);

  return (
    <div style={{ padding: '20px 24px', background: 'rgba(37,79,122,0.02)', borderTop: '1px solid var(--border-card)' }}>
      <div className="form-grid-2" style={{ gap: 16, marginBottom: 20 }}>
        <Field label="Patient" value={c.patient_name} />
        <Field label="Date" value={formatDate(c.created_at)} />
        <Field label="Assessor" value={c.assessor_name || '—'} />
        <Field label="Follow-up Date" value={formatDate(c.followup_date)} />
      </div>

      <SectionHeader number="1" title="Medical & Social History" />
      <Field label="Chief Complaint" value={c.chief_complaint || '—'} />
      <Field label="Medical History" value={c.medical_history || '—'} />

      {bodyParts.length > 0 && (
        <>
          <SectionHeader number="2" title="Affected Body Area" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {bodyParts.map((bp, i) => (
              <span key={i} style={{ display: 'inline-flex', padding: '4px 12px', borderRadius: 20, background: 'rgba(208,140,42,0.12)', border: '1px solid rgba(208,140,42,0.35)', color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 500 }}>
                {bp.label}{bp.subParts?.length ? ` (${bp.subParts.join(', ')})` : ''}
              </span>
            ))}
          </div>
        </>
      )}

      <SectionHeader number="3" title="Physical Assessment" />
      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: 'rgba(37,79,122,0.06)' }}>
              <th style={{ padding: '8px 12px', textAlign: 'left', border: '1px solid var(--border-card)', width: '35%', color: 'var(--text-head)', fontWeight: 600 }}>Parameter</th>
              <th style={{ padding: '8px 12px', textAlign: 'left', border: '1px solid var(--border-card)', color: 'var(--text-head)', fontWeight: 600 }}>Findings</th>
              <th style={{ padding: '8px 12px', textAlign: 'left', border: '1px solid var(--border-card)', color: 'var(--text-head)', fontWeight: 600 }}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {PA_ROWS.map(row => (
              <tr key={row.key}>
                <td style={{ padding: '8px 12px', border: '1px solid var(--border-card)', color: 'var(--text-muted)', fontSize: '0.82rem' }}>{row.label}</td>
                <td style={{ padding: '8px 12px', border: '1px solid var(--border-card)', color: 'var(--text-body)' }}>{pa[row.key]?.findings || '—'}</td>
                <td style={{ padding: '8px 12px', border: '1px solid var(--border-card)', color: 'var(--text-body)' }}>{pa[row.key]?.notes || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SectionHeader number="4" title="Patient Goals & Treatment Plan" />
      <div className="form-grid-2" style={{ gap: 16, marginBottom: 20 }}>
        <Field label="Patient Goals" value={c.patient_goals || '—'} />
        <Field label="Recommended Device" value={c.recommended_device || '—'} />
      </div>

      {c.notes && (
        <>
          <SectionHeader number="5" title="Additional Notes" />
          <div style={{ fontSize: '0.9rem', color: 'var(--text-body)', lineHeight: 1.7, marginBottom: 20 }}>{c.notes}</div>
        </>
      )}

      {photos.length > 0 && (
        <>
          <SectionHeader number="6" title="Clinical Photographs" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
            {photos.map((ph, i) => (
              <div key={i}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>
                  {ph.type === 'injury' ? 'Injury / Amputation Site' : 'Existing Limb Reference'}
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ph.url} alt={ph.type} style={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border-card)' }} />
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ marginTop: 16, marginBottom: (c.assessor_signature || c.patient_signature) ? 14 : 0, padding: '10px 14px', borderRadius: 8, background: c.consent_given ? 'rgba(16,185,129,0.07)' : 'rgba(239,68,68,0.05)', border: `1px solid ${c.consent_given ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.15)'}`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: '1rem' }}>{c.consent_given ? '✓' : '✗'}</span>
        <span style={{ fontSize: '0.82rem', color: c.consent_given ? '#065f46' : '#991b1b' }}>
          {c.consent_given ? 'Consent obtained and recorded' : 'Consent not yet recorded'}
        </span>
      </div>
      {(c.assessor_signature || c.patient_signature) && (
        <div className="form-grid-2" style={{ gap: 14 }}>
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

export default function DoctorConsultationsPage() {
  const { user, loading } = useAuth();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState<'injury' | 'existing' | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    patient_id: '',
    hospital_id: '',
    assessor_name: '',
    chief_complaint: '',
    medical_history: '',
    patient_goals: '',
    recommended_device: '',
    followup_date: '',
    notes: '',
    consent_given: false,
    assessment_date: today,
    consultation_type: 'new' as 'new' | 'follow_up',
    category: '',
  });
  const [recommendDevice, setRecommendDevice] = useState(true);
  const [assessorSignature, setAssessorSignature] = useState<string | null>(null);
  const [patientSignature, setPatientSignature] = useState<string | null>(null);

  const [physicalAssessment, setPhysicalAssessment] = useState<PhysicalAssessment>(EMPTY_PA);
  const [bodyParts, setBodyParts] = useState<BodyPart[]>([]);
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedPatient, setExpandedPatient] = useState<string | null>(null);
  const [expandedConsult, setExpandedConsult] = useState<number | null>(null);

  const injuryInputRef   = useRef<HTMLInputElement>(null);
  const existingInputRef = useRef<HTMLInputElement>(null);

  const load = () => {
    fetch('/api/doctor/consultations')
      .then(r => r.json())
      .then(data => {
        if (data.consultations) setConsultations(data.consultations);
        if (data.patients) setPatients(data.patients);
        if (data.hospitals) setHospitals(data.hospitals);
        setDataLoading(false);
      })
      .catch(() => setDataLoading(false));
  };

  async function handleHospitalChange(value: string) {
    setForm(prev => ({ ...prev, hospital_id: value, patient_id: '' }));
    const qs = value ? `?hospital_id=${value}` : '';
    try {
      const data = await fetch(`/api/doctor/consultations${qs}`).then(r => r.json());
      if (data.patients) setPatients(data.patients);
    } catch { /* keep existing patient list on failure */ }
  }

  useEffect(() => { if (user) load(); }, [user]);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!user) { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }
  if (user.role !== 'doctor' && !(user.role === 'super_admin' && user.hasDoctorProfile)) { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }

  function updatePA(key: keyof PhysicalAssessment, field: 'findings' | 'notes', value: string) {
    setPhysicalAssessment(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>, type: 'injury' | 'existing') {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(type);
    setUploadError('');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', 'db-prosthetics/consultations');
    try {
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || data.error) { setUploadError(data.error || 'Upload failed'); }
      else { setPhotos(prev => [...prev, { type, url: data.url! }]); }
    } catch { setUploadError('Upload failed — network error'); }
    finally { setUploadingPhoto(null); e.target.value = ''; }
  }

  function removePhoto(url: string) { setPhotos(prev => prev.filter(p => p.url !== url)); }

  function resetForm() {
    setForm({ patient_id: '', hospital_id: '', assessor_name: '', chief_complaint: '', medical_history: '', patient_goals: '', recommended_device: '', followup_date: '', notes: '', consent_given: false, assessment_date: today, consultation_type: 'new', category: '' });
    setRecommendDevice(true);
    setPhysicalAssessment(EMPTY_PA);
    setBodyParts([]);
    setPhotos([]);
    setAssessorSignature(null);
    setPatientSignature(null);
    setError('');
    setUploadError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const res = await fetch('/api/doctor/consultations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_id:          parseInt(form.patient_id),
        hospital_id:         form.hospital_id ? parseInt(form.hospital_id) : null,
        assessor_name:       form.assessor_name,
        chief_complaint:     form.chief_complaint,
        medical_history:     form.medical_history,
        physical_assessment: physicalAssessment,
        patient_goals:       form.patient_goals,
        recommended_device:  form.recommended_device,
        followup_date:       form.followup_date || null,
        notes:               form.notes,
        consent_given:       patientSignature ? 1 : 0,
        assessor_signature:  assessorSignature,
        patient_signature:   patientSignature,
        consultation_type:   form.consultation_type,
        category:            recommendDevice ? (form.category || null) : null,
        body_parts:          bodyParts,
        photos,
      }),
    });
    setSubmitting(false);
    if (res.ok) {
      const data = await res.json() as { id?: number };
      const newId = data.id;
      resetForm();
      setShowForm(false);
      if (recommendDevice && newId) {
        window.location.href = `/dashboard/doctor/orders?from_consultation=${newId}&tab=custom`;
        return;
      }
      setDataLoading(true);
      load();
    } else {
      const d = await res.json() as { error?: string };
      setError(d.error || 'Failed to save consultation');
    }
  }

  const q = search.toLowerCase();
  let filtered = consultations.filter(c =>
    c.patient_name?.toLowerCase().includes(q) ||
    (c.chief_complaint || '').toLowerCase().includes(q)
  );
  if (dateFrom) filtered = filtered.filter(c => c.created_at >= dateFrom);
  if (dateTo)   filtered = filtered.filter(c => c.created_at <= dateTo + 'T23:59:59');

  const sorted = [...filtered].sort((a, b) =>
    sortOrder === 'newest'
      ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      : new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // Group by patient name
  const patientMap = new Map<string, Consultation[]>();
  for (const c of sorted) {
    const key = c.patient_name || 'Unknown';
    if (!patientMap.has(key)) patientMap.set(key, []);
    patientMap.get(key)!.push(c);
  }
  const patientGroups = Array.from(patientMap.entries());

  return (
    <div className="dash-content">
      {/* Header */}
      <div className="dash-page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: '#1b3d5e18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Stethoscope size={22} color="var(--primary)" />
          </div>
          <div>
            <h1 className="font-display" style={{ fontSize: '1.7rem', fontWeight: 600, color: 'var(--text-head)', margin: 0 }}>Consultations</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: 2 }}>Standard P&O Assessment Forms</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="search"
            className="skeu-input"
            placeholder="Search patient or complaint..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: 200 }}
          />
          <button
            className="skeu-btn-primary"
            onClick={() => { if (showForm) { resetForm(); setShowForm(false); } else setShowForm(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: 7 }}
          >
            {showForm ? <><X size={15} />Cancel</> : <><Plus size={15} />New Consultation</>}
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="skeu-card" style={{ padding: 28, marginBottom: 24 }}>
          <div style={{ borderBottom: '2px solid var(--primary)', paddingBottom: 16, marginBottom: 24 }}>
            <h2 className="font-display" style={{ fontSize: '1.15rem', color: 'var(--text-head)', fontWeight: 600, margin: 0 }}>
              Standard Prosthetics &amp; Orthotics Assessment Form
            </h2>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Hospital + Patient */}
            <div className="form-grid-2" style={{ marginBottom: 20 }}>
              <div>
                <label className="skeu-label">Consulting As</label>
                <select className="skeu-select" value={form.hospital_id} onChange={e => handleHospitalChange(e.target.value)}>
                  <option value="">Personal (not hospital-affiliated)</option>
                  {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
              </div>
              <div>
                <label className="skeu-label">Patient <span style={{ color: '#dc2626' }}>*</span></label>
                <select className="skeu-select" value={form.patient_id} onChange={e => setForm({ ...form, patient_id: e.target.value })} required>
                  <option value="">Select a patient…</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select>
              </div>
            </div>

            {/* Visit type */}
            <div style={{ marginBottom: 20 }}>
              <label className="skeu-label" style={{ display: 'block', marginBottom: 8 }}>Visit Type</label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {(['new', 'follow_up'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, consultation_type: t })}
                    style={{
                      padding: '9px 18px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                      border: `2px solid ${form.consultation_type === t ? 'var(--primary)' : 'var(--border-card)'}`,
                      background: form.consultation_type === t ? 'rgba(27,61,94,0.07)' : 'transparent',
                      color: form.consultation_type === t ? 'var(--primary)' : 'var(--text-body)',
                    }}
                  >
                    {t === 'new' ? 'New Patient Assessment' : 'Follow-up Visit'}
                  </button>
                ))}
              </div>
            </div>

            {/* Recommend new device — drives the handoff to Orders */}
            <div style={{ marginBottom: 20, padding: '14px 16px', background: 'rgba(208,140,42,0.06)', border: '1px solid rgba(208,140,42,0.2)', borderRadius: 8 }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: recommendDevice ? 12 : 0 }}>
                <input type="checkbox" checked={recommendDevice} onChange={e => setRecommendDevice(e.target.checked)} style={{ marginTop: 2, flexShrink: 0 }} />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-body)', fontWeight: 500 }}>
                  Recommend a new prosthetic/orthotic device for this patient — saving will take you straight to placing the order with this consultation's details carried over.
                </span>
              </label>
              {recommendDevice && (
                <div>
                  <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Device Category</label>
                  <select className="skeu-select" style={{ width: '100%', maxWidth: 320 }} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    <option value="">Select category…</option>
                    <option value="upper_limb">Upper Limb</option>
                    <option value="lower_limb">Lower Limb</option>
                    <option value="facial">Facial</option>
                    <option value="spinal">Spinal</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              )}
            </div>

            {/* Assessor */}
            <div style={{ marginBottom: 20 }}>
              <label className="skeu-label">Assessor Name</label>
              <input className="skeu-input" value={form.assessor_name} onChange={e => setForm({ ...form, assessor_name: e.target.value })} placeholder="Full name of assessor…" />
            </div>

            {/* Section 1 */}
            <SectionHeader number="1" title="Medical & Social History" />
            <div style={{ marginBottom: 16 }}>
              <label className="skeu-label">Chief Complaint / Reason for Referral <span style={{ color: '#dc2626' }}>*</span></label>
              <textarea className="skeu-input" rows={2} value={form.chief_complaint} onChange={e => setForm({ ...form, chief_complaint: e.target.value })} placeholder="Primary reason for referral…" style={{ resize: 'vertical' }} required />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label className="skeu-label">Relevant Medical History</label>
              <textarea className="skeu-input" rows={3} value={form.medical_history} onChange={e => setForm({ ...form, medical_history: e.target.value })} placeholder="Diagnosis, amputation details, comorbidities…" style={{ resize: 'vertical' }} />
            </div>

            {/* Section 2 — Body diagram */}
            <SectionHeader number="2" title="Affected Body Area" />
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 10, marginTop: 0 }}>
              Click on the body diagram to mark the affected region(s). For hands/feet, select specific fingers or toes.
            </p>
            <BodySelector value={bodyParts} onChange={setBodyParts} />

            {/* Section 3 — Physical Assessment */}
            <div style={{ marginTop: 24 }}>
              <SectionHeader number="3" title="Physical Assessment" />
            </div>
            <div style={{ overflowX: 'auto', marginBottom: 24 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(37,79,122,0.06)' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '2px solid var(--border-card)', width: '35%', color: 'var(--text-head)', fontWeight: 600 }}>Parameter</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '2px solid var(--border-card)', color: 'var(--text-head)', fontWeight: 600 }}>Findings</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '2px solid var(--border-card)', color: 'var(--text-head)', fontWeight: 600 }}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {PA_ROWS.map(row => (
                    <tr key={row.key} style={{ borderBottom: '1px solid var(--border-card)' }}>
                      <td style={{ padding: '10px 12px', fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>{row.label}</td>
                      <td style={{ padding: '6px 8px' }}>
                        <input className="skeu-input" style={{ margin: 0, fontSize: '0.82rem' }} value={physicalAssessment[row.key].findings} onChange={e => updatePA(row.key, 'findings', e.target.value)} placeholder="Findings…" />
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <input className="skeu-input" style={{ margin: 0, fontSize: '0.82rem' }} value={physicalAssessment[row.key].notes} onChange={e => updatePA(row.key, 'notes', e.target.value)} placeholder="Notes…" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Section 4 — Goals & Plan */}
            <SectionHeader number="4" title="Patient Goals & Treatment Plan" />
            <div style={{ marginBottom: 16 }}>
              <label className="skeu-label">Patient Goals</label>
              <textarea className="skeu-input" rows={2} value={form.patient_goals} onChange={e => setForm({ ...form, patient_goals: e.target.value })} placeholder="What does the patient hope to achieve…" style={{ resize: 'vertical' }} />
            </div>
            <div className="form-grid-2" style={{ marginBottom: 24 }}>
              <div>
                <label className="skeu-label">Recommended Device / Intervention</label>
                <input className="skeu-input" value={form.recommended_device} onChange={e => setForm({ ...form, recommended_device: e.target.value })} placeholder="e.g. Below-knee prosthesis…" />
              </div>
              <div>
                <label className="skeu-label">Follow-up / Review Date</label>
                <input type="date" className="skeu-input" value={form.followup_date} onChange={e => setForm({ ...form, followup_date: e.target.value })} />
              </div>
            </div>

            {/* Section 5 — Photos */}
            <SectionHeader number="5" title="Clinical Photographs" />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 10, marginTop: 0 }}>
              Attach photos of the injury/amputation site or an existing limb for reference.
            </p>

            {uploadError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '8px 12px', borderRadius: 7, marginBottom: 10, fontSize: '0.82rem' }}>{uploadError}</div>
            )}

            <input ref={injuryInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handlePhotoUpload(e, 'injury')} />
            <input ref={existingInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handlePhotoUpload(e, 'existing')} />

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
              <button type="button" onClick={() => injuryInputRef.current?.click()} disabled={uploadingPhoto === 'injury'}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1.5px dashed rgba(208,140,42,0.4)', background: 'rgba(208,140,42,0.05)', color: 'var(--accent, #d08c2a)', fontSize: '0.82rem', fontWeight: 500, cursor: uploadingPhoto === 'injury' ? 'wait' : 'pointer', opacity: uploadingPhoto === 'injury' ? 0.6 : 1 }}>
                <Upload size={13} />
                {uploadingPhoto === 'injury' ? 'Uploading…' : 'Injury / Amputation Site Photo'}
              </button>
              <button type="button" onClick={() => existingInputRef.current?.click()} disabled={uploadingPhoto === 'existing'}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1.5px dashed rgba(37,79,122,0.3)', background: 'rgba(37,79,122,0.04)', color: 'var(--primary)', fontSize: '0.82rem', fontWeight: 500, cursor: uploadingPhoto === 'existing' ? 'wait' : 'pointer', opacity: uploadingPhoto === 'existing' ? 0.6 : 1 }}>
                <Upload size={13} />
                {uploadingPhoto === 'existing' ? 'Uploading…' : 'Existing Limb / Reference Photo (optional)'}
              </button>
            </div>

            {photos.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
                {photos.map((ph, i) => (
                  <div key={i} style={{ position: 'relative', width: 80, height: 80, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-card)' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ph.url} alt={ph.type} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '0.6rem', textAlign: 'center', padding: '2px 0', textTransform: 'uppercase' }}>{ph.type}</div>
                    <button type="button" onClick={() => removePhoto(ph.url)} style={{ position: 'absolute', top: 3, right: 3, background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }} aria-label="Remove photo">
                      <Trash2 size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Notes */}
            <div style={{ marginBottom: 20 }}>
              <label className="skeu-label">Additional Notes</label>
              <textarea className="skeu-input" rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Any additional observations…" style={{ resize: 'vertical' }} />
            </div>

            {/* Signatures & Consent */}
            <SectionHeader number="7" title="Signatures & Consent" />
            <div style={{ marginBottom: 14, padding: '14px 16px', background: 'rgba(37,79,122,0.05)', borderRadius: 8, border: '1px solid rgba(37,79,122,0.12)', fontSize: '0.85rem', color: 'var(--text-body)', lineHeight: 1.6 }}>
              By signing below, the Patient / Guardian consents to the fabrication and fitting of artificial limb(s) by DB Prosthetics and Orthotics Ltd, as per the Consent Form for Fabrication and Fitting of Artificial Limbs. Patient has been informed of the process, risks, and benefits.
            </div>
            <div className="form-grid-2" style={{ marginBottom: 24 }}>
              <div>
                <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Prosthetist / Orthotist Signature</label>
                <SignaturePad value={assessorSignature} onChange={setAssessorSignature} height={110} />
              </div>
              <div>
                <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Patient / Guardian Signature</label>
                <SignaturePad value={patientSignature} onChange={setPatientSignature} height={110} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="skeu-btn-primary" type="submit" disabled={submitting} style={{ padding: '10px 24px' }}>
                {submitting ? 'Saving…' : 'Save Assessment'}
              </button>
              <button type="button" onClick={() => { resetForm(); setShowForm(false); }}
                style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border-card)', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sort & Filter controls */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 0, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-card)' }}>
          <button onClick={() => setSortOrder('newest')} style={{ padding: '7px 16px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', border: 'none', background: sortOrder === 'newest' ? 'var(--primary)' : 'var(--bg-base)', color: sortOrder === 'newest' ? '#fff' : 'var(--text-muted)' }}>Newest First</button>
          <button onClick={() => setSortOrder('oldest')} style={{ padding: '7px 16px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', border: 'none', background: sortOrder === 'oldest' ? 'var(--primary)' : 'var(--bg-base)', color: sortOrder === 'oldest' ? '#fff' : 'var(--text-muted)' }}>Oldest First</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>From</label>
          <input type="date" className="skeu-input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: 150 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>To</label>
          <input type="date" className="skeu-input" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: 150 }} />
        </div>
        {(dateFrom || dateTo) && (
          <button onClick={() => { setDateFrom(''); setDateTo(''); }} style={{ padding: '7px 12px', borderRadius: 7, border: '1px solid var(--border-card)', background: 'transparent', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Clear Dates</button>
        )}
      </div>

      {/* Patient-grouped list */}
      {dataLoading ? (
        <div className="skeu-card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading consultations...</div>
      ) : patientGroups.length === 0 ? (
        <div className="skeu-card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          {consultations.length === 0 ? 'No consultations recorded yet. Use the button above to create the first one.' : 'No consultations match your search.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {patientGroups.map(([patientName, pConsults]) => {
            const isPatientExpanded = expandedPatient === patientName;
            return (
              <div key={patientName} className="skeu-card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Patient card header */}
                <div
                  style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', background: isPatientExpanded ? 'rgba(27,61,94,0.04)' : undefined }}
                  onClick={() => { setExpandedPatient(isPatientExpanded ? null : patientName); setExpandedConsult(null); }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>
                    {patientName.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-head)', fontSize: '0.95rem' }}>{patientName}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{pConsults.length} consultation{pConsults.length !== 1 ? 's' : ''}</div>
                  </div>
                  {isPatientExpanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                </div>

                {/* Date list */}
                {isPatientExpanded && (
                  <div style={{ borderTop: '1px solid var(--border-card)' }}>
                    {pConsults.map(c => {
                      const isConsultExpanded = expandedConsult === c.id;
                      return (
                        <div key={c.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                          <div
                            style={{ padding: '12px 20px 12px 56px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', background: isConsultExpanded ? 'rgba(27,61,94,0.03)' : undefined }}
                            onClick={() => setExpandedConsult(isConsultExpanded ? null : c.id)}
                          >
                            <div style={{ flex: 1 }}>
                              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-head)' }}>{formatDate(c.created_at)}</span>
                              {c.chief_complaint && (
                                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginLeft: 10 }}>
                                  — {c.chief_complaint.slice(0, 55)}{c.chief_complaint.length > 55 ? '…' : ''}
                                </span>
                              )}
                            </div>
                            {isConsultExpanded ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
                          </div>
                          {isConsultExpanded && <ConsultationDetail c={c} />}
                        </div>
                      );
                    })}
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
