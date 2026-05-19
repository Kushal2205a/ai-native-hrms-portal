'use client';

import { useState, useTransition } from 'react';
import { updateApplicationStatus } from '@/lib/actions/application';

interface ApplicationStatusActionsProps {
  applicationId: string;
  currentStatus: string;
}

export default function ApplicationStatusActions({
  applicationId,
  currentStatus,
}: ApplicationStatusActionsProps) {
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleUpdate(status: 'shortlisted' | 'rejected') {
    setError('');

    startTransition(async () => {
      try {
        await updateApplicationStatus({
          applicationId,
          status,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not update application.');
      }
    });
  }

  return (
    <div className="application-actions">
      <div className="application-actions-row">
        <button
          type="button"
          disabled={isPending || currentStatus === 'shortlisted'}
          onClick={() => handleUpdate('shortlisted')}
        >
          Shortlist
        </button>

        <button
          type="button"
          disabled={isPending || currentStatus === 'rejected'}
          onClick={() => handleUpdate('rejected')}
          className="application-action-danger"
        >
          Reject
        </button>
      </div>

      {error ? <p className="application-action-error">{error}</p> : null}
    </div>
  );
}