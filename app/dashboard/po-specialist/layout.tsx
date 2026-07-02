'use client';

import DashboardShell from '@/components/dashboard/DashboardShell';
import { LayoutDashboard, Users, ShoppingCart, CalendarDays, UserCircle } from 'lucide-react';

const NAV = [
  { label: 'Overview',     href: '/dashboard/po-specialist',             icon: LayoutDashboard },
  { label: 'My Patients',  href: '/dashboard/po-specialist/patients',    icon: Users },
  { label: 'Orders',       href: '/dashboard/po-specialist/orders',      icon: ShoppingCart },
  { label: 'Appointments', href: '/dashboard/po-specialist/appointments', icon: CalendarDays },
  { label: 'My Profile',   href: '/dashboard/po-specialist/profile',     icon: UserCircle },
];

export default function POLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell navItems={NAV} brandLabel="P&O Specialist" overviewHref="/dashboard/po-specialist">
      {children}
    </DashboardShell>
  );
}
