'use server';
import { fetchMockInterviewTranscript } from '@/lib/interviews/mockTranscript';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { generateInterviewSlots } from '@/lib/interviews/slots';

type ScheduleInterviewInput = {
  applicationId: string;
  startsAt: string;
};
type InterviewRecommendation = 'strong_hire' | 'hire' | 'hold' | 'reject';
type FinalDecision = 'selected' | 'rejected' | 'hold';

function getApplicationStatusFromDecision(decision: FinalDecision) {
  if (decision === 'selected') return 'selected';
  if (decision === 'rejected') return 'rejected';

  return 'interview_completed';
}

function buildMockAIFeedback(transcript: string): {
  aiFeedback: string;
  aiScore: number;
  aiRecommendation: InterviewRecommendation;
} {
  const hasDashboardExperience = transcript.toLowerCase().includes('dashboard');
  const hasReactExperience = transcript.toLowerCase().includes('react');
  const hasAccessibility = transcript.toLowerCase().includes('accessibility');

  const score =
    78 +
    (hasDashboardExperience ? 7 : 0) +
    (hasReactExperience ? 5 : 0) +
    (hasAccessibility ? 4 : 0);

  return {
    aiScore: Math.min(score, 94),
    aiRecommendation: 'hire',
    aiFeedback: [
      'AI Interview Feedback',
      '',
      'Summary',
      'The candidate demonstrated strong frontend experience with React, Next.js, TypeScript, dashboard-heavy workflows, and reusable component systems. They explained practical approaches to performance optimization, typed component design, and handling complex review interfaces.',
      '',
      'Strengths',
      '- Strong alignment with the role’s frontend stack and dashboard requirements.',
      '- Clear understanding of scalable UI structure, including separating data fetching, state handling, and presentation.',
      '- Good practical experience with performance optimization for large dashboard views.',
      '- Shows ownership mindset by clarifying workflows, shipping the smallest useful version, and iterating.',
      '- Mentions accessibility practices such as keyboard navigation, semantic HTML, focus states, and contrast.',
      '',
      'Concerns',
      '- The transcript does not show deep discussion of backend integration or database design.',
      '- No detailed example of conflict handling or cross-functional stakeholder management.',
      '- Final evaluation would benefit from a short live coding or system design follow-up.',
      '',
      'Recommendation',
      'Hire. The candidate appears well suited for a frontend-heavy HRMS role involving dashboards, workflow screens, and polished user experience.',
    ].join('\n'),
  };
}

export async function generateInterviewAIFeedback(interviewId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('You must be logged in to generate interview feedback.');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'hr'].includes(profile.role)) {
    throw new Error('Only HR/Admin can generate interview feedback.');
  }

  const transcript = await fetchMockInterviewTranscript();
  const aiResult = buildMockAIFeedback(transcript);

  const { error } = await supabase
    .from('interviews')
    .update({
      transcript,
      ai_feedback: aiResult.aiFeedback,
      ai_score: aiResult.aiScore,
      ai_recommendation: aiResult.aiRecommendation,
    })
    .eq('id', interviewId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/dashboard/admin/interviews');
  revalidatePath('/dashboard/hr/interviews');
}

export async function saveInterviewFinalDecision(
  interviewId: string,
  finalDecision: FinalDecision
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('You must be logged in to save the final decision.');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'hr'].includes(profile.role)) {
    throw new Error('Only HR/Admin can save final decisions.');
  }

  const { data: interview, error: interviewError } = await supabase
  .from('interviews')
  .select('id, application_id')
  .eq('id', interviewId)
  .single();

  if (interviewError || !interview) {
    throw new Error('Interview not found.');
  }

  if (!interview.application_id) {
    throw new Error('This interview is not linked to an application.');
  }


  const applicationStatus = getApplicationStatusFromDecision(finalDecision);

  const { error: interviewUpdateError } = await supabase
  .from('interviews')
  .update({
    status: 'completed',
    final_decision: finalDecision,
  })
  .eq('id', interviewId);

  if (interviewUpdateError) {
    throw new Error(interviewUpdateError.message);
  }

  const { data: updatedApplications, error: applicationUpdateError } = await supabase
  .from('job_applications')
  .update({
    status: applicationStatus,
  })
  .eq('id', interview.application_id)
  .select('id');

  if (applicationUpdateError) {
    throw new Error(applicationUpdateError.message);
  }

  if (!updatedApplications?.length) {
    throw new Error('Final decision saved, but no matching application was updated.');
  }

  revalidatePath('/dashboard/admin/interviews');
  revalidatePath('/dashboard/hr/interviews');
  revalidatePath('/dashboard/candidate');
  revalidatePath('/dashboard/candidate/interviews');
}
export async function getAvailableInterviewSlots(applicationId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('You must be logged in to choose an interview slot.');
  }

  const { data: application, error: applicationError } = await supabase
    .from('job_applications')
    .select(
      `
      id,
      job_id,
      candidate_id,
      status,
      candidate_profiles (
        user_id
      )
    `
    )
    .eq('id', applicationId)
    .single();

  if (applicationError || !application) {
    throw new Error('Application not found.');
  }

  const candidateProfile = Array.isArray(application.candidate_profiles)
    ? application.candidate_profiles[0]
    : application.candidate_profiles;

  if (candidateProfile?.user_id !== user.id) {
    throw new Error('You can only choose slots for your own application.');
  }

  if (application.status !== 'shortlisted') {
    throw new Error('Interview slots are available only after shortlisting.');
  }

  const { data: existingInterview } = await supabase
    .from('interviews')
    .select('id')
    .eq('application_id', applicationId)
    .maybeSingle();

  if (existingInterview) {
    return [];
  }

  const { data: bookedInterviews, error: bookedError } = await supabase
    .from('interviews')
    .select('scheduled_at, duration_minutes')
    .eq('status', 'scheduled');

  if (bookedError) {
    throw new Error('Could not load booked interview slots.');
  }

  const busySlots =
    bookedInterviews?.map((interview) => {
      const startsAt = new Date(interview.scheduled_at);
      const endsAt = new Date(startsAt);
      endsAt.setMinutes(endsAt.getMinutes() + (interview.duration_minutes ?? 30));

      return {
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
      };
    }) ?? [];

  return generateInterviewSlots(busySlots);
}

export async function scheduleInterview(input: ScheduleInterviewInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('You must be logged in to schedule an interview.');
  }

  const { data: application, error: applicationError } = await supabase
    .from('job_applications')
    .select(
      `
      id,
      job_id,
      candidate_id,
      status,
      candidate_profiles (
        user_id
      )
    `
    )
    .eq('id', input.applicationId)
    .single();

  if (applicationError || !application) {
    throw new Error('Application not found.');
  }

  const candidateProfile = Array.isArray(application.candidate_profiles)
    ? application.candidate_profiles[0]
    : application.candidate_profiles;

  if (candidateProfile?.user_id !== user.id) {
    throw new Error('You can only schedule your own interview.');
  }

  if (application.status !== 'shortlisted') {
    throw new Error('Only shortlisted applications can schedule interviews.');
  }

  const availableSlots = await getAvailableInterviewSlots(input.applicationId);

  const selectedSlot = availableSlots.find(
    (slot) => slot.startsAt === input.startsAt
  );

  if (!selectedSlot) {
    throw new Error('This interview slot is no longer available.');
  }

  const { error: insertError } = await supabase.from('interviews').insert({
    application_id: application.id,
    job_id: application.job_id,
    candidate_id: application.candidate_id,
    scheduled_at: selectedSlot.startsAt,
    duration_minutes: 30,
    mode: 'online',
    status: 'scheduled',
  });

  if (insertError) {
    throw new Error(insertError.message);
  }

  const { error: updateError } = await supabase
    .from('job_applications')
    .update({
      status: 'interview_scheduled',
    })
    .eq('id', application.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  revalidatePath('/dashboard/candidate');
  revalidatePath('/dashboard/admin/interviews');
  revalidatePath('/dashboard/hr/interviews');
}
export async function updateInterviewMeetingLink(
  interviewId: string,
  meetingLink: string
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('You must be logged in to update the meeting link.');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'hr'].includes(profile.role)) {
    throw new Error('Only HR/Admin can update meeting links.');
  }

  const cleanedLink = meetingLink.trim();

  if (!cleanedLink) {
    throw new Error('Meeting link is required.');
  }

  if (!cleanedLink.startsWith('https://')) {
    throw new Error('Meeting link must start with https://');
  }

  const { error } = await supabase
    .from('interviews')
    .update({
      meeting_link: cleanedLink,
    })
    .eq('id', interviewId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/dashboard/admin/interviews');
  revalidatePath('/dashboard/hr/interviews');
  revalidatePath('/dashboard/candidate/interviews');
  revalidatePath('/dashboard/candidate');
}