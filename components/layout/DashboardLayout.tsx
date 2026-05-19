import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import type { Role } from '@/types/roles';
import ThemeToggle from '@/components/theme/ThemeToggle';

interface DashboardLayoutProps {
  role: Role;
  fullName: string;
  title: string;
  children: React.ReactNode;
}

export default function DashboardLayout({
  role,
  fullName,
  title,
  children,
}: DashboardLayoutProps) {
  return (
    <div className="dash-shell">
      <Sidebar role={role} fullName={fullName} />
      <div className="dash-main">
        <Topbar title={title} />
        <main className="dash-content">{children}</main>
      </div>
    </div>
  );
}