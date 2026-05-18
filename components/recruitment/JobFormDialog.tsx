'use client';

import { useState, useTransition, type FormEvent, type KeyboardEvent } from 'react';
import { createJob, updateJob } from '@/lib/actions/jobs';
import type { Department, EmploymentType, JobPosting, JobStatus } from '@/types/database';
import Portal from '@/components/shared/Portal';

interface JobFormDialogProps {
  departments: Department[];
  job?: JobPosting;           // present = edit mode
  onClose: () => void;
}

const EMPLOYMENT_TYPES: { value: EmploymentType; label: string }[] = [
  { value: 'full_time',  label: 'Full Time' },
  { value: 'part_time',  label: 'Part Time' },
  { value: 'contract',   label: 'Contract' },
  { value: 'internship', label: 'Internship' },
];

export default function JobFormDialog({ departments, job, onClose }: JobFormDialogProps) {
  const isEdit = Boolean(job);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle]                   = useState(job?.title ?? '');
  const [description, setDescription]       = useState(job?.description ?? '');
  const [departmentId, setDepartmentId]     = useState(job?.department_id ?? '');
  const [location, setLocation]             = useState(job?.location ?? '');
  const [employmentType, setEmploymentType] = useState<EmploymentType | ''>(job?.employment_type ?? '');
  const [status, setStatus]                 = useState<JobStatus>(job?.status ?? 'draft');
  const [skillInput, setSkillInput]         = useState('');
  const [skills, setSkills]                 = useState<string[]>(job?.required_skills ?? []);

  function addSkill() {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills((prev) => [...prev, trimmed]);
    }
    setSkillInput('');
  }

  function removeSkill(skill: string) {
    setSkills((prev) => prev.filter((s) => s !== skill));
  }

  function handleSkillKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) { setError('Title is required.'); return; }
    if (!description.trim()) { setError('Description is required.'); return; }

    startTransition(async () => {
      try {
        if (isEdit && job) {
          await updateJob({
            id: job.id,
            title,
            description,
            department_id:   departmentId || null,
            required_skills: skills,
            location:        location || null,
            employment_type: (employmentType as EmploymentType) || null,
            status,
          });
        } else {
          await createJob({
            title,
            description,
            department_id:   departmentId || null,
            required_skills: skills,
            location:        location || null,
            employment_type: (employmentType as EmploymentType) || null,
            status,
          });
        }
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong.');
      }
    });
  }

  return (
    <Portal>
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        className="dialog-panel glass-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? 'Edit job posting' : 'Create job posting'}
      >
        {/* Header */}
        <div className="dialog-header">
          <div className="dialog-header-text">
            <p className="s-tag">{isEdit ? 'Edit Posting' : 'New Posting'}</p>
            <h2 className="s-h dialog-title">{isEdit ? 'Edit job' : 'Create job'}</h2>
          </div>
          <button className="dialog-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="dialog-form" noValidate>
          {/* Title */}
          <div className="auth-field">
            <label className="auth-label s-tag">Job Title</label>
            <input
              type="text"
              className="auth-input"
              placeholder="e.g. Senior Frontend Engineer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isPending}
            />
          </div>

          {/* Department + Employment type row */}
          <div className="dialog-row">
            <div className="auth-field">
              <label className="auth-label s-tag">Department</label>
              <select
                className="auth-input auth-select"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                disabled={isPending}
              >
                <option value="">No department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="auth-field">
              <label className="auth-label s-tag">Employment Type</label>
              <select
                className="auth-input auth-select"
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value as EmploymentType | '')}
                disabled={isPending}
              >
                <option value="">Select type</option>
                {EMPLOYMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Location */}
          <div className="auth-field">
            <label className="auth-label s-tag">Location</label>
            <input
              type="text"
              className="auth-input"
              placeholder="e.g. Remote, Bangalore, Hybrid"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={isPending}
            />
          </div>

          {/* Description */}
          <div className="auth-field">
            <label className="auth-label s-tag">Description</label>
            <textarea
              className="auth-input dialog-textarea"
              placeholder="Describe the role, responsibilities, and requirements…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isPending}
              rows={5}
            />
          </div>

          {/* Skills */}
          <div className="auth-field">
            <label className="auth-label s-tag">Required Skills</label>
            <div className="dialog-skill-row">
              <input
                type="text"
                className="auth-input"
                placeholder="Add skill and press Enter"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleSkillKeyDown}
                disabled={isPending}
              />
              <button
                type="button"
                className="ncta dialog-skill-add"
                onClick={addSkill}
                disabled={isPending}
              >
                Add
              </button>
            </div>
            {skills.length > 0 && (
              <div className="dialog-skills">
                {skills.map((s) => (
                  <span key={s} className="dialog-skill-tag">
                    {s}
                    <button
                      type="button"
                      className="dialog-skill-remove"
                      onClick={() => removeSkill(s)}
                      aria-label={`Remove ${s}`}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Status */}
          <div className="auth-field">
            <label className="auth-label s-tag">Status</label>
            <select
              className="auth-input auth-select"
              value={status}
              onChange={(e) => setStatus(e.target.value as JobStatus)}
              disabled={isPending}
            >
              <option value="draft">Draft</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {error && <p className="auth-error" role="alert">{error}</p>}

          {/* Actions */}
          <div className="dialog-actions">
            <button type="button" className="btn-ghost" onClick={onClose} disabled={isPending}>
              Cancel
            </button>
            <button type="submit" className="btn-g dialog-submit" disabled={isPending}>
              {isPending
                ? isEdit ? 'Saving…' : 'Creating…'
                : isEdit ? 'Save Changes' : 'Create Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </Portal>
  );
}