'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { useAuth } from '@/hooks/useAuth';
import { LayoutDashboard, UserPlus, CalendarPlus, UserCircle } from 'lucide-react';

const NAV = [
  { label: 'Overview',         href: '/dashboard/receptionist',              icon: LayoutDashboard },
  { label: 'Add Patient',      href: '/dashboard/receptionist/patients',     icon: UserPlus },
  { label: 'Book Appointment', href: '/dashboard/receptionist/appointments', icon: CalendarPlus },
  { label: 'My Profile',       href: '/dashboard/receptionist/profile',      icon: UserCircle },
];

const PROFILE_PATH = '/dashboard/receptionist/profile';

export default function ReceptionistLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [checked, setChecked] = useState(pathname === PROFILE_PATH);

  useEffect(() => {
    if (!user || pathname === PROFILE_PATH) { setChecked(true); return; }
    fetch('/api/receptionist/profile')
      .then(r => r.json())
      .then(data => {
        if (data.profile && !data.profile.profile_completed_at) {
          window.location.href = `${PROFILE_PATH}?required=1`;
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
    <DashboardShell navItems={NAV} brandLabel="Receptionist" overviewHref="/dashboard/receptionist">
      {children}
    </DashboardShell>
  );
}
