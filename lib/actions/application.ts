'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

type ApplicationStatus = 'applied' | 'shortlisted' | 'rejected';

interface UpdateApplicationStatusInput {
  applicationId: string;
  status: ApplicationStatus;
}

export async function updateApplicationStatus({
  applicationId,
  status,
}: UpdateApplicationStatusInput) {
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
    throw new Error('You do not have permission to update applications.');
  }

  const { error } = await supabase
    .from('job_applications')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', applicationId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/dashboard/hr/applications');
  revalidatePath('/dashboard/admin/applications');

  return { success: true };
}