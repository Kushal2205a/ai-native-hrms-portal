'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  generateAnalyticsInsight,
  type AnalyticsInsightScope,
  type AnalyticsMetrics,
} from '@/lib/ai/analyticsInsights';

type ActionState = {
  success: boolean;
  message: string;
};

type EmployeeAnalyticsItem = {
  employment_status: string;
  performance_score: number | null;
  profile_id: string | null;
  departments:
    | {
        name: string | null;
      }
    | {
        name: string | null;
      }[]
    | null;
  profiles:
    | {
        role: string | null;
      }
    | {
        role: string | null;
      }[]
    | null;
};

function getDepartmentName(employee: EmployeeAnalyticsItem) {
  const department = Array.isArray(employee.departments)
    ? employee.departments[0]
    : employee.departments;

  return department?.name ?? 'Unassigned';
}

function getLinkedProfileRole(employee: EmployeeAnalyticsItem) {
  const linkedProfile = Array.isArray(employee.profiles)
    ? employee.profiles[0]
    : employee.profiles;

  return linkedProfile?.role ?? null;
}

function getVisibleEmployeesForScope(
  employees: EmployeeAnalyticsItem[],
  scope: AnalyticsInsightScope
) {
  if (scope === 'admin') {
    return employees;
  }

  return employees.filter((employee) => {
    const linkedRole = getLinkedProfileRole(employee);

    return !employee.profile_id || linkedRole === 'employee';
  });
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
  statusCounts: Record<string, number>,
  finalDecisionCounts: Record<string, number>
) {
  return {
    total: Object.values(statusCounts).reduce((sum, count) => sum + count, 0),
    scheduled: statusCounts.scheduled ?? 0,
    completed: statusCounts.completed ?? 0,
    pending_feedback: statusCounts.completed ?? 0,
    selected: finalDecisionCounts.selected ?? 0,
    rejected: finalDecisionCounts.rejected ?? 0,
  };
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

export async function regenerateAnalyticsInsight(
  scope: AnalyticsInsightScope
): Promise<ActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      message: 'You must be logged in to regenerate analytics insight.',
    };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'hr'].includes(profile.role)) {
    return {
      success: false,
      message: 'Only Admin and HR users can regenerate analytics insight.',
    };
  }

  if (!['admin', 'hr'].includes(scope)) {
    return {
      success: false,
      message: 'Invalid analytics scope.',
    };
  }

  if (scope === 'admin' && profile.role !== 'admin') {
    return {
      success: false,
      message: 'Only Admin users can regenerate Admin analytics insight.',
    };
  }

  const { data: applications } = await supabase
    .from('job_applications')
    .select('status');

  const { data: interviews } = await supabase
    .from('interviews')
    .select('status, final_decision');

  const { data: employees, error: employeesError } = await supabase
    .from('employees')
    .select(
      `
      employment_status,
      performance_score,
      profile_id,
      departments (
        name
      ),
      profiles!employees_profile_id_fkey (
        role
      )
    `
    );

  if (employeesError) {
    return {
      success: false,
      message: employeesError.message,
    };
  }

  const employeeItems = getVisibleEmployeesForScope(
    (employees ?? []) as EmployeeAnalyticsItem[],
    scope
  );

  const applicationStatusCounts = countBy(
    (applications ?? []) as { status: string }[],
    'status'
  );

  const interviewStatusCounts = countBy(
    (interviews ?? []) as { status: string; final_decision: string | null }[],
    'status'
  );

  const interviewFinalDecisionCounts = countBy(
    (interviews ?? []) as { status: string; final_decision: string | null }[],
    'final_decision'
  );

  const metrics: AnalyticsMetrics = {
    applications: buildApplicationMetrics(applicationStatusCounts),
    interviews: buildInterviewMetrics(
      interviewStatusCounts,
      interviewFinalDecisionCounts
    ),
    workforce: buildWorkforceMetrics(employeeItems),
  };

  const insight = await generateAnalyticsInsight(metrics);

  const { error: insertError } = await supabase
    .from('ai_analytics_insights')
    .insert({
      scope,
      summary: insight.summary,
      recruitment_insights: insight.recruitment_insights,
      workforce_insights: insight.workforce_insights,
      suggested_actions: insight.suggested_actions,
      generated_by: profile.id,
    });

  if (insertError) {
    return {
      success: false,
      message: insertError.message,
    };
  }

  if (scope === 'admin') {
    revalidatePath('/dashboard/admin/analytics');
  }

  if (scope === 'hr') {
    revalidatePath('/dashboard/hr/analytics');
  }

  return {
    success: true,
    message: 'AI analytics insight regenerated.',
  };
}