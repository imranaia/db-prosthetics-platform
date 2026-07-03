'use client';

import { useState } from 'react';
import SignaturePad from './SignaturePad';

export interface ConsentValue {
  patient_guardian_name: string;
  patient_guardian_signature: string | null;
  witness_name: string;
  witness_signature: string | null;
  clinician_name: string;
  clinician_signature: string | null;
}

export const EMPTY_CONSENT: ConsentValue = {
  patient_guardian_name: '',
  patient_guardian_signature: null,
  witness_name: '',
  witness_signature: null,
  clinician_name: '',
  clinician_signature: null,
};

interface Props {
  value: ConsentValue;
  onChange: (v: ConsentValue) => void;
}

// Consent for Fabrication and Fitting of Artificial Limbs, captured at the
// moment a prosthetic order is placed rather than on a standalone page —
// dropped directly into whichever order form triggers it (custom/bespoke
// orders, or catalog orders for a complete device).
export default function ConsentCaptureInline({ value, onChange }: Props) {
  const [showWitness, setShowWitness] = useState(!!(value.witness_name || value.witness_signature));

  return (
    <div style={{ marginBottom: 24, padding: '16px 18px', background: 'rgba(37,79,122,0.05)', borderRadius: 10, border: '1px solid rgba(37,79,122,0.15)' }}>
      <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-head)', marginBottom: 8 }}>
        Consent for Fabrication and Fitting
      </h3>
      <div style={{ fontSize: '0.82rem', color: 'var(--text-body)', lineHeight: 1.6, marginBottom: 16 }}>
        The patient / guardian consents to the fabrication and fitting of this artificial limb by DB Prosthetics and Orthotics Ltd, understanding the process (assessment, casting, fabrication, fitting, training), the risks (skin irritation, discomfort, need for adjustments), and the benefits (improved mobility and independence).
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
        <div>
          <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>
            Patient / Guardian Name <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <input
            type="text" className="skeu-input" style={{ width: '100%', marginBottom: 8 }} placeholder="Full name"
            value={value.patient_guardian_name}
            onChange={e => onChange({ ...value, patient_guardian_name: e.target.value })}
          />
          <SignaturePad value={value.patient_guardian_signature} onChange={sig => onChange({ ...value, patient_guardian_signature: sig })} height={110} />
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>Signature or thumbprint — required</div>
        </div>
        <div>
          <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Prosthetist / Clinician Name</label>
          <input
            type="text" className="skeu-input" style={{ width: '100%', marginBottom: 8 }} placeholder="Full name"
            value={value.clinician_name}
            onChange={e => onChange({ ...value, clinician_name: e.target.value })}
          />
          <SignaturePad value={value.clinician_signature} onChange={sig => onChange({ ...value, clinician_signature: sig })} height={110} />
        </div>
      </div>

      {!showWitness ? (
        <button
          type="button"
          onClick={() => setShowWitness(true)}
          style={{ marginTop: 14, fontSize: '0.8rem', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
        >
          + Add a witness (optional)
        </button>
      ) : (
        <div style={{ marginTop: 16, maxWidth: 320 }}>
          <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Witness Name</label>
          <input
            type="text" className="skeu-input" style={{ width: '100%', marginBottom: 8 }} placeholder="Full name"
            value={value.witness_name}
            onChange={e => onChange({ ...value, witness_name: e.target.value })}
          />
          <SignaturePad value={value.witness_signature} onChange={sig => onChange({ ...value, witness_signature: sig })} height={90} />
        </div>
      )}
    </div>
  );
}
