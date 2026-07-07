'use client';

import SignaturePad from '@/components/forms/SignaturePad';
import SkeuSelect from '@/components/ui/SkeuSelect';
import type { BodyPart } from '@/components/consultation/BodySelector';

export interface MeasurementFormValues {
  amputation_date: string;
  cause_of_limb_loss: string;
  cause_other_detail: string;
  limb_shape_profile: string;
  residual_limb_length_cm: string;
  sound_limb_length_cm: string;
  circumference_joint_line_cm: string;
  circumference_interval_1_cm: string;
  circumference_interval_2_cm: string;
  circumference_interval_3_cm: string;
  circumference_interval_4_cm: string;
  circumference_interval_5_cm: string;
  circumference_interval_6_cm: string;
  circumference_distal_end_cm: string;
  k_level: string;
  lifestyle_goals: string;
  field_notes: string;
  clinician_name: string;
}

export const INITIAL_MEASUREMENT_FORM: MeasurementFormValues = {
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

function SectionHeader({ number, title }: { number: string; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, marginTop: 8 }}>
      <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>{number}</div>
      <h3 className="font-display" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-head)', margin: 0 }}>{title}</h3>
      <div style={{ flex: 1, height: 1, background: 'var(--border-card)' }} />
    </div>
  );
}

interface MeasurementFieldsProps {
  value: MeasurementFormValues;
  onChange: (v: MeasurementFormValues) => void;
  drawing: string | null;
  onDrawingChange: (v: string | null) => void;
  clinicianSignature: string | null;
  onClinicianSignatureChange: (v: string | null) => void;
  bodyParts: BodyPart[];
  // Section numbers are 1-indexed and carry on from whatever section number
  // the caller is already up to (e.g. the consultation form embeds this
  // right after Section 6, so measurement sections continue at 7).
  startSectionNumber?: number;
  // Skips "Medical Overview" and "Amputation & Damage Level" — used when
  // embedding inline in the consultation form itself, which already shows
  // this same medical history and body-area diagram earlier on the same
  // page, so repeating it right below would just be noise.
  skipOverviewSections?: boolean;
}

// Pure, controlled measurement fields — no fetch, no submit button, no
// fixed section numbering. Used both by the standalone measurement page
// (components/consultation/MeasurementForm.tsx) and embedded directly
// inline in the consultation form once "Fit for Prosthetic" is chosen,
// so both places render identical fields from one source of truth.
export default function MeasurementFields({
  value, onChange, drawing, onDrawingChange, clinicianSignature, onClinicianSignatureChange, bodyParts, startSectionNumber = 1, skipOverviewSections = false,
}: MeasurementFieldsProps) {
  const hasBodyAreaSection = bodyParts.length > 0 && !skipOverviewSections;
  const n = startSectionNumber;
  const residualSectionNumber = skipOverviewSections ? n : n + (hasBodyAreaSection ? 2 : 1);
  const set = (patch: Partial<MeasurementFormValues>) => onChange({ ...value, ...patch });

  return (
    <>
      {!skipOverviewSections && (
        <>
          <SectionHeader number={String(n)} title="Medical Overview" />
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: -6, marginBottom: 14 }}>
            Patient, date of birth, and evaluation date are already on record from this consultation.
          </p>
          <div className="form-grid-2" style={{ marginBottom: 16 }}>
            <div>
              <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Amputation Date</label>
              <input type="date" className="skeu-input" style={{ width: '100%' }} value={value.amputation_date} onChange={e => set({ amputation_date: e.target.value })} />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="skeu-label" style={{ display: 'block', marginBottom: 8 }}>Cause of Limb Loss / Disability</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {CAUSE_OPTIONS.map(o => (
                <button
                  key={o.value} type="button"
                  onClick={() => set({ cause_of_limb_loss: o.value })}
                  style={{
                    padding: '8px 16px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                    border: `2px solid ${value.cause_of_limb_loss === o.value ? 'var(--primary)' : 'var(--border-card)'}`,
                    background: value.cause_of_limb_loss === o.value ? 'rgba(27,61,94,0.07)' : 'transparent',
                    color: value.cause_of_limb_loss === o.value ? 'var(--primary)' : 'var(--text-body)',
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
            {value.cause_of_limb_loss === 'other' && (
              <input
                className="skeu-input" style={{ width: '100%', marginTop: 10 }}
                placeholder="Please describe…"
                value={value.cause_other_detail}
                onChange={e => set({ cause_other_detail: e.target.value })}
              />
            )}
          </div>
        </>
      )}

      {hasBodyAreaSection && (
        <>
          <SectionHeader number={String(n + 1)} title="Amputation & Damage Level" />
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

      <SectionHeader number={String(residualSectionNumber)} title="Residual Limb Measurements" />
      <div style={{ marginBottom: 16 }}>
        <label className="skeu-label" style={{ display: 'block', marginBottom: 8 }}>Limb Shape Profile</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {LIMB_SHAPE_OPTIONS.map(o => (
            <button
              key={o.value} type="button"
              onClick={() => set({ limb_shape_profile: o.value })}
              style={{
                padding: '8px 16px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                border: `2px solid ${value.limb_shape_profile === o.value ? 'var(--primary)' : 'var(--border-card)'}`,
                background: value.limb_shape_profile === o.value ? 'rgba(27,61,94,0.07)' : 'transparent',
                color: value.limb_shape_profile === o.value ? 'var(--primary)' : 'var(--text-body)',
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
          <input type="number" step="0.1" className="skeu-input" style={{ width: '100%' }} value={value.residual_limb_length_cm} onChange={e => set({ residual_limb_length_cm: e.target.value })} />
        </div>
        <div>
          <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Sound Limb Length (cm)</label>
          <input type="number" step="0.1" className="skeu-input" style={{ width: '100%' }} value={value.sound_limb_length_cm} onChange={e => set({ sound_limb_length_cm: e.target.value })} />
        </div>
      </div>

      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
        Circumference Timeline (every 5cm down from the joint line)
      </div>
      <div className="form-grid-3" style={{ marginBottom: 20, gap: 14 }}>
        <div>
          <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>At Joint Line (cm)</label>
          <input type="number" step="0.1" className="skeu-input" style={{ width: '100%' }} value={value.circumference_joint_line_cm} onChange={e => set({ circumference_joint_line_cm: e.target.value })} />
        </div>
        {([1, 2, 3, 4, 5, 6] as const).map(i => (
          <div key={i}>
            <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Interval {i} — {i * 5}cm (cm)</label>
            <input
              type="number" step="0.1" className="skeu-input" style={{ width: '100%' }}
              value={value[`circumference_interval_${i}_cm` as keyof MeasurementFormValues]}
              onChange={e => set({ [`circumference_interval_${i}_cm`]: e.target.value } as Partial<MeasurementFormValues>)}
            />
          </div>
        ))}
        <div>
          <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Distal End / Tip (cm)</label>
          <input type="number" step="0.1" className="skeu-input" style={{ width: '100%' }} value={value.circumference_distal_end_cm} onChange={e => set({ circumference_distal_end_cm: e.target.value })} />
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <SignaturePad value={drawing} onChange={onDrawingChange} height={180} label="Draw the Shape of the Affected Leg/Limb" />
      </div>

      <SectionHeader number={String(residualSectionNumber + 1)} title="Functional Mobility Assessment (K-Levels)" />
      <div style={{ marginBottom: 20 }}>
        <SkeuSelect
          value={value.k_level}
          onChange={v => set({ k_level: v })}
          options={K_LEVEL_OPTIONS}
          placeholder="Select K-Level…"
        />
      </div>

      <SectionHeader number={String(residualSectionNumber + 2)} title="Lifestyle Goals & Field Notes" />
      <div style={{ marginBottom: 16 }}>
        <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Primary Daily Goals / Functional Requirements</label>
        <textarea className="skeu-input" rows={3} style={{ width: '100%', resize: 'vertical' }} value={value.lifestyle_goals} onChange={e => set({ lifestyle_goals: e.target.value })} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Additional Field Notes</label>
        <textarea className="skeu-input" rows={3} style={{ width: '100%', resize: 'vertical' }} value={value.field_notes} onChange={e => set({ field_notes: e.target.value })} />
      </div>
      <div className="form-grid-2" style={{ marginBottom: 20 }}>
        <div>
          <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Clinician Name</label>
          <input className="skeu-input" style={{ width: '100%' }} value={value.clinician_name} onChange={e => set({ clinician_name: e.target.value })} />
        </div>
        <div>
          <SignaturePad value={clinicianSignature} onChange={onClinicianSignatureChange} height={80} label="Signature" />
        </div>
      </div>
    </>
  );
}
