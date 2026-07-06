'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Stethoscope, CalendarDays, Clock, Package } from 'lucide-react';

interface Patient {
  id: number;
  full_name: string;
  phone: string;
  dob: string;
  state: string;
  lga: string;
}

interface Consultation {
  id: number;
  chief_complaint: string;
  recommended_device: string;
  created_at: string;
  hospital_name: string;
  hospital_state: string;
}

interface Appointment {
  id: number;
  type: string;
  status: string;
  notes: string;
  preferred_date: string;
  created_at: string;
  hospital_name: string;
}

interface OrderItem { product_name: string; quantity: number; }
interface Order {
  id: number;
  status: string;
  payment_status: string;
  fulfillment_status: string | null;
  created_at: string;
  items: OrderItem[];
}

const FULFILLMENT_MESSAGE: Record<string, string> = {
  pending: 'Your order has been placed and is awaiting confirmation.',
  confirmed: 'Your order has been confirmed and will begin production soon.',
  manufacturing: 'Your device is being manufactured.',
  dispatched: 'Your device has been dispatched to the hospital.',
  delivered: 'Your device has arrived at the hospital.',
  received_by_doctor: 'Your order is with the doctor — visit the hospital to collect it.',
};

export default function PatientPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      fetch('/api/patient/profile').then(r => r.json()),
      fetch('/api/patient/consultations').then(r => r.json()),
      fetch('/api/patient/appointments').then(r => r.json()),
      fetch('/api/orders').then(r => r.json()),
    ]).then(([profileData, consData, apptData, ordersData]) => {
      if (profileData.patient) setPatient(profileData.patient);
      if (consData.consultations) setConsultations(consData.consultations);
      if (apptData.appointments) setAppointments(apptData.appointments);
      if (Array.isArray(ordersData)) setOrders(ordersData);
      setDataLoading(false);
    }).catch(() => setDataLoading(false));
  }, [user]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      Loading...
    </div>
  );
  if (!user) { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }
  if (user.role !== 'patient') { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }

  const upcomingAppointments = appointments.filter(a => a.status !== 'completed' && a.status !== 'cancelled');
  const nextAppointment = upcomingAppointments[0] ?? null;
  const lastVisit = consultations[0]?.created_at ?? null;
  const recentConsultations = consultations.slice(0, 5);
  const ongoingOrder = orders.find(o => o.fulfillment_status && FULFILLMENT_MESSAGE[o.fulfillment_status]) ?? null;

  function formatDate(dt: string) {
    return new Date(dt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function statusColor(status: string) {
    const colors: Record<string, string> = {
      requested: '#f59e0b',
      scheduled: '#3b82f6',
      completed: '#10b981',
      cancelled: '#ef4444',
    };
    return colors[status] ?? '#9ca3af';
  }

  return (
    <div className="dash-content">
      {/* Header */}
      <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: '#1b3d5e18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
          <Users size={22} color="var(--primary)" />
        </div>
        <div>
          <h1 className="font-display" style={{ fontSize: '1.9rem', fontWeight: 600, color: 'var(--text-head)', lineHeight: 1.2 }}>
            Welcome back, {dataLoading ? '...' : (patient?.full_name ?? 'Patient')}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '6px' }}>
            Patient Portal — DB Prosthetics &amp; Orthotics Ltd
          </p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px', opacity: dataLoading ? 0.5 : 1, transition: 'opacity 0.3s' }}>
        <div className="skeu-card" onClick={() => router.push('/dashboard/patient/records')} style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#1b3d5e18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Stethoscope size={20} color="var(--primary)" />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-head)', lineHeight: 1 }}>
              {dataLoading ? '—' : consultations.length}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>Total Consultations</div>
          </div>
        </div>

        <div className="skeu-card" onClick={() => router.push('/dashboard/patient/appointments')} style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#05966918', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CalendarDays size={20} color="#059669" />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-head)', lineHeight: 1 }}>
              {dataLoading ? '—' : upcomingAppointments.length}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>Upcoming Appointments</div>
          </div>
        </div>

        <div className="skeu-card" onClick={() => router.push('/dashboard/patient/records')} style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#d08c2a18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={20} color="#d08c2a" />
          </div>
          <div>
            <div style={{ fontSize: dataLoading ? '1.75rem' : lastVisit ? '1rem' : '1.75rem', fontWeight: 700, color: 'var(--text-head)', lineHeight: 1 }}>
              {dataLoading ? '—' : lastVisit ? formatDate(lastVisit) : 'No visits yet'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>Last Visit</div>
          </div>
        </div>
      </div>

      {/* Two-column layout — stacks to 1 column under 768px via .chart-grid */}
      <div className="chart-grid" style={{ alignItems: 'start' }}>
        {/* Left: Recent Consultations */}
        <div className="skeu-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-head)' }}>Recent Consultations</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>Your last 5 consultations</div>
            </div>
            <Link href="/dashboard/patient/records" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
              View all
            </Link>
          </div>

          {dataLoading ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>Loading...</div>
          ) : recentConsultations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              No consultations yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentConsultations.map(c => (
                <div key={c.id} style={{ padding: '14px', borderRadius: 10, background: 'var(--bg-base)', border: '1px solid var(--border-card)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-head)', fontSize: '0.875rem' }}>{c.hospital_name ?? 'Hospital'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(c.created_at)}</div>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-body)', marginBottom: 6 }}>{c.chief_complaint || 'No complaint noted'}</div>
                  {c.recommended_device && (
                    <span style={{ background: '#1b3d5e12', color: 'var(--primary)', padding: '2px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 500 }}>
                      {c.recommended_device}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Next Appointment */}
        <div className="skeu-card" style={{ padding: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-head)' }}>Next Appointment</div>
          </div>

          {dataLoading ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>Loading...</div>
          ) : nextAppointment ? (
            <div>
              <div style={{ marginBottom: '10px' }}>
                <span style={{
                  display: 'inline-block',
                  padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600,
                  background: nextAppointment.type === 'home' ? '#05966918' : '#1b3d5e18',
                  color: nextAppointment.type === 'home' ? '#059669' : 'var(--primary)',
                }}>
                  {nextAppointment.type === 'home' ? 'Home Visit' : 'Hospital'}
                </span>
              </div>
              {nextAppointment.hospital_name && (
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-head)', marginBottom: 6 }}>
                  {nextAppointment.hospital_name}
                </div>
              )}
              <div style={{ marginBottom: '12px' }}>
                <span style={{
                  display: 'inline-block',
                  padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600,
                  background: statusColor(nextAppointment.status) + '20',
                  color: statusColor(nextAppointment.status),
                }}>
                  {nextAppointment.status.charAt(0).toUpperCase() + nextAppointment.status.slice(1)}
                </span>
              </div>
              {nextAppointment.preferred_date && (
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                  Preferred: {formatDate(nextAppointment.preferred_date)}
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              No upcoming appointments.
            </div>
          )}

          <Link
            href="/dashboard/patient/appointments"
            className="skeu-btn-primary"
            style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: '16px', padding: '10px' }}
          >
            Book Appointment
          </Link>
        </div>
      </div>

      {!dataLoading && ongoingOrder && (
        <div className="skeu-card" style={{ padding: '20px 24px', marginTop: '20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#2e649918', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Package size={20} color="#2e6499" />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-head)' }}>
              {ongoingOrder.items.map(i => i.product_name).join(', ') || 'Your order'}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 3 }}>
              {FULFILLMENT_MESSAGE[ongoingOrder.fulfillment_status!]}
            </div>
          </div>
          <Link href="/dashboard/patient/orders" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            View Order
          </Link>
        </div>
      )}
    </div>
  );
}
