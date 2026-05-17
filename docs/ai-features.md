# AI Features

All AI calls must run server-side only.

Do not expose API keys to the client.

All AI outputs must use structured JSON and must be validated before saving to Supabase.

AI should assist HR decisions, not make final decisions automatically.

---

## 1. Resume Screening

Route:
- POST /api/ai/resume-screening

Input:
- job_description
- required_skills
- resume_text

Output:
```json
{
  "matchScore": 85,
  "summary": "Short summary of candidate fit.",
  "strengths": ["string"],
  "concerns": ["string"],
  "recommendation": "reject | hold | shortlist"
}