export async function fetchMockInterviewTranscript() {
  await new Promise((resolve) => setTimeout(resolve, 900));

  return `
Interviewer: Thanks for joining today. Can you briefly introduce yourself and your experience?

Candidate: Sure. I have around eight years of frontend engineering experience, mainly with React, Next.js, TypeScript, and design systems. In my recent role, I worked on dashboard-heavy products with reusable UI components, performance optimization, and server-side rendering.

Interviewer: This role requires building polished HR dashboards with filters, tables, and workflow-heavy screens. Have you worked on similar interfaces?

Candidate: Yes. I built internal operations dashboards where users had to review requests, filter records, update statuses, and collaborate across teams. I focused on making the UI responsive, fast, and easy to scan. I also worked on reducing bundle size and improving page load performance.

Interviewer: How would you approach a complex component like an applications review table?

Candidate: I would separate data fetching, state handling, and presentation. I would start with clear types, reusable row and badge components, and then add filters carefully. I would also make sure empty states, loading states, and error states are handled.

Interviewer: Tell me about a technical challenge you solved.

Candidate: We had a dashboard that became slow as data grew. I profiled rendering, memoized expensive components, paginated large lists, and moved some filtering server-side. This improved perceived performance and made the dashboard much smoother.

Interviewer: How comfortable are you with ownership and ambiguous requirements?

Candidate: I am comfortable with that. I usually clarify the user flow, define the smallest useful version, ship it, and then iterate based on feedback. I also document tradeoffs so the team understands why certain choices were made.

Interviewer: Any experience with accessibility?

Candidate: Yes. I have worked with keyboard navigation, semantic HTML, focus states, and color contrast. I try to include accessibility while building components rather than treating it as a final pass.

Interviewer: Thanks. Do you have any questions?

Candidate: Yes. I would like to understand how the team currently measures dashboard quality and what workflows are highest priority for HR users.
`.trim();
}