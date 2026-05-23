
import { createClient } from '@/lib/supabase/server';
import { requireDashboardSession } from '@/lib/auth/get-dashboard-session';
import { EmployeeRequestReviewForm } from '@/components/employee/EmployeeRequestReviewForm';
import {
  CalendarDays,
  ClipboardList,
  FileText,
  MessageSquareText,
} from 'lucide-react';

export const metadata = {
  title: 'HR Requests',
};

type ManageRequestItem = {
  id: string;
  request_type: string;
  status: string;
  priority: string;
  title: string;
  description: string | null;
  hr_response: string | null;
  created_at: string;
  employees:
    | {
        full_name: string | null;
        job_title: string | null;
        departments:
          | {
              name: string | null;
            }
          | {
              name: string | null;
            }[]
          | null;
      }
    | {
        full_name: string | null;
        job_title: string | null;
        departments:
          | {
              name: string | null;
            }
          | {
              name: string | null;
            }[]
          | null;
      }[]
    | null;
  leave_request_details:
    | {
        leave_type: string;
        start_date: string;
        end_date: string;
        day_count: number;
        reason: string;
      }
    | {
        leave_type: string;
        start_date: string;
        end_date: string;
        day_count: number;
        reason: string;
      }[]
    | null;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatLabel(value: string) {
  return value.replaceAll('_', ' ');
}

function getEmployee(request: ManageRequestItem) {
  return Array.isArray(request.employees)
    ? request.employees[0]
    : request.employees;
}

function getDepartmentName(
  employee: NonNullable<ReturnType<typeof getEmployee>>
) {
  const department = Array.isArray(employee.departments)
    ? employee.departments[0]
    : employee.departments;

  return department?.name ?? 'Unassigned';
}

function getLeaveDetails(request: ManageRequestItem) {
  return Array.isArray(request.leave_request_details)
    ? request.leave_request_details[0]
    : request.leave_request_details;
}

function getStatusClass(status: string) {
  switch (status) {
    case 'approved':
    case 'resolved':
      return 'employee-request-status employee-request-status--success';
    case 'rejected':
    case 'cancelled':
      return 'employee-request-status employee-request-status--danger';
    case 'in_review':
      return 'employee-request-status employee-request-status--review';
    default:
      return 'employee-request-status employee-request-status--submitted';
  }
}

function getPriorityClass(priority: string) {
  switch (priority) {
    case 'high':
      return 'employee-request-priority employee-request-priority--high';
    case 'low':
      return 'employee-request-priority employee-request-priority--low';
    default:
      return 'employee-request-priority employee-request-priority--normal';
  }
}

export default async function HRRequestsPage() {
  await requireDashboardSession('hr');
  const supabase = await createClient();

  const { data: requests } = await supabase
    .from('employee_requests')
    .select(
      `
      id,
      request_type,
      status,
      priority,
      title,
      description,
      hr_response,
      created_at,
      employees (
        full_name,
        job_title,
        departments (
          name
        )
      ),
      leave_request_details (
        leave_type,
        start_date,
        end_date,
        day_count,
        reason
      )
    `
    )
    .order('created_at', { ascending: false });

  const requestItems = (requests ?? []) as ManageRequestItem[];

  const openRequests = requestItems.filter((request) =>
    ['submitted', 'in_review'].includes(request.status)
  ).length;

  const resolvedRequests = requestItems.filter((request) =>
    ['approved', 'rejected', 'resolved', 'cancelled'].includes(request.status)
  ).length;

  const leaveRequests = requestItems.filter(
    (request) => request.request_type === 'leave'
  ).length;

  const highPriorityRequests = requestItems.filter(
    (request) => request.priority === 'high'
  ).length;

  const statCards = [
    {
      label: 'Total Requests',
      value: String(requestItems.length),
      icon: ClipboardList,
      color: 'var(--g)',
    },
    {
      label: 'Open',
      value: String(openRequests),
      icon: MessageSquareText,
      color: 'var(--amber)',
    },
    {
      label: 'Resolved',
      value: String(resolvedRequests),
      icon: FileText,
      color: 'var(--teal)',
    },
    {
      label: 'High Priority',
      value: String(highPriorityRequests),
      icon: CalendarDays,
      color: 'var(--g)',
    },
  ];

  return (
    <>
      <section className="dash-section">
        <p className="s-tag dash-section-tag">Requests</p>
        <h1 className="s-h dash-page-heading">Employee requests</h1>
        <p className="dash-panel-empty">
          Review employee requests, update status, and send responses.
        </p>
      </section>

      <div className="dash-cards">
        {statCards.map((card) => {
          const Icon = card.icon;

          return (
            <div key={card.label} className="glass-card dash-stat-card">
              <div className="dash-stat-icon" style={{ color: card.color }}>
                <Icon size={18} strokeWidth={1.5} />
              </div>
              <p className="dash-stat-value">{card.value}</p>
              <p className="dash-stat-label s-tag">{card.label}</p>
            </div>
          );
        })}
      </div>

      <section className="glass-card employee-requests-panel manage-requests-panel">
        <div className="manage-requests-header">
          <div>
            <p className="s-tag dash-panel-tag">Review Queue</p>
            <h2>All employee requests</h2>
          </div>

          <p>{leaveRequests} leave request{leaveRequests === 1 ? '' : 's'}</p>
        </div>

        {requestItems.length ? (
          <div className="manage-request-list">
            {requestItems.map((request) => {
              const employee = getEmployee(request);
              const leaveDetails = getLeaveDetails(request);

              return (
                <article key={request.id} className="employee-request-card">
                  <div className="employee-request-card-header">
                    <div>
                      <p className="employee-request-type">
                        {formatLabel(request.request_type)}
                      </p>
                      <h3>{request.title}</h3>
                      <p className="employee-request-date">
                        {employee?.full_name ?? 'Unknown employee'}
                        {employee?.job_title ? ` · ${employee.job_title}` : ''}
                        {employee ? ` · ${getDepartmentName(employee)}` : ''}
                      </p>
                      <p className="employee-request-date">
                        Submitted {formatDate(request.created_at)}
                      </p>
                    </div>

                    <div className="employee-request-badges">
                      <span className={getStatusClass(request.status)}>
                        {formatLabel(request.status)}
                      </span>
                      <span className={getPriorityClass(request.priority)}>
                        {formatLabel(request.priority)}
                      </span>
                    </div>
                  </div>

                  {request.description ? (
                    <p className="employee-request-description">
                      {request.description}
                    </p>
                  ) : null}

                  {leaveDetails ? (
                    <div className="employee-request-leave-details">
                      <span>{formatLabel(leaveDetails.leave_type)}</span>
                      <span>
                        {formatDate(leaveDetails.start_date)} →{' '}
                        {formatDate(leaveDetails.end_date)}
                      </span>
                      <span>
                        {Number(leaveDetails.day_count)} day
                        {Number(leaveDetails.day_count) > 1 ? 's' : ''}
                      </span>
                    </div>
                  ) : null}

                  <EmployeeRequestReviewForm
                    requestId={request.id}
                    currentStatus={request.status}
                    currentResponse={request.hr_response}
                  />
                </article>
              );
            })}
          </div>
        ) : (
          <p className="dash-panel-empty">
            Employee requests will appear here.
          </p>
        )}
      </section>
    </>
  );
}