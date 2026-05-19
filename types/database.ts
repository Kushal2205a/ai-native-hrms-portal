export type Role = 'admin' | 'hr' | 'employee' | 'candidate';
export type ProfileStatus = 'active' | 'inactive' | 'pending';
export type JobStatus = 'draft' | 'open' | 'closed';
export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'internship';
export type ApplicationStatus =
  | 'applied'
  | 'screening'
  | 'shortlisted'
  | 'assessment_assigned'
  | 'assessment_completed'
  | 'interview_scheduled'
  | 'interview_completed'
  | 'offered'
  | 'rejected'
  | 'hired';
export type InterviewStatus = 'scheduled' | 'completed' | 'cancelled';
export type EmploymentStatus = 'active' | 'on_leave' | 'terminated';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  department_id: string | null;
  job_title: string | null;
  phone: string | null;
  status: ProfileStatus;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface JobPosting {
  id: string;
  title: string;
  department_id: string | null;
  description: string;
  required_skills: string[];
  location: string | null;
  employment_type: EmploymentType | null;
  status: JobStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // joined
  departments?: Pick<Department, 'id' | 'name'> | null;
}

export interface CandidateProfile {
  id: string;
  user_id: string;
  resume_url: string | null;
  resume_text: string | null;
  parsed_resume_json: Record<string, unknown> | null;
  skills: string[];
  experience_years: number | null;
  education: string | null;
  portfolio_url: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  created_at: string;
  updated_at: string;

  // joined
  profiles?: Pick<Profile, 'id' | 'email' | 'full_name' | 'role'> | null;
}

export interface JobApplication {
  id: string;
  job_id: string;
  candidate_id: string;
  status: ApplicationStatus;
  source: string | null;
  cover_note: string | null;
  created_at: string;
  updated_at: string;

  // joined
  job_postings?: Pick<
    JobPosting,
    'id' | 'title' | 'location' | 'employment_type' | 'status' | 'created_at'
  > | null;
  candidate_profiles?: Pick<
    CandidateProfile,
    'id' | 'user_id' | 'skills' | 'experience_years' | 'education'
  > | null;
}

export type ApplicationReview = {
  id: string;
  job_id: string;
  candidate_id: string;
  status: string;
  source: string | null;
  cover_note: string | null;
  created_at: string;
  updated_at: string;
  job_title: string;
  job_location: string | null;
  job_employment_type: string | null;
  candidate_profile_id: string;
  candidate_user_id: string;
  candidate_full_name: string | null;
  candidate_email: string | null;
  candidate_skills: string[] | null;
  candidate_experience_years: number | null;
  candidate_education: string | null;

  screening_score: number | null;
  screening_recommendation: ScreeningRecommendation | null;
  screening_summary: string | null;
  screening_strengths: string[] | null;
  screening_concerns: string[] | null;
  screening_model: string | null;
  screening_created_at: string | null;
};

export type ScreeningRecommendation =
  | 'strong_match'
  | 'possible_match'
  | 'weak_match';

export type ApplicationScreening = {
  id: string;
  application_id: string;
  score: number;
  recommendation: ScreeningRecommendation;
  summary: string;
  strengths: string[];
  concerns: string[];
  model: string;
  raw_response: unknown | null;
  created_at: string;
  updated_at: string;
};