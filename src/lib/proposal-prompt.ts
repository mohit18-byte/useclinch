// ═══════════════════════════════════════════════════════════════
// Clinch — Proposal Prompt Builder (10-Section Format)
// Constructs system + user prompts for OpenAI proposal generation.
// ═══════════════════════════════════════════════════════════════

export interface PromptProfile {
  full_name: string | null;
  bio: string | null;
  services: string[];
  hourly_rate: number | null; // cents
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
    'Write in a confident, high-energy tone. Use strong assertions, punchy sentences, and a results-driven voice. Project authority and urgency.',
};

// ── System Prompt ───────────────────────────────────────────────

export const PROPOSAL_SYSTEM_PROMPT_V2 = `You are an expert proposal writer for freelancers and agencies.
You write compelling, specific, and conversion-optimized project proposals.

CRITICAL RULES:
1. Output ONLY valid JSON. No markdown. No backticks. No explanation text.
2. Every string value must be plain text — no markdown formatting, no bullet points with dashes, no asterisks.
3. Follow the EXACT JSON structure below. Do not add or remove any keys.

OUTPUT JSON STRUCTURE:
{
  "cover": {
    "title": "string — compelling project title (5-8 words)",
    "subtitle": "string — one-sentence value proposition",
    "date": "string — today's date in YYYY-MM-DD format"
  },
  "problem": {
    "headline": "string — section heading (e.g. 'The Challenge')",
    "body": "string — 2-4 sentences describing the client's pain point"
  },
  "solution": {
    "headline": "string — section heading (e.g. 'The Solution')",
    "body": "string — 3-5 sentences describing the proposed solution"
  },
  "approach": {
    "headline": "string — section heading (e.g. 'My Approach')",
    "steps": [
      {
        "title": "string — step name",
        "description": "string — 1-2 sentence description"
      }
    ]
  },
  "deliverables": {
    "headline": "string — section heading (e.g. 'What You Get')",
    "items": [
      {
        "name": "string — deliverable name",
        "description": "string — brief description"
      }
    ]
  },
  "timeline": {
    "headline": "string — section heading (e.g. 'Timeline')",
    "phases": [
      {
        "phase": "string — phase name",
        "duration": "string — e.g. '2 weeks'",
        "description": "string — what happens in this phase"
      }
    ]
  },
  "pricing": {
    "headline": "string — section heading (e.g. 'Investment')",
    "summary": "string — 1-2 sentence pricing overview",
    "lineItems": [
      {
        "label": "string — line item name",
        "amount": "number — amount in cents (e.g. 150000 for $1,500)"
      }
    ],
    "total": "number — total in cents, must equal sum of lineItems",
    "note": "string — payment terms (e.g. '50% deposit to begin')"
  },
  "about": {
    "headline": "string — section heading (e.g. 'About Me')",
    "body": "string — 2-4 sentences about the freelancer"
  },
  "faq": {
    "headline": "string — section heading (e.g. 'FAQ')",
    "items": [
      {
        "question": "string",
        "answer": "string — 1-3 sentences"
      }
    ]
  },
  "cta": {
    "headline": "string — e.g. 'Ready to Get Started?'",
    "body": "string — 1-2 sentence closing message",
    "buttonLabel": "string — e.g. 'Accept Proposal'"
  }
}

REQUIREMENTS:
- approach.steps: exactly 3-5 items
- deliverables.items: exactly 4-8 items
- timeline.phases: exactly 3-6 items
- pricing.lineItems: exactly 3-8 items, amounts in CENTS
- pricing.total: must be a number in CENTS matching the sum of lineItems
- faq.items: exactly 3-5 items
- All amounts are in cents (multiply dollar amounts by 100)
- If a budget is provided, pricing.total should match or be close to it
- about section should be written from the freelancer's perspective using the profile info provided`;

// ── User Prompt Builder ─────────────────────────────────────────

export function buildProposalPrompt(
  input: PromptInput,
  profile: PromptProfile
): { systemPrompt: string; userPrompt: string } {
  const tone = input.tone || 'formal';
  const toneInstruction = TONE_INSTRUCTIONS[tone] || TONE_INSTRUCTIONS.formal;

  const systemPrompt = `${PROPOSAL_SYSTEM_PROMPT_V2}

TONE: ${tone.toUpperCase()}
${toneInstruction}`;

  const hourlyRate = profile.hourly_rate
    ? `$${(profile.hourly_rate / 100).toFixed(0)}/hr`
    : 'Not specified';

  const services = profile.services?.length
    ? profile.services.join(', ')
    : 'General software development';

  let userPrompt = `Generate a project proposal with the following context:

FREELANCER PROFILE:
Name: ${profile.full_name || 'Freelancer'}
Bio: ${profile.bio || 'Experienced software developer'}
Services: ${services}
Hourly Rate: ${hourlyRate}

PROJECT DETAILS:
Client: ${input.client_name || 'Unknown'} ${input.client_company ? `(${input.client_company})` : ''}
Project Type: ${input.project_type || 'General'}
Budget: ${input.budget ? `$${input.budget}` : 'TBD'}
Timeline: ${input.timeline || 'TBD'}`;

  if (input.deliverables?.length) {
    userPrompt += `\nRequested Deliverables: ${input.deliverables.join(', ')}`;
  }

  if (input.job_description) {
    userPrompt += `

RAW JOB DESCRIPTION:
${input.job_description}

Use the job description as the primary source of truth for understanding the project scope.
Extract and infer any missing details from it. The proposal should directly address every requirement mentioned.`;
  }

  userPrompt += `

Today's date is ${new Date().toISOString().split('T')[0]}.
Remember: output ONLY the JSON object, nothing else. All monetary amounts must be in cents.`;

  return { systemPrompt, userPrompt };
}
