'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  generateEmployeeGrowthInsight,
  type EmployeeGrowthInsightInput,
} from '@/lib/ai/employeeGrowthInsights';

type ActionState = {
  success: boolean;
  message: string;
};

export async function regenerateEmployeeGrowthInsight(): Promise<ActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      message: 'You must be logged in to regenerate your growth insight.',
    };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'employee') {
    return {
      success: false,
      message: 'Only employee users can regenerate personal growth insight.',
    };
  }

  const { data: employee, error: employeeError } = await supabase
    .from('employees')
    .select(
      `
      id,
      full_name,
      email,
      job_title,
      employment_status,
      employment_type,
      location,
      joined_at,
      performance_score,
      departments (
        name
      )
    `
    )
    .eq('profile_id', profile.id)
    .maybeSingle();

  if (employeeError) {
    return {
      success: false,
      message: employeeError.message,
    };
  }

  if (!employee) {
    return {
      success: false,
      message: 'No employee profile is linked to this account yet.',
    };
  }

  const employeeItem = employee as EmployeeGrowthInsightInput & {
    id: string;
  };

  const insight = await generateEmployeeGrowthInsight(employeeItem);

  const { error: insertError } = await supabase
    .from('ai_employee_insights')
    .insert({
      employee_id: employeeItem.id,
      summary: insight.summary,
      strengths: insight.strengths,
      focus_areas: insight.focus_areas,
      suggested_actions: insight.suggested_actions,
      generated_by: profile.id,
    });

  if (insertError) {
    return {
      success: false,
      message: insertError.message,
    };
  }

  revalidatePath('/dashboard/employee');

  return {
    success: true,
    message: 'Your AI growth insight was regenerated.',
  };
}