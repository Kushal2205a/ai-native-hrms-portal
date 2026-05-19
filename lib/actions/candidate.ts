'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
async function requireCandidate() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    redirect('/login');
  }

  if (profile.role !== 'candidate') {
    redirect('/login');
  }

  return { supabase, userId: user.id };
}

export interface UpsertCandidateProfileInput {
  resume_url?: string | null;
  resume_text?: string | null;
  parsed_resume_json?: Record<string, unknown> | null;
  skills?: string[];
  experience_years?: number | null;
  education?: string | null;
  portfolio_url?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
}

export async function upsertCandidateProfile(input: UpsertCandidateProfileInput) {
  const { supabase, userId } = await requireCandidate();

  const { error } = await supabase.from('candidate_profiles').upsert(
    {
      user_id: userId,
      resume_url: input.resume_url ?? null,
      resume_text: input.resume_text ?? null,
      parsed_resume_json: input.parsed_resume_json ?? null,
      skills: input.skills ?? [],
      experience_years: input.experience_years ?? null,
      education: input.education?.trim() || null,
      portfolio_url: input.portfolio_url?.trim() || null,
      linkedin_url: input.linkedin_url?.trim() || null,
      github_url: input.github_url?.trim() || null,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'user_id',
    }
  );

  if (error) throw new Error(error.message);

  revalidatePath('/dashboard/candidate');
  revalidatePath('/recruitment/applications');
}

export interface ApplyToJobInput {
  job_id: string;
  cover_note?: string | null;
}

export async function applyToJob(input: ApplyToJobInput) {
  const { supabase, userId } = await requireCandidate();

  const { data: job, error: jobError } = await supabase
    .from('job_postings')
    .select('id, status')
    .eq('id', input.job_id)
    .single();

  if (jobError || !job) {
    throw new Error('Job not found.');
  }

  if (job.status !== 'open') {
    throw new Error('This job is not open for applications.');
  }

  const { data: candidateProfile, error: candidateError } = await supabase
    .from('candidate_profiles')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (candidateError || !candidateProfile) {
    throw new Error('Complete your candidate profile before applying.');
  }

  const { data: application, error } = await supabase
    .from('job_applications')
    .insert({
      job_id: input.job_id,
      candidate_id: candidateProfile.id,
      status: 'applied',
      source: 'direct',
      cover_note: input.cover_note?.trim() || null,
    })
    .select('id')
    .single();

  if (error || !application) {
    if (error?.code === '23505') {
      throw new Error('You have already applied to this job.');
    }

    throw new Error(error?.message ?? 'Could not submit application.');
  }

  revalidatePath('/jobs');
  revalidatePath(`/jobs/${input.job_id}`);
  revalidatePath('/recruitment/applications');
  revalidatePath('/dashboard/candidate');
}

export async function getCandidateApplicationForJob(jobId: string) {
  const { supabase, userId } = await requireCandidate();

  const { data: candidateProfile } = await supabase
    .from('candidate_profiles')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (!candidateProfile) return null;

  const { data: application } = await supabase
    .from('job_applications')
    .select('id, status, created_at')
    .eq('job_id', jobId)
    .eq('candidate_id', candidateProfile.id)
    .maybeSingle();

  return application;
}