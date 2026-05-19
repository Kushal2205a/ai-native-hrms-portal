'use client';

import { useState, useTransition, type FormEvent, type KeyboardEvent } from 'react';
import { upsertCandidateProfile } from '@/lib/actions/candidate';
import type { CandidateProfile } from '@/types/database';

interface CandidateProfileFormProps {
  profile: CandidateProfile | null;
}

export default function CandidateProfileForm({ profile }: CandidateProfileFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [resumeText, setResumeText] = useState(profile?.resume_text ?? '');
  const [skills, setSkills] = useState<string[]>(profile?.skills ?? []);
  const [skillInput, setSkillInput] = useState('');
  const [experienceYears, setExperienceYears] = useState(
    profile?.experience_years?.toString() ?? ''
  );
  const [education, setEducation] = useState(profile?.education ?? '');
  const [portfolioUrl, setPortfolioUrl] = useState(profile?.portfolio_url ?? '');
  const [linkedinUrl, setLinkedinUrl] = useState(profile?.linkedin_url ?? '');
  const [githubUrl, setGithubUrl] = useState(profile?.github_url ?? '');

  function addSkill() {
    const value = skillInput.trim();

    if (!value) return;

    const alreadyExists = skills.some(
      (skill) => skill.toLowerCase() === value.toLowerCase()
    );

    if (alreadyExists) {
      setSkillInput('');
      return;
    }

    setSkills((current) => [...current, value]);
    setSkillInput('');
  }

  function removeSkill(skillToRemove: string) {
    setSkills((current) => current.filter((skill) => skill !== skillToRemove));
  }

  function handleSkillKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError('');
    setSuccess('');

    const parsedExperience =
      experienceYears.trim() === '' ? null : Number(experienceYears);

    if (parsedExperience !== null && Number.isNaN(parsedExperience)) {
      setError('Experience must be a valid number.');
      return;
    }

    startTransition(async () => {
      try {
        await upsertCandidateProfile({
          resume_text: resumeText.trim() || null,
          skills,
          experience_years: parsedExperience,
          education,
          portfolio_url: portfolioUrl,
          linkedin_url: linkedinUrl,
          github_url: githubUrl,
        });

        setSuccess('Candidate profile saved.');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong.');
      }
    });
  }

  return (
    <form className="candidate-profile-form" onSubmit={handleSubmit}>
      <div className="candidate-form-grid">
        <label className="candidate-field candidate-field-full">
          <span>Resume Text</span>
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste your resume text here. Later, this will be parsed and screened by AI."
            rows={10}
          />
        </label>

        <label className="candidate-field">
          <span>Experience Years</span>
          <input
            value={experienceYears}
            onChange={(e) => setExperienceYears(e.target.value)}
            placeholder="Example: 2"
            inputMode="decimal"
          />
        </label>

        <label className="candidate-field">
          <span>Education</span>
          <input
            value={education}
            onChange={(e) => setEducation(e.target.value)}
            placeholder="Example: B.Tech CSE"
          />
        </label>

        <label className="candidate-field candidate-field-full">
          <span>Skills</span>
          <div className="candidate-skill-input-row">
            <input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={handleSkillKeyDown}
              placeholder="Type a skill and press Enter"
            />
            <button type="button" onClick={addSkill}>
              Add
            </button>
          </div>

          {skills.length > 0 ? (
            <div className="candidate-skill-list">
              {skills.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  className="candidate-skill-chip"
                  onClick={() => removeSkill(skill)}
                  title="Click to remove"
                >
                  {skill} ×
                </button>
              ))}
            </div>
          ) : (
            <p className="candidate-help-text">No skills added yet.</p>
          )}
        </label>

        <label className="candidate-field">
          <span>Portfolio URL</span>
          <input
            value={portfolioUrl}
            onChange={(e) => setPortfolioUrl(e.target.value)}
            placeholder="https://yourportfolio.com"
          />
        </label>

        <label className="candidate-field">
          <span>LinkedIn URL</span>
          <input
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            placeholder="https://linkedin.com/in/..."
          />
        </label>

        <label className="candidate-field">
          <span>GitHub URL</span>
          <input
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            placeholder="https://github.com/..."
          />
        </label>
      </div>

      {error ? <div className="candidate-form-error">{error}</div> : null}
      {success ? <div className="candidate-form-success">{success}</div> : null}

      <div className="candidate-form-actions">
        <button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </form>
  );
}