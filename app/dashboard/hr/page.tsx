import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { FileText, CalendarCheck, Users, AlertTriangle } from 'lucide-react';

export const metadata = { title: 'HR' };

const STAT_CARDS = [
  { label: 'New Applications', value: '—', icon: FileText,      color: 'var(--g)' },
  { label: 'Interviews Today', value: '—', icon: CalendarCheck, color: 'var(--teal)' },
  { label: 'Active Employees', value: '—', icon: Users,         color: 'var(--amber)' },
  { label: 'At-Risk Employees',value: '—', icon: AlertTriangle, color: 'var(--red)' },
];

export default async function HRDashboard() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'hr'].includes(profile.role)) redirect('/login');

  return (
    <DashboardLayout role="hr" fullName={profile.full_name} title="HR Overview">
      <div className="dash-section">
        <p className="s-tag dash-section-tag">Overview</p>
        <h1 className="s-h dash-page-heading">Good to see you, {profile.full_name.split(' ')[0]}.</h1>
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
          <p className="s-tag dash-panel-tag">Pending Screenings</p>
          <p className="dash-panel-empty">Screening queue will appear here.</p>
        </div>
        <div className="glass-card dash-panel">
          <p className="s-tag dash-panel-tag">Upcoming Interviews</p>
          <p className="dash-panel-empty">Interviews will appear here.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}