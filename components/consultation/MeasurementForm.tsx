'use client';

import { useEffect, useState } from 'react';
import { Ruler } from 'lucide-react';
import type { BodyPart } from '@/components/consultation/BodySelector';
import MeasurementFields, { INITIAL_MEASUREMENT_FORM, type MeasurementFormValues } from '@/components/consultation/MeasurementFields';

interface ConsultationRef {
  id: number;
  patient_id: number;
  patient_name: string;
  patient_dob: string | null;
  body_parts: string | null;
  assessor_name: string | null;
}

interface MeasurementFormProps {
  consultationId: number;
  thenOrder: boolean;
  onSaved: () => void;
  // Renders without the page-level dash-content wrapper/header padding when
  // embedded directly inside another page's own panel.
  embedded?: boolean;
}

// Standalone wrapper used when navigating directly to the measurement page
// (e.g. from a custom order flow). Fetches the consultation it belongs to,
// then renders the same MeasurementFields the consultation form embeds
// inline, with its own header and submit button.
export default function MeasurementForm({ consultationId, thenOrder, onSaved, embedded }: MeasurementFormProps) {
  const [consultation, setConsultation] = useState<ConsultationRef | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [form, setForm] = useState<MeasurementFormValues>(INITIAL_MEASUREMENT_FORM);
  const [drawing, setDrawing] = useState<string | null>(null);
  const [clinicianSignature, setClinicianSignature] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
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
  }, [consultationId]);

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
        consultation_id: consultationId,
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
    onSaved();
  }

  const content = (
    <>
      {!embedded && (
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
      )}

      {dataLoading ? (
        <div className="skeu-card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
      ) : (
        <div className={embedded ? undefined : 'skeu-card'} style={embedded ? undefined : { padding: 24 }}>
          <form onSubmit={handleSubmit}>
            <MeasurementFields
              value={form}
              onChange={setForm}
              drawing={drawing}
              onDrawingChange={setDrawing}
              clinicianSignature={clinicianSignature}
              onClinicianSignatureChange={setClinicianSignature}
              bodyParts={bodyParts}
            />

            {error && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, fontSize: '0.88rem', marginBottom: 16 }}>{error}</div>}

            <button type="submit" className="skeu-btn-primary" disabled={submitting}>
              {submitting ? 'Saving…' : thenOrder ? 'Save & Continue to Order' : 'Save Measurement'}
            </button>
          </form>
        </div>
      )}
    </>
  );

  if (embedded) return content;
  return <div className="dash-content" style={{ maxWidth: 800, margin: '0 auto' }}>{content}</div>;
}
