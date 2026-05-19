import { redirect } from 'next/navigation';
import ApplicationsReviewList from '@/components/recruitment/ApplicationsReviewList';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { createClient } from '@/lib/supabase/server';
import type { ApplicationReview } from '@/types/database';  
import { GenerateScreeningButton } from '@/components/recruitment/GenerateScreeningButton';
type ApplicationStat = {
  label: string;
  value: number;
};

export const metadata = {
  title: 'Applications',
};

export default async function HRApplicationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, full_name, email')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    redirect('/login');
  }

  const { data: applications } = await supabase.rpc('get_application_reviews');
  const applicationStatsItems = (applications ?? []) as ApplicationReview[];

  const totalApplications = applicationStatsItems.length;

  const aiScreenedCount = applicationStatsItems.filter(
    (application) => application.screening_score !== null
    ).length;

  const shortlistedCount = applicationStatsItems.filter(
    (application) => application.status === 'shortlisted'
    ).length;

  const rejectedCount = applicationStatsItems.filter(
    (application) => application.status === 'rejected'
    ).length;

  const applicationStats: ApplicationStat[] = [
    {
        label: 'Total Applications',
        value: totalApplications,
    },
    {
        label: 'AI Screened',
        value: aiScreenedCount,
    },
    {
        label: 'Shortlisted',
        value: shortlistedCount,
    },
    {
        label: 'Rejected',
        value: rejectedCount,
    },
    ];
  return (
   <DashboardLayout role="admin" fullName={profile.full_name} title="Applications">
      <section className="dash-section">
        <p className="s-tag dash-section-tag">Recruitment</p>
        <h1 className="s-h dash-page-heading">Candidate applications</h1>
        <p className="dash-panel-empty">
          Review submitted applications from candidate profiles.
        </p>
      </section>

      <div className="application-stats-grid">
        {applicationStats.map((stat) => (
            <div key={stat.label} className="application-stat-card">
            <p className="application-stat-value">{stat.value}</p>
            <p className="application-stat-label">{stat.label}</p>
            </div>
        ))}
      </div>

      <section className="glass-card dash-panel">
        <ApplicationsReviewList applications={(applications ?? []) as ApplicationReview[]} />
      </section>
    </DashboardLayout>
  );
}