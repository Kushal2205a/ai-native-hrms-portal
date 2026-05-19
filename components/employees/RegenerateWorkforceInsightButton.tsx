'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { regenerateWorkforceInsight } from '@/lib/actions/employeeInsights';

type RegenerateWorkforceInsightButtonProps = {
  scope: 'admin' | 'hr';
};

export function RegenerateWorkforceInsightButton({
  scope,
}: RegenerateWorkforceInsightButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleRegenerate() {
    startTransition(async () => {
      const result = await regenerateWorkforceInsight(scope);

      if (!result.success) {
        alert(result.message);
        return;
      }

      router.refresh();
    });
  }

  return (
    <button
      type="button"
      className="employee-ai-regenerate-button"
      onClick={handleRegenerate}
      disabled={isPending}
    >
      {isPending ? 'Generating...' : 'Regenerate insight'}
    </button>
  );
}