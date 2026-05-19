'use client';

import { useState, useTransition } from 'react';
import { runApplicationScreening } from '@/lib/actions/screening';

interface ApplicationScreeningActionsProps {
  applicationId: string;
  hasScreening: boolean;
}

export default function ApplicationScreeningActions({
  applicationId,
  hasScreening,
}: ApplicationScreeningActionsProps) {
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleRunScreening() {
    setError('');

    startTransition(async () => {
      try {
        await runApplicationScreening(applicationId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not run AI screening.');
      }
    });
  }

  return (
    <div className="screening-actions">
      <button type="button" disabled={isPending} onClick={handleRunScreening}>
        {isPending ? 'Screening...' : hasScreening ? 'Rerun AI' : 'Run AI'}
      </button>

      {error ? <p className="screening-action-error">{error}</p> : null}
    </div>
  );
}