'use client';

import { useAuth } from '@/hooks/useAuth';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Ruler } from 'lucide-react';
import SignaturePad from '@/components/forms/SignaturePad';
import SkeuSelect from '@/components/ui/SkeuSelect';
import type { BodyPart } from '@/components/consultation/BodySelector';

interface ConsultationRef {
  id: number;
  patient_id: number;
  patient_name: string;
  patient_dob: string | null;
  body_parts: string | null;
  assessor_name: string | null;
}

const CAUSE_OPTIONS = [
  { value: 'vascular_diabetes', label: 'Vascular / Diabetes' },
  { value: 'trauma', label: 'Trauma' },
  { value: 'cancer', label: 'Cancer' },
  { value: 'congenital', label: 'Congenital' },
  { value: 'other', label: 'Others' },
];

const LIMB_SHAPE_OPTIONS = [
  { value: 'cylindrical', label: 'Cylindrical' },
  { value: 'conical', label: 'Conical' },
  { value: 'bulbous', label: 'Bulbous' },
  { value: 'irregular', label: 'Irregular' },
];

const K_LEVEL_OPTIONS = [
  { value: 'k0', label: 'K0 — Cannot safely transfer or walk; cosmetic use only' },
  { value: 'k1', label: 'K1 — Household Ambulator' },
  { value: 'k2', label: 'K2 — Limited Community Ambulator' },
  { value: 'k3', label: 'K3 — Community Ambulator' },
  { value: 'k4', label: 'K4 — High-Activity User' },
];

const INITIAL_FORM = {
  amputation_date: '',
  cause_of_limb_loss: '',
  cause_other_detail: '',
  limb_shape_profile: '',
  residual_limb_length_cm: '',
  sound_limb_length_cm: '',
  circumference_joint_line_cm: '',
  circumference_interval_1_cm: '',
  circumference_interval_2_cm: '',
  circumference_interval_3_cm: '',
  circumference_interval_4_cm: '',
  circumference_interval_5_cm: '',
  circumference_interval_6_cm: '',
  circumference_distal_end_cm: '',
  k_level: '',
  lifestyle_goals: '',
  field_notes: '',
  clinician_name: '',
};

function SectionHeader({ number, title }: { number: string; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, marginTop: 8 }}>
      <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>{number}</div>
      <h3 className="font-display" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-head)', margin: 0 }}>{title}</h3>
      <div style={{ flex: 1, height: 1, background: 'var(--border-card)' }} />
    </div>
  );
}

export default function NewMeasurementPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
      <NewMeasurementPageInner />
    </Suspense>
  );
}

function NewMeasurementPageInner() {
  const { user, loading } = useAuth();
  const searchParams = useSearchParams();
  const consultationId = searchParams.get('consultation_id');
  const thenOrder = searchParams.get('then_order') === '1';

  const [consultation, setConsultation] = useState<ConsultationRef | null>(null);
  const [dataLoading, setDataLoading] = useState(!!consultationId);
  const [form, setForm] = useState(INITIAL_FORM);
  const [drawing, setDrawing] = useState<string | null>(null);
  const [clinicianSignature, setClinicianSignature] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !consultationId) return;
    fetch(`/api/doctor/measurements?consultation_id=${consultationId}`)
      .then(r => r.json())
      .then(data => {
        if (data.consultation) {
          setConsultation(data.consultation);
          setForm(f => ({ ...f, clinician_name: data.consultation.assessor_name || '', amputation_date: data.consultation.patient_amputation_date || '' }));
        }
        setDataLoading(false);
      })
      .catch(() => setDataLoading(false));
  }, [user, consultationId]);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!user) { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }
  if (user.role !== 'doctor' && user.role !== 'po_specialist' && !(user.role === 'super_admin' && user.hasDoctorProfile)) {
    if (typeof window !== 'undefined') window.location.href = '/login';
    return null;
  }
  if (!consultationId) {
    return <div className="dash-content"><div className="skeu-card" style={{ padding: 24 }}>No consultation specified.</div></div>;
  }

  const bodyParts: BodyPart[] = consultation?.body_parts ? (() => { try { return JSON.parse(consultation.body_parts); } catch { return []; } })() : [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (form.cause_of_limb_loss === 'other' && !form.cause_other_detail.trim()) {
      setError('Please describe the cause of limb loss.');
      return;
    }
    setSubmitting(true);
    const num = (v: string) => (v.trim() ? parseFloat(v) : null);
    const res = await fetch('/api/doctor/measurements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consultation_id: parseInt(consultationId!),
        patient_id: consultation?.patient_id,
        amputation_date: form.amputation_date || null,
        cause_of_limb_loss: form.cause_of_limb_loss || null,
        cause_other_detail: form.cause_other_detail || null,
        limb_shape_profile: form.limb_shape_profile || null,
        residual_limb_length_cm: num(form.residual_limb_length_cm),
        sound_limb_length_cm: num(form.sound_limb_length_cm),
        circumference_joint_line_cm: num(form.circumference_joint_line_cm),
        circumference_interval_1_cm: num(form.circumference_interval_1_cm),
        circumference_interval_2_cm: num(form.circumference_interval_2_cm),
        circumference_interval_3_cm: num(form.circumference_interval_3_cm),
        circumference_interval_4_cm: num(form.circumference_interval_4_cm),
        circumference_interval_5_cm: num(form.circumference_interval_5_cm),
        circumference_interval_6_cm: num(form.circumference_interval_6_cm),
        circumference_distal_end_cm: num(form.circumference_distal_end_cm),
        limb_shape_drawing: drawing,
        k_level: form.k_level || null,
        lifestyle_goals: form.lifestyle_goals || null,
        field_notes: form.field_notes || null,
        clinician_name: form.clinician_name || null,
        clinician_signature: clinicianSignature,
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || 'Failed to save measurement.');
      return;
    }
    if (thenOrder) {
      window.location.href = `/dashboard/doctor/orders?from_consultation=${consultationId}&tab=custom`;
    } else {
      window.location.href = '/dashboard/doctor/consultations';
    }
  }

  return (
    <div className="dash-content" style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="dash-page-header" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <div style={{ width: 46, height: 46, borderRadius: 12, background: '#1b3d5e18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Ruler size={22} color="var(--primary)" />
        </div>
        <div>
          <h1 className="font-display" style={{ fontSize: '1.7rem', fontWeight: 600, color: 'var(--text-head)', margin: 0 }}>Prosthetic Evaluation &amp; Measurement</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 2 }}>
            {dataLoading ? 'Loading…' : consultation ? `For ${consultation.patient_name}` : ''}
          </p>
        </div>
      </div>

      {dataLoading ? (
        <div className="skeu-card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
      ) : (
        <div className="skeu-card" style={{ padding: 24 }}>
          <form onSubmit={handleSubmit}>
            <SectionHeader number="1" title="Medical Overview" />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: -6, marginBottom: 14 }}>
              Patient, date of birth, and evaluation date are already on record from this consultation.
            </p>
            <div className="form-grid-2" style={{ marginBottom: 16 }}>
              <div>
                <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Amputation Date</label>
                <input type="date" className="skeu-input" style={{ width: '100%' }} value={form.amputation_date} onChange={e => setForm({ ...form, amputation_date: e.target.value })} />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label className="skeu-label" style={{ display: 'block', marginBottom: 8 }}>Cause of Limb Loss / Disability</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {CAUSE_OPTIONS.map(o => (
                  <button
                    key={o.value} type="button"
                    onClick={() => setForm({ ...form, cause_of_limb_loss: o.value })}
                    style={{
                      padding: '8px 16px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                      border: `2px solid ${form.cause_of_limb_loss === o.value ? 'var(--primary)' : 'var(--border-card)'}`,
                      background: form.cause_of_limb_loss === o.value ? 'rgba(27,61,94,0.07)' : 'transparent',
                      color: form.cause_of_limb_loss === o.value ? 'var(--primary)' : 'var(--text-body)',
                    }}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              {form.cause_of_limb_loss === 'other' && (
                <input
                  className="skeu-input" style={{ width: '100%', marginTop: 10 }}
                  placeholder="Please describe…"
                  value={form.cause_other_detail}
                  onChange={e => setForm({ ...form, cause_other_detail: e.target.value })}
                />
              )}
            </div>

            {bodyParts.length > 0 && (
              <>
                <SectionHeader number="2" title="Amputation & Damage Level" />
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: -6, marginBottom: 14 }}>
                  Already marked on the affected body area during the consultation.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                  {bodyParts.map((bp, i) => (
                    <span key={i} style={{ display: 'inline-flex', padding: '4px 12px', borderRadius: 20, background: 'rgba(27,61,94,0.08)', border: '1px solid rgba(27,61,94,0.25)', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 500 }}>
                      {bp.label}{bp.subParts?.length ? ` (${bp.subParts.join(', ')})` : ''}
                    </span>
                  ))}
                </div>
              </>
            )}

            <SectionHeader number="3" title="Residual Limb Measurements" />
            <div style={{ marginBottom: 16 }}>
              <label className="skeu-label" style={{ display: 'block', marginBottom: 8 }}>Limb Shape Profile</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {LIMB_SHAPE_OPTIONS.map(o => (
                  <button
                    key={o.value} type="button"
                    onClick={() => setForm({ ...form, limb_shape_profile: o.value })}
                    style={{
                      padding: '8px 16px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                      border: `2px solid ${form.limb_shape_profile === o.value ? 'var(--primary)' : 'var(--border-card)'}`,
                      background: form.limb_shape_profile === o.value ? 'rgba(27,61,94,0.07)' : 'transparent',
                      color: form.limb_shape_profile === o.value ? 'var(--primary)' : 'var(--text-body)',
                    }}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-grid-2" style={{ marginBottom: 16 }}>
              <div>
                <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Residual Limb Length (cm)</label>
                <input type="number" step="0.1" className="skeu-input" style={{ width: '100%' }} value={form.residual_limb_length_cm} onChange={e => setForm({ ...form, residual_limb_length_cm: e.target.value })} />
              </div>
              <div>
                <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Sound Limb Length (cm)</label>
                <input type="number" step="0.1" className="skeu-input" style={{ width: '100%' }} value={form.sound_limb_length_cm} onChange={e => setForm({ ...form, sound_limb_length_cm: e.target.value })} />
              </div>
            </div>

            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
              Circumference Timeline (every 5cm down from the joint line)
            </div>
            <div className="form-grid-3" style={{ marginBottom: 20, gap: 14 }}>
              <div>
                <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>At Joint Line (cm)</label>
                <input type="number" step="0.1" className="skeu-input" style={{ width: '100%' }} value={form.circumference_joint_line_cm} onChange={e => setForm({ ...form, circumference_joint_line_cm: e.target.value })} />
              </div>
              {[1, 2, 3, 4, 5, 6].map(n => (
                <div key={n}>
                  <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Interval {n} — {n * 5}cm (cm)</label>
                  <input
                    type="number" step="0.1" className="skeu-input" style={{ width: '100%' }}
                    value={form[`circumference_interval_${n}_cm` as keyof typeof form]}
                    onChange={e => setForm({ ...form, [`circumference_interval_${n}_cm`]: e.target.value })}
                  />
                </div>
              ))}
              <div>
                <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Distal End / Tip (cm)</label>
                <input type="number" step="0.1" className="skeu-input" style={{ width: '100%' }} value={form.circumference_distal_end_cm} onChange={e => setForm({ ...form, circumference_distal_end_cm: e.target.value })} />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <SignaturePad value={drawing} onChange={setDrawing} height={180} label="Draw the Shape of the Affected Leg/Limb" />
            </div>

            <SectionHeader number="4" title="Functional Mobility Assessment (K-Levels)" />
            <div style={{ marginBottom: 20 }}>
              <SkeuSelect
                value={form.k_level}
                onChange={v => setForm({ ...form, k_level: v })}
                options={K_LEVEL_OPTIONS}
                placeholder="Select K-Level…"
              />
            </div>

            <SectionHeader number="5" title="Lifestyle Goals & Field Notes" />
            <div style={{ marginBottom: 16 }}>
              <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Primary Daily Goals / Functional Requirements</label>
              <textarea className="skeu-input" rows={3} style={{ width: '100%', resize: 'vertical' }} value={form.lifestyle_goals} onChange={e => setForm({ ...form, lifestyle_goals: e.target.value })} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Additional Field Notes</label>
              <textarea className="skeu-input" rows={3} style={{ width: '100%', resize: 'vertical' }} value={form.field_notes} onChange={e => setForm({ ...form, field_notes: e.target.value })} />
            </div>
            <div className="form-grid-2" style={{ marginBottom: 20 }}>
              <div>
                <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Clinician Name</label>
                <input className="skeu-input" style={{ width: '100%' }} value={form.clinician_name} onChange={e => setForm({ ...form, clinician_name: e.target.value })} />
              </div>
              <div>
                <SignaturePad value={clinicianSignature} onChange={setClinicianSignature} height={80} label="Signature" />
              </div>
            </div>

            {error && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, fontSize: '0.88rem', marginBottom: 16 }}>{error}</div>}

            <button type="submit" className="skeu-btn-primary" disabled={submitting}>
              {submitting ? 'Saving…' : thenOrder ? 'Save & Continue to Order' : 'Save Measurement'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
