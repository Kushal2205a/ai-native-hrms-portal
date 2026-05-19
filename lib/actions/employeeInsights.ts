'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
    generateWorkforceInsight,
    type EmployeeInsightInput,
} from '@/lib/ai/employeeInsights';

type ActionState = {
    success: boolean;
    message: string;
};
type InsightScope = 'admin' | 'hr';
export async function regenerateWorkforceInsight(
    scope: InsightScope
): Promise<ActionState> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return {
            success: false,
            message: 'You must be logged in to regenerate workforce insight.',
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
            message: 'Only Admin and HR users can regenerate workforce insight.',
        };
    }

    if (!['admin', 'hr'].includes(scope)) {
        return {
            success: false,
            message: 'Invalid insight scope.',
        };
    }

    if (scope === 'admin' && profile.role !== 'admin') {
        return {
            success: false,
            message: 'Only Admin users can regenerate Admin workforce insight.',
        };
    }

    const employeeQuery = supabase
        .from('employees')
        .select(
            `
        full_name,
        job_title,
        employment_status,
        employment_type,
        location,
        joined_at,
        performance_score,
        profile_id,
        departments (
        name
        ),
        profiles (
        role
        )
    `
        )
        .order('full_name', { ascending: true });

    const { data: employees, error: employeesError } = await employeeQuery;

    if (employeesError) {
        return {
            success: false,
            message: employeesError.message,
        };
    }

    const allEmployeeItems = (employees ?? []) as (EmployeeInsightInput & {
        profile_id: string | null;
        profiles:
        | {
            role: string | null;
        }
        | {
            role: string | null;
        }[]
        | null;
    })[];

    const employeeItems =
        scope === 'hr'
            ? allEmployeeItems.filter((employee) => {
                const linkedProfile = Array.isArray(employee.profiles)
                    ? employee.profiles[0]
                    : employee.profiles;

                return !employee.profile_id || linkedProfile?.role === 'employee';
            })
            : allEmployeeItems;

    if (!employeeItems.length) {
        return {
            success: false,
            message: 'No employees found to analyze.',
        };
    }

    const insight = await generateWorkforceInsight(employeeItems);

    const { error: insertError } = await supabase
        .from('ai_workforce_insights')
        .insert({
            scope,
            summary: insight.summary,
            strengths: insight.strengths,
            attention_areas: insight.attention_areas,
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
        revalidatePath('/dashboard/admin/employees');
    }

    if (scope === 'hr') {
        revalidatePath('/dashboard/hr/employees');
    }

    return {
        success: true,
        message: 'AI workforce insight regenerated.',
    };
}