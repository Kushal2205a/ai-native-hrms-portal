export type EmployeeGrowthInsightInput = {
  full_name: string;
  email: string | null;
  job_title: string | null;
  employment_status: string;
  employment_type: string;
  location: string | null;
  joined_at: string;
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

export type EmployeeGrowthInsight = {
  summary: string;
  strengths: string[];
  focus_areas: string[];
  suggested_actions: string[];
};

function getDepartmentName(employee: EmployeeGrowthInsightInput) {
  const department = Array.isArray(employee.departments)
    ? employee.departments[0]
    : employee.departments;

  return department?.name ?? 'Unassigned';
}

function getTenureMonths(joinedAt: string) {
  const joinedDate = new Date(joinedAt);
  const now = new Date();

  const years = now.getFullYear() - joinedDate.getFullYear();
  const months = now.getMonth() - joinedDate.getMonth();

  return Math.max(0, years * 12 + months);
}

export function buildFallbackEmployeeGrowthInsight(
  employee: EmployeeGrowthInsightInput
): EmployeeGrowthInsight {
  const departmentName = getDepartmentName(employee);
  const tenureMonths = getTenureMonths(employee.joined_at);
  const score = employee.performance_score;

  const performanceBand =
    typeof score !== 'number'
      ? 'not yet scored'
      : score >= 85
        ? 'strong'
        : score >= 70
          ? 'stable'
          : 'needs support';

  return {
    summary:
      typeof score === 'number'
        ? `Your current performance score is ${score}%, which indicates a ${performanceBand} performance pattern in your ${employee.job_title ?? 'current'} role.`
        : `Your employee profile is active in ${departmentName}, and a performance score has not been added yet.`,
    strengths:
      typeof score === 'number' && score >= 85
        ? [
            'You are showing strong consistency in your current role.',
            `Your work in ${departmentName} appears to be contributing positively to team performance.`,
          ]
        : typeof score === 'number' && score >= 70
          ? [
              'You are maintaining a stable performance level.',
              'You have a good base to build more visible outcomes in the next cycle.',
            ]
          : [
              'You have a clear opportunity to reset priorities and build momentum.',
              'Focused support and clearer short-term goals may help improve consistency.',
            ],
    focus_areas:
      typeof score === 'number' && score >= 85
        ? [
            'Take on one stretch responsibility that increases ownership.',
            'Document recent wins so they are visible during review conversations.',
          ]
        : typeof score === 'number' && score >= 70
          ? [
              'Choose one measurable skill or delivery goal for the next month.',
              'Ask for feedback on where your work can create more impact.',
            ]
          : [
              'Align with your manager on two short-term priorities.',
              'Ask for support where blockers are slowing your progress.',
            ],
    suggested_actions: [
      tenureMonths < 6
        ? 'Review onboarding goals and confirm expectations for the next checkpoint.'
        : 'Review your recent work outcomes and prepare notes for your next manager check-in.',
      'Pick one measurable goal for the next 30 days.',
      'Update your profile details if your role, location, or work arrangement has changed.',
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

export async function generateEmployeeGrowthInsight(
  employee: EmployeeGrowthInsightInput
): Promise<EmployeeGrowthInsight> {
  const fallback = buildFallbackEmployeeGrowthInsight(employee);

  const apiKey = process.env.NVIDIA_API_KEY;

  if (!apiKey) {
    return fallback;
  }

  const departmentName = getDepartmentName(employee);
  const tenureMonths = getTenureMonths(employee.joined_at);

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
                'You are an employee growth assistant inside an HRMS. Speak directly to the employee in supportive language. Do not make promotion, firing, compensation, legal, medical, or disciplinary decisions. Return JSON only.',
            },
            {
              role: 'user',
              content: JSON.stringify({
                instruction:
                  'Create a personal employee growth insight. Return JSON with keys: summary, strengths, focus_areas, suggested_actions. Each array should contain 2 to 4 concise strings. Use supportive language. Avoid manager-only or HR-only wording.',
                employee: {
                  job_title: employee.job_title,
                  employment_status: employee.employment_status,
                  employment_type: employee.employment_type,
                  location: employee.location,
                  department: departmentName,
                  tenure_months: tenureMonths,
                  performance_score: employee.performance_score,
                },
              }),
            },
          ],
          temperature: 0.25,
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

    const parsed = JSON.parse(jsonText) as Partial<EmployeeGrowthInsight>;

    return {
      summary: parsed.summary || fallback.summary,
      strengths: parsed.strengths?.length
        ? parsed.strengths
        : fallback.strengths,
      focus_areas: parsed.focus_areas?.length
        ? parsed.focus_areas
        : fallback.focus_areas,
      suggested_actions: parsed.suggested_actions?.length
        ? parsed.suggested_actions
        : fallback.suggested_actions,
    };
  } catch {
    return fallback;
  }
}