import ApplicationStatusActions from './ApplicationStatusActions';
import type { ApplicationReview } from '@/types/database';
import ApplicationScreeningActions from './ApplicationScreeningActions';

type CandidateVerification = {
  verification_status: string | null;
  profile_name: string | null;
  resume_name: string | null;
  linkedin_url_found: boolean;
  linkedin_url_valid: boolean;
};

interface ApplicationsReviewListProps {
  applications: ApplicationReview[];
  verificationData?: Record<string, CandidateVerification>;
}

function formatStatus(status: string) {
  return status.replaceAll('_', ' ');
}

function VerificationBadge({ status }: { status: string | null }) {
  if (!status) return null;

  const config = {
    verified: {
      label: 'Verified',
      className: 'resume-verification-badge resume-verification-badge--verified',
    },
    needs_review: {
      label: 'Needs Review',
      className: 'resume-verification-badge resume-verification-badge--review',
    },
    mismatch: {
      label: 'Mismatch',
      className: 'resume-verification-badge resume-verification-badge--mismatch',
    },
  };

  const setting = config[status as keyof typeof config];
  if (!setting) return null;

  return <span className={setting.className}>{setting.label}</span>;
}

export default function ApplicationsReviewList({ applications, verificationData = {} }: ApplicationsReviewListProps) {
  if (!applications.length) {
    return <p className="dash-panel-empty">No candidate applications yet.</p>;
  }

  return (
    <div className="review-applications-list">
      {applications.map((application) => {
        const verification = verificationData[application.candidate_id];

        return (
          <article key={application.id} className="review-application-card">
            <div>
              <p className="review-application-title">
                {application.job_title ?? 'Unknown role'}
              </p>

              <p className="review-application-meta">
                Status: {formatStatus(application.status)}
                {application.job_location ? ` · ${application.job_location}` : ''}
                {application.job_employment_type
                  ? ` · ${application.job_employment_type.replace('_', ' ')}`
                  : ''}
              </p>
               
              <p className="review-application-meta">
                Candidate:{' '}
                {application.candidate_full_name ?? 'Unknown candidate'}
                {application.candidate_email ? ` · ${application.candidate_email}` : ''}
                {verification ? (
                  <VerificationBadge status={verification.verification_status} />
                ) : null}
              </p>

              <p className="review-application-meta">
                Experience: {application.candidate_experience_years ?? 'N/A'} years
                {application.candidate_education
                  ? ` · Education: ${application.candidate_education}`
                  : ''}
              </p>

              {verification ? (
                <div className="review-application-verification">
                  <span className={`review-verification-item ${verification.linkedin_url_found && verification.linkedin_url_valid ? 'review-verification-item--pass' : 'review-verification-item--muted'}`}>
                    {verification.linkedin_url_found && verification.linkedin_url_valid ? '✓' : '—'} LinkedIn
                  </span>
                </div>
              ) : null}

              {application.screening_score !== null ? (
                <div className="screening-result">
                    <div className="screening-result-head">
                        <span className="screening-score">
                            AI Score {application.screening_score}/100
                        </span>
                        <span className="screening-recommendation">
                            {formatStatus(application.screening_recommendation ?? 'possible_match')}
                        </span>
                    </div>

                    {application.screening_summary ? (
                        <p className="screening-summary">{application.screening_summary}</p>
                    ) : null}

                    {application.screening_strengths?.length ? (
                    <div className="screening-list">
                        <p>Strengths</p>
                        <ul>
                            {application.screening_strengths.map((item) => (
                                <li key={item}>{item}</li>
                        ))}
                        </ul>
                    </div>
                    ) : null}

                    {application.screening_concerns?.length ? (
                    <div className="screening-list">
                        <p>Concerns</p>
                        <ul>
                        {application.screening_concerns.map((item) => (
                            <li key={item}>{item}</li>
                        ))}
                        </ul>
                    </div>
                    ) : null}
                </div>
                ) : (
                <p className="review-application-meta">
                    AI screening: Not generated yet
                </p>
                )}
            </div>

            <div className="review-application-side">
              <span className="review-application-status">
                {formatStatus(application.status)}
              </span>

              <ApplicationScreeningActions
                applicationId={application.id}
                hasScreening={Boolean(application.screening_score)}
              />

              <ApplicationStatusActions
                applicationId={application.id}
                currentStatus={application.status}
              />
            </div>
          </article>
        );
      })}
    </div>
  );
}