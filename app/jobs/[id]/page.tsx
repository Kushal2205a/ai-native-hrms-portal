import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { MapPin, Briefcase, ArrowLeft } from 'lucide-react';

export const metadata = { title: 'Job Details' };

const EMPLOYMENT_LABELS: Record<string, string> = {
  full_time:  'Full Time',
  part_time:  'Part Time',
  contract:   'Contract',
  internship: 'Internship',
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function JobDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: job } = await supabase
    .from('job_postings')
    .select('*, departments(id, name)')
    .eq('id', id)
    .eq('status', 'open')
    .single();

  if (!job) notFound();

  return (
    <main className="jobs-root">
      <div className="auth-bg" aria-hidden="true">
        <div className="auth-bg-mesh auth-bg-mesh--signup" />
        <div className="auth-bg-grid" />
      </div>

      <div className="jobs-container jobs-container--detail">
        {/* Back */}
        <Link href="/jobs" className="job-detail-back">
          <ArrowLeft size={13} strokeWidth={1.5} />
          All positions
        </Link>

        {/* Header card */}
        <div className="glass-card job-detail-header">
          <p className="s-tag job-card-dept">
            {job.departments?.name ?? 'General'}
          </p>
          <h1 className="s-h job-detail-title">{job.title}</h1>

          <div className="job-card-meta" style={{ marginTop: '12px' }}>
            {job.location && (
              <span className="job-meta-item">
                <MapPin size={11} strokeWidth={1.5} />
                {job.location}
              </span>
            )}
            {job.employment_type && (
              <span className="job-meta-item">
                <Briefcase size={11} strokeWidth={1.5} />
                {EMPLOYMENT_LABELS[job.employment_type]}
              </span>
            )}
          </div>

          {job.required_skills?.length > 0 && (
            <div className="job-card-skills" style={{ marginTop: '16px' }}>
              {job.required_skills.map((skill: string) => (
                <span key={skill} className="job-skill-tag">{skill}</span>
              ))}
            </div>
          )}

          <p className="job-meta-item" style={{ marginTop: '12px' }}>
            Posted {new Date(job.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>

          {/* Apply CTA */}
          <Link href={`/signup?redirect=/jobs/${id}`} className="btn-g job-detail-apply">
            Apply for this role →
          </Link>
        </div>

        {/* Description */}
        <div className="glass-card job-detail-body">
          <p className="s-tag" style={{ marginBottom: '16px' }}>About this role</p>
          <div className="job-detail-description">
            {job.description.split('\n').map((para: string, i: number) =>
              para.trim() ? <p key={i}>{para}</p> : <br key={i} />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}