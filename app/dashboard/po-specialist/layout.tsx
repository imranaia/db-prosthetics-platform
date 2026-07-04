'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { useAuth } from '@/hooks/useAuth';
import { LayoutDashboard, ShoppingCart, UserCircle } from 'lucide-react';

const NAV = [
  { label: 'Overview',   href: '/dashboard/po-specialist',        icon: LayoutDashboard },
  { label: 'Orders',     href: '/dashboard/po-specialist/orders', icon: ShoppingCart },
  { label: 'My Profile', href: '/dashboard/po-specialist/profile', icon: UserCircle },
];

const PROFILE_PATH = '/dashboard/po-specialist/profile';

export default function POLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [checked, setChecked] = useState(pathname === PROFILE_PATH);

  useEffect(() => {
    if (!user || pathname === PROFILE_PATH) { setChecked(true); return; }
    fetch('/api/po-specialist/profile')
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
    <DashboardShell navItems={NAV} brandLabel="P&O Specialist" overviewHref="/dashboard/po-specialist">
      {children}
    </DashboardShell>
  );
}
