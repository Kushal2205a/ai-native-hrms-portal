'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

type ActionState = {
  success: boolean;
  message: string;
};

const statuses = [
  'submitted',
  'in_review',
  'approved',
  'rejected',
  'resolved',
  'cancelled',
] as const;

type RequestStatus = (typeof statuses)[number];

function isRequestStatus(value: FormDataEntryValue | null): value is RequestStatus {
  return typeof value === 'string' && statuses.includes(value as RequestStatus);
}

function getStringValue(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

export async function updateEmployeeRequestStatus(
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      message: 'You must be logged in to update requests.',
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
      message: 'Only HR or Admin users can update employee requests.',
    };
  }

  const requestId = getStringValue(formData, 'request_id');
  const statusValue = formData.get('status');
  const hrResponse = getStringValue(formData, 'hr_response');

  if (!requestId) {
    return {
      success: false,
      message: 'Missing request id.',
    };
  }

  if (!isRequestStatus(statusValue)) {
    return {
      success: false,
      message: 'Choose a valid request status.',
    };
  }

  const { error } = await supabase
    .from('employee_requests')
    .update({
      status: statusValue,
      hr_response: hrResponse || null,
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  revalidatePath('/dashboard/hr/requests');
  revalidatePath('/dashboard/admin/requests');
  revalidatePath('/employee/requests');

  return {
    success: true,
    message: 'Request updated.',
  };
}