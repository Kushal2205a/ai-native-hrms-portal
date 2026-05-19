'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateEmployeeRequestStatus } from '@/lib/actions/manageEmployeeRequests';

type EmployeeRequestReviewFormProps = {
  requestId: string;
  currentStatus: string;
  currentResponse: string | null;
};

const statuses = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'in_review', label: 'In review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function EmployeeRequestReviewForm({
  requestId,
  currentStatus,
  currentResponse,
}: EmployeeRequestReviewFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setMessage('');

    startTransition(async () => {
      const result = await updateEmployeeRequestStatus(formData);

      setMessage(result.message);

      if (result.success) {
        router.refresh();
      }
    });
  }

  return (
    <form action={handleSubmit} className="employee-request-review-form">
      <input type="hidden" name="request_id" value={requestId} />

      <label>
        <span>Status</span>
        <select name="status" defaultValue={currentStatus}>
          {statuses.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>HR response</span>
        <textarea
          name="hr_response"
          rows={3}
          defaultValue={currentResponse ?? ''}
          placeholder="Add a short response for the employee."
        />
      </label>

      <div className="employee-request-review-footer">
        <p>{message}</p>

        <button type="submit" disabled={isPending}>
          {isPending ? 'Updating...' : 'Update request'}
        </button>
      </div>
    </form>
  );
}