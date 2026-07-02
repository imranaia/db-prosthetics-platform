'use client';

import DashboardShell from '@/components/dashboard/DashboardShell';
import { LayoutDashboard, Users, Stethoscope, CalendarDays, UserCircle } from 'lucide-react';

const NAV = [
  { label: 'Overview',      href: '/dashboard/doctor',               icon: LayoutDashboard },
  { label: 'My Patients',   href: '/dashboard/doctor/patients',      icon: Users },
  { label: 'Consultations', href: '/dashboard/doctor/consultations', icon: Stethoscope },
  { label: 'Appointments',  href: '/dashboard/doctor/appointments',  icon: CalendarDays },
  { label: 'My Profile',    href: '/dashboard/doctor/profile',       icon: UserCircle },
];

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell navItems={NAV} brandLabel="Doctor Portal" overviewHref="/dashboard/doctor">
      {children}
    </DashboardShell>
  );
}
