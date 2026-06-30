'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const ROLE_REDIRECTS: Record<string, string> = {
  super_admin:    '/dashboard/super-admin',
  hospital_admin: '/dashboard/hospital-admin',
  doctor:         '/dashboard/doctor',
  po_specialist:  '/dashboard/po-specialist',
  patient:        '/dashboard/patient',
};

export default function DashboardIndex() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') { router.replace('/login'); return; }
    const role = (session?.user as any)?.role as string;
    router.replace(ROLE_REDIRECTS[role] || '/login');
  }, [status, session, router]);

  return (
    <div style={{ minHeight: '100vh', background: '#0f2438', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'rgba(240,236,228,0.5)', fontSize: '0.9rem' }}>Redirecting...</div>
    </div>
  );
}
