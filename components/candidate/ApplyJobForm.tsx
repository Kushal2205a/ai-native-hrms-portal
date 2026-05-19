'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { applyToJob } from '@/lib/actions/candidate';

interface ApplyJobFormProps {
  jobId: string;
  alreadyApplied: boolean;
  hasCandidateProfile: boolean;
}

export default function ApplyJobForm({
  jobId,
  alreadyApplied,
  hasCandidateProfile,
}: ApplyJobFormProps) {
  const router = useRouter();
  const [coverNote, setCoverNote] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError('');
    setSuccess('');

    if (!hasCandidateProfile) {
      setError('Complete your candidate profile before applying.');
      return;
    }

    if (alreadyApplied) {
      setError('You have already applied to this job.');
      return;
    }

    startTransition(async () => {
      try {
        await applyToJob({
          job_id: jobId,
          cover_note: coverNote,
        });

        setSuccess('Application submitted.');
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong.');
      }
    });
  }

  if (!hasCandidateProfile) {
    return (
      <div className="apply-panel">
        <p className="apply-panel-title">Profile required</p>
        <p className="apply-panel-copy">
          Complete your candidate profile before applying to this role.
        </p>
        <button
          type="button"
          className="apply-primary-btn"
          onClick={() => router.push('/dashboard/candidate/profile')}
        >
          Complete Profile
        </button>
      </div>
    );
  }

  if (alreadyApplied) {
    return (
      <div className="apply-panel">
        <p className="apply-panel-title">Application already submitted</p>
        <p className="apply-panel-copy">
          You have already applied to this role. Track the status from your candidate dashboard.
        </p>
        <button
          type="button"
          className="apply-secondary-btn"
          onClick={() => router.push('/dashboard/candidate')}
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <form className="apply-form" onSubmit={handleSubmit}>
      <label className="apply-field">
        <span>Cover Note</span>
        <textarea
          value={coverNote}
          onChange={(e) => setCoverNote(e.target.value)}
          placeholder="Optional: add a short note for the HR team."
          rows={6}
        />
      </label>

      {error ? <div className="apply-form-error">{error}</div> : null}
      {success ? <div className="apply-form-success">{success}</div> : null}

      <div className="apply-form-actions">
        <button type="submit" disabled={isPending}>
          {isPending ? 'Submitting...' : 'Submit Application'}
        </button>
      </div>
    </form>
  );
}