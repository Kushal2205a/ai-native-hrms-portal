import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { TrendingUp, ClipboardList, MessageSquare, UserCircle } from 'lucide-react';

export const metadata = { title: 'My Dashboard' };

const STAT_CARDS = [
  { label: 'Performance Score', value: '—', icon: TrendingUp,    color: 'var(--g)' },
  { label: 'Open Requests',     value: '—', icon: ClipboardList, color: 'var(--teal)' },
  { label: 'Chatbot Sessions',  value: '—', icon: MessageSquare, color: 'var(--amber)' },
  { label: 'Profile Complete',  value: '—', icon: UserCircle,    color: 'var(--g)' },
];

export default async function EmployeeDashboard() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'employee') redirect('/login');

  return (
    <DashboardLayout role="employee" fullName={profile.full_name} title="My Dashboard">
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
          <p className="s-tag dash-panel-tag">My Performance</p>
          <p className="dash-panel-empty">Your metrics will appear here.</p>
        </div>
        <div className="glass-card dash-panel">
          <p className="s-tag dash-panel-tag">Recent Requests</p>
          <p className="dash-panel-empty">Your submitted requests will appear here.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}