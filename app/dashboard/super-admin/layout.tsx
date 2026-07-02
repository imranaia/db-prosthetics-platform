'use client';

import DashboardShell from '@/components/dashboard/DashboardShell';
import { useAuth } from '@/hooks/useAuth';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const switchLink = user?.hasDoctorProfile
    ? { label: 'Switch to Doctor Dashboard', href: '/dashboard/doctor' }
    : undefined;

  return <DashboardShell switchLink={switchLink}>{children}</DashboardShell>;
}
