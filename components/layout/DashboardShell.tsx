import { redirect } from 'next/navigation';
import { getDashboardSession } from '@/lib/auth/get-dashboard-session';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';

export default async function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getDashboardSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="dash-shell">
      <Sidebar role={session.role} fullName={session.fullName} />
      <div className="dash-main">
        <Topbar role={session.role} />
        <main className="dash-content">{children}</main>
      </div>
    </div>
  );
}
