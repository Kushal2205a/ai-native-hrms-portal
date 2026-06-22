import { normalizeSummary } from '@/lib/utils';

export type EmployeeInsightInput = {
  full_name: string;
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

export type WorkforceInsight = {
  summary: string;
  strengths: string[];
  attention_areas: string[];
  suggested_actions: string[];
};

function getDepartmentName(employee: EmployeeInsightInput) {
  const department = Array.isArray(employee.departments)
    ? employee.departments[0]
    : employee.departments;

  return department?.name ?? 'Unassigned';
}

function buildEmployeePayload(employees: EmployeeInsightInput[]) {
  return employees.map((employee) => ({
    name: employee.full_name,
    role: employee.job_title ?? 'Unspecified role',
    department: getDepartmentName(employee),
    status: employee.employment_status,
    type: employee.employment_type,
    location: employee.location ?? 'Unspecified location',
    joined_year: new Date(employee.joined_at).getFullYear(),
    performance_score: employee.performance_score,
  }));
}


export function buildFallbackWorkforceInsight(
  employees: EmployeeInsightInput[]
): WorkforceInsight {
  const total = employees.length;

  const activeEmployees = employees.filter(
    (employee) => employee.employment_status === 'active'
  );

  const onLeaveEmployees = employees.filter(
    (employee) => employee.employment_status === 'on_leave'
  );

  const inactiveEmployees = employees.filter(
    (employee) => employee.employment_status === 'inactive'
  );

  const performanceScores = employees
    .map((employee) => employee.performance_score)
    .filter((score): score is number => typeof score === 'number');

  const avgPerformance = performanceScores.length
    ? Math.round(
        performanceScores.reduce((sum, score) => sum + score, 0) /
          performanceScores.length
      )
    : null;

  const highPerformers = employees.filter(
    (employee) =>
      typeof employee.performance_score === 'number' &&
      employee.performance_score >= 85
  );

  const needsAttention = employees.filter(
    (employee) =>
      typeof employee.performance_score === 'number' &&
      employee.performance_score < 75
  );

  return {
    summary: `The workforce currently has ${total} employees, with ${activeEmployees.length} active employees${
      avgPerformance !== null ? ` and an average performance score of ${avgPerformance}%.` : '.'
    }`,
    strengths: [
      highPerformers.length
        ? `${highPerformers
            .slice(0, 3)
            .map((employee) => employee.full_name)
            .join(', ')} are strong performers who may be considered for mentoring or ownership opportunities.`
        : 'The workforce has stable coverage across active employees.',
    ],
    attention_areas: [
      needsAttention.length
        ? `${needsAttention
            .slice(0, 3)
            .map((employee) => employee.full_name)
            .join(', ')} may benefit from supportive performance check-ins.`
        : 'No major performance attention areas are visible from the current employee data.',
      onLeaveEmployees.length
        ? `${onLeaveEmployees
            .map((employee) => employee.full_name)
            .join(', ')} are currently on leave, so coverage should be reviewed.`
        : 'No employees are currently marked on leave.',
      inactiveEmployees.length
        ? `${inactiveEmployees
            .map((employee) => employee.full_name)
            .join(', ')} are inactive and should be excluded from active workforce planning.`
        : 'No inactive employees are present in the current dataset.',
    ],
    suggested_actions: [
      'Review employees below 75 performance for supportive check-ins.',
      'Consider high performers for mentoring or ownership opportunities.',
      'Review leave and inactive status before workforce planning.',
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

export async function generateWorkforceInsight(
  employees: EmployeeInsightInput[]
): Promise<WorkforceInsight> {
  const fallback = buildFallbackWorkforceInsight(employees);

  const apiKey = process.env.NVIDIA_API_KEY;

  if (!apiKey) {
    return fallback;
  }

  const employeePayload = buildEmployeePayload(employees);

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
                'You are an HR analytics assistant. Analyze employee workforce data. Be assistive, careful, and human-reviewed. Do not make firing, promotion, compensation, or legal decisions. Do not rank employees. Return JSON only.',
            },
            {
              role: 'user',
              content: JSON.stringify({
                instruction:
                  'Analyze this workforce data and return JSON with keys: summary (a single concise string), strengths (array of 2 to 4 strings), attention_areas (array of 2 to 4 strings), suggested_actions (array of 2 to 4 strings). Mention employee names when useful. Use soft language like may benefit, consider, review, monitor.',
                employees: employeePayload,
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

    const parsed = JSON.parse(jsonText) as Partial<WorkforceInsight>;

    return {
      summary: normalizeSummary(parsed.summary) || fallback.summary,
      strengths: parsed.strengths?.length ? parsed.strengths : fallback.strengths,
      attention_areas: parsed.attention_areas?.length
        ? parsed.attention_areas
        : fallback.attention_areas,
      suggested_actions: parsed.suggested_actions?.length
        ? parsed.suggested_actions
        : fallback.suggested_actions,
    };
  } catch {
    return fallback;
  }
}