'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { useAuth } from '@/hooks/useAuth';
import { LayoutDashboard, Users, Stethoscope, CalendarDays, UserCircle, UserPlus, ClipboardCheck } from 'lucide-react';

const NAV = [
  { label: 'Overview',       href: '/dashboard/hospital-admin',                 icon: LayoutDashboard },
  { label: 'Patients',       href: '/dashboard/hospital-admin/patients',         icon: Users },
  { label: 'Consultations',  href: '/dashboard/hospital-admin/consultations',    icon: Stethoscope },
  { label: 'Appointments',   href: '/dashboard/hospital-admin/appointments',     icon: CalendarDays },
  { label: 'Discharge Records', href: '/dashboard/hospital-admin/discharge',    icon: ClipboardCheck },
  { label: 'Staff',          href: '/dashboard/hospital-admin/staff',            icon: UserPlus },
  { label: 'My Profile',     href: '/dashboard/hospital-admin/profile',          icon: UserCircle },
];

const PROFILE_PATH = '/dashboard/hospital-admin/profile';

export default function HospitalAdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [checked, setChecked] = useState(pathname === PROFILE_PATH);

  useEffect(() => {
    if (!user || pathname === PROFILE_PATH) { setChecked(true); return; }
    fetch('/api/hospital-admin/profile')
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
    <DashboardShell navItems={NAV} brandLabel="Hospital Admin" overviewHref="/dashboard/hospital-admin">
      {children}
    </DashboardShell>
  );
}
