'use client';

import { useState, useTransition } from 'react';
import {
  generateInterviewAIFeedback,
  saveInterviewFinalDecision,
} from '@/lib/actions/interviews';

type FinalDecision = 'selected' | 'rejected' | 'hold';

interface InterviewFeedbackPanelProps {
  interviewId: string;
  aiFeedback?: string | null;
  aiScore?: number | null;
  aiRecommendation?: string | null;
  finalDecision?: string | null;
  status: string;
}

function formatValue(value?: string | null) {
  return value ? value.replaceAll('_', ' ') : 'Pending';
}

export default function InterviewFeedbackPanel({
  interviewId,
  aiFeedback,
  aiScore,
  aiRecommendation,
  finalDecision,
  status,
}: InterviewFeedbackPanelProps) {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleGenerateFeedback() {
    setError('');
    setSuccess('');

    startTransition(async () => {
      try {
        await generateInterviewAIFeedback(interviewId);
        setSuccess('AI feedback generated.');
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Could not generate AI feedback.'
        );
      }
    });
  }

  function handleDecision(decision: FinalDecision) {
    setError('');
    setSuccess('');

    startTransition(async () => {
      try {
        await saveInterviewFinalDecision(interviewId, decision);
        setSuccess('Final decision saved.');
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Could not save final decision.'
        );
      }
    });
  }

  return (
    <div className="interview-feedback-panel">
      <div className="interview-feedback-header">
        <div>
          <p className="s-tag interview-feedback-tag">AI feedback</p>
          <p className="interview-feedback-title">
            Transcript-based evaluation
          </p>
        </div>

        <button
          type="button"
          className="interview-feedback-generate"
          disabled={isPending}
          onClick={handleGenerateFeedback}
        >
          {isPending ? 'Generating...' : aiFeedback ? 'Regenerate' : 'Generate'}
        </button>
      </div>

      {aiFeedback ? (
        <div className="interview-feedback-result">
          <div className="interview-feedback-stats">
            <div className="interview-feedback-stat">
              <span>Score</span>
              <strong>{aiScore ?? '—'}</strong>
            </div>

            <div className="interview-feedback-stat">
              <span>Recommendation</span>
              <strong>{formatValue(aiRecommendation)}</strong>
            </div>

            <div className="interview-feedback-stat">
              <span>Decision</span>
              <strong>{formatValue(finalDecision)}</strong>
            </div>
          </div>

          <pre className="interview-feedback-text">{aiFeedback}</pre>

          <div className="interview-decision-actions">
            <button
              type="button"
              className="interview-decision-button"
              disabled={isPending || status === 'completed'}
              onClick={() => handleDecision('selected')}
            >
              Select
            </button>

            <button
              type="button"
              className="interview-decision-button"
              disabled={isPending || status === 'completed'}
              onClick={() => handleDecision('hold')}
            >
              Hold
            </button>

            <button
              type="button"
              className="interview-decision-button interview-decision-button--danger"
              disabled={isPending || status === 'completed'}
              onClick={() => handleDecision('rejected')}
            >
              Reject
            </button>
          </div>
        </div>
      ) : (
        <p className="interview-feedback-empty">
          Generate AI feedback after the interview. The system will fetch the
          mock meeting transcript and evaluate the candidate.
        </p>
      )}

      {error ? <p className="form-error interview-feedback-message">{error}</p> : null}
      {success ? (
        <p className="form-success interview-feedback-message">{success}</p>
      ) : null}
    </div>
  );
}