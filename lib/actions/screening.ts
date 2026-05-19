'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { runNvidiaChatCompletion } from '@/lib/ai/nvidia';
import type { ScreeningRecommendation } from '@/types/database';

type ScreeningPayload = {
  score: number;
  recommendation: ScreeningRecommendation;
  summary: string;
  strengths: string[];
  concerns: string[];
};

function extractJson(text: string) {
  const cleaned = text
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim();

  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');

  if (start === -1 || end === -1) {
    throw new Error('AI response did not contain JSON.');
  }

  return cleaned.slice(start, end + 1);
}

function validateScreeningPayload(payload: unknown): ScreeningPayload {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid AI screening response.');
  }

  const data = payload as Partial<ScreeningPayload>;

  const allowedRecommendations: ScreeningRecommendation[] = [
    'strong_match',
    'possible_match',
    'weak_match',
  ];

  if (typeof data.score !== 'number' || data.score < 0 || data.score > 100) {
    throw new Error('AI screening score is invalid.');
  }

  if (
    !data.recommendation ||
    !allowedRecommendations.includes(data.recommendation)
  ) {
    throw new Error('AI screening recommendation is invalid.');
  }

  if (typeof data.summary !== 'string') {
    throw new Error('AI screening summary is invalid.');
  }

  if (!Array.isArray(data.strengths)) {
    throw new Error('AI screening strengths are invalid.');
  }

  if (!Array.isArray(data.concerns)) {
    throw new Error('AI screening concerns are invalid.');
  }

  return {
    score: Math.round(data.score),
    recommendation: data.recommendation,
    summary: data.summary,
    strengths: data.strengths.map(String),
    concerns: data.concerns.map(String),
  };
}

export async function runApplicationScreeningInternal(applicationId: string) {
  const supabase = await createClient();

  const { data: application, error: applicationError } = await supabase
    .from('job_applications')
    .select(
      `
      id,
      job_id,
      candidate_id,
      cover_note,
      status,
      job_postings (
        id,
        title,
        description,
        location,
        employment_type,
        required_skills
      ),
      candidate_profiles (
        id,
        skills,
        experience_years,
        education,
        resume_text
      )
    `
    )
    .eq('id', applicationId)
    .single();

  if (applicationError || !application) {
    throw new Error(applicationError?.message ?? 'Application not found.');
  }

  const job = Array.isArray(application.job_postings)
    ? application.job_postings[0]
    : application.job_postings;

  const candidate = Array.isArray(application.candidate_profiles)
    ? application.candidate_profiles[0]
    : application.candidate_profiles;

  if (!job || !candidate) {
    throw new Error('Application is missing job or candidate profile data.');
  }

  const prompt = `
You are an HR recruitment screening assistant.

Evaluate the candidate against the job.

Return ONLY valid JSON with this exact shape:
{
  "score": number between 0 and 100,
  "recommendation": "strong_match" | "possible_match" | "weak_match",
  "summary": "short HR-friendly summary",
  "strengths": ["strength 1", "strength 2"],
  "concerns": ["concern 1", "concern 2"]
}

Scoring guidance:
- 80-100 = strong_match
- 50-79 = possible_match
- 0-49 = weak_match

Job:
Title: ${job.title}
Description: ${job.description}
Location: ${job.location ?? 'Not specified'}
Employment type: ${job.employment_type ?? 'Not specified'}
Required skills: ${(job.required_skills ?? []).join(', ') || 'Not specified'}

Candidate:
Skills: ${(candidate.skills ?? []).join(', ') || 'Not specified'}
Experience years: ${candidate.experience_years ?? 'Not specified'}
Education: ${candidate.education ?? 'Not specified'}
Resume text: ${candidate.resume_text ?? 'Not provided'}
Cover note: ${application.cover_note ?? 'Not provided'}
`;

  const aiResponse = await runNvidiaChatCompletion({
    messages: [
      {
        role: 'system',
        content:
          'You are a careful HR screening assistant. You must return only valid JSON. Do not include markdown.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.2,
    max_tokens: 1200,
  });

  const jsonText = extractJson(aiResponse);
  const parsed = JSON.parse(jsonText);
  const screening = validateScreeningPayload(parsed);

  const { error: upsertError } = await supabase
    .from('application_screenings')
    .upsert(
      {
        application_id: application.id,
        score: screening.score,
        recommendation: screening.recommendation,
        summary: screening.summary,
        strengths: screening.strengths,
        concerns: screening.concerns,
        model: 'google/gemma-3n-e4b-it',
        raw_response: aiResponse,
        updated_at: new Date().toISOString(),
        },
      {
        onConflict: 'application_id',
      }
    );

  if (upsertError) {
    throw new Error(upsertError.message);
  }

  revalidatePath('/dashboard/hr/applications');
  revalidatePath('/dashboard/admin/applications');
  revalidatePath('/dashboard/candidate');

  return { success: true };
}

export async function runApplicationScreening(applicationId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('You must be logged in.');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'hr'].includes(profile.role)) {
    throw new Error('You do not have permission to run screening.');
  }

  return runApplicationScreeningInternal(applicationId);
}