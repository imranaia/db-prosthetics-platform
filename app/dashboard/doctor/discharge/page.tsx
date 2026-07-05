'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { ClipboardCheck, ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import SignaturePad from '@/components/forms/SignaturePad';

interface Patient { id: number; full_name: string; }
interface Consultation { id: number; patient_name: string; chief_complaint: string | null; created_at: string; }

interface DischargeForm {
  id: number;
  patient_name: string | null;
  hospital_name: string | null;
  device_fit: string | null;
  alignment_function: string | null;
  skin_condition: string | null;
  pain_discomfort: string | null;
  gait_mobility: string | null;
  patient_satisfaction: string | null;
  training_donning: number;
  training_care: number;
  training_skin: number;
  training_troubleshooting: number;
  discharge_date: string | null;
  discharge_reason: string | null;
  followup_recommended: number;
  next_appointment: string | null;
  prosthetist_name: string | null;
  patient_signature_name: string | null;
  prosthetist_signature: string | null;
  patient_signature: string | null;
  created_at: string;
}

const ASSESSMENT_ROWS = [
  { key: 'device_fit',           label: 'Device Fit & Comfort' },
  { key: 'alignment_function',   label: 'Alignment & Function' },
  { key: 'skin_condition',       label: 'Skin Condition / Pressure Areas' },
  { key: 'pain_discomfort',      label: 'Pain / Discomfort' },
  { key: 'gait_mobility',        label: 'Gait / Mobility Improvement' },
  { key: 'patient_satisfaction', label: 'Patient Satisfaction' },
] as const;

const INITIAL_FORM = {
  patient_id: '' as unknown as number,
  consultation_id: '' as unknown as number | null,
  device_fit: '',
  alignment_function: '',
  skin_condition: '',
  pain_discomfort: '',
  gait_mobility: '',
  patient_satisfaction: '',
  training_donning: 0,
  training_care: 0,
  training_skin: 0,
  training_troubleshooting: 0,
  discharge_date: '',
  discharge_reason: '',
  followup_recommended: 0,
  next_appointment: '',
  prosthetist_name: '',
  patient_signature_name: '',
  prosthetist_signature: null as string | null,
  patient_signature: null as string | null,
};

function SectionHeader({ number, title }: { number: string; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, marginTop: 8 }}>
      <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>{number}</div>
      <h3 className="font-display" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-head)', margin: 0 }}>{title}</h3>
      <div style={{ flex: 1, height: 1, background: 'var(--border-card)' }} />
    </div>
  );
}

function formatDate(dt: string | null) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

function DischargeDetail({ form }: { form: DischargeForm }) {
  return (
    <div style={{ padding: '16px 0' }}>
      <SectionHeader number="1" title="Post-Fitting Assessment" />
      <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
        <thead>
          <tr style={{ background: 'rgba(27,61,94,0.06)' }}>
            <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', border: '1px solid var(--border-card)', width: '40%' }}>Aspect</th>
            <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', border: '1px solid var(--border-card)' }}>Status / Notes</th>
          </tr>
        </thead>
        <tbody>
          {ASSESSMENT_ROWS.map(row => (
            <tr key={row.key}>
              <td style={{ padding: '8px 12px', fontSize: '0.85rem', border: '1px solid var(--border-card)', fontWeight: 500, color: 'var(--text-body)', background: 'rgba(27,61,94,0.02)' }}>{row.label}</td>
              <td style={{ padding: '8px 12px', border: '1px solid var(--border-card)', fontSize: '0.85rem', color: 'var(--text-body)' }}>{form[row.key] || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      <SectionHeader number="2" title="Training & Education Provided" />
      <div className="form-grid-2" style={{ gap: 10, marginBottom: 20 }}>
        {[
          { key: 'training_donning' as const, label: 'Donning / Doffing' },
          { key: 'training_care' as const, label: 'Care & Maintenance' },
          { key: 'training_skin' as const, label: 'Skin Inspection' },
          { key: 'training_troubleshooting' as const, label: 'Troubleshooting' },
        ].map(item => (
          <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, border: `1px solid ${form[item.key] ? 'var(--primary)' : 'var(--border-card)'}`, background: form[item.key] ? 'rgba(27,61,94,0.06)' : 'transparent' }}>
            <span style={{ fontSize: '1rem', color: form[item.key] ? 'var(--primary)' : 'var(--text-muted)' }}>{form[item.key] ? '✓' : '○'}</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-body)' }}>{item.label}</span>
          </div>
        ))}
      </div>

      <SectionHeader number="3" title="Discharge Summary" />
      <div className="form-grid-2" style={{ gap: 14, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>Discharge Date</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-body)' }}>{formatDate(form.discharge_date)}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>Reason for Discharge</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-body)' }}>{form.discharge_reason || '—'}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>Follow-up Recommended</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-body)' }}>{form.followup_recommended ? 'Yes' : 'No'}</div>
        </div>
        {form.followup_recommended ? (
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>Next Appointment</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-body)' }}>{formatDate(form.next_appointment)}</div>
          </div>
        ) : null}
      </div>

      <SectionHeader number="4" title="Signatures" />
      <div className="form-grid-2" style={{ gap: 14 }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>Prosthetist / Orthotist — {form.prosthetist_name || '—'}</div>
          <SignaturePad value={form.prosthetist_signature} disabled height={90} />
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>Patient / Caregiver — {form.patient_signature_name || '—'}</div>
          <SignaturePad value={form.patient_signature} disabled height={90} />
        </div>
      </div>
    </div>
  );
}

export default function DoctorDischargePage() {
  const { user, loading } = useAuth();
  const [forms, setForms] = useState<DischargeForm[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const load = () => {
    Promise.all([
      fetch('/api/doctor/discharge').then(r => r.json()),
      fetch('/api/doctor/consultations').then(r => r.json()),
    ]).then(([dData, cData]) => {
      setForms(dData.forms || []);
      setPatients(cData.patients || []);
      setConsultations(cData.consultations || []);
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

  // Filter consultations by selected patient
  const patientConsultations = form.patient_id
    ? consultations.filter(c => {
        const p = patients.find(p => p.id === Number(form.patient_id));
        return p && c.patient_name === p.full_name;
      })
    : [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    if (!form.patient_id) { setFormError('Please select a patient.'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/doctor/discharge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          patient_id: Number(form.patient_id),
          consultation_id: form.consultation_id ? Number(form.consultation_id) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error || 'Failed to save.'); setSubmitting(false); return; }
      setForm({ ...INITIAL_FORM });
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
            <ClipboardCheck size={22} color="var(--primary)" />
          </div>
          <div>
            <h1 className="font-display" style={{ fontSize: '1.7rem', fontWeight: 600, color: 'var(--text-head)', margin: 0 }}>Discharge Records</h1>
            {!dataLoading && (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 2 }}>{forms.length} record{forms.length !== 1 ? 's' : ''}</div>
            )}
          </div>
        </div>
        <button
          className="skeu-btn-accent"
          onClick={() => { setShowForm(!showForm); setFormError(''); }}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          {showForm ? <><X size={16} />Cancel</> : <><Plus size={16} />New Discharge Form</>}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="skeu-card" style={{ padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-head)', marginBottom: 20 }}>New Discharge Form</h2>
          <form onSubmit={handleSubmit}>
            {/* Patient + Consultation */}
            <div className="form-grid-2" style={{ gap: 16, marginBottom: 20 }}>
              <div>
                <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Patient <span style={{ color: '#dc2626' }}>*</span></label>
                <select className="skeu-select" style={{ width: '100%' }} value={form.patient_id as unknown as string}
                  onChange={e => setForm({ ...form, patient_id: e.target.value as unknown as number, consultation_id: '' as unknown as null })} required>
                  <option value="">Select patient…</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Link to Consultation (optional)</label>
                <select className="skeu-select" style={{ width: '100%' }} value={form.consultation_id as unknown as string}
                  onChange={e => setForm({ ...form, consultation_id: e.target.value as unknown as number | null })}>
                  <option value="">None</option>
                  {patientConsultations.map(c => (
                    <option key={c.id} value={c.id}>
                      #{c.id} — {c.chief_complaint ? c.chief_complaint.slice(0, 40) : formatDate(c.created_at)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <SectionHeader number="1" title="Post-Fitting Assessment" />
            <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
              <thead>
                <tr style={{ background: 'rgba(27,61,94,0.06)' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', border: '1px solid var(--border-card)', width: '40%' }}>Aspect</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', border: '1px solid var(--border-card)' }}>Status / Notes</th>
                </tr>
              </thead>
              <tbody>
                {ASSESSMENT_ROWS.map(row => (
                  <tr key={row.key}>
                    <td style={{ padding: '8px 12px', fontSize: '0.85rem', border: '1px solid var(--border-card)', fontWeight: 500, color: 'var(--text-body)', background: 'rgba(27,61,94,0.02)' }}>{row.label}</td>
                    <td style={{ padding: '4px 8px', border: '1px solid var(--border-card)' }}>
                      <input className="skeu-input" style={{ margin: 0, border: 'none', background: 'transparent', boxShadow: 'none' }}
                        value={form[row.key] as string}
                        onChange={e => setForm({ ...form, [row.key]: e.target.value })} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>

            <SectionHeader number="2" title="Training & Education Provided" />
            <div className="form-grid-2" style={{ gap: 10, marginBottom: 20 }}>
              {[
                { key: 'training_donning' as const, label: 'Donning / Doffing' },
                { key: 'training_care' as const, label: 'Care & Maintenance' },
                { key: 'training_skin' as const, label: 'Skin Inspection' },
                { key: 'training_troubleshooting' as const, label: 'Troubleshooting' },
              ].map(item => (
                <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 14px', borderRadius: 8, border: `1px solid ${form[item.key] ? 'var(--primary)' : 'var(--border-card)'}`, background: form[item.key] ? 'rgba(27,61,94,0.06)' : 'transparent' }}>
                  <input type="checkbox" checked={!!form[item.key]} onChange={e => setForm({ ...form, [item.key]: e.target.checked ? 1 : 0 })} style={{ accentColor: 'var(--primary)', width: 16, height: 16 }} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-body)' }}>{item.label}</span>
                </label>
              ))}
            </div>

            <SectionHeader number="3" title="Discharge Summary" />
            <div className="form-grid-2" style={{ gap: 14, marginBottom: 20 }}>
              <div>
                <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Discharge Date</label>
                <input type="date" className="skeu-input" style={{ width: '100%' }} value={form.discharge_date} onChange={e => setForm({ ...form, discharge_date: e.target.value })} />
              </div>
              <div>
                <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Reason for Discharge</label>
                <input type="text" className="skeu-input" style={{ width: '100%' }} placeholder="e.g. Patient goals achieved" value={form.discharge_reason} onChange={e => setForm({ ...form, discharge_reason: e.target.value })} />
              </div>
              <div>
                <label className="skeu-label" style={{ display: 'block', marginBottom: 8 }}>Follow-up Recommended</label>
                <div style={{ display: 'flex', gap: 12 }}>
                  {[{ val: 1, label: 'Yes' }, { val: 0, label: 'No' }].map(opt => (
                    <button key={opt.val} type="button"
                      onClick={() => setForm({ ...form, followup_recommended: opt.val })}
                      style={{ flex: 1, padding: '10px', borderRadius: 8, border: `2px solid ${form.followup_recommended === opt.val ? 'var(--primary)' : 'var(--border-card)'}`, background: form.followup_recommended === opt.val ? 'rgba(27,61,94,0.07)' : 'transparent', cursor: 'pointer', fontWeight: 600, color: form.followup_recommended === opt.val ? 'var(--primary)' : 'var(--text-body)', fontSize: '0.9rem' }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              {form.followup_recommended ? (
                <div>
                  <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Next Appointment Date</label>
                  <input type="date" className="skeu-input" style={{ width: '100%' }} value={form.next_appointment} onChange={e => setForm({ ...form, next_appointment: e.target.value })} />
                </div>
              ) : <div />}
            </div>

            <SectionHeader number="4" title="Signatures" />
            <div className="form-grid-2" style={{ gap: 14, marginBottom: 24 }}>
              <div>
                <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Prosthetist / Orthotist Name</label>
                <input type="text" className="skeu-input" style={{ width: '100%', marginBottom: 8 }} placeholder="Full name" value={form.prosthetist_name} onChange={e => setForm({ ...form, prosthetist_name: e.target.value })} />
                <SignaturePad value={form.prosthetist_signature} onChange={sig => setForm({ ...form, prosthetist_signature: sig })} height={110} />
              </div>
              <div>
                <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Patient / Caregiver Name</label>
                <input type="text" className="skeu-input" style={{ width: '100%', marginBottom: 8 }} placeholder="Full name" value={form.patient_signature_name} onChange={e => setForm({ ...form, patient_signature_name: e.target.value })} />
                <SignaturePad value={form.patient_signature} onChange={sig => setForm({ ...form, patient_signature: sig })} height={110} />
              </div>
            </div>

            {formError && (
              <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, fontSize: '0.88rem', marginBottom: 16 }}>
                {formError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" className="skeu-btn-primary" disabled={submitting} style={{ flex: 1 }}>
                {submitting ? 'Saving...' : 'Save Discharge Form'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setFormError(''); setForm({ ...INITIAL_FORM }); }}
                style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid var(--border-card)', background: 'transparent', cursor: 'pointer', fontWeight: 600, color: 'var(--text-body)' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {dataLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading...</div>
      ) : forms.length === 0 ? (
        <div className="skeu-card" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <ClipboardCheck size={40} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-head)', marginBottom: 8 }}>No discharge records yet</div>
          <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Create the first discharge form using the button above.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {forms.map(df => (
            <div key={df.id} className="skeu-card" style={{ padding: '18px 20px' }}>
              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                onClick={() => setExpandedId(expandedId === df.id ? null : df.id)}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-head)' }}>
                      {df.patient_name || 'Unknown Patient'} — {formatDate(df.discharge_date)}
                    </span>
                    {df.followup_recommended ? (
                      <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600, background: '#dbeafe', color: '#1d4ed8' }}>Follow-up recommended</span>
                    ) : null}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {df.hospital_name || 'DB Prosthetics'} &middot; Prosthetist: {df.prosthetist_name || '—'}
                  </div>
                </div>
                <div style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                  {expandedId === df.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </div>

              {expandedId === df.id && (
                <div style={{ marginTop: 16, borderTop: '1px solid var(--border-card)', paddingTop: 4 }}>
                  <DischargeDetail form={df} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
