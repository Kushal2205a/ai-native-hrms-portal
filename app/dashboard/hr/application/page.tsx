import { redirect } from 'next/navigation';
import ApplicationsReviewList from '@/components/recruitment/ApplicationsReviewList';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { createClient } from '@/lib/supabase/server';
import type { ApplicationReview } from '@/types/database';  

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

  if (!profile || profile.role !== 'hr') {
    redirect('/login');
  }

  const { data: applications } = await supabase.rpc('get_application_reviews');


  return (
    <DashboardLayout role="hr" fullName={profile.full_name} title="Applications">
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
    </DashboardLayout>
  );
}