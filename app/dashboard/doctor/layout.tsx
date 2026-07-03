'use client';

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

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const switchLink = user?.role === 'super_admin'
    ? { label: 'Switch to Admin Dashboard', href: '/dashboard/super-admin' }
    : undefined;

  return (
    <DashboardShell navItems={NAV} brandLabel="Doctor Portal" overviewHref="/dashboard/doctor" switchLink={switchLink}>
      {children}
    </DashboardShell>
  );
}
