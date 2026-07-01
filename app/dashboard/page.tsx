'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

const ROLE_REDIRECTS: Record<string, string> = {
  super_admin:    '/dashboard/super-admin',
  hospital_admin: '/dashboard/hospital-admin',
  doctor:         '/dashboard/doctor',
  po_specialist:  '/dashboard/po-specialist',
  patient:        '/dashboard/patient',
};

export default function DashboardIndex() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace('/login'); return; }
    router.replace(ROLE_REDIRECTS[user.role] || '/login');
  }, [loading, user, router]);

  return (
    <div style={{ minHeight: '100vh', background: '#0f2438', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'rgba(240,236,228,0.5)', fontSize: '0.9rem' }}>Redirecting...</div>
    </div>
  );
}
