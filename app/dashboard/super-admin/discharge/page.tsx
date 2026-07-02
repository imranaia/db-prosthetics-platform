'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { ClipboardCheck, ChevronDown, ChevronUp } from 'lucide-react';

interface Patient {
  id: number;
  full_name: string;
}

interface Hospital {
  id: number;
  name: string;
}

interface DischargeForm {
  id: number;
  patient_id: number;
  patient_name: string;
  hospital_id: number | null;
  hospital_name: string | null;
  consultation_id: number | null;
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
  hospital_id: '' as unknown as number | null,
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

function ReadOnlyDischargeView({ form }: { form: DischargeForm }) {
  return (
    <div style={{ padding: '0 4px' }}>
      <SectionHeader number="1" title="Post-Fitting Assessment" />
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

      <SectionHeader number="2" title="Training & Education Provided" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {[
          { key: 'training_donning', label: 'Donning / Doffing' },
          { key: 'training_care', label: 'Care & Maintenance' },
          { key: 'training_skin', label: 'Skin Inspection' },
          { key: 'training_troubleshooting', label: 'Troubleshooting' },
        ].map(item => (
          <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, border: `1px solid ${form[item.key as keyof DischargeForm] ? 'var(--primary)' : 'var(--border-card)'}`, background: form[item.key as keyof DischargeForm] ? 'rgba(27,61,94,0.06)' : 'transparent' }}>
            <span style={{ fontSize: '1rem', color: form[item.key as keyof DischargeForm] ? 'var(--primary)' : 'var(--text-muted)' }}>{form[item.key as keyof DischargeForm] ? '✓' : '○'}</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-body)' }}>{item.label}</span>
          </div>
        ))}
      </div>

      <SectionHeader number="3" title="Discharge Summary" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>Prosthetist / Orthotist Name</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-body)' }}>{form.prosthetist_name || '—'}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>Patient / Caregiver Name</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-body)' }}>{form.patient_signature_name || '—'}</div>
        </div>
      </div>
    </div>
  );
}

export default function DischargePage() {
  const { user, loading } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [dischargeForms, setDischargeForms] = useState<DischargeForm[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [dataLoading, setDataLoading] = useState(true);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!user) { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }
  if (user.role !== 'super_admin') { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }

  const load = () => {
    Promise.all([
      fetch('/api/admin/patients').then(r => r.json()),
      fetch('/api/admin/hospitals').then(r => r.json()),
      fetch('/api/admin/discharge').then(r => r.json()),
    ]).then(([pData, hData, dData]) => {
      setPatients(Array.isArray(pData) ? pData : []);
      setHospitals(Array.isArray(hData) ? hData : []);
      setDischargeForms(dData.forms || []);
      setDataLoading(false);
    }).catch(() => setDataLoading(false));
  };

  useEffect(() => {
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    if (!form.patient_id) { setFormError('Please select a patient.'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/discharge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          patient_id: Number(form.patient_id),
          consultation_id: form.consultation_id ? Number(form.consultation_id) : null,
          hospital_id: form.hospital_id ? Number(form.hospital_id) : null,
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
      {/* Header */}
      <div className="dash-page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: '#1b3d5e18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ClipboardCheck size={22} color="var(--primary)" />
          </div>
          <h1 className="font-display" style={{ fontSize: '1.7rem', fontWeight: 600, color: 'var(--text-head)', margin: 0 }}>Discharge Forms</h1>
        </div>
        <button
          className="skeu-btn-accent"
          onClick={() => { setShowForm(!showForm); setFormError(''); }}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <ClipboardCheck size={16} />
          {showForm ? 'Cancel' : 'New Discharge Form'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="skeu-card" style={{ padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-head)', marginBottom: 20 }}>New Discharge Form</h2>
          <form onSubmit={handleSubmit}>
            {/* Row 1: Patient, Hospital, Consultation */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Patient <span style={{ color: '#dc2626' }}>*</span></label>
                <select
                  className="skeu-select"
                  style={{ width: '100%' }}
                  value={form.patient_id as unknown as string}
                  onChange={e => setForm({ ...form, patient_id: e.target.value as unknown as number })}
                  required
                >
                  <option value="">Select patient…</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Hospital</label>
                <select
                  className="skeu-select"
                  style={{ width: '100%' }}
                  value={form.hospital_id as unknown as string}
                  onChange={e => setForm({ ...form, hospital_id: e.target.value as unknown as number | null })}
                >
                  <option value="">Select hospital…</option>
                  {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
              </div>
              <div>
                <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Consultation ID (optional)</label>
                <input
                  type="number"
                  className="skeu-input"
                  style={{ width: '100%' }}
                  placeholder="Leave blank if none"
                  value={form.consultation_id as unknown as string}
                  onChange={e => setForm({ ...form, consultation_id: e.target.value as unknown as number | null })}
                />
              </div>
            </div>

            <SectionHeader number="1" title="Post-Fitting Assessment" />
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
                      <input
                        className="skeu-input"
                        style={{ margin: 0, border: 'none', background: 'transparent', boxShadow: 'none' }}
                        value={form[row.key] as string}
                        onChange={e => setForm({ ...form, [row.key]: e.target.value })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <SectionHeader number="2" title="Training & Education Provided" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {[
                { key: 'training_donning' as const, label: 'Donning / Doffing' },
                { key: 'training_care' as const, label: 'Care & Maintenance' },
                { key: 'training_skin' as const, label: 'Skin Inspection' },
                { key: 'training_troubleshooting' as const, label: 'Troubleshooting' },
              ].map(item => (
                <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 14px', borderRadius: 8, border: `1px solid ${form[item.key] ? 'var(--primary)' : 'var(--border-card)'}`, background: form[item.key] ? 'rgba(27,61,94,0.06)' : 'transparent' }}>
                  <input
                    type="checkbox"
                    checked={!!form[item.key]}
                    onChange={e => setForm({ ...form, [item.key]: e.target.checked ? 1 : 0 })}
                    style={{ accentColor: 'var(--primary)', width: 16, height: 16 }}
                  />
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-body)' }}>{item.label}</span>
                </label>
              ))}
            </div>

            <SectionHeader number="3" title="Discharge Summary" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
              <div>
                <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Prosthetist / Orthotist Name</label>
                <input type="text" className="skeu-input" style={{ width: '100%' }} placeholder="Full name" value={form.prosthetist_name} onChange={e => setForm({ ...form, prosthetist_name: e.target.value })} />
              </div>
              <div>
                <label className="skeu-label" style={{ display: 'block', marginBottom: 6 }}>Patient / Caregiver Name</label>
                <input type="text" className="skeu-input" style={{ width: '100%' }} placeholder="Full name" value={form.patient_signature_name} onChange={e => setForm({ ...form, patient_signature_name: e.target.value })} />
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>Digital record of name serves as acknowledgement</div>
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
      ) : dischargeForms.length === 0 ? (
        <div className="skeu-card" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <ClipboardCheck size={40} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-head)', marginBottom: 8 }}>No discharge forms yet</div>
          <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Create the first form using the button above.</div>
        </div>
      ) : (
        <div className="skeu-card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(27,61,94,0.04)', borderBottom: '1px solid var(--border-card)' }}>
                {['Patient', 'Hospital', 'Discharge Date', 'Follow-up', 'Prosthetist', 'Date Created', ''].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dischargeForms.map(df => (
                <>
                  <tr key={df.id} style={{ borderBottom: '1px solid var(--border-card)', cursor: 'pointer' }} onClick={() => setExpandedId(expandedId === df.id ? null : df.id)}>
                    <td style={{ padding: '12px 14px', fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-head)' }}>{df.patient_name || '—'}</td>
                    <td style={{ padding: '12px 14px', fontSize: '0.85rem', color: 'var(--text-body)' }}>{df.hospital_name || '—'}</td>
                    <td style={{ padding: '12px 14px', fontSize: '0.85rem', color: 'var(--text-body)' }}>{formatDate(df.discharge_date)}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, background: df.followup_recommended ? '#d1fae5' : '#f3f4f6', color: df.followup_recommended ? '#065f46' : '#374151' }}>
                        {df.followup_recommended ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '0.85rem', color: 'var(--text-body)' }}>{df.prosthetist_name || '—'}</td>
                    <td style={{ padding: '12px 14px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>{formatDate(df.created_at)}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      {expandedId === df.id ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                    </td>
                  </tr>
                  {expandedId === df.id && (
                    <tr key={`${df.id}-expanded`}>
                      <td colSpan={7} style={{ padding: '20px 24px', background: 'rgba(27,61,94,0.02)', borderBottom: '1px solid var(--border-card)' }}>
                        <ReadOnlyDischargeView form={df} />
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
