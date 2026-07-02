'use client';

import DashboardShell from '@/components/dashboard/DashboardShell';
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

export default function HospitalAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell navItems={NAV} brandLabel="Hospital Admin" overviewHref="/dashboard/hospital-admin">
      {children}
    </DashboardShell>
  );
}
