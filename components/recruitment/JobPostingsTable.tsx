'use client';

import { useState, useTransition } from 'react';
import { closeJob } from '@/lib/actions/jobs';
import JobFormDialog from './JobFormDialog';
import type { Department, JobPosting } from '@/types/database';
import { Pencil, X, Link, Plus } from 'lucide-react';

interface JobPostingsTableProps {
  jobs: JobPosting[];
  departments: Department[];
}

const STATUS_STYLES: Record<string, string> = {
  open:   'badge badge--open',
  draft:  'badge badge--draft',
  closed: 'badge badge--closed',
};

const EMPLOYMENT_LABELS: Record<string, string> = {
  full_time:  'Full Time',
  part_time:  'Part Time',
  contract:   'Contract',
  internship: 'Internship',
};

export default function JobPostingsTable({ jobs, departments }: JobPostingsTableProps) {
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobPosting | undefined>();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function openCreate() {
    setEditingJob(undefined);
    setDialogOpen(true);
  }

  function openEdit(job: JobPosting) {
    setEditingJob(job);
    setDialogOpen(true);
  }

  function handleClose() {
    setDialogOpen(false);
    setEditingJob(undefined);
  }

  function handleCloseJob(id: string) {
    startTransition(async () => {
      await closeJob(id);
    });
  }

  function copyApplyLink(id: string) {
    const url = `${window.location.origin}/jobs/${id}`;

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).catch(() => fallbackCopy(url));
    } else {
      fallbackCopy(url);
    }

    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function fallbackCopy(text: string) {
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.focus();
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="table-toolbar">
        <p className="table-count s-tag">{jobs.length} posting{jobs.length !== 1 ? 's' : ''}</p>
        <button className="btn-g table-create-btn" onClick={openCreate}>
          <Plus size={14} strokeWidth={2} />
          New Job
        </button>
      </div>

      {/* Table */}
      {jobs.length === 0 ? (
        <div className="glass-card table-empty">
          <p className="s-tag">No job postings yet</p>
          <p className="table-empty-sub">Create your first job posting to get started.</p>
        </div>
      ) : (
        <div className="glass-card table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th className="s-tag">Title</th>
                <th className="s-tag">Department</th>
                <th className="s-tag">Type</th>
                <th className="s-tag">Location</th>
                <th className="s-tag">Status</th>
                <th className="s-tag">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td className="table-cell-primary">{job.title}</td>
                  <td>{job.departments?.name ?? <span className="table-cell-muted">—</span>}</td>
                  <td>
                    {job.employment_type
                      ? EMPLOYMENT_LABELS[job.employment_type]
                      : <span className="table-cell-muted">—</span>}
                  </td>
                  <td>{job.location ?? <span className="table-cell-muted">—</span>}</td>
                  <td>
                    <span className={STATUS_STYLES[job.status] ?? 'badge'}>
                      {job.status}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      {/* Copy apply link */}
                      {job.status === 'open' && (
                        <button
                          className="table-action-btn"
                          onClick={() => copyApplyLink(job.id)}
                          title="Copy apply link"
                        >
                          <Link size={13} strokeWidth={1.5} />
                          {copiedId === job.id ? 'Copied!' : 'Link'}
                        </button>
                      )}

                      {/* Edit */}
                      <button
                        className="table-action-btn"
                        onClick={() => openEdit(job)}
                        title="Edit"
                      >
                        <Pencil size={13} strokeWidth={1.5} />
                        Edit
                      </button>

                      {/* Close — only for open/draft */}
                      {job.status !== 'closed' && (
                        <button
                          className="table-action-btn table-action-btn--danger"
                          onClick={() => handleCloseJob(job.id)}
                          disabled={isPending}
                          title="Close job"
                        >
                          <X size={13} strokeWidth={1.5} />
                          Close
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialog */}
      {dialogOpen && (
        <JobFormDialog
          departments={departments}
          job={editingJob}
          onClose={handleClose}
        />
      )}
    </div>
  );
}