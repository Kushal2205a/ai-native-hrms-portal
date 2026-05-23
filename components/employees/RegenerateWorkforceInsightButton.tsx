'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { regenerateWorkforceInsight } from '@/lib/actions/employeeInsights';

type RegenerateWorkforceInsightButtonProps = {
  scope: 'admin' | 'hr';
};

export function RegenerateWorkforceInsightButton({
  scope,
}: RegenerateWorkforceInsightButtonProps) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleRegenerate() {
    try {
      setIsGenerating(true);

      const result = await regenerateWorkforceInsight(scope);

      if (!result.success) {
        alert(result.message);
        return;
      }

      router.refresh();
    } catch (error) {
      console.error(error);
      alert('Failed to regenerate workforce insight.');
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <button
      type="button"
      className="employee-ai-regenerate-button"
      onClick={handleRegenerate}
      disabled={isGenerating}
    >
      {isGenerating ? 'Generating...' : 'Regenerate insight'}
    </button>
  );
}