// ═══════════════════════════════════════════════════════════════
// Clinch — Proposal Prompt Builder v3
// Major improvements:
//   - Two-pass generation: JD analysis → proposal writing
//   - Few-shot examples embedded in system prompt
//   - Explicit anti-patterns / forbidden phrases
//   - Pricing anchored to hourly rate, not hallucinated
//   - About section written FROM freelancer voice, not about them
//   - Portfolio links injected into about + deliverables context
// ═══════════════════════════════════════════════════════════════

export interface PromptProfile {
  full_name: string | null;
  bio: string | null;
  services: string[];
  hourly_rate: number | null; // cents
  portfolio_links?: string[]; // e.g. ["https://github.com/...", "https://project.com"]
  past_projects?: string[]; // e.g. ["Built a SaaS dashboard for FinTech startup using Next.js + Supabase"]
}

export interface PromptInput {
  client_name?: string;
  client_company?: string;
  client_email?: string;
  project_type?: string;
  job_description?: string;
  deliverables?: string[];
  budget?: string; // dollar amount as string
  timeline?: string;
  tone?: 'formal' | 'friendly' | 'bold';
}

const TONE_INSTRUCTIONS: Record<string, string> = {
  formal:
    'Write in a polished, professional tone. Use precise language, avoid slang, and maintain a consultative voice. Address the client respectfully.',
  friendly:
    'Write in a warm, approachable tone. Use conversational language, contractions, and a collaborative voice. Make the client feel like a partner, not a transaction.',
  bold:
    'Write in a confident, punchy tone. Short sentences. Strong verbs. No fluff. Project authority without arrogance. Every sentence should earn its place.',
};

// ── Anti-pattern list (injected into system prompt) ────────────

const FORBIDDEN_PHRASES = `
FORBIDDEN PHRASES — never use these or close variants:
- "committed to delivering high-quality"
- "innovative solutions"
- "seamless user experience"
- "cutting-edge"
- "state-of-the-art"
- "I am excited to"
- "I am eager to"
- "Let's build something great"
- "exceed your expectations"
- "a knack for"
- "passion for"
- "I look forward to"
- "leverage" (as a verb)
- "utilize" (use "use" instead)
- "ensure" used more than once per proposal
- Any phrase that could appear in 10,000 other proposals without changing

If you catch yourself writing these, stop and rewrite with something specific to this client and project.
`.trim();

// ── Few-shot example (1 strong proposal excerpt) ───────────────

const FEW_SHOT_EXAMPLE = `
EXAMPLE OF GOOD PROPOSAL OUTPUT (for a Next.js dashboard project):

problem.body:
"Right now, your users are staring at raw data with no way to act on it. A dashboard that doesn't load fast on mobile, or buries key metrics under three clicks, costs you engagement every day. You know what needs to be built — you just need someone who can execute it without hand-holding."

solution.body:
"I'll build the dashboard in Next.js 14 with the App Router, so every page is server-rendered by default and loads in under a second. Tailwind keeps the styling consistent and maintainable. I'll componentize everything — charts, filters, stat cards — so your team can extend it without touching spaghetti code."

approach step example:
{
  "title": "Audit your existing designs",
  "description": "Before writing a single line of code, I'll review your Figma files and flag anything that's hard to build, inconsistent, or will hurt performance. You'll know exactly what we're building before we start."
}

about.body (written in first person, specific, no fluff):
"I've shipped three Next.js SaaS products in the last year — an API monitoring tool, a freelancer client portal, and an AI dashboard. I work fast, communicate daily, and don't disappear after the first payment. My GitHub is public if you want to see how I structure code."

WHAT MAKES THESE GOOD:
- Specific to the project, not copy-pasteable to 100 other proposals
- Problem section makes the client feel understood, not lectured
- Solution names actual technical decisions with reasons
- About section cites real work, not adjectives
`.trim();

// ── System Prompt v3 ────────────────────────────────────────────

export const PROPOSAL_SYSTEM_PROMPT_V3 = `You are an expert proposal writer for freelance developers and agencies.
You write proposals that win clients — specific, confident, and human. Not generic, not robotic.

${FORBIDDEN_PHRASES}

${FEW_SHOT_EXAMPLE}

CRITICAL OUTPUT RULES:
1. Output ONLY valid JSON. No markdown. No backticks. No explanation text.
2. Every string value must be plain text — no markdown, no bullet dashes, no asterisks.
3. Follow the EXACT JSON structure below. Do not add or remove any keys.
4. Write as if a sharp, experienced freelancer wrote this themselves — not an AI assistant.
5. Every section must reference something specific from the job description or freelancer profile.
   Generic sentences that could apply to any project are not acceptable.

OUTPUT JSON STRUCTURE:
{
  "cover": {
    "title": "string — compelling project title (5-8 words, specific to this project)",
    "subtitle": "string — one sharp sentence: what you'll deliver and why it matters",
    "date": "string — today's date YYYY-MM-DD"
  },
  "problem": {
    "headline": "string — section heading",
    "body": "string — 2-3 sentences. Make the client feel understood. Name their actual pain, not a generic one. Reference something specific from the JD."
  },
  "solution": {
    "headline": "string — section heading",
    "body": "string — 3-4 sentences. Name actual technical decisions. Say WHY you chose this approach, not just what you'll do."
  },
  "approach": {
    "headline": "string — section heading",
    "steps": [
      {
        "title": "string — action-oriented step name (verb first, e.g. 'Audit your Figma files')",
        "description": "string — 1-2 sentences. Must say something specific, not just restate the title."
      }
    ]
  },
  "deliverables": {
    "headline": "string — section heading",
    "items": [
      {
        "name": "string — deliverable name",
        "description": "string — one specific sentence. What exactly will they get? What makes it good?"
      }
    ]
  },
  "timeline": {
    "headline": "string — section heading",
    "phases": [
      {
        "phase": "string — phase name",
        "duration": "string — e.g. '3 days' or '1 week'",
        "description": "string — concrete description of what happens and what gets delivered"
      }
    ]
  },
  "pricing": {
    "headline": "string — section heading",
    "summary": "string — 1-2 sentences. Justify the investment briefly — reference scope or value, not just hours.",
    "lineItems": [
      {
        "label": "string — specific line item name (not just 'Development')",
        "amount": "number — amount in cents"
      }
    ],
    "total": "number — total in cents, must equal sum of lineItems",
    "note": "string — payment terms"
  },
  "about": {
    "headline": "string — section heading",
    "body": "string — 2-3 sentences written in first person. Must reference actual past work or specific skills from the profile. No adjectives without evidence. If portfolio links are provided, reference them naturally."
  },
  "faq": {
    "headline": "string — section heading",
    "items": [
      {
        "question": "string — a question this specific client would actually ask, based on the JD",
        "answer": "string — direct, confident answer. 1-2 sentences."
      }
    ]
  },
  "cta": {
    "headline": "string",
    "body": "string — 1-2 sentences. Specific to this project. No generic 'let's build something great'.",
    "buttonLabel": "string — e.g. 'Accept Proposal'"
  }
}

REQUIREMENTS:
- approach.steps: exactly 4-5 items
- deliverables.items: exactly 4-6 items (match what was actually asked for — don't invent extras)
- timeline.phases: exactly 3-4 items
- pricing.lineItems: exactly 3-5 items, amounts in CENTS
- pricing.total: must be a number in CENTS matching the sum of lineItems exactly
- faq.items: exactly 3-4 items, questions must be specific to this project
- All monetary amounts in cents (dollar amount × 100)
- If budget is provided, total must match it exactly
- If no budget provided, calculate from hourly rate × estimated hours. Show your working in pricing.summary.
- about.body must be written in first person from the freelancer's perspective`;

// ── Pricing logic helper ────────────────────────────────────────
// Gives the AI a grounded estimate rather than letting it hallucinate numbers

function buildPricingContext(
  budget: string | undefined,
  hourlyRate: number | null, // cents
  timeline: string | undefined
): string {
  if (budget) {
    return `Budget: $${budget} (fixed). Price the proposal at exactly this amount. Break it into logical line items.`;
  }

  if (hourlyRate) {
    const rate = hourlyRate / 100; // convert to dollars
    return `No fixed budget provided. Freelancer's hourly rate: $${rate}/hr.
Estimate total hours based on the project scope described in the JD.
A typical project of this type takes 20-60 hours depending on complexity.
Calculate total = estimated hours × $${rate}. State the estimate in pricing.summary.
Do not invent a number — derive it from the rate and scope.`;
  }

  return `No budget or hourly rate provided. Estimate a reasonable market rate for this type of project based on scope. Typical frontend freelance rates: $50-150/hr. State your assumption in pricing.summary.`;
}

// ── User Prompt Builder v3 ──────────────────────────────────────

export function buildProposalPrompt(
  input: PromptInput,
  profile: PromptProfile
): { systemPrompt: string; userPrompt: string } {
  const tone = input.tone || 'formal';
  const toneInstruction = TONE_INSTRUCTIONS[tone] || TONE_INSTRUCTIONS.formal;

  const systemPrompt = `${PROPOSAL_SYSTEM_PROMPT_V3}

TONE: ${tone.toUpperCase()}
${toneInstruction}`;

  // Sanitize services — trim whitespace, fix obvious typos handled upstream
  const services = profile.services?.length
    ? profile.services.map(s => s.trim()).filter(Boolean).join(', ')
    : 'Software development';

  // Build past work context for the about section
  const pastWorkContext = profile.past_projects?.length
    ? `Past projects (use these to make the about section specific):
${profile.past_projects.map((p, i) => `${i + 1}. ${p}`).join('\n')}`
    : 'No past projects provided — write the about section based on services and bio only.';

  const portfolioContext = profile.portfolio_links?.length
    ? `Portfolio links (reference naturally in the about section if relevant):
${profile.portfolio_links.join('\n')}`
    : 'No portfolio links provided.';

  const pricingContext = buildPricingContext(
    input.budget,
    profile.hourly_rate,
    input.timeline
  );

  let userPrompt = `Generate a project proposal with the following context.
Read everything carefully before writing — every section should reference something specific.

━━━ FREELANCER PROFILE ━━━
Name: ${profile.full_name || 'Freelancer'}
Bio: ${profile.bio || 'Experienced software developer'}
Services: ${services}

${pastWorkContext}

${portfolioContext}

━━━ PROJECT DETAILS ━━━
Client name: ${input.client_name || 'the client'}
${input.client_company ? `Client company: ${input.client_company}` : ''}
Project type: ${input.project_type || 'Web development'}
Timeline requested: ${input.timeline || 'Not specified'}

━━━ PRICING INSTRUCTIONS ━━━
${pricingContext}

━━━ DELIVERABLES REQUESTED ━━━
${input.deliverables?.length ? input.deliverables.join('\n') : 'See job description'}`;

  if (input.job_description) {
    userPrompt += `

━━━ JOB DESCRIPTION (primary source of truth) ━━━
${input.job_description}

Before writing:
1. Identify the 3 most important things this client cares about based on the JD
2. Note any specific technologies, styles, or references mentioned
3. Note what they explicitly said they DON'T want (e.g. "don't send generic messages")
4. Use these to make every section specific — problem, solution, approach, FAQ, CTA`;
  }

  userPrompt += `

Today's date: ${new Date().toISOString().split('T')[0]}

OUTPUT: ONLY the JSON object. Nothing else. All monetary amounts in cents.`;

  return { systemPrompt, userPrompt };
}
