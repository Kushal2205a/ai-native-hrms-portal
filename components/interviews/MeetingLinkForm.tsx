'use client';

import { useState, useTransition } from 'react';
import { updateInterviewMeetingLink } from '@/lib/actions/interviews';

interface MeetingLinkFormProps {
  interviewId: string;
  currentMeetingLink?: string | null;
}

export default function MeetingLinkForm({
  interviewId,
  currentMeetingLink,
}: MeetingLinkFormProps) {
  const [meetingLink, setMeetingLink] = useState(currentMeetingLink ?? '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError('');
    setSuccess('');

    startTransition(async () => {
      try {
        await updateInterviewMeetingLink(interviewId, meetingLink);
        setSuccess('Meeting link saved.');
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Could not save meeting link.'
        );
      }
    });
  }

  return (
    <form className="meeting-link-form" onSubmit={handleSubmit}>
      <input
        className="meeting-link-input"
        type="url"
        placeholder="Paste meeting link"
        value={meetingLink}
        onChange={(event) => setMeetingLink(event.target.value)}
      />

      <button type="submit" className="meeting-link-save" disabled={isPending}>
        {isPending ? 'Saving...' : currentMeetingLink ? 'Update' : 'Save'}
      </button>

      {error ? <p className="form-error meeting-link-message">{error}</p> : null}
      {success ? (
        <p className="form-success meeting-link-message">{success}</p>
      ) : null}
    </form>
  );
}