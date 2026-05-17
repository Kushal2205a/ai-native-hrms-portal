# Database Schema

Database: Supabase PostgreSQL  
Auth: Supabase Auth

## Schema Change Rule
Before adding a new table, column, enum, relationship, or API response field:
1. Update this file.
2. Add or update the SQL migration.
3. Update TypeScript types.
4. Then update UI/API code.

The AI assistant must not invent table names or column names inside components.

---

## profiles

Stores app-level user profile and role. Linked to Supabase Auth user.

Fields:
- id: uuid primary key, references auth.users(id)
- email: text
- full_name: text
- role: enum/admin/hr/employee/candidate
- department_id: uuid nullable
- job_title: text nullable
- phone: text nullable
- status: enum/active/inactive/pending
- created_at: timestamp

---

## departments

Fields:
- id: uuid primary key
- name: text
- description: text nullable
- created_at: timestamp

---

## job_postings

Fields:
- id: uuid primary key
- title: text
- department_id: uuid references departments(id)
- description: text
- required_skills: text[]
- location: text nullable
- employment_type: text nullable
- status: enum/draft/open/closed
- created_by: uuid references profiles(id)
- created_at: timestamp

---

## candidate_profiles

Fields:
- id: uuid primary key
- user_id: uuid references profiles(id)
- resume_url: text nullable
- resume_text: text nullable
- skills: text[]
- experience_years: numeric nullable
- education: text nullable
- created_at: timestamp

---

## job_applications

Fields:
- id: uuid primary key
- job_id: uuid references job_postings(id)
- candidate_id: uuid references candidate_profiles(id)
- status: enum/applied/screening/assessment/interview/shortlisted/rejected/hired
- ai_match_score: integer 0-100 nullable
- ai_screening_summary: text nullable
- created_at: timestamp

---

## interviews

Fields:
- id: uuid primary key
- application_id: uuid references job_applications(id)
- interviewer_id: uuid references profiles(id)
- scheduled_at: timestamp
- meeting_link: text nullable
- status: enum/scheduled/completed/cancelled
- transcript: text nullable
- ai_interview_summary: text nullable
- ai_candidate_score: integer 0-100 nullable
- created_at: timestamp

---

## employee_records

Fields:
- id: uuid primary key
- employee_id: uuid references profiles(id)
- manager_id: uuid references profiles(id) nullable
- joining_date: date nullable
- employment_status: enum/active/on_leave/terminated
- work_location: text nullable
- updated_at: timestamp

---

## performance_metrics

Fields:
- id: uuid primary key
- employee_id: uuid references profiles(id)
- period: text
- performance_score: integer 0-100
- attendance_score: integer 0-100 nullable
- engagement_score: integer 0-100 nullable
- manager_feedback: text nullable
- created_at: timestamp

---

## ai_employee_insights

Fields:
- id: uuid primary key
- employee_id: uuid references profiles(id)
- recommended_training: text nullable
- flight_risk_score: integer 0-100 nullable
- risk_reasoning: text nullable
- generated_at: timestamp

---

## chat_sessions

Fields:
- id: uuid primary key
- user_id: uuid references profiles(id)
- title: text nullable
- created_at: timestamp

---

## chat_messages

Fields:
- id: uuid primary key
- session_id: uuid references chat_sessions(id)
- sender_role: enum/user/assistant
- message: text
- created_at: timestamp