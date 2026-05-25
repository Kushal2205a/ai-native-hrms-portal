import { runNvidiaChatCompletion } from './nvidia';

type ParsedResume = {
    skills: string[];
    education: string;
    experience_years: number | null;
    linkedin_url: string | null;
    github_url: string | null;
    portfolio_url: string | null;
};

export async function parseResumeWithAI(
    resumeText: string
): Promise<ParsedResume> {
    const prompt = `
Extract structured candidate information from this resume.

Return ONLY valid JSON.

Schema:
{
  "skills": string[],
  "education": string,
  "experience_years": number | null,
  "linkedin_url": string | null,
  "github_url": string | null,
  "portfolio_url": string | null
}

Rules:
- skills must contain only technical/professional skills
- experience_years should be an estimated total experience value
- Count internships and full-time roles
- Return integer numbers only
- Never include words like "years"

Examples:
"experience_years": 0
"experience_years": 0.5
"experience_years": 1
"experience_years": 2
- return null if a link is missing
- do not include markdown
- do not explain anything

Resume:
${resumeText}
`;

    const response = await runNvidiaChatCompletion({
        messages: [
            {
                role: 'system',
                content:
                    'You are a resume parsing assistant that returns strict JSON only.',
            },
            {
                role: 'user',
                content: prompt,
            },
        ],
        temperature: 0.1,
        max_tokens: 700,
    });

    try {
        const cleanedResponse = response
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();

        console.log('AI Resume Response:', cleanedResponse);

        return JSON.parse(cleanedResponse) as ParsedResume;
    } catch (error) {
        console.error('Raw AI response:', response);

        throw new Error('Failed to parse AI resume response.');
    }
}