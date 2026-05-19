
import { createClient } from '@/lib/supabase/server';
import { requireDashboardSession } from '@/lib/auth/get-dashboard-session';
import { Users, Briefcase, CalendarCheck, TrendingUp } from 'lucide-react';

export const metadata = { title: 'HR' };

type RecentApplication = {
  id: string;
  status: string;
  job_title: string | null;
  candidate_full_name: string | null;
};

type DashboardInterview = {
  id: string;
  scheduled_at: string;
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
};

type BasicProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
};

export default async function HRDashboard() {
  const session = await requireDashboardSession('hr');
  const supabase = await createClient();

  const { count: openRolesCount } = await supabase
    .from('job_postings')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'open');

  const { count: totalEmployeesCount } = await supabase
    .from('employees')
    .select('id', { count: 'exact', head: true });

  const { data: employeePerformanceRows } = await supabase
    .from('employees')
    .select('performance_score')
    .not('performance_score', 'is', null);

  const { data: recentApplications } = await supabase
    .rpc('get_application_reviews')
    .limit(3);

  const now = new Date();

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const { count: interviewsTodayCount } = await supabase
    .from('interviews')
    .select('id', { count: 'exact', head: true })
    .gte('scheduled_at', startOfToday.toISOString())
    .lte('scheduled_at', endOfToday.toISOString());

  const { data: upcomingInterviews } = await supabase
    .from('interviews')
    .select(
      `
      id,
      scheduled_at,
      status,
      job_postings (
        title
      ),
      candidate_profiles (
        id,
        user_id
      )
    `
    )
    .gte('scheduled_at', now.toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(3);

  const upcomingInterviewItems = (upcomingInterviews ?? []) as DashboardInterview[];

  const upcomingCandidateUserIds = upcomingInterviewItems
    .map((interview) => {
      const candidateProfile = Array.isArray(interview.candidate_profiles)
        ? interview.candidate_profiles[0]
        : interview.candidate_profiles;

      return candidateProfile?.user_id;
    })
    .filter(Boolean) as string[];

  const { data: upcomingCandidateUsers } = upcomingCandidateUserIds.length
    ? await supabase.rpc('get_basic_profiles', {
        profile_ids: upcomingCandidateUserIds,
      })
    : { data: [] };

  const upcomingCandidateUserById = new Map<string, BasicProfile>(
    ((upcomingCandidateUsers ?? []) as BasicProfile[]).map(
      (candidateUser: BasicProfile) => [candidateUser.id, candidateUser]
    )
  );

  const recentApplicationItems = (recentApplications ?? []) as RecentApplication[];
  const performanceScores = (employeePerformanceRows ?? [])
  .map((employee) => employee.performance_score)
  .filter((score): score is number => typeof score === 'number');

  const avgPerformance = performanceScores.length
    ? Math.round(
        performanceScores.reduce((sum, score) => sum + score, 0) /
            performanceScores.length
        )
    : null;
  const statCards = [
    {
        label: 'Total Employees',
        value: String(totalEmployeesCount ?? 0),
        icon: Users,
        color: 'var(--g)',
    },
    {
        label: 'Open Roles',
        value: String(openRolesCount ?? 0),
        icon: Briefcase,
        color: 'var(--teal)',
    },
    {
        label: 'Interviews Today',
        value: String(interviewsTodayCount ?? 0),
        icon: CalendarCheck,
        color: 'var(--amber)',
    },
    {
        label: 'Avg Performance',
        value: avgPerformance !== null ? `${avgPerformance}%` : '—',
        icon: TrendingUp,
        color: 'var(--g)',
    },
    ];
  return (
    <>
      <div className="dash-section">
        <p className="s-tag dash-section-tag">Overview</p>
        <h1 className="s-h dash-page-heading">
          Good to see you, {session.fullName.split(' ')[0]}.
        </h1>
      </div>

      <div className="dash-cards">
        {statCards.map((card) => {
          const Icon = card.icon;

          return (
            <div key={card.label} className="glass-card dash-stat-card">
              <div className="dash-stat-icon" style={{ color: card.color }}>
                <Icon size={18} strokeWidth={1.5} />
              </div>
              <p className="dash-stat-value">{card.value}</p>
              <p className="dash-stat-label s-tag">{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="dash-panels">
        <div className="glass-card dash-panel">
          <p className="s-tag dash-panel-tag">Recent Applications</p>

          {recentApplicationItems.length ? (
            <div className="overview-application-list">
              {recentApplicationItems.map((application) => (
                <article
                  key={application.id}
                  className="overview-application-item"
                >
                  <div className="overview-application-main">
                    <p className="overview-application-name">
                      {application.candidate_full_name ?? 'Unknown candidate'}
                    </p>

                    <p className="overview-application-role">
                      {application.job_title ?? 'Unknown role'}
                    </p>
                  </div>

                  <span className="overview-application-status">
                    {application.status.replaceAll('_', ' ')}
                  </span>
                </article>
              ))}
            </div>
          ) : (
            <p className="dash-panel-empty">Applications will appear here.</p>
          )}
        </div>

        <div className="glass-card dash-panel">
          <p className="s-tag dash-panel-tag">Upcoming Interviews</p>

          {upcomingInterviewItems.length ? (
            <div className="overview-application-list">
              {upcomingInterviewItems.map((interview) => {
                const job = Array.isArray(interview.job_postings)
                  ? interview.job_postings[0]
                  : interview.job_postings;

                const candidateProfile = Array.isArray(
                  interview.candidate_profiles
                )
                  ? interview.candidate_profiles[0]
                  : interview.candidate_profiles;

                const candidateUser = candidateProfile?.user_id
                  ? upcomingCandidateUserById.get(candidateProfile.user_id)
                  : null;

                return (
                  <article
                    key={interview.id}
                    className="overview-application-item"
                  >
                    <div className="overview-application-main">
                      <p className="overview-application-name">
                        {candidateUser?.full_name ?? 'Unknown candidate'}
                      </p>

                      <p className="overview-application-role">
                        {job?.title ?? 'Unknown role'} ·{' '}
                        {new Date(interview.scheduled_at).toLocaleString(
                          'en-IN',
                          {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                          }
                        )}
                      </p>
                    </div>

                    <span className="overview-application-status">
                      {interview.status.replaceAll('_', ' ')}
                    </span>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="dash-panel-empty">Interviews will appear here.</p>
          )}
        </div>
      </div>
    </>
  );
}