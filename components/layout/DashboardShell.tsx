import { redirect } from 'next/navigation';
import { getDashboardSession } from '@/lib/auth/get-dashboard-session';
import DashboardClient from '@/components/layout/DashboardClient';

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
    <DashboardClient key = {session.userId} role={session.role} fullName={session.fullName}>
      {children}
    </DashboardClient>
  );
}