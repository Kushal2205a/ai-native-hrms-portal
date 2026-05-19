import Link from 'next/link';

import MeetingLinkForm from '@/components/interviews/MeetingLinkForm';
import { createClient } from '@/lib/supabase/server';
import { requireDashboardSession } from '@/lib/auth/get-dashboard-session';
import InterviewFeedbackPanel from '@/components/interviews/InterviewFeedbackPanel';

export const metadata = {
  title: 'Interviews',
};

type BasicProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type InterviewReviewItem = {
  id: string;
  scheduled_at: string;
  duration_minutes: number | null;
  mode: string;
  meeting_link: string | null;
  status: string;
  job_postings:
    | {
        title: string | null;
      }
    | {
        title: string | null;
      }[]
    | null;
  candidate_profiles:
    | {
        id: string | null;
        user_id: string | null;
      }
    | {
        id: string | null;
        user_id: string | null;
      }[]
    | null;
  transcript: string | null;
  ai_feedback: string | null;
  ai_score: number | null;
  ai_recommendation: string | null;
  interviewer_feedback: string | null;
  final_decision: string | null;
  completed_at: string | null;
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

export default async function HRInterviewsPage() {
  const session = await requireDashboardSession('hr');
  const supabase = await createClient();

  const { data: interviews } = await supabase
    .from('interviews')
    .select(
      `
      id,
      scheduled_at,
      duration_minutes,
      mode,
      meeting_link,
      status,
      transcript,
      ai_feedback,
      ai_score,
      ai_recommendation,
      interviewer_feedback,
      final_decision,
      completed_at,
      job_postings (
        title
      ),
      candidate_profiles (
        id,
        user_id
      )
    `
    )
    .order('scheduled_at', { ascending: true });

  const interviewItems = (interviews ?? []) as InterviewReviewItem[];

  const candidateUserIds = interviewItems
    .map((interview) => {
      const candidateProfile = Array.isArray(interview.candidate_profiles)
        ? interview.candidate_profiles[0]
        : interview.candidate_profiles;

      return candidateProfile?.user_id;
    })
    .filter(Boolean) as string[];

  const { data: candidateUsers } = candidateUserIds.length
    ? await supabase.rpc('get_basic_profiles', {
        profile_ids: candidateUserIds,
      })
    : { data: [] };

  const candidateUserById = new Map<string, BasicProfile>(
    ((candidateUsers ?? []) as BasicProfile[]).map(
      (candidateUser: BasicProfile) => [candidateUser.id, candidateUser]
    )
  );

  return (
    <>
      <section className="dash-section">
        <p className="s-tag dash-section-tag">Interviews</p>
        <h1 className="s-h dash-page-heading">Scheduled interviews</h1>
        <p className="dash-panel-empty">
          View candidate interview slots and meeting links.
        </p>
      </section>

      <div className="glass-card dash-panel">
        {interviewItems.length ? (
          <div className="interviews-list">
            {interviewItems.map((interview) => {
              const job = Array.isArray(interview.job_postings)
                ? interview.job_postings[0]
                : interview.job_postings;

              const candidateProfile = Array.isArray(interview.candidate_profiles)
                ? interview.candidate_profiles[0]
                : interview.candidate_profiles;

              const candidateUser = candidateProfile?.user_id
                ? candidateUserById.get(candidateProfile.user_id)
                : null;

              return (
                <article key={interview.id} className="interview-card">
                  <div className="interview-card-main">
                    <p className="interview-card-title">
                      {candidateUser?.full_name ?? 'Unknown candidate'}
                    </p>

                    <p className="interview-card-meta">
                      {job?.title ?? 'Unknown role'} ·{' '}
                      {formatInterviewDate(interview.scheduled_at)}
                    </p>

                    <p className="interview-card-meta">
                      {candidateUser?.email ?? 'Email not available'} ·{' '}
                      {formatStatus(interview.status)}
                    </p>
                  </div>

                  <div className="interview-card-actions">
                    {interview.meeting_link ? (
                      <Link
                        href={interview.meeting_link}
                        target="_blank"
                        rel="noreferrer"
                        className="interview-meet-link"
                      >
                        Open meeting
                      </Link>
                    ) : null}

                    <MeetingLinkForm
                      interviewId={interview.id}
                      currentMeetingLink={interview.meeting_link}
                    />
                  </div>

                  <InterviewFeedbackPanel
                    interviewId={interview.id}
                    aiFeedback={interview.ai_feedback}
                    aiScore={interview.ai_score}
                    aiRecommendation={interview.ai_recommendation}
                    finalDecision={interview.final_decision}
                    status={interview.status}
                  />
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