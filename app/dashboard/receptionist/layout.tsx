'use client';

import DashboardShell from '@/components/dashboard/DashboardShell';
import { LayoutDashboard, UserPlus, CalendarPlus } from 'lucide-react';

const NAV = [
  { label: 'Overview',         href: '/dashboard/receptionist',              icon: LayoutDashboard },
  { label: 'Add Patient',      href: '/dashboard/receptionist/patients',     icon: UserPlus },
  { label: 'Book Appointment', href: '/dashboard/receptionist/appointments', icon: CalendarPlus },
];

export default function ReceptionistLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell navItems={NAV} brandLabel="Receptionist" overviewHref="/dashboard/receptionist">
      {children}
    </DashboardShell>
  );
}
