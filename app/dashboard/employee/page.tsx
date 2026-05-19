
import { createClient } from '@/lib/supabase/server';
import { requireDashboardSession } from '@/lib/auth/get-dashboard-session';
import { RegenerateEmployeeInsightButton } from '@/components/employee/RegenerateEmployeeInsightButton';
import {
    buildFallbackEmployeeGrowthInsight,
    type EmployeeGrowthInsight,
    type EmployeeGrowthInsightInput,
} from '@/lib/ai/employeeGrowthInsights';
import {
    BadgeCheck,
    Briefcase,
    CalendarDays,
    MapPin,
    TrendingUp,
} from 'lucide-react';

export const metadata = {
    title: 'Employee Dashboard',
};

type EmployeeDashboardItem = EmployeeGrowthInsightInput & {
    id: string;
};

type SavedEmployeeInsight = {
    id: string;
    summary: string;
    strengths: string[] | null;
    focus_areas: string[] | null;
    suggested_actions: string[] | null;
    generated_at: string;
};

function getDepartmentName(employee: EmployeeGrowthInsightInput) {
    const department = Array.isArray(employee.departments)
        ? employee.departments[0]
        : employee.departments;

    return department?.name ?? 'Unassigned';
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

function formatLabel(value: string) {
    return value.replaceAll('_', ' ');
}

function getTenureLabel(joinedAt: string) {
    const joinedDate = new Date(joinedAt);
    const now = new Date();

    const years = now.getFullYear() - joinedDate.getFullYear();
    const months = now.getMonth() - joinedDate.getMonth();
    const totalMonths = Math.max(0, years * 12 + months);

    if (totalMonths < 12) {
        return `${totalMonths} months`;
    }

    const tenureYears = Math.floor(totalMonths / 12);
    const remainingMonths = totalMonths % 12;

    return remainingMonths
        ? `${tenureYears} yr ${remainingMonths} mo`
        : `${tenureYears} yr`;
}

function getPerformanceLabel(score: number | null) {
    if (typeof score !== 'number') {
        return {
            label: 'Not scored',
            description: 'A performance score has not been added yet.',
            className: 'employee-self-performance employee-self-performance--neutral',
        };
    }

    if (score >= 85) {
        return {
            label: 'Strong performance',
            description: 'You are showing strong consistency in your current role.',
            className: 'employee-self-performance employee-self-performance--strong',
        };
    }

    if (score >= 70) {
        return {
            label: 'Stable performance',
            description: 'You are maintaining a steady performance level.',
            className: 'employee-self-performance employee-self-performance--stable',
        };
    }

    return {
        label: 'Growth focus',
        description: 'A focused support plan can help improve consistency.',
        className: 'employee-self-performance employee-self-performance--focus',
    };
}

function mergeSavedInsight(
    savedInsight: SavedEmployeeInsight | null,
    fallbackInsight: EmployeeGrowthInsight
): EmployeeGrowthInsight {
    if (!savedInsight) {
        return fallbackInsight;
    }

    return {
        summary: savedInsight.summary || fallbackInsight.summary,
        strengths: savedInsight.strengths?.length
            ? savedInsight.strengths
            : fallbackInsight.strengths,
        focus_areas: savedInsight.focus_areas?.length
            ? savedInsight.focus_areas
            : fallbackInsight.focus_areas,
        suggested_actions: savedInsight.suggested_actions?.length
            ? savedInsight.suggested_actions
            : fallbackInsight.suggested_actions,
    };
}

export default async function EmployeeDashboardPage() {
    const session = await requireDashboardSession('employee');
  const supabase = await createClient();

    const { data: employee, error: employeeError } = await supabase
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
        .eq('profile_id', session.profileId)
        .maybeSingle();

    console.log('EMPLOYEE ROW DEBUG', {
        profileId: session.profileId,
        employee,
        employeeError,
    });
    if (!employee) {
        return (
            <>
                <section className="dash-section">
                    <p className="s-tag dash-section-tag">Employee Overview</p>
                    <h1 className="s-h dash-page-heading">
                        Good to see you, {session.fullName.split(' ')[0]}.
                    </h1>
                </section>

                <section className="glass-card employee-self-empty">
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

    const employeeItem = employee as EmployeeDashboardItem;
    const departmentName = getDepartmentName(employeeItem);
    const performance = getPerformanceLabel(employeeItem.performance_score);

    const fallbackInsight = buildFallbackEmployeeGrowthInsight(employeeItem);

    const { data: latestInsight } = await supabase
        .from('ai_employee_insights')
        .select(
            `
      id,
      summary,
      strengths,
      focus_areas,
      suggested_actions,
      generated_at
    `
        )
        .eq('employee_id', employeeItem.id)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    const savedInsight = latestInsight as SavedEmployeeInsight | null;
    const growthInsight = mergeSavedInsight(savedInsight, fallbackInsight);
    const insightGeneratedAt = savedInsight?.generated_at ?? null;

    const statCards = [
        {
            label: 'Performance',
            value:
                typeof employeeItem.performance_score === 'number'
                    ? `${employeeItem.performance_score}%`
                    : '—',
            icon: TrendingUp,
            color: 'var(--g)',
        },
        {
            label: 'Status',
            value: formatLabel(employeeItem.employment_status),
            icon: BadgeCheck,
            color: 'var(--teal)',
        },
        {
            label: 'Tenure',
            value: getTenureLabel(employeeItem.joined_at),
            icon: CalendarDays,
            color: 'var(--amber)',
        },
        {
            label: 'Department',
            value: departmentName,
            icon: Briefcase,
            color: 'var(--g)',
        },
    ];

    return (
        <>
            <section className="dash-section">
                <p className="s-tag dash-section-tag">Employee Overview</p>
                <h1 className="s-h dash-page-heading">
                    Good to see you, {session.fullName.split(' ')[0]}.
                </h1>
                <p className="dash-panel-empty">
                    View your profile, performance summary, and AI-assisted growth
                    guidance.
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

            <section className="glass-card employee-growth-panel">
                <div className="employee-growth-header">
                    <div>
                        <p className="s-tag dash-panel-tag">AI Growth Insight</p>
                        <p className="employee-growth-summary">{growthInsight.summary}</p>

                        <p className="employee-growth-meta">
                            {insightGeneratedAt
                                ? `Last generated ${formatDateTime(insightGeneratedAt)}`
                                : 'Showing fallback insight from your current profile data.'}
                        </p>
                    </div>

                    <RegenerateEmployeeInsightButton />
                </div>

                <div className="employee-growth-grid">
                    <div>
                        <h2>Strengths</h2>
                        <ul>
                            {growthInsight.strengths.map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h2>Focus areas</h2>
                        <ul>
                            {growthInsight.focus_areas.map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h2>Suggested actions</h2>
                        <ul>
                            {growthInsight.suggested_actions.map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            <div className="employee-self-grid">
                <section className="glass-card employee-self-panel">
                    <p className="s-tag dash-panel-tag">My Profile</p>

                    <div className="employee-self-profile">
                        <div>
                            <h2>{employeeItem.full_name}</h2>
                            <p>{employeeItem.job_title ?? 'Role not assigned'}</p>
                        </div>

                        <span className={performance.className}>{performance.label}</span>
                    </div>

                    <p className="employee-self-performance-note">
                        {performance.description}
                    </p>

                    <div className="employee-self-detail-list">
                        <div>
                            <span>Email</span>
                            <strong>{employeeItem.email ?? 'Not added'}</strong>
                        </div>
                        <div>
                            <span>Department</span>
                            <strong>{departmentName}</strong>
                        </div>
                        <div>
                            <span>Employment type</span>
                            <strong>{formatLabel(employeeItem.employment_type)}</strong>
                        </div>
                        <div>
                            <span>Joined</span>
                            <strong>{formatDate(employeeItem.joined_at)}</strong>
                        </div>
                    </div>
                </section>

                <section className="glass-card employee-self-panel">
                    <p className="s-tag dash-panel-tag">HR Details</p>

                    <div className="employee-self-location">
                        <MapPin size={18} strokeWidth={1.5} />
                        <div>
                            <h2>{employeeItem.location ?? 'Location not added'}</h2>
                            <p>{formatLabel(employeeItem.employment_status)}</p>
                        </div>
                    </div>

                    <div className="employee-self-detail-list">
                        <div>
                            <span>Work location</span>
                            <strong>{employeeItem.location ?? 'Not added'}</strong>
                        </div>
                        <div>
                            <span>Status</span>
                            <strong>{formatLabel(employeeItem.employment_status)}</strong>
                        </div>
                        <div>
                            <span>Tenure</span>
                            <strong>{getTenureLabel(employeeItem.joined_at)}</strong>
                        </div>
                        <div>
                            <span>Performance score</span>
                            <strong>
                                {typeof employeeItem.performance_score === 'number'
                                    ? `${employeeItem.performance_score}%`
                                    : 'Not scored'}
                            </strong>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}