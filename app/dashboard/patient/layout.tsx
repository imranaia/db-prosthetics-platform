'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { useAuth } from '@/hooks/useAuth';
import { LayoutDashboard, Stethoscope, CalendarDays, UserCircle, ClipboardCheck, ShoppingCart } from 'lucide-react';

const NAV = [
  { label: 'Overview',          href: '/dashboard/patient',              icon: LayoutDashboard },
  { label: 'My Records',        href: '/dashboard/patient/records',      icon: Stethoscope },
  { label: 'Appointments',      href: '/dashboard/patient/appointments', icon: CalendarDays },
  { label: 'My Orders',         href: '/dashboard/patient/orders',       icon: ShoppingCart },
  { label: 'Discharge Records', href: '/dashboard/patient/discharge',    icon: ClipboardCheck },
  { label: 'My Profile',        href: '/dashboard/patient/profile',      icon: UserCircle },
];

const ONBOARDING_PATH = '/dashboard/patient/onboarding';

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [checked, setChecked] = useState(pathname === ONBOARDING_PATH);

  // Same pattern as the must_change_password gate on login: a client-side
  // redirect, not a proxy-level one — checked once per mount, skipped
  // entirely when already on the onboarding page to avoid a redirect loop.
  useEffect(() => {
    if (!user || pathname === ONBOARDING_PATH) { setChecked(true); return; }
    fetch('/api/patient/profile')
      .then(r => r.json())
      .then(data => {
        if (data.patient && !data.patient.declaration_signed_at) {
          window.location.href = ONBOARDING_PATH;
          return;
        }
        setChecked(true);
      })
      .catch(() => setChecked(true));
  }, [user, pathname]);

  if (!checked) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  return (
    <DashboardShell navItems={NAV} brandLabel="Patient Portal" overviewHref="/dashboard/patient">
      {children}
    </DashboardShell>
  );
}
