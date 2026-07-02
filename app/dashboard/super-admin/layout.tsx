'use client';

import DashboardShell from '@/components/dashboard/DashboardShell';
import { useAuth } from '@/hooks/useAuth';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  async function switchToDoctor() {
    if (!user?.hasDoctorProfile) {
      const res = await fetch('/api/admin/doctor-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      // 409 means a doctor profile already exists (e.g. hasDoctorProfile was
      // stale) — that's fine, proceed to the doctor dashboard either way.
      if (!res.ok && res.status !== 409) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Could not switch to Doctor Dashboard. Please try again.');
        return;
      }
    }
    window.location.href = '/dashboard/doctor';
  }

  const switchLink = user
    ? { label: 'Switch to Doctor Dashboard', onClick: switchToDoctor }
    : undefined;

  return <DashboardShell switchLink={switchLink}>{children}</DashboardShell>;
}
