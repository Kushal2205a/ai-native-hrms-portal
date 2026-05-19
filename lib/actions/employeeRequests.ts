'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

type ActionState = {
  success: boolean;
  message: string;
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

type RequestType = (typeof requestTypes)[number];
type Priority = (typeof priorities)[number];
type LeaveType = (typeof leaveTypes)[number];

function isRequestType(value: FormDataEntryValue | null): value is RequestType {
  return typeof value === 'string' && requestTypes.includes(value as RequestType);
}

function isPriority(value: FormDataEntryValue | null): value is Priority {
  return typeof value === 'string' && priorities.includes(value as Priority);
}

function isLeaveType(value: FormDataEntryValue | null): value is LeaveType {
  return typeof value === 'string' && leaveTypes.includes(value as LeaveType);
}

function getStringValue(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

function getDayCount(startDateValue: string, endDateValue: string) {
  const startDate = new Date(`${startDateValue}T00:00:00`);
  const endDate = new Date(`${endDateValue}T00:00:00`);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return null;
  }

  if (endDate < startDate) {
    return null;
  }

  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((endDate.getTime() - startDate.getTime()) / msPerDay) + 1;
}

function buildLeaveTitle(startDate: string, endDate: string) {
  if (startDate === endDate) {
    return `Leave request: ${startDate}`;
  }

  return `Leave request: ${startDate} to ${endDate}`;
}

export async function createEmployeeRequest(
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      message: 'You must be logged in to submit a request.',
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
      message: 'Only employee users can submit requests.',
    };
  }

  const { data: employee, error: employeeError } = await supabase
    .from('employees')
    .select('id')
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

  const requestTypeValue = formData.get('request_type');
  const priorityValue = formData.get('priority');

  if (!isRequestType(requestTypeValue)) {
    return {
      success: false,
      message: 'Choose a valid request type.',
    };
  }

  const requestType = requestTypeValue;
  const priority = isPriority(priorityValue) ? priorityValue : 'normal';

  if (requestType === 'leave') {
    const leaveTypeValue = formData.get('leave_type');
    const startDate = getStringValue(formData, 'start_date');
    const endDate = getStringValue(formData, 'end_date');
    const reason = getStringValue(formData, 'reason');

    if (!isLeaveType(leaveTypeValue)) {
      return {
        success: false,
        message: 'Choose a valid leave type.',
      };
    }

    if (!startDate || !endDate) {
      return {
        success: false,
        message: 'Choose a start date and end date.',
      };
    }

    const dayCount = getDayCount(startDate, endDate);

    if (!dayCount) {
      return {
        success: false,
        message: 'End date must be the same as or after start date.',
      };
    }

    if (!reason || reason.length < 5) {
      return {
        success: false,
        message: 'Add a short reason for your leave request.',
      };
    }

    const { data: request, error: requestError } = await supabase
      .from('employee_requests')
      .insert({
        employee_id: employee.id,
        request_type: 'leave',
        priority,
        title: buildLeaveTitle(startDate, endDate),
        description: reason,
      })
      .select('id')
      .single();

    if (requestError) {
      return {
        success: false,
        message: requestError.message,
      };
    }

    const { error: leaveError } = await supabase
      .from('leave_request_details')
      .insert({
        request_id: request.id,
        leave_type: leaveTypeValue,
        start_date: startDate,
        end_date: endDate,
        day_count: dayCount,
        reason,
      });

    if (leaveError) {
      return {
        success: false,
        message: leaveError.message,
      };
    }

    revalidatePath('/employee/requests');

    return {
      success: true,
      message: 'Leave request submitted.',
    };
  }

  const title = getStringValue(formData, 'title');
  const description = getStringValue(formData, 'description');

  if (!title || title.length < 3) {
    return {
      success: false,
      message: 'Add a request title.',
    };
  }

  if (!description || description.length < 5) {
    return {
      success: false,
      message: 'Add a short request description.',
    };
  }

  const { error: requestError } = await supabase
    .from('employee_requests')
    .insert({
      employee_id: employee.id,
      request_type: requestType,
      priority,
      title,
      description,
    });

  if (requestError) {
    return {
      success: false,
      message: requestError.message,
    };
  }

  revalidatePath('/employee/requests');

  return {
    success: true,
    message: 'Request submitted.',
  };
}