import ApplicationStatusActions from './ApplicationStatusActions';
import type { ApplicationReview } from '@/types/database';
import ApplicationScreeningActions from './ApplicationScreeningActions';


interface ApplicationsReviewListProps {
  applications: ApplicationReview[];
}

function formatStatus(status: string) {
  return status.replaceAll('_', ' ');
}

export default function ApplicationsReviewList({ applications }: ApplicationsReviewListProps) {
  if (!applications.length) {
    return <p className="dash-panel-empty">No candidate applications yet.</p>;
  }

  return (
    <div className="review-applications-list">
      {applications.map((application) => (
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
            </p>

            <p className="review-application-meta">
              Experience: {application.candidate_experience_years ?? 'N/A'} years
              {application.candidate_education
                ? ` · Education: ${application.candidate_education}`
                : ''}
            </p>



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
      ))}
    </div>
  );
}