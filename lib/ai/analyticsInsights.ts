import { normalizeSummary } from '@/lib/utils';

export type AnalyticsInsightScope = 'admin' | 'hr';

export type AnalyticsMetrics = {
  applications: {
    total: number;
    applied: number;
    shortlisted: number;
    interview_scheduled: number;
    interview_completed: number;
    selected: number;
    rejected: number;
  };
  interviews: {
    total: number;
    scheduled: number;
    completed: number;
    pending_feedback: number;
    selected: number;
    rejected: number;
  };
  workforce: {
    total_employees: number;
    active: number;
    on_leave: number;
    inactive: number;
    average_performance: number | null;
    performance_buckets: {
      high: number;
      stable: number;
      needs_attention: number;
    };
    department_distribution: Record<string, number>;
  };
};

export type AnalyticsInsight = {
  summary: string;
  recruitment_insights: string[];
  workforce_insights: string[];
  suggested_actions: string[];
};

export function buildFallbackAnalyticsInsight(
  metrics: AnalyticsMetrics
): AnalyticsInsight {
  const totalApplications = metrics.applications.total;
  const applied = metrics.applications.applied;
  const shortlisted = metrics.applications.shortlisted;
  const scheduledInterviews = metrics.interviews.scheduled;
  const completedInterviews = metrics.interviews.completed;
  const pendingFeedback = metrics.interviews.pending_feedback;
  const selected = metrics.applications.selected;

  const selectionRate =
    totalApplications > 0 ? Math.round((selected / totalApplications) * 100) : 0;

  const avgPerformance = metrics.workforce.average_performance;

  const largestDepartmentEntry = Object.entries(
    metrics.workforce.department_distribution
  ).sort((a, b) => b[1] - a[1])[0];

  const largestDepartment = largestDepartmentEntry
    ? `${largestDepartmentEntry[0]} has the largest headcount with ${largestDepartmentEntry[1]} employees.`
    : 'No department distribution is available yet.';

  return {
    summary: `Analytics are based on ${totalApplications} applications, ${metrics.interviews.total} interviews, and ${metrics.workforce.total_employees} employees. The current selection rate is ${selectionRate}%${
      avgPerformance !== null
        ? `, with average workforce performance at ${avgPerformance}%.`
        : '.'
    }`,
    recruitment_insights: [
      applied > shortlisted
        ? 'A larger share of candidates are still in the applied stage, so screening throughput may need review.'
        : 'The application pipeline is moving beyond the initial applied stage.',
      scheduledInterviews > completedInterviews
        ? 'There are more scheduled interviews than completed interviews, so upcoming interview execution should be monitored.'
        : 'Interview completion is keeping pace with scheduled interviews.',
      pendingFeedback > 0
        ? `${pendingFeedback} interviews may need feedback or final decision follow-up.`
        : 'There are no obvious pending feedback bottlenecks from the current interview data.',
    ],
    workforce_insights: [
      largestDepartment,
      metrics.workforce.performance_buckets.high >
      metrics.workforce.performance_buckets.needs_attention
        ? 'The workforce has more high performers than employees needing attention.'
        : 'The workforce has a visible needs-attention group that may require manager follow-up.',
      metrics.workforce.on_leave > 0
        ? `${metrics.workforce.on_leave} employees are on leave, so coverage should be reviewed.`
        : 'No employees are currently marked on leave.',
    ],
    suggested_actions: [
      'Review candidates who remain in the applied stage.',
      'Close feedback loops for completed interviews.',
      'Use department and performance distribution before opening new roles.',
    ],
  };
}

function extractJsonObject(text: string) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');

  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  return text.slice(start, end + 1);
}

export async function generateAnalyticsInsight(
  metrics: AnalyticsMetrics
): Promise<AnalyticsInsight> {
  const fallback = buildFallbackAnalyticsInsight(metrics);

  const apiKey = process.env.NVIDIA_API_KEY;

  if (!apiKey) {
    return fallback;
  }

  try {
    const response = await fetch(
      'https://integrate.api.nvidia.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemma-3n-e4b-it',
          messages: [
            {
              role: 'system',
              content:
                'You are an HR analytics assistant. Analyze aggregate HRMS metrics only. Do not mention individual employee names. Do not make legal, compensation, firing, or promotion decisions. Return JSON only.',
            },
            {
              role: 'user',
              content: JSON.stringify({
                instruction:
                  'Analyze these HRMS analytics metrics and return JSON with keys: summary (a single concise string), recruitment_insights (array of 2 to 4 strings), workforce_insights (array of 2 to 4 strings), suggested_actions (array of 2 to 4 strings). Use soft language like review, monitor, consider, may indicate.',
                metrics,
              }),
            },
          ],
          temperature: 0.2,
          max_tokens: 700,
        }),
      }
    );

    const result = await response.json();

    const content = result?.choices?.[0]?.message?.content;

    if (!content || typeof content !== 'string') {
      return fallback;
    }

    const jsonText = extractJsonObject(content);

    if (!jsonText) {
      return fallback;
    }

    const parsed = JSON.parse(jsonText) as Partial<AnalyticsInsight>;

    return {
      summary: normalizeSummary(parsed.summary) || fallback.summary,
      recruitment_insights: parsed.recruitment_insights?.length
        ? parsed.recruitment_insights
        : fallback.recruitment_insights,
      workforce_insights: parsed.workforce_insights?.length
        ? parsed.workforce_insights
        : fallback.workforce_insights,
      suggested_actions: parsed.suggested_actions?.length
        ? parsed.suggested_actions
        : fallback.suggested_actions,
    };
  } catch {
    return fallback;
  }
}