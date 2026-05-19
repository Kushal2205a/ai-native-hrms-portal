'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { regenerateEmployeeGrowthInsight } from '@/lib/actions/employeeGrowthInsights';

export function RegenerateEmployeeInsightButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleRegenerate() {
    startTransition(async () => {
      const result = await regenerateEmployeeGrowthInsight();

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
      className="employee-growth-regenerate-button"
      onClick={handleRegenerate}
      disabled={isPending}
    >
      {isPending ? 'Generating...' : 'Regenerate insight'}
    </button>
  );
}