import DashboardShell from '@/components/layout/DashboardShell';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/** @deprecated Use route layouts with DashboardShell instead. */
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return <DashboardShell>{children}</DashboardShell>;
}
