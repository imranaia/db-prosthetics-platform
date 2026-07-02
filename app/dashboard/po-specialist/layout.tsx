'use client';

import DashboardShell from '@/components/dashboard/DashboardShell';
import { LayoutDashboard, ShoppingCart, UserCircle } from 'lucide-react';

const NAV = [
  { label: 'Overview',   href: '/dashboard/po-specialist',        icon: LayoutDashboard },
  { label: 'Orders',     href: '/dashboard/po-specialist/orders', icon: ShoppingCart },
  { label: 'My Profile', href: '/dashboard/po-specialist/profile', icon: UserCircle },
];

export default function POLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell navItems={NAV} brandLabel="P&O Specialist" overviewHref="/dashboard/po-specialist">
      {children}
    </DashboardShell>
  );
}
