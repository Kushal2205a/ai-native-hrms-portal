'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createEmployeeRequest } from '@/lib/actions/employeeRequests';
import { draftEmployeeRequest } from '@/lib/actions/requestDrafting';

const requestTypes = [
  { value: 'leave', label: 'Leave' },
  { value: 'work_from_home', label: 'Work from home' },
  { value: 'document', label: 'Document' },
  { value: 'payroll', label: 'Payroll' },
  { value: 'profile_update', label: 'Profile update' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'general', label: 'General' },
];

const priorities = [
  { value: 'normal', label: 'Normal' },
  { value: 'low', label: 'Low' },
  { value: 'high', label: 'High' },
];

const leaveTypes = [
  { value: 'casual', label: 'Casual leave' },
  { value: 'sick', label: 'Sick leave' },
  { value: 'earned', label: 'Earned leave' },
  { value: 'unpaid', label: 'Unpaid leave' },
  { value: 'other', label: 'Other' },
];

function getDayCount(startDateValue: string, endDateValue: string) {
  if (!startDateValue || !endDateValue) return null;

  const startDate = new Date(`${startDateValue}T00:00:00`);
  const endDate = new Date(`${endDateValue}T00:00:00`);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return null;
  }

  if (endDate < startDate) {
    return null;
  }

  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((endDate.getTime() - startDate.getTime()) / msPerDay) + 1;
}

export function EmployeeRequestForm() {
  const router = useRouter();

  const [requestType, setRequestType] = useState('leave');
  const [priority, setPriority] = useState('normal');
  const [leaveType, setLeaveType] = useState('casual');

  const [roughText, setRoughText] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reason, setReason] = useState('');

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [message, setMessage] = useState('');
  const [isSubmitting, startSubmitTransition] = useTransition();
  const [isDrafting, startDraftTransition] = useTransition();

  const isLeaveRequest = requestType === 'leave';

  const dayCount = useMemo(
    () => getDayCount(startDate, endDate),
    [startDate, endDate]
  );

  function handleDraft() {
    setMessage('');

    const formData = new FormData();
    formData.set('rough_text', roughText);
    formData.set('selected_request_type', requestType);

    startDraftTransition(async () => {
      const result = await draftEmployeeRequest(formData);

      setMessage(result.message);

      if (!result.success) {
        return;
      }

      setRequestType(result.draft.request_type);
      setPriority(result.draft.priority);

      if (result.draft.request_type === 'leave') {
        setLeaveType(result.draft.leave_type ?? 'casual');
        setReason(result.draft.reason ?? result.draft.description);
        setTitle('');
        setDescription('');
        return;
      }

      setTitle(result.draft.title);
      setDescription(result.draft.description);
      setReason('');
    });
  }

  function handleSubmit(formData: FormData) {
    setMessage('');

    startSubmitTransition(async () => {
      const result = await createEmployeeRequest(formData);

      setMessage(result.message);

      if (result.success) {
        setRoughText('');
        setTitle('');
        setDescription('');
        setReason('');
        setStartDate('');
        setEndDate('');
        setPriority('normal');
        setLeaveType('casual');
        setRequestType('leave');
        router.refresh();
      }
    });
  }

  return (
    <div className="employee-request-form-shell">
      <div className="employee-request-ai-box">
        <div>
          <p className="s-tag dash-panel-tag">AI Draft Assistant</p>
          <h3>Describe your request in one line</h3>
          <p>
            AI can classify the request and draft cleaner wording. You still
            review and submit it manually.
          </p>
        </div>

        <textarea
          value={roughText}
          onChange={(event) => setRoughText(event.target.value)}
          rows={3}
          placeholder="Example: need salary slip for bank loan asap"
        />

        <button type="button" onClick={handleDraft} disabled={isDrafting}>
          {isDrafting ? 'Drafting...' : 'Improve with AI'}
        </button>
      </div>

      <form action={handleSubmit} className="employee-request-form">
        <div className="employee-request-form-grid">
          <label>
            <span>Request type</span>
            <select
              name="request_type"
              value={requestType}
              onChange={(event) => setRequestType(event.target.value)}
            >
              {requestTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Priority</span>
            <select
              name="priority"
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
            >
              {priorities.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {isLeaveRequest ? (
          <>
            <div className="employee-request-form-grid">
              <label>
                <span>Leave type</span>
                <select
                  name="leave_type"
                  value={leaveType}
                  onChange={(event) => setLeaveType(event.target.value)}
                >
                  {leaveTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Estimated days</span>
                <input
                  value={dayCount ? `${dayCount} day${dayCount > 1 ? 's' : ''}` : '—'}
                  readOnly
                />
              </label>
            </div>

            <div className="employee-request-form-grid">
              <label>
                <span>Start date</span>
                <input
                  name="start_date"
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </label>

              <label>
                <span>End date</span>
                <input
                  name="end_date"
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                />
              </label>
            </div>

            <label>
              <span>Reason</span>
              <textarea
                name="reason"
                rows={4}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Briefly explain why you need leave."
              />
            </label>
          </>
        ) : (
          <>
            <label>
              <span>Title</span>
              <input
                name="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Example: Need experience letter"
              />
            </label>

            <label>
              <span>Description</span>
              <textarea
                name="description"
                rows={5}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Add details so HR can understand the request."
              />
            </label>
          </>
        )}

        <div className="employee-request-form-footer">
          <p>{message}</p>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit request'}
          </button>
        </div>
      </form>
    </div>
  );
}