import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardLayout from '@/components/layout/DashboardLayout';
import JobPostingsTable from '@/components/recruitment/JobPostingsTable';

export const metadata = { title: 'Job Postings' };

export default async function RecruitmentJobsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'hr'].includes(profile.role)) redirect('/login');

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
    <DashboardLayout
      role={profile.role as 'admin' | 'hr'}
      fullName={profile.full_name}
      title="Job Postings"
    >
      <div className="dash-section">
        <p className="s-tag dash-section-tag">Recruitment</p>
        <h1 className="s-h dash-page-heading">Job Postings</h1>
      </div>

      <JobPostingsTable
        jobs={jobs ?? []}
        departments={departments ?? []}
      />
    </DashboardLayout>
  );
}