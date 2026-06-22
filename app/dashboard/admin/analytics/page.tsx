
import { createClient } from '@/lib/supabase/server';
import { requireDashboardSession } from '@/lib/auth/get-dashboard-session';
import { normalizeSummary } from '@/lib/utils';
import { RegenerateAnalyticsInsightButton } from '@/components/analytics/RegenerateAnalyticsInsightButton';
import {
  buildFallbackAnalyticsInsight,
  type AnalyticsInsight,
  type AnalyticsMetrics,
} from '@/lib/ai/analyticsInsights';
import {
  Briefcase,
  CalendarCheck,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';

export const metadata = {
  title: 'Analytics',
};

type EmployeeAnalyticsItem = {
  employment_status: string;
  performance_score: number | null;
  departments:
    | {
        name: string | null;
      }
    | {
        name: string | null;
      }[]
    | null;
};

type SavedAnalyticsInsight = {
  id: string;
  summary: string;
  recruitment_insights: string[] | null;
  workforce_insights: string[] | null;
  suggested_actions: string[] | null;
  generated_at: string;
};

function getDepartmentName(employee: EmployeeAnalyticsItem) {
  const department = Array.isArray(employee.departments)
    ? employee.departments[0]
    : employee.departments;

  return department?.name ?? 'Unassigned';
}

function countBy<T extends Record<string, unknown>>(
  items: T[],
  key: keyof T
): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, item) => {
    const value = item[key];

    if (typeof value !== 'string' || !value) {
      return acc;
    }

    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

function buildApplicationMetrics(statusCounts: Record<string, number>) {
  return {
    total: Object.values(statusCounts).reduce((sum, count) => sum + count, 0),
    applied: statusCounts.applied ?? 0,
    shortlisted: statusCounts.shortlisted ?? 0,
    interview_scheduled: statusCounts.interview_scheduled ?? 0,
    interview_completed: statusCounts.interview_completed ?? 0,
    selected: statusCounts.selected ?? 0,
    rejected: statusCounts.rejected ?? 0,
  };
}

function buildInterviewMetrics(
  interviews: { status: string; final_decision: string | null }[]
) {
  const statusCounts = countBy(interviews, 'status');
  const finalDecisionCounts = countBy(interviews, 'final_decision');

  const pendingFeedback = interviews.filter(
    (interview) =>
      interview.status === 'completed' && !interview.final_decision
  ).length;

  return {
    total: interviews.length,
    scheduled: statusCounts.scheduled ?? 0,
    completed: statusCounts.completed ?? 0,
    pending_feedback: pendingFeedback,
    selected: finalDecisionCounts.selected ?? 0,
    rejected: finalDecisionCounts.rejected ?? 0,
  };
}

function buildWorkforceMetrics(employees: EmployeeAnalyticsItem[]) {
  const performanceScores = employees
    .map((employee) => employee.performance_score)
    .filter((score): score is number => typeof score === 'number');

  const averagePerformance = performanceScores.length
    ? Math.round(
        performanceScores.reduce((sum, score) => sum + score, 0) /
          performanceScores.length
      )
    : null;

  const departmentDistribution = employees.reduce<Record<string, number>>(
    (acc, employee) => {
      const departmentName = getDepartmentName(employee);
      acc[departmentName] = (acc[departmentName] ?? 0) + 1;
      return acc;
    },
    {}
  );

  return {
    total_employees: employees.length,
    active: employees.filter(
      (employee) => employee.employment_status === 'active'
    ).length,
    on_leave: employees.filter(
      (employee) => employee.employment_status === 'on_leave'
    ).length,
    inactive: employees.filter(
      (employee) => employee.employment_status === 'inactive'
    ).length,
    average_performance: averagePerformance,
    performance_buckets: {
      high: employees.filter(
        (employee) =>
          typeof employee.performance_score === 'number' &&
          employee.performance_score >= 85
      ).length,
      stable: employees.filter(
        (employee) =>
          typeof employee.performance_score === 'number' &&
          employee.performance_score >= 70 &&
          employee.performance_score < 85
      ).length,
      needs_attention: employees.filter(
        (employee) =>
          typeof employee.performance_score === 'number' &&
          employee.performance_score < 70
      ).length,
    },
    department_distribution: departmentDistribution,
  };
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}



function getPercent(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function mergeSavedInsight(
  savedInsight: SavedAnalyticsInsight | null,
  fallbackInsight: AnalyticsInsight
): AnalyticsInsight {
  if (!savedInsight) {
    return fallbackInsight;
  }

  return {
    summary: normalizeSummary(savedInsight.summary) || fallbackInsight.summary,
    recruitment_insights: savedInsight.recruitment_insights?.length
      ? savedInsight.recruitment_insights
      : fallbackInsight.recruitment_insights,
    workforce_insights: savedInsight.workforce_insights?.length
      ? savedInsight.workforce_insights
      : fallbackInsight.workforce_insights,
    suggested_actions: savedInsight.suggested_actions?.length
      ? savedInsight.suggested_actions
      : fallbackInsight.suggested_actions,
  };
}

export default async function AdminAnalyticsPage() {
  await requireDashboardSession('admin');
  const supabase = await createClient();

  const { data: applications } = await supabase
    .from('job_applications')
    .select('status');

  const { data: interviews } = await supabase
    .from('interviews')
    .select('status, final_decision');

  const { data: employees } = await supabase
    .from('employees')
    .select(
      `
      employment_status,
      performance_score,
      departments (
        name
      )
    `
    );

  const applicationStatusCounts = countBy(
    (applications ?? []) as { status: string }[],
    'status'
  );

  const applicationMetrics = buildApplicationMetrics(applicationStatusCounts);

  const interviewMetrics = buildInterviewMetrics(
    (interviews ?? []) as { status: string; final_decision: string | null }[]
  );

  const workforceMetrics = buildWorkforceMetrics(
    (employees ?? []) as EmployeeAnalyticsItem[]
  );

  const metrics: AnalyticsMetrics = {
    applications: applicationMetrics,
    interviews: interviewMetrics,
    workforce: workforceMetrics,
  };

  const fallbackInsight = buildFallbackAnalyticsInsight(metrics);

  const { data: latestInsight } = await supabase
    .from('ai_analytics_insights')
    .select(
      `
      id,
      summary,
      recruitment_insights,
      workforce_insights,
      suggested_actions,
      generated_at
    `
    )
    .eq('scope', 'admin')
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const savedInsight = latestInsight as SavedAnalyticsInsight | null;
  const analyticsInsight = mergeSavedInsight(savedInsight, fallbackInsight);
  const insightGeneratedAt = savedInsight?.generated_at ?? null;

  const selectedRate = getPercent(
    applicationMetrics.selected,
    applicationMetrics.total
  );

  const completionRate = getPercent(
    interviewMetrics.completed,
    interviewMetrics.total
  );

  const statCards = [
    {
      label: 'Applications',
      value: String(applicationMetrics.total),
      icon: Briefcase,
      color: 'var(--g)',
    },
    {
      label: 'Scheduled Interviews',
      value: String(interviewMetrics.scheduled),
      icon: CalendarCheck,
      color: 'var(--amber)',
    },
    {
      label: 'Selection Rate',
      value: `${selectedRate}%`,
      icon: CheckCircle2,
      color: 'var(--teal)',
    },
    {
      label: 'Avg Performance',
      value:
        workforceMetrics.average_performance !== null
          ? `${workforceMetrics.average_performance}%`
          : '—',
      icon: TrendingUp,
      color: 'var(--g)',
    },
  ];

  const recruitmentFunnel = [
    ['Applied', applicationMetrics.applied],
    ['Shortlisted', applicationMetrics.shortlisted],
    ['Interview Scheduled', applicationMetrics.interview_scheduled],
    ['Interview Completed', applicationMetrics.interview_completed],
    ['Selected', applicationMetrics.selected],
    ['Rejected', applicationMetrics.rejected],
  ];

  const interviewBreakdown = [
    ['Scheduled', interviewMetrics.scheduled],
    ['Completed', interviewMetrics.completed],
    ['Pending Feedback', interviewMetrics.pending_feedback],
    ['Selected', interviewMetrics.selected],
    ['Rejected', interviewMetrics.rejected],
  ];

  const performanceBreakdown = [
    ['High performers', workforceMetrics.performance_buckets.high],
    ['Stable', workforceMetrics.performance_buckets.stable],
    ['Needs attention', workforceMetrics.performance_buckets.needs_attention],
  ];

  const departmentBreakdown = Object.entries(
    workforceMetrics.department_distribution
  ).sort((a, b) => b[1] - a[1]);

  return (
    <>
      <section className="dash-section">
        <p className="s-tag dash-section-tag">Analytics</p>
        <h1 className="s-h dash-page-heading">
          HRMS performance overview
        </h1>
        <p className="dash-panel-empty">
          Track hiring movement, interview progress, and workforce health from
          aggregate data.
        </p>
      </section>

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

      <section className="glass-card analytics-ai-panel">
        <div className="analytics-ai-panel-header">
          <div>
            <p className="s-tag dash-panel-tag">AI Analytics Summary</p>
            <p className="analytics-ai-summary">{analyticsInsight.summary}</p>

            <p className="analytics-ai-meta">
              {insightGeneratedAt
                ? `Last generated ${formatDateTime(insightGeneratedAt)}`
                : 'Showing fallback insight from current aggregate metrics.'}
            </p>
          </div>

          <RegenerateAnalyticsInsightButton scope="admin" />
        </div>

        <div className="analytics-ai-grid">
          <div>
            <h2>Recruitment insights</h2>
            <ul>
              {analyticsInsight.recruitment_insights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div>
            <h2>Workforce insights</h2>
            <ul>
              {analyticsInsight.workforce_insights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div>
            <h2>Suggested actions</h2>
            <ul>
              {analyticsInsight.suggested_actions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <div className="analytics-grid">
        <section className="glass-card analytics-panel">
          <div className="analytics-panel-header">
            <div>
              <p className="s-tag dash-panel-tag">Recruitment Funnel</p>
              <h2>Application movement</h2>
            </div>
            <p>{applicationMetrics.total} total</p>
          </div>

          <div className="analytics-bar-list">
            {recruitmentFunnel.map(([label, value]) => (
              <div key={label} className="analytics-bar-item">
                <div className="analytics-bar-meta">
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
                <div className="analytics-bar-track">
                  <div
                    className="analytics-bar-fill"
                    style={{
                      width: `${getPercent(
                        Number(value),
                        applicationMetrics.total
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-card analytics-panel">
          <div className="analytics-panel-header">
            <div>
              <p className="s-tag dash-panel-tag">Interviews</p>
              <h2>Interview progress</h2>
            </div>
            <p>{completionRate}% complete</p>
          </div>

          <div className="analytics-bar-list">
            {interviewBreakdown.map(([label, value]) => (
              <div key={label} className="analytics-bar-item">
                <div className="analytics-bar-meta">
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
                <div className="analytics-bar-track">
                  <div
                    className="analytics-bar-fill"
                    style={{
                      width: `${getPercent(
                        Number(value),
                        interviewMetrics.total
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-card analytics-panel">
          <div className="analytics-panel-header">
            <div>
              <p className="s-tag dash-panel-tag">Departments</p>
              <h2>Workforce distribution</h2>
            </div>
            <p>{workforceMetrics.total_employees} employees</p>
          </div>

          <div className="analytics-bar-list">
            {departmentBreakdown.length ? (
              departmentBreakdown.map(([label, value]) => (
                <div key={label} className="analytics-bar-item">
                  <div className="analytics-bar-meta">
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                  <div className="analytics-bar-track">
                    <div
                      className="analytics-bar-fill"
                      style={{
                        width: `${getPercent(
                          value,
                          workforceMetrics.total_employees
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="dash-panel-empty">No department data available.</p>
            )}
          </div>
        </section>

        <section className="glass-card analytics-panel">
          <div className="analytics-panel-header">
            <div>
              <p className="s-tag dash-panel-tag">Performance</p>
              <h2>Performance distribution</h2>
            </div>
            <p>
              {workforceMetrics.average_performance !== null
                ? `${workforceMetrics.average_performance}% avg`
                : 'No score'}
            </p>
          </div>

          <div className="analytics-bar-list">
            {performanceBreakdown.map(([label, value]) => (
              <div key={label} className="analytics-bar-item">
                <div className="analytics-bar-meta">
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
                <div className="analytics-bar-track">
                  <div
                    className="analytics-bar-fill"
                    style={{
                      width: `${getPercent(
                        Number(value),
                        workforceMetrics.total_employees
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}