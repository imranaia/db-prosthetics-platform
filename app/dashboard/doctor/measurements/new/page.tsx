'use client';

import { useAuth } from '@/hooks/useAuth';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import MeasurementForm from '@/components/consultation/MeasurementForm';

export default function NewMeasurementPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
      <NewMeasurementPageInner />
    </Suspense>
  );
}

function NewMeasurementPageInner() {
  const { user, loading } = useAuth();
  const searchParams = useSearchParams();
  const consultationId = searchParams.get('consultation_id');
  const thenOrder = searchParams.get('then_order') === '1';

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!user) { if (typeof window !== 'undefined') window.location.href = '/login'; return null; }
  if (user.role !== 'doctor' && user.role !== 'po_specialist' && !(user.role === 'super_admin' && user.hasDoctorProfile)) {
    if (typeof window !== 'undefined') window.location.href = '/login';
    return null;
  }
  if (!consultationId) {
    return <div className="dash-content"><div className="skeu-card" style={{ padding: 24 }}>No consultation specified.</div></div>;
  }

  return (
    <MeasurementForm
      consultationId={parseInt(consultationId)}
      thenOrder={thenOrder}
      onSaved={() => {
        if (thenOrder) window.location.href = `/dashboard/doctor/orders?from_consultation=${consultationId}&tab=custom`;
        else window.location.href = '/dashboard/doctor/consultations';
      }}
    />
  );
}
