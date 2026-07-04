'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { useAuth } from '@/hooks/useAuth';
import { LayoutDashboard, Users, Stethoscope, CalendarDays, UserCircle, ClipboardCheck, ShoppingCart } from 'lucide-react';

const NAV = [
  { label: 'Overview',      href: '/dashboard/doctor',               icon: LayoutDashboard },
  { label: 'My Patients',   href: '/dashboard/doctor/patients',      icon: Users },
  { label: 'Consultations', href: '/dashboard/doctor/consultations', icon: Stethoscope },
  { label: 'Discharge Records', href: '/dashboard/doctor/discharge', icon: ClipboardCheck },
  { label: 'Appointments',  href: '/dashboard/doctor/appointments',  icon: CalendarDays },
  { label: 'Parts & Orders', href: '/dashboard/doctor/orders',       icon: ShoppingCart },
  { label: 'My Profile',    href: '/dashboard/doctor/profile',       icon: UserCircle },
];

const PROFILE_PATH = '/dashboard/doctor/profile';

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [checked, setChecked] = useState(pathname === PROFILE_PATH);

  // Only a genuine 'doctor' account (created by a hospital admin with a
  // temp password) is gated here — a super_admin operating in Doctor Mode
  // switched in instantly and manages their own admin profile separately.
  useEffect(() => {
    if (!user || user.role !== 'doctor' || pathname === PROFILE_PATH) { setChecked(true); return; }
    fetch('/api/doctor/profile')
      .then(r => r.json())
      .then(data => {
        if (data.doctor && !data.doctor.profile_completed_at) {
          window.location.href = `${PROFILE_PATH}?required=1`;
          return;
        }
        setChecked(true);
      })
      .catch(() => setChecked(true));
  }, [user, pathname]);

  const switchLink = user?.role === 'super_admin'
    ? { label: 'Switch to Admin Dashboard', href: '/dashboard/super-admin' }
    : undefined;

  if (!checked) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  return (
    <DashboardShell navItems={NAV} brandLabel="Doctor Portal" overviewHref="/dashboard/doctor" switchLink={switchLink}>
      {children}
    </DashboardShell>
  );
}
