'use client';

import { useState } from 'react';
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
  // Lower limb (general)
  footwear_type: string;
  heel_height_cm: string;
  socket_ap_width_cm: string;
  socket_ml_width_cm: string;
  // Lower limb — Partial Foot
  partial_foot_level: string;
  foot_length_cm: string;
  foot_width_cm: string;
  // Lower limb — AFO / Ankle-Foot Orthosis
  afo_ankle_joint_type: string;
  afo_ankle_joint_other: string;
  afo_functions: string[];
  shoe_modification: string;
  // Upper limb
  segment_length_proximal_cm: string;
  segment_length_distal_cm: string;
  segment_length_terminal_cm: string;
  limb_ap_width_cm: string;
  limb_ml_width_cm: string;
  // Trunk / Spinal
  trunk_circumference_1_cm: string;
  trunk_circumference_2_cm: string;
  trunk_circumference_3_cm: string;
  trunk_circumference_4_cm: string;
  k_level: string;
  lifestyle_goals: string;
  field_notes: string;
  clinician_name: string;
}

// Device Category values (from the consultation/order form's Device Category
// select) that have their own technical-card-derived measurement fields —
// "facial" and "other" don't map to any of the 12 cards in docs/, so they
// fall back to just the general Residual Limb Measurements section.
const CATEGORY_SECTION_TYPES = ['lower_limb', 'upper_limb', 'spinal'];
export function hasCategoryMeasurementSection(category?: string): boolean {
  return !!category && CATEGORY_SECTION_TYPES.includes(category);
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
  footwear_type: '',
  heel_height_cm: '',
  socket_ap_width_cm: '',
  socket_ml_width_cm: '',
  partial_foot_level: '',
  foot_length_cm: '',
  foot_width_cm: '',
  afo_ankle_joint_type: '',
  afo_ankle_joint_other: '',
  afo_functions: [],
  shoe_modification: '',
  segment_length_proximal_cm: '',
  segment_length_distal_cm: '',
  segment_length_terminal_cm: '',
  limb_ap_width_cm: '',
  limb_ml_width_cm: '',
  trunk_circumference_1_cm: '',
  trunk_circumference_2_cm: '',
  trunk_circumference_3_cm: '',
  trunk_circumference_4_cm: '',
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

const FOOTWEAR_OPTIONS = [
  { value: 'barefoot', label: 'Barefoot' },
  { value: 'closed_shoe', label: 'Closed Shoe' },
  { value: 'flip_flop', label: 'Flip Flop' },
  { value: 'open_shoe', label: 'Open Shoe' },
];

const PARTIAL_FOOT_LEVEL_OPTIONS = [
  { value: 'chopart', label: 'Chopart' },
  { value: 'lisfranc', label: 'Lisfranc' },
  { value: 'trans_metatarsal', label: 'Trans-Metatarsal' },
];

const AFO_ANKLE_JOINT_OPTIONS = [
  { value: 'free_motion_scotty', label: 'Free Motion Ankle Joint (Scotty)' },
  { value: 'free_motion_oklahoma', label: 'Free Motion Ankle Joint (Oklahoma)' },
  { value: 'ankle_flexure_tamarack', label: 'Ankle Flexure Joint (Tamarack)' },
  { value: 'stirrup', label: 'Stirrup' },
];

const AFO_FUNCTION_OPTIONS = ['Plantar Flexion Stop', 'Limited Motion', 'Dorsiflexion Assist', 'Double Assist', 'Rigid', 'Free Motion'];

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
  // Device Category chosen earlier in the consultation/order form — drives
  // which technical-card-derived measurement fields show up (see
  // hasCategoryMeasurementSection above).
  category?: string;
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
  value, onChange, drawing, onDrawingChange, clinicianSignature, onClinicianSignatureChange, bodyParts, category, startSectionNumber = 1, skipOverviewSections = false,
}: MeasurementFieldsProps) {
  // Defensive fallback — a draft or record saved before this field existed
  // (sessionStorage draft persistence, or an older measurement row) won't
  // have afo_functions at all, and this is read unconditionally below.
  const afoFunctions = value.afo_functions || [];
  const [showPartialFoot, setShowPartialFoot] = useState(!!value.partial_foot_level);
  const [showAfo, setShowAfo] = useState(!!(value.afo_ankle_joint_type || afoFunctions.length));

  const hasBodyAreaSection = bodyParts.length > 0 && !skipOverviewSections;
  const n = startSectionNumber;
  const residualSectionNumber = skipOverviewSections ? n : n + (hasBodyAreaSection ? 2 : 1);
  const hasCategorySection = hasCategoryMeasurementSection(category);
  const categorySectionNumber = residualSectionNumber + 1;
  const kLevelSectionNumber = residualSectionNumber + (hasCategorySection ? 2 : 1);
  const set = (patch: Partial<MeasurementFormValues>) => onChange({ ...value, ...patch });
  const toggleAfoFunction = (fn: string) => {
    const has = afoFunctions.includes(fn);
    set({ afo_functions: has ? afoFunctions.filter(f => f !== fn) : [...afoFunctions, fn] });
  };

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

      {hasCategorySection && category === 'lower_limb' && (
        <>
          <SectionHeader number={String(categorySectionNumber)} title="Lower Limb Measurements" />
          <div style={{ marginBottom: 16 }}>
            <label className="skeu-label" style={{ display: 'block', marginBottom: 8 }}>Footwear Type</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {FOOTWEAR_OPTIONS.map(o => (
                <button
                  key={o.value} type="button"
                  onClick={() => set({ footwear_type: o.value })}
                  style={{
                    padding: '8px 16px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                    border: `2px solid ${value.footwear_type === o.value ? 'var(--primary)' : 'var(--border-card)'}`,
                    background: value.footwear_type === o.value ? 'rgba(27,61,94,0.07)' : 'transparent',
                    color: value.footwear_type === o.value ? 'var(--primary)' : 'var(--text-body)',
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <div className="form-grid-3" style={{ marginBottom: 20 }}>
            <div>
              <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Heel Height (cm)</label>
              <input type="number" step="0.1" className="skeu-input" style={{ width: '100%' }} value={value.heel_height_cm} onChange={e => set({ heel_height_cm: e.target.value })} />
            </div>
            <div>
              <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Socket Width — A/P (cm)</label>
              <input type="number" step="0.1" className="skeu-input" style={{ width: '100%' }} value={value.socket_ap_width_cm} onChange={e => set({ socket_ap_width_cm: e.target.value })} />
            </div>
            <div>
              <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Socket Width — M/L (cm)</label>
              <input type="number" step="0.1" className="skeu-input" style={{ width: '100%' }} value={value.socket_ml_width_cm} onChange={e => set({ socket_ml_width_cm: e.target.value })} />
            </div>
          </div>

          {!showPartialFoot && (
            <button
              type="button" onClick={() => setShowPartialFoot(true)}
              style={{ display: 'inline-flex', alignItems: 'center', padding: '8px 14px', borderRadius: 8, border: '1.5px dashed rgba(208,140,42,0.4)', background: 'rgba(208,140,42,0.05)', color: 'var(--accent, #d08c2a)', fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer', marginBottom: 16, marginRight: 10 }}
            >
              + Add Partial Foot Details
            </button>
          )}
          {showPartialFoot && (
            <div style={{ marginBottom: 20, padding: '14px 16px', borderRadius: 10, border: '1px solid var(--border-card)' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                Partial Foot
              </div>
              <div style={{ marginBottom: 14 }}>
                <label className="skeu-label" style={{ display: 'block', marginBottom: 8 }}>Amputation Level</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {PARTIAL_FOOT_LEVEL_OPTIONS.map(o => (
                    <button
                      key={o.value} type="button"
                      onClick={() => set({ partial_foot_level: o.value })}
                      style={{
                        padding: '7px 14px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                        border: `2px solid ${value.partial_foot_level === o.value ? 'var(--primary)' : 'var(--border-card)'}`,
                        background: value.partial_foot_level === o.value ? 'rgba(27,61,94,0.07)' : 'transparent',
                        color: value.partial_foot_level === o.value ? 'var(--primary)' : 'var(--text-body)',
                      }}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-grid-2">
                <div>
                  <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Foot Length (cm)</label>
                  <input type="number" step="0.1" className="skeu-input" style={{ width: '100%' }} value={value.foot_length_cm} onChange={e => set({ foot_length_cm: e.target.value })} />
                </div>
                <div>
                  <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Foot Width (cm)</label>
                  <input type="number" step="0.1" className="skeu-input" style={{ width: '100%' }} value={value.foot_width_cm} onChange={e => set({ foot_width_cm: e.target.value })} />
                </div>
              </div>
            </div>
          )}

          {!showAfo && (
            <button
              type="button" onClick={() => setShowAfo(true)}
              style={{ display: 'inline-flex', alignItems: 'center', padding: '8px 14px', borderRadius: 8, border: '1.5px dashed rgba(208,140,42,0.4)', background: 'rgba(208,140,42,0.05)', color: 'var(--accent, #d08c2a)', fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer', marginBottom: 16 }}
            >
              + Add AFO / Ankle-Foot Orthosis Details
            </button>
          )}
          {showAfo && (
            <div style={{ marginBottom: 20, padding: '14px 16px', borderRadius: 10, border: '1px solid var(--border-card)' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                AFO / Ankle-Foot Orthosis
              </div>
              <div style={{ marginBottom: 14 }}>
                <label className="skeu-label" style={{ display: 'block', marginBottom: 8 }}>Ankle Joint Type</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {AFO_ANKLE_JOINT_OPTIONS.map(o => (
                    <button
                      key={o.value} type="button"
                      onClick={() => set({ afo_ankle_joint_type: o.value })}
                      style={{
                        padding: '7px 14px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                        border: `2px solid ${value.afo_ankle_joint_type === o.value ? 'var(--primary)' : 'var(--border-card)'}`,
                        background: value.afo_ankle_joint_type === o.value ? 'rgba(27,61,94,0.07)' : 'transparent',
                        color: value.afo_ankle_joint_type === o.value ? 'var(--primary)' : 'var(--text-body)',
                      }}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
                <input
                  className="skeu-input" style={{ width: '100%', marginTop: 10 }}
                  placeholder="Other ankle joint characteristics…"
                  value={value.afo_ankle_joint_other}
                  onChange={e => set({ afo_ankle_joint_other: e.target.value })}
                />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label className="skeu-label" style={{ display: 'block', marginBottom: 8 }}>Function</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {AFO_FUNCTION_OPTIONS.map(fn => (
                    <button
                      key={fn} type="button"
                      onClick={() => toggleAfoFunction(fn)}
                      style={{
                        padding: '7px 14px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                        border: `2px solid ${afoFunctions.includes(fn) ? 'var(--primary)' : 'var(--border-card)'}`,
                        background: afoFunctions.includes(fn) ? 'rgba(27,61,94,0.07)' : 'transparent',
                        color: afoFunctions.includes(fn) ? 'var(--primary)' : 'var(--text-body)',
                      }}
                    >
                      {fn}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Shoe Modification</label>
                <input className="skeu-input" style={{ width: '100%' }} value={value.shoe_modification} onChange={e => set({ shoe_modification: e.target.value })} />
              </div>
            </div>
          )}
        </>
      )}

      {hasCategorySection && category === 'upper_limb' && (
        <>
          <SectionHeader number={String(categorySectionNumber)} title="Upper Limb Measurements" />
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
            Segment Lengths
          </div>
          <div className="form-grid-3" style={{ marginBottom: 20 }}>
            <div>
              <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Shoulder to Elbow (cm)</label>
              <input type="number" step="0.1" className="skeu-input" style={{ width: '100%' }} value={value.segment_length_proximal_cm} onChange={e => set({ segment_length_proximal_cm: e.target.value })} />
            </div>
            <div>
              <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Elbow to Wrist (cm)</label>
              <input type="number" step="0.1" className="skeu-input" style={{ width: '100%' }} value={value.segment_length_distal_cm} onChange={e => set({ segment_length_distal_cm: e.target.value })} />
            </div>
            <div>
              <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Wrist to Fingertip (cm)</label>
              <input type="number" step="0.1" className="skeu-input" style={{ width: '100%' }} value={value.segment_length_terminal_cm} onChange={e => set({ segment_length_terminal_cm: e.target.value })} />
            </div>
          </div>
          <div className="form-grid-2" style={{ marginBottom: 20 }}>
            <div>
              <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Limb Width — A/P (cm)</label>
              <input type="number" step="0.1" className="skeu-input" style={{ width: '100%' }} value={value.limb_ap_width_cm} onChange={e => set({ limb_ap_width_cm: e.target.value })} />
            </div>
            <div>
              <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Limb Width — M/L (cm)</label>
              <input type="number" step="0.1" className="skeu-input" style={{ width: '100%' }} value={value.limb_ml_width_cm} onChange={e => set({ limb_ml_width_cm: e.target.value })} />
            </div>
          </div>
        </>
      )}

      {hasCategorySection && category === 'spinal' && (
        <>
          <SectionHeader number={String(categorySectionNumber)} title="Trunk Measurements" />
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
            Circumference — Chest to Hip
          </div>
          <div className="form-grid-2" style={{ marginBottom: 20, gap: 14 }}>
            <div>
              <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Chest / Underarm (cm)</label>
              <input type="number" step="0.1" className="skeu-input" style={{ width: '100%' }} value={value.trunk_circumference_1_cm} onChange={e => set({ trunk_circumference_1_cm: e.target.value })} />
            </div>
            <div>
              <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Waist (cm)</label>
              <input type="number" step="0.1" className="skeu-input" style={{ width: '100%' }} value={value.trunk_circumference_2_cm} onChange={e => set({ trunk_circumference_2_cm: e.target.value })} />
            </div>
            <div>
              <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Upper Hip (cm)</label>
              <input type="number" step="0.1" className="skeu-input" style={{ width: '100%' }} value={value.trunk_circumference_3_cm} onChange={e => set({ trunk_circumference_3_cm: e.target.value })} />
            </div>
            <div>
              <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Hip (cm)</label>
              <input type="number" step="0.1" className="skeu-input" style={{ width: '100%' }} value={value.trunk_circumference_4_cm} onChange={e => set({ trunk_circumference_4_cm: e.target.value })} />
            </div>
          </div>
        </>
      )}

      <SectionHeader number={String(kLevelSectionNumber)} title="Functional Mobility Assessment (K-Levels)" />
      <div style={{ marginBottom: 20 }}>
        <SkeuSelect
          value={value.k_level}
          onChange={v => set({ k_level: v })}
          options={K_LEVEL_OPTIONS}
          placeholder="Select K-Level…"
        />
      </div>

      <SectionHeader number={String(kLevelSectionNumber + 1)} title="Lifestyle Goals & Field Notes" />
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
