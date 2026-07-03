'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { ClipboardCheck, ChevronDown, ChevronUp } from 'lucide-react';

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
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20, minWidth: 420 }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
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
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>Prosthetist / Orthotist</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-body)' }}>{form.prosthetist_name || '—'}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>Patient / Caregiver</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-body)' }}>{form.patient_signature_name || '—'}</div>
        </div>
      </div>
    </div>
  );
}

export default function HospitalAdminDischargePage() {
  const { user, loading } = useAuth();
  const [forms, setForms] = useState<DischargeForm[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'hospital_admin') return;
    fetch('/api/hospital-admin/discharge')
      .then(r => r.json())
      .then(data => {
        setForms(data.forms || []);
        setDataLoading(false);
      })
      .catch(() => setDataLoading(false));
  }, [user]);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!user) { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }
  if (user.role !== 'hospital_admin') { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }

  return (
    <div className="dash-content">
      <div className="dash-page-header" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
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

      {dataLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading...</div>
      ) : forms.length === 0 ? (
        <div className="skeu-card" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <ClipboardCheck size={40} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-head)', marginBottom: 8 }}>No discharge records yet</div>
          <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Discharge records for patients at your hospital will appear here.</div>
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
