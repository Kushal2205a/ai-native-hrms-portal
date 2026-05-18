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