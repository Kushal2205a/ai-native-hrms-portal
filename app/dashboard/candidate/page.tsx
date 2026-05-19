import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Briefcase, FileText, CalendarCheck, UserCircle } from 'lucide-react';
import Link from 'next/link';
import InterviewSlotPicker from '@/components/candidate/InterviewSlotPicker';


export const metadata = { title: 'Candidate' };
function formatApplicationStatus(status: string) {
    return status
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getApplicationStatusMessage(status: string) {
    if (status === 'selected') {
        return 'Congratulations, you have been selected for this role.';
    }

    if (status === 'rejected') {
        return 'Your application was not selected for this role.';
    }

    if (status === 'interview_completed') {
        return 'Your interview is complete. The team is reviewing the final decision.';
    }

    if (status === 'interview_scheduled') {
        return 'Your interview has been scheduled. Check your interviews tab for details.';
    }

    if (status === 'shortlisted') {
        return 'You have been shortlisted. Please choose an interview slot.';
    }

    if (status === 'screened') {
        return 'Your application has been screened by AI.';
    }

    return null;
}

function isFinalApplicationStatus(status: string) {
    return ['selected', 'rejected', 'interview_completed'].includes(status);
}
const STAT_CARD_CONFIG = [
    { label: 'Jobs Available', icon: Briefcase, color: 'var(--g)' },
    { label: 'My Applications', icon: FileText, color: 'var(--teal)' },
    { label: 'My Interviews', icon: CalendarCheck, color: 'var(--amber)' },
    { label: 'Profile Complete', icon: UserCircle, color: 'var(--g)' },
];
export default async function CandidateDashboard() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .single();
    const { data: openJobs } = await supabase
        .from('job_postings')
        .select(
            `
        id,
        title,
        location,
        employment_type,
        created_at,
        departments (
        id,
        name
        )
    `
        )
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(4);
    const { data: candidateProfile } = await supabase
        .from('candidate_profiles')
        .select('id, resume_text, experience_years, education')
        .eq('user_id', user.id)
        .maybeSingle();

    const { data: myApplications } = candidateProfile
        ? await supabase
            .from('job_applications')
            .select(
                `
                    id,
                    status,
                    created_at,
                    job_postings!job_applications_job_id_fkey (
                    id,
                    title,
                    location,
                    employment_type,
                    status
                    )
                `
            )
            .eq('candidate_id', candidateProfile.id)
            .order('created_at', { ascending: false })
            .limit(4)
        : { data: [] };



    const jobsAvailableCount = openJobs?.length ?? 0;
    const myApplicationsCount = myApplications?.length ?? 0;
    const myInterviewsCount = 0;

    const isProfileComplete = Boolean(
        candidateProfile?.resume_text &&
        candidateProfile?.experience_years !== null &&
        candidateProfile?.education
    );
    if (!profile || profile.role !== 'candidate') redirect('/login');

    const statCards = STAT_CARD_CONFIG.map((card) => {
        const values: Record<string, string | number> = {
            'Jobs Available': jobsAvailableCount,
            'My Applications': myApplicationsCount,
            'My Interviews': myInterviewsCount,
            'Profile Complete': isProfileComplete ? 'Yes' : 'No',
        };

        return {
            ...card,
            value: values[card.label],
        };
    });

    return (
        <DashboardLayout role="candidate" fullName={profile.full_name} title="My Overview">
            <div className="dash-section">
                <p className="s-tag dash-section-tag">Overview</p>
                <h1 className="s-h dash-page-heading">Hello, {profile.full_name.split(' ')[0]}.</h1>
            </div>

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

            <div className="dash-panels">
                <div className="glass-card dash-panel">
                    <p className="s-tag dash-panel-tag">Open Positions</p>

                    <div className="candidate-dashboard-list">
                        {openJobs?.length ? (
                            openJobs.map((job) => (
                                <Link
                                    key={job.id}
                                    href={`/jobs/${job.id}`}
                                    className="candidate-dashboard-job"
                                >
                                    <div>
                                        <p className="candidate-dashboard-job-title">{job.title}</p>
                                        <p className="candidate-dashboard-job-meta">
                                            {job.departments?.[0]?.name ?? 'General'}
                                            {job.location ? ` · ${job.location}` : ''}
                                            {job.employment_type ? ` · ${job.employment_type.replace('_', ' ')}` : ''}
                                        </p>
                                    </div>
                                    <span>View</span>
                                </Link>
                            ))
                        ) : (
                            <p className="dash-panel-empty">No open positions right now.</p>
                        )}
                    </div>
                </div>
                <div className="glass-card dash-panel">
                    <p className="s-tag dash-panel-tag">My Applications</p>

                    <div className="candidate-dashboard-list">
                        {myApplications?.length ? (
                            myApplications.map((application) => {
                                const job = Array.isArray(application.job_postings)
                                    ? application.job_postings[0]
                                    : application.job_postings;

                                const statusMessage = getApplicationStatusMessage(application.status);

                                return (
                                    <div
                                        key={application.id}
                                        className={`candidate-dashboard-application-card ${isFinalApplicationStatus(application.status)
                                            ? 'candidate-dashboard-application-card--final'
                                            : ''
                                            }`}
                                    >
                                        <Link
                                            href={job?.id ? `/jobs/${job.id}` : '#'}
                                            className="candidate-dashboard-job"
                                        >
                                            <div className="candidate-dashboard-job-main">
                                                <div>
                                                    <p className="candidate-dashboard-job-title">
                                                        {job?.title ?? 'Archived job'}
                                                    </p>

                                                    <p className="candidate-dashboard-job-meta">
                                                        {job?.location ? job.location : 'Details unavailable'}
                                                        {job?.employment_type
                                                            ? ` · ${job.employment_type.replace('_', ' ')}`
                                                            : ''}
                                                    </p>
                                                </div>

                                                <span
                                                    className={`candidate-application-status candidate-application-status--${application.status}`}
                                                >
                                                    {formatApplicationStatus(application.status)}
                                                </span>
                                            </div>
                                        </Link>

                                        {statusMessage ? (
                                            <p className="candidate-application-message">{statusMessage}</p>
                                        ) : null}

                                        {application.status === 'shortlisted' ? (
                                            <InterviewSlotPicker applicationId={application.id} />
                                        ) : null}
                                    </div>
                                );
                            })
                        ) : (
                            <p className="dash-panel-empty">Your applications will appear here.</p>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}