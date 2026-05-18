import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Briefcase, FileText, CalendarCheck, UserCircle } from 'lucide-react';

export const metadata = { title: 'Candidate' };

const STAT_CARDS = [
  { label: 'Jobs Available',    value: '—', icon: Briefcase,     color: 'var(--g)' },
  { label: 'My Applications',   value: '—', icon: FileText,      color: 'var(--teal)' },
  { label: 'My Interviews',     value: '—', icon: CalendarCheck, color: 'var(--amber)' },
  { label: 'Profile Complete',  value: '—', icon: UserCircle,    color: 'var(--g)' },
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

  if (!profile || profile.role !== 'candidate') redirect('/login');

  return (
    <DashboardLayout role="candidate" fullName={profile.full_name} title="My Overview">
      <div className="dash-section">
        <p className="s-tag dash-section-tag">Overview</p>
        <h1 className="s-h dash-page-heading">Hello, {profile.full_name.split(' ')[0]}.</h1>
      </div>

      <div className="dash-cards">
        {STAT_CARDS.map((card) => {
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
          <p className="dash-panel-empty">Available jobs will appear here.</p>
        </div>
        <div className="glass-card dash-panel">
          <p className="s-tag dash-panel-tag">My Applications</p>
          <p className="dash-panel-empty">Your applications will appear here.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}