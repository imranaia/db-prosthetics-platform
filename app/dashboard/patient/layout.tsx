'use client';

import DashboardShell from '@/components/dashboard/DashboardShell';
import { LayoutDashboard, Stethoscope, CalendarDays, UserCircle } from 'lucide-react';

const NAV = [
  { label: 'Overview',       href: '/dashboard/patient',              icon: LayoutDashboard },
  { label: 'My Records',     href: '/dashboard/patient/records',      icon: Stethoscope },
  { label: 'Appointments',   href: '/dashboard/patient/appointments', icon: CalendarDays },
  { label: 'My Profile',     href: '/dashboard/patient/profile',      icon: UserCircle },
];

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell navItems={NAV} brandLabel="Patient Portal" overviewHref="/dashboard/patient">
      {children}
    </DashboardShell>
  );
}
