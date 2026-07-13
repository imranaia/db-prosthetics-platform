'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Stethoscope, Package, FileText, LogOut as DischargeIcon } from 'lucide-react';

interface PatientInfo {
  id: number; full_name: string; patient_unique_id: string | null; phone: string | null;
  dob: string | null; state: string | null; lga: string | null; address: string | null;
  amputation_date: string | null; amputation_level: string | null; amputation_side: string | null;
}
interface ConsultationRow {
  id: number; created_at: string; conducted_by_role: string; assessor_name: string | null;
  chief_complaint: string | null; category: string | null; device_subtype: string | null;
  fit_for_prosthetic: 'fit' | 'not_fit' | null; recommended_device: string | null;
  consultation_type: string; hospital_name: string | null;
}
interface OrderRow {
  id: number; created_at: string; status: string; fulfillment_status: string; payment_status: string;
  created_by_role: string; total_amount: number; items: Array<{ product_name: string; quantity: number }>;
}
interface CustomOrderRow {
  id: number; created_at: string; category: string | null; description: string; status: string; created_by_role: string;
}
interface DischargeRow {
  id: number; created_at: string; discharge_date: string | null; discharge_reason: string | null;
  device_fit: string | null; patient_satisfaction: string | null; prosthetist_name: string | null;
  followup_recommended: number; next_appointment: string | null;
}

function formatDate(dt: string | null) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="skeu-card" style={{ padding: 20, marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        {icon}
        <h2 className="font-display" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-head)', margin: 0 }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '8px 0' }}>{text}</div>;
}

export default function PatientHistoryPage() {
  const { user, loading } = useAuth();
  const params = useParams();
  const patientId = params?.id as string;
  const [data, setData] = useState<{
    patient: PatientInfo; consultations: ConsultationRow[]; orders: OrderRow[];
    customOrders: CustomOrderRow[]; dischargeForms: DischargeRow[];
  } | null>(null);
  const [error, setError] = useState('');
  const [dataLoading, setDataLoading] = useState(true);

  const basePath = user?.role === 'po_specialist' ? '/dashboard/po-specialist/patients' : '/dashboard/doctor/patients';

  useEffect(() => {
    if (!user || !patientId) return;
    fetch(`/api/doctor/patients/${patientId}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setData(d);
        setDataLoading(false);
      })
      .catch(() => { setError('Failed to load patient history.'); setDataLoading(false); });
  }, [user, patientId]);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!user) { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }
  if (user.role !== 'doctor' && user.role !== 'po_specialist' && !(user.role === 'super_admin' && user.hasDoctorProfile)) {
    if (typeof window !== 'undefined') window.location.href = '/login';
    return null;
  }

  return (
    <div className="dash-content">
      <Link href={basePath} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: 16 }}>
        <ArrowLeft size={15} /> Back to My Patients
      </Link>

      {dataLoading ? (
        <div className="skeu-card" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading patient history...</div>
      ) : error ? (
        <div className="skeu-card" style={{ textAlign: 'center', padding: '60px', color: '#b91c1c' }}>{error}</div>
      ) : data ? (
        <>
          <div className="dash-page-header" style={{ marginBottom: 20 }}>
            <h1 className="font-display" style={{ fontSize: '1.7rem', fontWeight: 600, color: 'var(--text-head)', margin: 0 }}>{data.patient.full_name}</h1>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 6, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{data.patient.patient_unique_id || '—'}</span>
              <span>{data.patient.phone || '—'}</span>
              <span>{formatDate(data.patient.dob)}</span>
              <span>{[data.patient.lga, data.patient.state].filter(Boolean).join(', ') || '—'}</span>
              {data.patient.amputation_level && (
                <span>{data.patient.amputation_level}{data.patient.amputation_side ? ` (${data.patient.amputation_side})` : ''}</span>
              )}
            </div>
          </div>

          <Card title={`Consultations (${data.consultations.length})`} icon={<Stethoscope size={18} color="var(--primary)" />}>
            {data.consultations.length === 0 ? <Empty text="No consultations recorded." /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data.consultations.map(c => (
                  <div key={c.id} style={{ padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border-card)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-head)' }}>
                        {c.consultation_type === 'follow_up' ? 'Follow-up' : 'New'} consultation
                        {c.fit_for_prosthetic && (
                          <span style={{
                            marginLeft: 8, padding: '2px 8px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700,
                            background: c.fit_for_prosthetic === 'fit' ? '#d1fae5' : '#fee2e2',
                            color: c.fit_for_prosthetic === 'fit' ? '#065f46' : '#b91c1c',
                          }}>
                            {c.fit_for_prosthetic === 'fit' ? 'Fit' : 'Not Fit'}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{formatDate(c.created_at)}</div>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      By {c.assessor_name || (c.conducted_by_role === 'po_specialist' ? 'P&O Specialist' : 'Doctor')}
                      {c.hospital_name ? ` · ${c.hospital_name}` : ' · Personal'}
                      {c.category ? ` · ${c.category.replace('_', ' ')}` : ''}
                      {c.device_subtype ? ` (${c.device_subtype.replace(/_/g, ' ')})` : ''}
                    </div>
                    {c.chief_complaint && (
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-body)', marginTop: 6 }}>{c.chief_complaint}</div>
                    )}
                    {c.recommended_device && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>Recommended: {c.recommended_device}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title={`Orders (${data.orders.length})`} icon={<Package size={18} color="var(--primary)" />}>
            {data.orders.length === 0 ? <Empty text="No orders recorded." /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data.orders.map(o => (
                  <div key={o.id} style={{ padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border-card)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-head)' }}>
                        {o.items.map(i => `${i.product_name} ×${i.quantity}`).join(', ') || `Order #${o.id}`}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{formatDate(o.created_at)}</div>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span>Status: {o.status.replace('_', ' ')}</span>
                      <span>· Fulfillment: {o.fulfillment_status.replace('_', ' ')}</span>
                      <span>· {o.payment_status === 'paid' ? 'Paid' : 'Unpaid'}</span>
                      <span>· ₦{(o.total_amount / 100).toLocaleString('en-NG')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {data.customOrders.length > 0 && (
            <Card title={`Custom Orders (${data.customOrders.length})`} icon={<Package size={18} color="var(--primary)" />}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data.customOrders.map(co => (
                  <div key={co.id} style={{ padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border-card)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-head)' }}>
                        {co.category ? co.category.replace('_', ' ') : 'Custom order'} · {co.status.replace('_', ' ')}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{formatDate(co.created_at)}</div>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-body)', marginTop: 6 }}>{co.description}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card title={`Discharge Records (${data.dischargeForms.length})`} icon={<DischargeIcon size={18} color="var(--primary)" />}>
            {data.dischargeForms.length === 0 ? <Empty text="No discharge records." /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data.dischargeForms.map(d => (
                  <div key={d.id} style={{ padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border-card)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-head)' }}>
                        Device fit: {d.device_fit || '—'}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{formatDate(d.discharge_date || d.created_at)}</div>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      {d.discharge_reason}{d.prosthetist_name ? ` · By ${d.prosthetist_name}` : ''}
                    </div>
                    {!!d.followup_recommended && (
                      <div style={{ fontSize: '0.8rem', color: '#b45309', marginTop: 4 }}>
                        Follow-up recommended{d.next_appointment ? `: ${formatDate(d.next_appointment)}` : ''}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      ) : null}
    </div>
  );
}
