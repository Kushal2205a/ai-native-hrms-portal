
import { createClient } from '@/lib/supabase/server';
import { requireDashboardSession } from '@/lib/auth/get-dashboard-session';
import { EmployeeRequestForm } from '@/components/employee/EmployeeRequestForm';
import {
  CalendarDays,
  ClipboardList,
  FileText,
  MessageSquareText,
} from 'lucide-react';

export const metadata = {
  title: 'Requests',
};

type EmployeeRequestItem = {
  id: string;
  request_type: string;
  status: string;
  priority: string;
  title: string;
  description: string | null;
  hr_response: string | null;
  created_at: string;
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

function getLeaveDetails(request: EmployeeRequestItem) {
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

export default async function EmployeeRequestsPage() {
  const session = await requireDashboardSession('employee');
  const supabase = await createClient();

  const { data: employee } = await supabase
    .from('employees')
    .select('id, full_name, job_title')
    .eq('profile_id', session.profileId)
    .maybeSingle();

  if (!employee) {
    return (
      <>
        <section className="dash-section">
          <p className="s-tag dash-section-tag">Requests</p>
          <h1 className="s-h dash-page-heading">Employee requests</h1>
        </section>

        <section className="glass-card employee-requests-empty">
          <p className="s-tag dash-panel-tag">Profile not linked</p>
          <h2>No employee profile is linked to this account yet.</h2>
          <p>
            Please contact HR so your employee record can be connected to your
            login account.
          </p>
        </section>
      </>
    );
  }

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
      leave_request_details (
        leave_type,
        start_date,
        end_date,
        day_count,
        reason
      )
    `
    )
    .eq('employee_id', employee.id)
    .order('created_at', { ascending: false });

  const requestItems = (requests ?? []) as EmployeeRequestItem[];

  const openRequests = requestItems.filter((request) =>
    ['submitted', 'in_review'].includes(request.status)
  ).length;

  const resolvedRequests = requestItems.filter((request) =>
    ['approved', 'rejected', 'resolved', 'cancelled'].includes(request.status)
  ).length;

  const leaveRequests = requestItems.filter(
    (request) => request.request_type === 'leave'
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
      label: 'Leave Requests',
      value: String(leaveRequests),
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
          Submit HR requests and track their review status.
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

      <div className="employee-requests-layout">
        <section className="glass-card employee-requests-panel">
          <p className="s-tag dash-panel-tag">New Request</p>
          <h2>Submit a request</h2>
          <p>
            Choose leave for structured leave details, or use another request
            type for general HR support.
          </p>

          <EmployeeRequestForm />
        </section>

        <section className="glass-card employee-requests-panel">
          <p className="s-tag dash-panel-tag">My Requests</p>
          <h2>Request history</h2>

          {requestItems.length ? (
            <div className="employee-request-list">
              {requestItems.map((request) => {
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

                    {request.hr_response ? (
                      <div className="employee-request-response">
                        <span>HR response</span>
                        <p>{request.hr_response}</p>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="dash-panel-empty">
              Your submitted requests will appear here.
            </p>
          )}
        </section>
      </div>
    </>
  );
}