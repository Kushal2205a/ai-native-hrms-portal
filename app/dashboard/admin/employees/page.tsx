import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { createClient } from '@/lib/supabase/server';
import { buildFallbackWorkforceInsight } from '@/lib/ai/employeeInsights';
import { RegenerateWorkforceInsightButton } from '@/components/employees/RegenerateWorkforceInsightButton';




type SavedWorkforceInsight = {
    id: string;
    summary: string;
    strengths: string[] | null;
    attention_areas: string[] | null;
    suggested_actions: string[] | null;
    generated_at: string;
};

import {
    Users,
    CalendarCheck,
    TrendingUp,
    UserCheck,
} from 'lucide-react';
import Link from 'next/link';

export const metadata = {
    title: 'Employees',
};

type EmployeeDirectoryItem = {
    id: string;
    full_name: string;
    email: string | null;
    job_title: string | null;
    employment_status: string;
    employment_type: string;
    location: string | null;
    joined_at: string;
    performance_score: number | null;
    departments:
    | {
        name: string | null;
    }
    | {
        name: string | null;
    }[]
    | null;
};

function getDepartmentName(employee: EmployeeDirectoryItem) {
    const department = Array.isArray(employee.departments)
        ? employee.departments[0]
        : employee.departments;

    return department?.name ?? 'Unassigned';
}

function formatStatus(value: string) {
    return value.replaceAll('_', ' ');
}

function formatDate(value: string) {
    return new Date(value).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}
function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getEmployeeSignal(employee: EmployeeDirectoryItem) {
    if (employee.employment_status === 'inactive') {
        return {
            key: 'inactive',
            label: 'Inactive',
            className: 'employee-signal employee-signal--inactive',
            action: 'Exclude from active workforce planning.',
        };
    }

    if (employee.employment_status === 'on_leave') {
        return {
            key: 'on_leave',
            label: 'On leave',
            className: 'employee-signal employee-signal--leave',
            action: 'Review coverage and return-to-work planning.',
        };
    }

    if (
        typeof employee.performance_score === 'number' &&
        employee.performance_score >= 85
    ) {
        return {
            key: 'high_performer',
            label: 'High performer',
            className: 'employee-signal employee-signal--high',
            action: 'Consider for mentoring or ownership opportunities.',
        };
    }

    if (
        typeof employee.performance_score === 'number' &&
        employee.performance_score < 75
    ) {
        return {
            key: 'needs_attention',
            label: 'Needs attention',
            className: 'employee-signal employee-signal--attention',
            action: 'Schedule a supportive performance check-in.',
        };
    }

    return {
        key: 'stable',
        label: 'Stable',
        className: 'employee-signal employee-signal--stable',
        action: 'Continue regular check-ins.',
    };
}
type EmployeesPageProps = {
    searchParams?: Promise<{
        status?: string;
        department?: string;
        signal?: string;
    }>;
};

export default async function AdminEmployeesPage({
    searchParams,
}: EmployeesPageProps) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .single();

    if (!profile || profile.role !== 'admin') {
        redirect('/login');
    }

    const params = await searchParams;

    const selectedStatus = params?.status ?? 'all';
    const selectedDepartment = params?.department ?? 'all';
    const selectedSignal = params?.signal ?? 'all';

    const { data: employees } = await supabase
        .from('employees')
        .select(
            `
      id,
      full_name,
      email,
      job_title,
      employment_status,
      employment_type,
      location,
      joined_at,
      performance_score,
      departments (
        name
      )
    `
        )
        .order('full_name', { ascending: true });

    const employeeItems = (employees ?? []) as EmployeeDirectoryItem[];




    const { data: latestInsight } = await supabase
        .from('ai_workforce_insights')
        .select(
        `
            id,
            summary,
            strengths,
            attention_areas,
            suggested_actions,
            generated_at
        `
        )
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    const savedInsight = latestInsight as SavedWorkforceInsight | null;
    const fallbackInsight = buildFallbackWorkforceInsight(employeeItems);

    const workforceInsight = savedInsight
        ? {
            summary: savedInsight.summary,
            strengths: savedInsight.strengths?.length
                ? savedInsight.strengths
                : fallbackInsight.strengths,
            attention_areas: savedInsight.attention_areas?.length
                ? savedInsight.attention_areas
                : fallbackInsight.attention_areas,
            suggested_actions: savedInsight.suggested_actions?.length
                ? savedInsight.suggested_actions
                : fallbackInsight.suggested_actions,
        }
        : fallbackInsight;

    const insightGeneratedAt = savedInsight?.generated_at ?? null;

    const departmentOptions = Array.from(
        new Set(employeeItems.map((employee) => getDepartmentName(employee)))
    ).sort();

    const filteredEmployeeItems = employeeItems.filter((employee) => {
        const departmentName = getDepartmentName(employee);
        const signal = getEmployeeSignal(employee);

        const matchesStatus =
            selectedStatus === 'all' || employee.employment_status === selectedStatus;

        const matchesDepartment =
            selectedDepartment === 'all' || departmentName === selectedDepartment;

        const matchesSignal =
            selectedSignal === 'all' || signal.key === selectedSignal;

        return matchesStatus && matchesDepartment && matchesSignal;
    });

    const activeCount = employeeItems.filter(
        (employee) => employee.employment_status === 'active'
    ).length;

    const onLeaveCount = employeeItems.filter(
        (employee) => employee.employment_status === 'on_leave'
    ).length;

    const performanceScores = employeeItems
        .map((employee) => employee.performance_score)
        .filter((score): score is number => typeof score === 'number');

    const avgPerformance = performanceScores.length
        ? Math.round(
            performanceScores.reduce((sum, score) => sum + score, 0) /
            performanceScores.length
        )
        : null;



    const statCards = [
        {
            label: 'Total Employees',
            value: String(employeeItems.length),
            icon: Users,
            color: 'var(--g)',
        },
        {
            label: 'Active',
            value: String(activeCount),
            icon: UserCheck,
            color: 'var(--teal)',
        },
        {
            label: 'On Leave',
            value: String(onLeaveCount),
            icon: CalendarCheck,
            color: 'var(--amber)',
        },
        {
            label: 'Avg Performance',
            value: avgPerformance !== null ? `${avgPerformance}%` : '—',
            icon: TrendingUp,
            color: 'var(--g)',
        },
    ];

    return (
        <DashboardLayout
            role="admin"
            fullName={profile.full_name}
            title="Employees"
        >
            <section className="dash-section">
                <p className="s-tag dash-section-tag">Employees</p>
                <h1 className="s-h dash-page-heading">
                    AI-assisted workforce overview
                </h1>
                <p className="dash-panel-empty">
                    Review employee records, workforce signals, and AI-generated HR
                    insights.
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

            <section className="glass-card employee-ai-panel">
                <div className="employee-ai-panel-header">
                    <div>
                    <p className="s-tag dash-panel-tag">AI Workforce Insight</p>
                    <p className="employee-ai-summary">{workforceInsight.summary}</p>

                    <p className="employee-ai-meta">
                        {insightGeneratedAt
                        ? `Last generated ${formatDateTime(insightGeneratedAt)}`
                        : 'Showing fallback insight from current employee data.'}
                    </p>
                    </div>

                    <RegenerateWorkforceInsightButton scope="admin" />
                </div>

                <div className="employee-ai-grid">
                    <div>
                        <h2>Strengths</h2>
                        <ul>
                            {workforceInsight.strengths.map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h2>Attention areas</h2>
                        <ul>
                            {workforceInsight.attention_areas.map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h2>Suggested actions</h2>
                        <ul>
                            {workforceInsight.suggested_actions.map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            <section className="glass-card dash-panel employee-directory-panel">
                <div className="employee-directory-header">

                    <div className="employee-filters">
                        <div>
                            <p className="employee-filter-label">Status</p>
                            <div className="employee-filter-row">
                                {[
                                    ['all', 'All'],
                                    ['active', 'Active'],
                                    ['on_leave', 'On leave'],
                                    ['inactive', 'Inactive'],
                                ].map(([value, label]) => (
                                    <Link
                                        key={value}
                                        href={buildEmployeeFilterHref('/dashboard/admin/employees', 'status', value, {
                                            status: selectedStatus,
                                            department: selectedDepartment,
                                            signal: selectedSignal,
                                        })}
                                        className={`employee-filter-chip ${selectedStatus === value ? 'employee-filter-chip--active' : ''
                                            }`}
                                    >
                                        {label}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div>
                            <p className="employee-filter-label">Department</p>
                            <div className="employee-filter-row">
                                <Link
                                    href={buildEmployeeFilterHref('/dashboard/admin/employees', 'department', 'all', {
                                        status: selectedStatus,
                                        department: selectedDepartment,
                                        signal: selectedSignal,
                                    })}
                                    className={`employee-filter-chip ${selectedDepartment === 'all' ? 'employee-filter-chip--active' : ''
                                        }`}
                                >
                                    All
                                </Link>

                                {departmentOptions.map((department) => (
                                    <Link
                                        key={department}
                                        href={buildEmployeeFilterHref('/dashboard/admin/employees', 'department', department, {
                                            status: selectedStatus,
                                            department: selectedDepartment,
                                            signal: selectedSignal,
                                        })}
                                        className={`employee-filter-chip ${selectedDepartment === department ? 'employee-filter-chip--active' : ''
                                            }`}
                                    >
                                        {department}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div>
                            <p className="employee-filter-label">Signal</p>
                            <div className="employee-filter-row">
                                {[
                                    ['all', 'All'],
                                    ['high_performer', 'High performer'],
                                    ['stable', 'Stable'],
                                    ['needs_attention', 'Needs attention'],
                                    ['on_leave', 'On leave'],
                                    ['inactive', 'Inactive'],
                                ].map(([value, label]) => (
                                    <Link
                                        key={value}
                                        href={buildEmployeeFilterHref('/dashboard/admin/employees', 'signal', value, {
                                            status: selectedStatus,
                                            department: selectedDepartment,
                                            signal: selectedSignal,
                                        })}
                                        className={`employee-filter-chip ${selectedSignal === value ? 'employee-filter-chip--active' : ''
                                            }`}
                                    >
                                        {label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>









                    <div>
                        <p className="s-tag dash-panel-tag">Directory</p>
                        <h2 className="employee-directory-title">Employee records</h2>
                    </div>
                    <p className="employee-directory-count">
                        {filteredEmployeeItems.length} of {employeeItems.length} employees
                    </p>
                </div>

                {filteredEmployeeItems.length ? (
                    <div className="employee-directory-grid">
                        {filteredEmployeeItems.map((employee) => {
                            const signal = getEmployeeSignal(employee);

                            return (
                                <article key={employee.id} className="employee-card">
                                    <div className="employee-card-header">
                                        <div>
                                            <p className="employee-card-name">
                                                {employee.full_name}
                                            </p>
                                            <p className="employee-card-role">
                                                {employee.job_title ?? 'Role not specified'} ·{' '}
                                                {getDepartmentName(employee)}
                                            </p>
                                        </div>

                                        <span className={signal.className}>{signal.label}</span>
                                    </div>

                                    <div className="employee-card-meta">
                                        <span>{employee.location ?? 'Location not specified'}</span>
                                        <span>{formatStatus(employee.employment_type)}</span>
                                        <span>{formatStatus(employee.employment_status)}</span>
                                    </div>

                                    <div className="employee-card-footer">
                                        <div>
                                            <span>Performance</span>
                                            <strong>
                                                {employee.performance_score !== null
                                                    ? `${employee.performance_score}%`
                                                    : '—'}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Joined</span>
                                            <strong>{formatDate(employee.joined_at)}</strong>
                                        </div>
                                    </div>

                                    <p className="employee-card-action">{signal.action}</p>
                                </article>
                            );
                        })}
                    </div>
                ) : (
                    <p className="dash-panel-empty">No employees match these filters.</p>
                )}
            </section>
        </DashboardLayout>
    );
}


function buildEmployeeFilterHref(
    basePath: string,
    key: 'status' | 'department' | 'signal',
    value: string,
    current: {
        status: string;
        department: string;
        signal: string;
    }
) {
    const params = new URLSearchParams();

    const next = {
        ...current,
        [key]: value,
    };

    if (next.status !== 'all') {
        params.set('status', next.status);
    }

    if (next.department !== 'all') {
        params.set('department', next.department);
    }

    if (next.signal !== 'all') {
        params.set('signal', next.signal);
    }

    const query = params.toString();

    return query ? `${basePath}?${query}` : basePath;
}