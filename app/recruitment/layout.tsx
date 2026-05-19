import DashboardShell from '@/components/layout/DashboardShell';

export default function RecruitmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
