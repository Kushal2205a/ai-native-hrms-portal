'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { EmploymentType, JobStatus } from '@/types/database';

// ── helpers ──────────────────────────────────────────────────────────────────

async function requireHROrAdmin() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'hr'].includes(profile.role)) {
    redirect('/login');
  }

  return { supabase, userId: user.id };
}

// ── create ────────────────────────────────────────────────────────────────────

export interface CreateJobInput {
  title: string;
  description: string;
  department_id: string | null;
  required_skills: string[];
  location: string | null;
  employment_type: EmploymentType | null;
  status: JobStatus;
}

export async function createJob(input: CreateJobInput) {
  const { supabase, userId } = await requireHROrAdmin();

  const { error } = await supabase.from('job_postings').insert({
    title:           input.title.trim(),
    description:     input.description.trim(),
    department_id:   input.department_id || null,
    required_skills: input.required_skills,
    location:        input.location?.trim() || null,
    employment_type: input.employment_type || null,
    status:          input.status,
    created_by:      userId,
  });

  if (error) throw new Error(error.message);

  revalidatePath('/recruitment/jobs');
  revalidatePath('/jobs');
}

// ── update ────────────────────────────────────────────────────────────────────

export interface UpdateJobInput extends CreateJobInput {
  id: string;
}

export async function updateJob(input: UpdateJobInput) {
  const { supabase } = await requireHROrAdmin();

  const { error } = await supabase
    .from('job_postings')
    .update({
      title:           input.title.trim(),
      description:     input.description.trim(),
      department_id:   input.department_id || null,
      required_skills: input.required_skills,
      location:        input.location?.trim() || null,
      employment_type: input.employment_type || null,
      status:          input.status,
    })
    .eq('id', input.id);

  if (error) throw new Error(error.message);

  revalidatePath('/recruitment/jobs');
  revalidatePath('/jobs');
  revalidatePath(`/jobs/${input.id}`);
}

// ── close ─────────────────────────────────────────────────────────────────────

export async function closeJob(id: string) {
  const { supabase } = await requireHROrAdmin();

  const { error } = await supabase
    .from('job_postings')
    .update({ status: 'closed' })
    .eq('id', id);

  if (error) throw new Error(error.message);

  revalidatePath('/recruitment/jobs');
  revalidatePath('/jobs');
  revalidatePath(`/jobs/${id}`);
}