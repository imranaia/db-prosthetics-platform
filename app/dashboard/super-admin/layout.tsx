import DashboardShell from '@/components/dashboard/DashboardShell';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
