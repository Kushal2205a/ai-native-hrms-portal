'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { runApplicationScreening } from '@/lib/actions/screening';

type GenerateScreeningButtonProps = {
  applicationId: string;
  hasScreening?: boolean;
};

export function GenerateScreeningButton({
  applicationId,
  hasScreening = false,
}: GenerateScreeningButtonProps) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    setMessage('');

    startTransition(async () => {
      const result = await runApplicationScreening(applicationId);

      if (result?.success === false) {
        setMessage('Could not generate screening.');
        return;
      }

      setMessage(
        hasScreening
          ? 'AI screening regenerated.'
          : 'AI screening generated.'
      );

      router.refresh();
    });
  }

  return (
    <div className="screening-action">
      <button type="button" onClick={handleClick} disabled={isPending}>
        {isPending
          ? 'Generating...'
          : hasScreening
            ? 'Regenerate AI Screening'
            : 'Generate AI Screening'}
      </button>

      {message ? <p>{message}</p> : null}
    </div>
  );
}