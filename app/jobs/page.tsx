import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { MapPin, Briefcase, Clock } from 'lucide-react';
import type { JobPosting } from '@/types/database';

export const metadata = { title: 'Open Positions' };

const EMPLOYMENT_LABELS: Record<string, string> = {
  full_time:  'Full Time',
  part_time:  'Part Time',
  contract:   'Contract',
  internship: 'Internship',
};

export default async function PublicJobsPage() {
  const supabase = await createClient();

  const { data: jobs } = await supabase
    .from('job_postings')
    .select('*, departments(id, name)')
    .eq('status', 'open')
    .order('created_at', { ascending: false });

  return (
    <main className="jobs-root">
      {/* Background */}
      <div className="auth-bg" aria-hidden="true">
        <div className="auth-bg-mesh auth-bg-mesh--login" />
        <div className="auth-bg-grid" />
      </div>

      <div className="jobs-container">
        {/* Header */}
        <div className="jobs-topbar">
            <Link href="/dashboard/candidate" className="job-detail-back">
                ← Dashboard
            </Link>

            <Link href="/dashboard/candidate" className="jobs-dashboard-link">
                Dashboard
            </Link>
        </div>
        <div className="jobs-header">
          <div className="jobs-brand">
            <span className="auth-pulse auth-pulse--peach" aria-hidden="true" />
            <span className="s-tag">HRMS</span>
          </div>
          <h1 className="s-h jobs-heading">Open Positions</h1>
          <p className="jobs-sub">
            {jobs?.length
              ? `${jobs.length} role${jobs.length !== 1 ? 's' : ''} currently open`
              : 'No open roles at the moment'}
          </p>
        </div>

        {/* Job cards */}
        {!jobs?.length ? (
          <div className="glass-card jobs-empty">
            <p className="s-tag">Check back soon</p>
            <p className="jobs-empty-sub">New positions will appear here when available.</p>
          </div>
        ) : (
          <div className="jobs-list">
            {jobs.map((job: JobPosting) => (
              <Link key={job.id} href={`/jobs/${job.id}`} className="job-card glass-card">
                <div className="job-card-top">
                  <div>
                    <p className="s-tag job-card-dept">
                      {job.departments?.name ?? 'General'}
                    </p>
                    <h2 className="job-card-title">{job.title}</h2>
                  </div>
                  <span className="ncta job-card-apply">Apply →</span>
                </div>

                <div className="job-card-meta">
                  {job.location && (
                    <span className="job-meta-item">
                      <MapPin size={11} strokeWidth={1.5} />
                      {job.location}
                    </span>
                  )}
                  {job.employment_type && (
                    <span className="job-meta-item">
                      <Briefcase size={11} strokeWidth={1.5} />
                      {EMPLOYMENT_LABELS[job.employment_type] ?? job.employment_type}
                    </span>
                  )}
                  <span className="job-meta-item">
                    <Clock size={11} strokeWidth={1.5} />
                    {new Date(job.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                {job.required_skills?.length > 0 && (
                  <div className="job-card-skills">
                    {job.required_skills.slice(0, 5).map((skill) => (
                      <span key={skill} className="job-skill-tag">{skill}</span>
                    ))}
                    {job.required_skills.length > 5 && (
                      <span className="job-skill-tag job-skill-tag--more">
                        +{job.required_skills.length - 5}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}