import ApplicationsReviewList from '@/components/recruitment/ApplicationsReviewList';
import { createClient } from '@/lib/supabase/server';
import { requireDashboardSession } from '@/lib/auth/get-dashboard-session';
import type { ApplicationReview } from '@/types/database';  
type ApplicationStat = {
  label: string;
  value: number;
};

export const metadata = {
  title: 'Applications',
};

export default async function HRApplicationsPage() {
  await requireDashboardSession('hr');
  const supabase = await createClient();

  const { data: applications } = await supabase.rpc('get_application_reviews');
  const applicationStatsItems = (applications ?? []) as ApplicationReview[];

  const candidateIds = [...new Set(
    applicationStatsItems.map((a) => a.candidate_id).filter(Boolean)
  )];

  let verificationData: Record<string, { verification_status: string | null; profile_name: string | null; resume_name: string | null; linkedin_url_found: boolean; linkedin_url_valid: boolean }> = {};

  if (candidateIds.length > 0) {
    const { data: profiles } = await supabase
      .from('candidate_profiles')
      .select('id, parsed_resume_json')
      .in('id', candidateIds);

    if (profiles) {
      for (const profile of profiles) {
        const json = profile.parsed_resume_json as Record<string, unknown> | null;
        const verification = json?.verification as Record<string, unknown> | null;
        if (verification) {
          verificationData[profile.id] = {
            verification_status: (verification.verification_status as string) ?? null,
            profile_name: (verification.profile_name as string) ?? null,
            resume_name: (verification.resume_name as string) ?? null,
            linkedin_url_found: Boolean(verification.linkedin_url_found),
            linkedin_url_valid: Boolean(verification.linkedin_url_valid),
          };
        }
      }
    }
  }

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
   <>
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
        <ApplicationsReviewList
          applications={(applications ?? []) as ApplicationReview[]}
          verificationData={verificationData}
        />
      </section>
    </>
  );
}