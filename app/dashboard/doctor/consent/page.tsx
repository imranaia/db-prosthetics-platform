'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { FileSignature, ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import SignaturePad from '@/components/forms/SignaturePad';

interface Patient { id: number; full_name: string; }

interface ConsentForm {
  id: number;
  patient_name: string | null;
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

const today = () => new Date().toISOString().slice(0, 10);

const INITIAL_FORM = {
  patient_id: '' as unknown as number,
  patient_display_id: '',
  form_date: today(),
  patient_guardian_name: '',
  witness_name: '',
  clinician_name: '',
};

function formatDate(dt: string | null) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

function ConsentDetail({ cf }: { cf: ConsentForm }) {
  return (
    <div style={{ padding: '16px 0' }}>
      <div style={{ marginBottom: 16, padding: '14px 16px', background: 'rgba(37,79,122,0.05)', borderRadius: 8, border: '1px solid rgba(37,79,122,0.12)', fontSize: '0.85rem', color: 'var(--text-body)', lineHeight: 1.6 }}>
        I, the undersigned, hereby consent to the fabrication and fitting of artificial limb(s) (prosthesis) by DB Prosthetics and Orthotics Ltd. I understand the process involves assessment, casting, fabrication, fitting, and training; risks may include skin irritation, discomfort, need for adjustments, or limitations in function; benefits include improved mobility and independence. I consent to photographs (if needed) for clinical records. I have had the opportunity to ask questions and received satisfactory answers.
      </div>
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

export default function DoctorConsentPage() {
  const { user, loading } = useAuth();
  const [forms, setForms] = useState<ConsentForm[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [patientGuardianSignature, setPatientGuardianSignature] = useState<string | null>(null);
  const [witnessSignature, setWitnessSignature] = useState<string | null>(null);
  const [clinicianSignature, setClinicianSignature] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const load = () => {
    Promise.all([
      fetch('/api/doctor/consent').then(r => r.json()),
      fetch('/api/doctor/consultations').then(r => r.json()),
    ]).then(([cData, pData]) => {
      setForms(cData.forms || []);
      setPatients(pData.patients || []);
      setDataLoading(false);
    }).catch(() => setDataLoading(false));
  };

  useEffect(() => {
    if (!user || (user.role !== 'doctor' && !(user.role === 'super_admin' && user.hasDoctorProfile))) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!user) { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }
  if (user.role !== 'doctor' && !(user.role === 'super_admin' && user.hasDoctorProfile)) { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }

  function resetForm() {
    setForm({ ...INITIAL_FORM, form_date: today() });
    setPatientGuardianSignature(null);
    setWitnessSignature(null);
    setClinicianSignature(null);
    setFormError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    if (!form.patient_id) { setFormError('Please select a patient.'); return; }
    if (!patientGuardianSignature) { setFormError('Patient / Guardian signature is required.'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/doctor/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          patient_id: Number(form.patient_id),
          patient_guardian_signature: patientGuardianSignature,
          witness_signature: witnessSignature,
          clinician_signature: clinicianSignature,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error || 'Failed to save.'); setSubmitting(false); return; }
      resetForm();
      setShowForm(false);
      setDataLoading(true);
      load();
    } catch {
      setFormError('Network error. Please try again.');
    }
    setSubmitting(false);
  }

  return (
    <div className="dash-content">
      <div className="dash-page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
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
        <button
          className="skeu-btn-accent"
          onClick={() => { setShowForm(!showForm); setFormError(''); }}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          {showForm ? <><X size={16} />Cancel</> : <><Plus size={16} />New Consent Form</>}
        </button>
      </div>

      {showForm && (
        <div className="skeu-card" style={{ padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-head)', marginBottom: 6 }}>Consent Form for Fabrication and Fitting of Artificial Limbs</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 20 }}>DB Prosthetics and Orthotics Ltd</p>
          <form onSubmit={handleSubmit}>
            <div className="form-grid-2" style={{ marginBottom: 18 }}>
              <div>
                <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Patient <span style={{ color: '#dc2626' }}>*</span></label>
                <select className="skeu-select" style={{ width: '100%' }} value={form.patient_id as unknown as string}
                  onChange={e => setForm({ ...form, patient_id: e.target.value as unknown as number })} required>
                  <option value="">Select patient…</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Patient ID</label>
                <input type="text" className="skeu-input" style={{ width: '100%' }} value={form.patient_display_id} onChange={e => setForm({ ...form, patient_display_id: e.target.value })} />
              </div>
            </div>

            <div className="form-grid-2" style={{ marginBottom: 20 }}>
              <div>
                <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Date</label>
                <input type="date" className="skeu-input" style={{ width: '100%' }} value={form.form_date} onChange={e => setForm({ ...form, form_date: e.target.value })} />
              </div>
            </div>

            <div style={{ marginBottom: 20, padding: '14px 16px', background: 'rgba(37,79,122,0.05)', borderRadius: 8, border: '1px solid rgba(37,79,122,0.12)', fontSize: '0.85rem', color: 'var(--text-body)', lineHeight: 1.7 }}>
              I, the undersigned, hereby consent to the fabrication and fitting of artificial limb(s) (prosthesis) by DB Prosthetics and Orthotics Ltd. I understand:
              <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
                <li>The process involves assessment, casting, fabrication, fitting, and training.</li>
                <li>Risks may include skin irritation, discomfort, need for adjustments, or limitations in function.</li>
                <li>Benefits include improved mobility and independence.</li>
                <li>I agree to follow instructions for care, use, and follow-up visits.</li>
                <li>I consent to photographs (if needed) for clinical records (optional).</li>
              </ul>
              I have had the opportunity to ask questions and received satisfactory answers.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18, marginBottom: 24 }}>
              <div>
                <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Patient / Guardian Name <span style={{ color: '#dc2626' }}>*</span></label>
                <input type="text" className="skeu-input" style={{ width: '100%', marginBottom: 8 }} placeholder="Full name" value={form.patient_guardian_name} onChange={e => setForm({ ...form, patient_guardian_name: e.target.value })} />
                <SignaturePad value={patientGuardianSignature} onChange={setPatientGuardianSignature} height={110} />
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>Signature or thumbprint</div>
              </div>
              <div>
                <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Witness Name (if applicable)</label>
                <input type="text" className="skeu-input" style={{ width: '100%', marginBottom: 8 }} placeholder="Full name" value={form.witness_name} onChange={e => setForm({ ...form, witness_name: e.target.value })} />
                <SignaturePad value={witnessSignature} onChange={setWitnessSignature} height={110} />
              </div>
              <div>
                <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Prosthetist / Clinician Name</label>
                <input type="text" className="skeu-input" style={{ width: '100%', marginBottom: 8 }} placeholder="Full name" value={form.clinician_name} onChange={e => setForm({ ...form, clinician_name: e.target.value })} />
                <SignaturePad value={clinicianSignature} onChange={setClinicianSignature} height={110} />
              </div>
            </div>

            {formError && (
              <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, fontSize: '0.88rem', marginBottom: 16 }}>
                {formError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" className="skeu-btn-primary" disabled={submitting} style={{ flex: 1 }}>
                {submitting ? 'Saving...' : 'Save Consent Form'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid var(--border-card)', background: 'transparent', cursor: 'pointer', fontWeight: 600, color: 'var(--text-body)' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {dataLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading...</div>
      ) : forms.length === 0 ? (
        <div className="skeu-card" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <FileSignature size={40} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-head)', marginBottom: 8 }}>No consent forms yet</div>
          <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Create the first consent form using the button above.</div>
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
                    {cf.patient_name || 'Unknown Patient'} — {formatDate(cf.form_date)}
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
