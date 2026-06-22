export type RequestDraftInput = {
  rough_text: string;
  selected_request_type?: string;
};

export type AIRequestDraft = {
  request_type:
    | 'leave'
    | 'work_from_home'
    | 'document'
    | 'payroll'
    | 'profile_update'
    | 'equipment'
    | 'general';
  priority: 'low' | 'normal' | 'high';
  title: string;
  description: string;
  leave_type?: 'casual' | 'sick' | 'earned' | 'unpaid' | 'other';
  reason?: string;
  estimated_days?: number;
};

const requestTypes = [
  'leave',
  'work_from_home',
  'document',
  'payroll',
  'profile_update',
  'equipment',
  'general',
] as const;

const priorities = ['low', 'normal', 'high'] as const;

const leaveTypes = ['casual', 'sick', 'earned', 'unpaid', 'other'] as const;

function isRequestType(value: unknown): value is AIRequestDraft['request_type'] {
  return typeof value === 'string' && requestTypes.includes(value as AIRequestDraft['request_type']);
}

function isPriority(value: unknown): value is AIRequestDraft['priority'] {
  return typeof value === 'string' && priorities.includes(value as AIRequestDraft['priority']);
}

function isLeaveType(value: unknown): value is NonNullable<AIRequestDraft['leave_type']> {
  return typeof value === 'string' && leaveTypes.includes(value as NonNullable<AIRequestDraft['leave_type']>);
}

function extractJsonObject(text: string) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');

  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  return text.slice(start, end + 1);
}

function inferFallbackDraft(input: RequestDraftInput): AIRequestDraft {
  const text = input.rough_text.trim();
  const lower = text.toLowerCase();
  const medicalKeywords = [
  'sick',
  'fever',
  'ill',
  'illness',
  'hospital',
  'doctor',
  'medical',
  'diarrhea',
  'piles',
  'surgery',
  'injury',
  'health',
];

  const isMedicalLeave = medicalKeywords.some(keyword =>
    lower.includes(keyword)
  );
  const requestType: AIRequestDraft['request_type'] =
    lower.includes('leave') ||
      lower.includes('sick') ||
      lower.includes('vacation') ||
      lower.includes('day off')
      ? 'leave'
      : lower.includes('wfh') || lower.includes('work from home') || lower.includes('remote')
        ? 'work_from_home'
        : lower.includes('salary slip') ||
          lower.includes('experience letter') ||
          lower.includes('certificate') ||
          lower.includes('document')
          ? 'document'
          : lower.includes('salary') ||
            lower.includes('payroll') ||
            lower.includes('payslip') ||
            lower.includes('tax')
            ? 'payroll'
            : lower.includes('laptop') ||
              lower.includes('mouse') ||
              lower.includes('keyboard') ||
              lower.includes('equipment')
              ? 'equipment'
              : lower.includes('profile') ||
                lower.includes('name') ||
                lower.includes('phone') ||
                lower.includes('address')
                ? 'profile_update'
                : isRequestType(input.selected_request_type)
                  ? input.selected_request_type
                  : 'general';

  const priority: AIRequestDraft['priority'] =
    lower.includes('urgent') ||
      lower.includes('asap') ||
      lower.includes('immediately')
      ? 'high'
      : 'normal';

  if (requestType === 'leave') {
    return {
      request_type: 'leave',
      priority,
      title: 'Leave request',
      description: text,
      leave_type: isMedicalLeave ? 'sick' : 'casual',
      reason: text,
    };
  }

  const titleByType: Record<AIRequestDraft['request_type'], string> = {
    leave: 'Leave request',
    work_from_home: 'Work from home request',
    document: 'Document request',
    payroll: 'Payroll query',
    profile_update: 'Profile update request',
    equipment: 'Equipment request',
    general: 'General HR request',
  };

  return {
    request_type: requestType,
    priority,
    title: titleByType[requestType],
    description: text,
  };
}

function normalizeDraft(
  parsed: Partial<AIRequestDraft>,
  fallback: AIRequestDraft
): AIRequestDraft {
  const requestType = isRequestType(parsed.request_type)
    ? parsed.request_type
    : fallback.request_type;

  const priority = isPriority(parsed.priority)
    ? parsed.priority
    : fallback.priority;

  const title =
    typeof parsed.title === 'string' && parsed.title.trim().length >= 3
      ? parsed.title.trim()
      : fallback.title;

  const description =
    typeof parsed.description === 'string' && parsed.description.trim().length >= 5
      ? parsed.description.trim()
      : fallback.description;

  const draft: AIRequestDraft = {
    request_type: requestType,
    priority,
    title,
    description,
  };

  if (requestType === 'leave') {
    draft.leave_type = isLeaveType(parsed.leave_type)
      ? parsed.leave_type
      : fallback.leave_type ?? 'casual';

    draft.reason =
      typeof parsed.reason === 'string' && parsed.reason.trim().length >= 5
        ? parsed.reason.trim()
        : fallback.reason ?? description;
  }

  return draft;
}

export async function generateRequestDraft(
  input: RequestDraftInput
): Promise<AIRequestDraft> {
  const fallback = inferFallbackDraft(input);
  const apiKey = process.env.NVIDIA_API_KEY;

  if (!apiKey || input.rough_text.trim().length < 5) {
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
                `
                You are an HRMS request drafting assistant.

                Convert rough employee text into professional HR wording.

                Rules:
                - Rewrite the employee's text into clear, polite, workplace-appropriate language.
                - Preserve intent.
                - Do not invent dates, approvals, or policy information.
                - Keep descriptions concise.
                - Return valid JSON only.
                `,
            },
            {
              role: 'user',
              content: JSON.stringify({
                instruction: `
Return JSON with:

{
  request_type,
  priority,
  title,
  description,
  leave_type,
  reason
}

request_type must be one of:
leave, work_from_home, document, payroll,
profile_update, equipment, general.

priority must be:
low, normal, high

For leave requests:
- title should be a short HR-friendly title.
- description should be a complete professional request.
- reason should be a concise professional summary.
- leave_type must be one of:
  casual, sick, earned, unpaid, other

Examples:

Input:
"I have diarrhea and need leave for 10 days"

Output:
{
  "request_type": "leave",
  "title": "Medical Leave Request",
  "description": "I would like to request leave due to a medical condition requiring recovery.",
  "reason": "Medical condition requiring recovery",
  "leave_type": "sick",
  
}
`,
                rough_text: input.rough_text,
                selected_request_type: input.selected_request_type,
              }),
            },
          ],
          temperature: 0.6,
          max_tokens: 500,
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

    const parsed = JSON.parse(jsonText) as Partial<AIRequestDraft>;

    return normalizeDraft(parsed, fallback);
  } catch {
    return fallback;
  }
}