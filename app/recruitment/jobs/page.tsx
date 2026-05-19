import { createClient } from '@/lib/supabase/server';
import { requireDashboardSession } from '@/lib/auth/get-dashboard-session';
import JobPostingsTable from '@/components/recruitment/JobPostingsTable';

export const metadata = { title: 'Job Postings' };

export default async function RecruitmentJobsPage() {
  await requireDashboardSession('admin', 'hr');
  const supabase = await createClient();

  const [{ data: jobs }, { data: departments }] = await Promise.all([
    supabase
      .from('job_postings')
      .select('*, departments(id, name)')
      .order('created_at', { ascending: false }),
    supabase
      .from('departments')
      .select('id, name, description, created_at')
      .order('name'),
  ]);

  return (
    <>
      <div className="dash-section">
        <p className="s-tag dash-section-tag">Recruitment</p>
        <h1 className="s-h dash-page-heading">Job Postings</h1>
      </div>

      <JobPostingsTable
        jobs={jobs ?? []}
        departments={departments ?? []}
      />
    </>
  );
}