import Link from 'next/link';

import { createClient } from '@/lib/supabase/server';
import { requireDashboardSession } from '@/lib/auth/get-dashboard-session';

export const metadata = {
  title: 'My Interviews',
};

type CandidateInterview = {
  id: string;
  scheduled_at: string;
  duration_minutes: number | null;
  mode: string;
  meeting_link: string | null;
  status: string;
  job_postings:
    | {
        title: string | null;
        location: string | null;
        employment_type: string | null;
      }
    | {
        title: string | null;
        location: string | null;
        employment_type: string | null;
      }[]
    | null;
};

function formatInterviewDate(value: string) {
  return new Date(value).toLocaleString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatStatus(status: string) {
  return status.replaceAll('_', ' ');
}

export default async function CandidateInterviewsPage() {
  const session = await requireDashboardSession('candidate');
  const supabase = await createClient();

  const { data: candidateProfile } = await supabase
    .from('candidate_profiles')
    .select('id')
    .eq('user_id', session.userId)
    .maybeSingle();

  const { data: interviews } = candidateProfile
    ? await supabase
        .from('interviews')
        .select(
          `
          id,
          scheduled_at,
          duration_minutes,
          mode,
          meeting_link,
          status,
          job_postings (
            title,
            location,
            employment_type
          )
        `
        )
        .eq('candidate_id', candidateProfile.id)
        .order('scheduled_at', { ascending: true })
    : { data: [] };

  const interviewItems = (interviews ?? []) as CandidateInterview[];

  return (
    <>
      <section className="dash-section">
        <p className="s-tag dash-section-tag">Interviews</p>
        <h1 className="s-h dash-page-heading">My interviews</h1>
        <p className="dash-panel-empty">
          View your scheduled interview time and meeting link.
        </p>
      </section>

      <div className="glass-card dash-panel">
        {interviewItems.length ? (
          <div className="interviews-list">
            {interviewItems.map((interview) => {
              const job = Array.isArray(interview.job_postings)
                ? interview.job_postings[0]
                : interview.job_postings;

              return (
                <article key={interview.id} className="interview-card">
                  <div className="interview-card-main">
                    <p className="interview-card-title">
                      {job?.title ?? 'Unknown role'}
                    </p>

                    <p className="interview-card-meta">
                      {formatInterviewDate(interview.scheduled_at)}
                      {interview.duration_minutes
                        ? ` · ${interview.duration_minutes} min`
                        : ''}
                    </p>

                    <p className="interview-card-meta">
                      {interview.mode.replace('_', ' ')} ·{' '}
                      {formatStatus(interview.status)}
                    </p>
                  </div>

                  {interview.meeting_link ? (
                    <Link
                      href={interview.meeting_link}
                      target="_blank"
                      rel="noreferrer"
                      className="interview-meet-link"
                    >
                      Join meeting
                    </Link>
                  ) : (
                    <span className="interview-meet-missing">
                      Link pending
                    </span>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <p className="dash-panel-empty">
            Scheduled interviews will appear here.
          </p>
        )}
      </div>
    </>
  );
}