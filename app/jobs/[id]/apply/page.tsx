import Link from 'next/link';
import { redirect } from 'next/navigation';
import ApplyJobForm from '@/components/candidate/ApplyJobForm';
import { createClient } from '@/lib/supabase/server';
interface ApplyPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: 'Apply',
};

export default async function ApplyPage({ params }: ApplyPageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, full_name, email')
    .eq('id', user.id)
    .single();
  
  if (!profile || profile.role !== 'candidate') {
        redirect('/login');
    }

  const { data: job } = await supabase
    .from('job_postings')
    .select(
      `
      id,
      title,
      description,
      required_skills,
      location,
      employment_type,
      status,
      departments (
        id,
        name
      )
    `
    )
    .eq('id', id)
    .single();

  if (!job || job.status !== 'open') {
    redirect('/jobs');
  }

  const { data: candidateProfile } = await supabase
    .from('candidate_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  let alreadyApplied = false;

  if (candidateProfile) {
    const { data: existingApplication } = await supabase
      .from('job_applications')
      .select('id')
      .eq('job_id', job.id)
      .eq('candidate_id', candidateProfile.id)
      .maybeSingle();

    alreadyApplied = Boolean(existingApplication);
  }

  return (
    <main className="jobs-root">
        <div className="auth-bg" aria-hidden="true">
        <div className="auth-bg-mesh auth-bg-mesh--signup" />
        <div className="auth-bg-grid" />
        </div>

        <div className="jobs-container jobs-container--detail apply-detail-container">
        <div className="jobs-topbar">
            <Link href={`/jobs/${job.id}`} className="job-detail-back">
                ← Back to job
            </Link>

            <Link href="/dashboard/candidate" className="jobs-dashboard-link">
                Dashboard
            </Link>
        </div>

        <div className="apply-detail-grid">
            <article className="glass-card job-detail-header apply-job-card">
            <p className="s-tag job-card-dept">Application</p>
            <h1 className="s-h job-detail-title">Apply for {job.title}</h1>

            <div className="job-card-meta" style={{ marginTop: '12px' }}>
                {job.departments?.[0]?.name ? (
                <span className="job-meta-item">{job.departments[0].name}</span>
                ) : null}
                {job.location ? <span className="job-meta-item">{job.location}</span> : null}
                {job.employment_type ? (
                <span className="job-meta-item">
                    {job.employment_type.replace('_', ' ')}
                </span>
                ) : null}
            </div>

            {job.required_skills?.length ? (
                <div className="job-card-skills" style={{ marginTop: '16px' }}>
                {job.required_skills.map((skill: string) => (
                    <span key={skill} className="job-skill-tag">
                    {skill}
                    </span>
                ))}
                </div>
            ) : null}

            <div className="job-detail-description apply-job-description">
                <p>{job.description}</p>
            </div>
            </article>

            <aside className="glass-card apply-card">
            <p className="s-tag">Submit</p>
            <h2 className="apply-card-title">Candidate application</h2>
            <p className="apply-card-copy">
                Your saved candidate profile will be attached to this application.
            </p>

            <ApplyJobForm
                jobId={job.id}
                hasCandidateProfile={Boolean(candidateProfile)}
                alreadyApplied={alreadyApplied}
            />
            </aside>
        </div>
        </div>
    </main>
    );
}