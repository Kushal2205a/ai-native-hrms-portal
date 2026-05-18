import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Users, Briefcase, CalendarCheck, TrendingUp } from 'lucide-react';

export const metadata = { title: 'Admin' };

const STAT_CARDS = [
  { label: 'Total Employees', value: '—', icon: Users,         color: 'var(--g)' },
  { label: 'Open Roles',      value: '—', icon: Briefcase,     color: 'var(--teal)' },
  { label: 'Interviews Today',value: '—', icon: CalendarCheck, color: 'var(--amber)' },
  { label: 'Avg Performance', value: '—', icon: TrendingUp,    color: 'var(--g)' },
];

export default async function AdminDashboard() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') redirect('/login');

  return (
    <DashboardLayout role="admin" fullName={profile.full_name} title="Admin Overview">
      <div className="dash-section">
        <p className="s-tag dash-section-tag">Overview</p>
        <h1 className="s-h dash-page-heading">Good to see you, {profile.full_name.split(' ')[0]}.</h1>
      </div>

      {/* Stat cards */}
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

      {/* Placeholder panels */}
      <div className="dash-panels">
        <div className="glass-card dash-panel">
          <p className="s-tag dash-panel-tag">Recent Applications</p>
          <p className="dash-panel-empty">Applications will appear here.</p>
        </div>
        <div className="glass-card dash-panel">
          <p className="s-tag dash-panel-tag">Upcoming Interviews</p>
          <p className="dash-panel-empty">Interviews will appear here.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}