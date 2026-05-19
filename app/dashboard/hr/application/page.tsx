
import ApplicationsReviewList from '@/components/recruitment/ApplicationsReviewList';
import { createClient } from '@/lib/supabase/server';
import { requireDashboardSession } from '@/lib/auth/get-dashboard-session';
import type { ApplicationReview } from '@/types/database';  

export const metadata = {
  title: 'Applications',
};

export default async function HRApplicationsPage() {
  const session = await requireDashboardSession('hr');
  const supabase = await createClient();

  const { data: applications } = await supabase.rpc('get_application_reviews');


  return (
    <>
      <section className="dash-section">
        <p className="s-tag dash-section-tag">Recruitment</p>
        <h1 className="s-h dash-page-heading">Candidate applications</h1>
        <p className="dash-panel-empty">
          Review submitted applications from candidate profiles.
        </p>
      </section>

      <section className="glass-card dash-panel">
       <ApplicationsReviewList applications={(applications ?? []) as ApplicationReview[]} />
      </section>
    </>
  );
}