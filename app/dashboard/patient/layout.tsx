'use client';

import DashboardShell from '@/components/dashboard/DashboardShell';
import { LayoutDashboard, Stethoscope, CalendarDays, UserCircle, ClipboardCheck, ShoppingCart, FileSignature } from 'lucide-react';

const NAV = [
  { label: 'Overview',          href: '/dashboard/patient',              icon: LayoutDashboard },
  { label: 'My Records',        href: '/dashboard/patient/records',      icon: Stethoscope },
  { label: 'Appointments',      href: '/dashboard/patient/appointments', icon: CalendarDays },
  { label: 'My Orders',         href: '/dashboard/patient/orders',       icon: ShoppingCart },
  { label: 'Discharge Records', href: '/dashboard/patient/discharge',    icon: ClipboardCheck },
  { label: 'Consent Forms',     href: '/dashboard/patient/consent',      icon: FileSignature },
  { label: 'My Profile',        href: '/dashboard/patient/profile',      icon: UserCircle },
];

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell navItems={NAV} brandLabel="Patient Portal" overviewHref="/dashboard/patient">
      {children}
    </DashboardShell>
  );
}
