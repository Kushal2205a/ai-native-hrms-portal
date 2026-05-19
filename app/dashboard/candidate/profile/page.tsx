
import CandidateProfileForm from '@/components/candidate/CandidateProfileForm';
import { createClient } from '@/lib/supabase/server';
import { requireDashboardSession } from '@/lib/auth/get-dashboard-session';

export const metadata = {
  title: 'Candidate Profile',
};

export default async function CandidateProfilePage() {
  const session = await requireDashboardSession('candidate');
  const supabase = await createClient();

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
    .eq('user_id', session.userId)
    .maybeSingle();

  return (
    <>
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
    </>
  );
}