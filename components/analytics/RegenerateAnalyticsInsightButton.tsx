'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  regenerateAnalyticsInsight,
} from '@/lib/actions/analyticsInsights';
import type { AnalyticsInsightScope } from '@/lib/ai/analyticsInsights';

type RegenerateAnalyticsInsightButtonProps = {
  scope: AnalyticsInsightScope;
};

export function RegenerateAnalyticsInsightButton({
  scope,
}: RegenerateAnalyticsInsightButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleRegenerate() {
    startTransition(async () => {
      const result = await regenerateAnalyticsInsight(scope);

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
      className="analytics-ai-regenerate-button"
      onClick={handleRegenerate}
      disabled={isPending}
    >
      {isPending ? 'Generating...' : 'Regenerate insight'}
    </button>
  );
}