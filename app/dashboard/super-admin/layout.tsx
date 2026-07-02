'use client';

import DashboardShell from '@/components/dashboard/DashboardShell';
import { useAuth } from '@/hooks/useAuth';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  async function switchToDoctor() {
    if (!user?.hasDoctorProfile) {
      await fetch('/api/admin/doctor-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
    }
    window.location.href = '/dashboard/doctor';
  }

  const switchLink = user
    ? { label: 'Switch to Doctor Dashboard', onClick: switchToDoctor }
    : undefined;

  return <DashboardShell switchLink={switchLink}>{children}</DashboardShell>;
}
