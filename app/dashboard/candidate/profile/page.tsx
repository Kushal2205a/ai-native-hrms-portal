import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CandidateProfileForm from '@/components/candidate/CandidateProfileForm';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Candidate Profile',
};

export default async function CandidateProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, full_name, email')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'candidate') {
    redirect('/login');
  }

  const { data: candidateProfile } = await supabase
    .from('candidate_profiles')
    .select(
      `
      id,
      user_id,
      resume_url,
      resume_text,
      parsed_resume_json,
      skills,
      experience_years,
      education,
      portfolio_url,
      linkedin_url,
      github_url,
      created_at,
      updated_at
    `
    )
    .eq('user_id', user.id)
    .maybeSingle();

  return (
    <DashboardLayout
      role="candidate"
      fullName={profile.full_name}
      title="Candidate Profile"
    >
      <section className="dash-section">
        <p className="s-tag">Profile</p>
        <h1 className="s-h">Your candidate profile</h1>
        <p className="s-sub">
          Keep your skills, experience, and resume details updated before applying.
        </p>
      </section>

      <section className="glass-card dash-panel candidate-profile-panel">
        <CandidateProfileForm profile={candidateProfile} />
      </section>
    </DashboardLayout>
  );
}