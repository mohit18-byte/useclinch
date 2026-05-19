// ═══════════════════════════════════════════════════════════════
// Clinch — Proposal Prompt Builder v6
// What changed from v5:
//   - Added cleanJobDescription() — strips Twitter/social/emoji noise
//   - Added detectJDFormat() — classifies informal vs structured JDs
//   - INFORMAL JD mode: scope-aware instructions, no hallucinated features
//   - Per-section BAD PATTERN prohibitions embedded in JSON schema
//   - Cover title: explicit banned titles listed by name
//   - Problem: "Building X is challenging" explicitly prohibited
//   - Approach steps: generic titles banned by name
//   - CTA: must reference a specific risk, tech, or timeline item
//   - FAQ: generic questions banned by name
//   - cleanJobDescription() auto-called inside buildProposalPrompt()
// ═══════════════════════════════════════════════════════════════

// ── JD Preprocessor ─────────────────────────────────────────────
// Strips social media noise so the AI's feature extraction is clean.
// Called automatically by buildProposalPrompt() before prompt injection.

export function cleanJobDescription(raw: string): string {
  let text = raw;

  // Twitter @handles
  text = text.replace(/@[\w]+/g, '');

  // Shortened URLs — replace with [link] placeholder
  text = text.replace(
    /https?:\/\/(t\.co|bit\.ly|lnkd\.in|ow\.ly|buff\.ly|short\.io)\/\S+/g,
    '[link]'
  );

  // Remaining full URLs — keep domain name for context
  text = text.replace(/https?:\/\/([^\s/]+)[^\s]*/g, '[$1]');

  // Twitter/X thread numbering at line start (1/, 2/, 3/, 10/, etc.)
  text = text.replace(/^\d{1,2}\/\s*/gm, '');

  // RT patterns
  text = text.replace(/^RT\s+/gm, '');

  // Emoji (broad Unicode ranges)
  text = text.replace(
    /[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}\u{25AA}-\u{27FF}]/gu,
    ''
  );

  // Hashtags — strip # but keep the word (it's signal)
  text = text.replace(/#(\w+)/g, '$1');

  // Normalize whitespace
  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.trim();

  // Hard cap at 8000 chars to prevent prompt bloat on long threads
  if (text.length > 8000) {
    text = text.slice(0, 8000) + '\n[JD truncated — remaining content omitted]';
  }

  return text;
}

// ── JD Format Detector ───────────────────────────────────────────
// 'informal' = short/conversational tweet/DM, missing spec detail.
// 'structured' = has requirements, bullet lists, clear scope.

type JDFormat = 'structured' | 'informal';

function detectJDFormat(jd: string): JDFormat {
  const wordCount = jd.split(/\s+/).filter(Boolean).length;
  const hasStructuredKeywords =
    /requirements?|deliverable|responsibilities|looking for|tech stack|must.?have|nice.?to.?have|scope|features?|specification/i.test(
      jd
    );
  const hasBullets = (jd.match(/^[\-\*•·]\s/gm) ?? []).length >= 3;
  const hasNumberedList = (jd.match(/^\d+\.\s/gm) ?? []).length >= 3;

  if (wordCount < 120 && !hasStructuredKeywords && !hasBullets && !hasNumberedList) {
    return 'informal';
  }
  return 'structured';
}


export interface PromptProfile {
  full_name: string | null;
  bio: string | null;
  services: string[];
  portfolio_url?: string | null;
  past_projects?: Array<{ name: string; description: string; link?: string }>;
}

export type PricingMode = 'fixed' | 'hourly' | 'estimate';

export interface PromptInput {
  client_name?: string;
  client_company?: string;
  client_email?: string;
  project_type?: string;
  job_description?: string;
  deliverables?: string[];
  timeline?: string;
  tone?: 'formal' | 'friendly' | 'bold';
  currency?: string;        // ISO 4217 e.g. 'USD', 'INR', 'EUR'
  pricing_mode?: PricingMode;
  budget?: string;          // whole number as string, e.g. "500000" meaning ₹5,00,000
  hourly_rate?: string;     // whole number as string, e.g. "3000" meaning ₹3,000/hr
}

const TONE_INSTRUCTIONS: Record<string, string> = {
  formal:
    'Write in a polished, professional tone. Use precise language, avoid slang, and maintain a consultative voice. Address the client respectfully.',
  friendly:
    'Write in a warm, approachable tone. Use conversational language, contractions, and a collaborative voice. Make the client feel like a partner, not a transaction.',
  bold:
    'Write in a confident, punchy tone. Short sentences. Strong verbs. No fluff. Project authority without arrogance. Every sentence should earn its place.',
};

// ── Anti-pattern list ───────────────────────────────────────────

const FORBIDDEN_PHRASES = `
FORBIDDEN PHRASES — never use these or any close variant:
- "committed to delivering high-quality"
- "innovative solutions" / "innovative digital experiences"
- "seamless user experience" / "seamless experience"
- "cutting-edge" / "state-of-the-art"
- "I am excited to" / "I am eager to" / "I am passionate about"
- "Let's build something great" / "Let's build something amazing"
- "exceed your expectations" / "meet and exceed"
- "a knack for" / "passion for"
- "I look forward to"
- "leverage" (as a verb — use "use" instead)
- "utilize" (use "use" instead)
- "ensure" used more than once per proposal
- "efficient and innovative"
- "user-centric"
- "drive results" / "deliver results"
- "functional but also impactful"
- "hard-working" / "detail-oriented" / "self-starter"
- Any phrase that could appear unchanged in 10,000 other proposals

If you catch yourself writing any of these, stop and rewrite with something concrete and specific to this client and project.
`.trim();

// ── Few-shot examples ───────────────────────────────────────────

const FEW_SHOT_EXAMPLE = `
EXAMPLES OF GOOD VS BAD PROPOSAL WRITING — study these carefully:

━━━ PROBLEM SECTION ━━━

BAD (generic, could apply to anyone):
"Building an MVP is challenging. You need a developer who can deliver a clean, modern product on time and on budget."

GOOD (specific, makes client feel understood):
"You're not just building another SaaS — you're building the thing that writes proposals for other people, which means your users will judge the output quality against their own professional reputation. The hard part isn't the AI call; it's making the output sound human enough that a freelancer would actually send it without editing. That's the problem worth solving."

━━━ SOLUTION SECTION ━━━

BAD (stack list with no reasoning):
"I'll use Next.js, Tailwind CSS, and TypeScript to build a fast, responsive application with a modern UI."

GOOD (named decisions with reasons):
"I'll use Next.js 14 App Router with server components for the dashboard — this means the heavy AI API calls happen server-side, keeping the client fast even on slow connections. Supabase handles auth and storage so you're not building plumbing; you're building product. For the AI integration I'll stream responses token-by-token using the Vercel AI SDK — users see output immediately instead of staring at a spinner."

━━━ APPROACH STEPS ━━━

BAD (generic, applies to every project):
Step: "Development Phase"
Description: "Implement the frontend and backend features."

GOOD (specific tech + specific outcome):
Step: "Wire up OpenAI streaming with real-time UI feedback"
Description: "Integrate the OpenAI API with streaming so proposal text appears word-by-word in the editor. This is the moment users first see the product work — it needs to feel fast and magic, not sluggish."

━━━ FAQ QUESTIONS ━━━

BAD (generic, applies to any freelancer):
Q: "How do you handle project communication?"
A: "I provide regular updates and am available via Slack or email."

GOOD (specific to THIS project's risks):
Q: "How do you handle OpenAI rate limits or API failures mid-generation?"
A: "I implement retry logic and graceful degradation — if the API call fails, the user sees a clear error and can retry, not a blank screen. I'll also add a fallback prompt for partial generations."

━━━ ABOUT SECTION ━━━

BAD (adjectives without evidence):
"I am an experienced full-stack developer with a passion for building scalable, high-quality web applications."

GOOD (specific past work, written like a human):
"I built Clinch — an AI proposal generator for freelancers that parses job descriptions and generates tailored proposals using GPT-4. It's live, has paying users, and was built solo in six weeks with Next.js, Supabase, and the OpenAI API. Before that I shipped Canary, an API changelog monitor that uses browser automation to detect deprecations before they break production. I work fast, communicate daily, and I've already solved most of the hard problems you're about to run into."

WHAT MAKES THE GOOD EXAMPLES WORK:
- Problem: names the real hard part, not the obvious challenge
- Solution: every technology choice has a reason attached
- Approach: names the specific technology + the specific outcome
- FAQ: addresses risks unique to THIS project
- About: names real products, real tech, real timeline — no adjectives
`.trim();

// ── System Prompt v6 ────────────────────────────────────────────

export const PROPOSAL_SYSTEM_PROMPT_V6 = `You are an expert proposal writer for freelance developers and agencies.
Your proposals win clients because they are specific, confident, and human — not generic, not robotic.
A great proposal makes the client think "this person has already thought through my problem."

${FORBIDDEN_PHRASES}

${FEW_SHOT_EXAMPLE}

━━━ INFORMAL JD HANDLING ━━━
Sometimes a JD is short, conversational, or incomplete (a tweet, a Slack message, a 2-sentence LinkedIn DM).
When you are explicitly told the JD is INFORMAL, adjust:
- Problem: frame around what needs to be discovered — signal you understand the unknowns
- Deliverables: mark scope-uncertain items as "To be confirmed on kick-off call" instead of inventing specifics
- Timeline: use ranges ("3–5 weeks") not fixed commitments
- FAQ: include one question about your discovery/scoping process
- DO NOT invent features that were not mentioned. Under-specify rather than hallucinate scope.

━━━ PRE-WRITING CHECKLIST (MANDATORY — do this before writing a single word) ━━━

Step 1 — JD EXTRACTION
Read the job description carefully. Extract and mentally list:
a) Every specific feature and deliverable requested (e.g. "chat interface", "vector database", "file upload")
b) Every technology mentioned by name (e.g. "Pinecone", "LangChain", "Framer Motion", "Stripe")
c) The 2-3 things they care about MOST (often in "What matters most" or "Looking for" sections)
d) Anything they explicitly said they DON'T want (e.g. "no generic messages", "no copy-paste applications")
e) Any "bonus" or "nice to have" skills — these are differentiators, mention them if you have them

Step 2 — COVERAGE VERIFICATION
Every item from list (a) MUST appear in at least one deliverable.
Every technology from list (b) MUST appear in the solution or approach section.
If you cannot cover an item, address it in the FAQ.
Do NOT drop JD requirements to fit a length limit.

Step 3 — DIFFERENTIATOR CHECK
Does the freelancer's past work overlap with what the client is building?
If yes — this is your strongest asset. Lead with it in problem or about sections.
Example: Client building an AI proposal tool + freelancer built Clinch (an AI proposal tool) = mention this explicitly.

Step 4 — TONE CALIBRATION
Read how the client wrote the JD. Match their vocabulary.
If they said "RAG system" — use "RAG system", not "AI knowledge retrieval".
If they said "agentic workflows" — use "agentic workflows", not "AI automation".
Mirror their language exactly for technical terms.

━━━ CRITICAL OUTPUT RULES ━━━
1. Output ONLY valid JSON. No markdown. No backticks. No explanation text before or after.
2. Every string value must be plain text — no markdown, no bullet dashes, no asterisks.
3. Follow the EXACT JSON structure below. Do not add or remove any keys.
4. Write as if a sharp, experienced freelancer wrote this themselves — not an AI assistant.
5. Every section must reference something specific from the job description or freelancer profile.
   Generic sentences that could apply to any project are not acceptable.
6. Never invent deliverables not requested in the JD. Never drop deliverables that were requested.

OUTPUT JSON STRUCTURE:
{
  "cover": {
    "title": "string — 5-8 words. MUST name the specific technology, domain, or unique constraint of THIS project. BANNED BY NAME (never use these patterns): 'AI Chatbot Development Project', 'Web Application for [Company]', 'Full-Stack Development Project', 'Mobile App Development Proposal', '[Technology] Development Project'. GOOD PATTERNS: 'Real-Time RAG Chatbot with Pinecone Vector Search', 'Multi-Tenant SaaS Billing with Stripe Metered Usage', 'Sub-100ms Options Flow Trading Dashboard'",
    "subtitle": "string — one sharp sentence: what you will deliver AND the specific business outcome it creates for this client",
    "date": "string — today's date YYYY-MM-DD"
  },
  "problem": {
    "headline": "string — section heading",
    "body": "string — 2-3 sentences. Name the non-obvious technical constraint, data model decision, UX paradox, or scaling edge case specific to THIS project. MUST NOT start with 'Building X is challenging', 'You need a developer who', or 'This project requires experience'. MUST reference something specific from the JD — a named technology, a data constraint, a user behavior. The client should think: 'this person has already thought past the surface.'"
  },
  "solution": {
    "headline": "string — section heading",
    "body": "string — 3-4 sentences. Name actual technical decisions with reasons. For every technology you mention, say WHY you chose it over the alternative. If the client mentioned specific tech by name (Pinecone, LangChain, Framer Motion, Stripe, Supabase), address it directly."
  },
  "approach": {
    "headline": "string — section heading",
    "steps": [
      {
        "title": "string — verb-first, names a specific technology or specific deliverable outcome. BANNED BY NAME: 'Development Phase', 'Backend Development', 'Frontend Implementation', 'Testing and QA', 'Deployment', 'Project Setup'. GOOD: 'Wire up Pinecone vector search with chunked PDF ingestion', 'Build Stripe webhook handler for subscription lifecycle events'",
        "description": "string — 1-2 sentences. Must add information beyond the title. State what the client has in their hands at the end of this step."
      }
    ]
  },
  "deliverables": {
    "headline": "string — section heading",
    "items": [
      {
        "name": "string — deliverable name, use JD language exactly where possible",
        "description": "string — one specific sentence. What exactly will they receive? What makes it production-ready or measurable?"
      }
    ]
  },
  "timeline": {
    "headline": "string — section heading",
    "phases": [
      {
        "phase": "string — phase name",
        "duration": "string — e.g. '3 days', '1 week', or '3–5 days' for informal JDs",
        "description": "string — concrete: what happens, what gets built, what gets delivered at the end of this phase"
      }
    ]
  },
  "pricing": {
    "headline": "string — section heading",
    "summary": "string — 1-2 sentences. Justify the price by referencing scope complexity or value delivered. If hourly: show exact working (X hrs × rate = total). If fixed: confirm scope fit.",
    "lineItems": [
      {
        "label": "string — specific name tied to actual JD work. NOT generic: 'Development', 'Design', 'Backend', 'Frontend'. Use JD language and name the feature or capability.",
        "amount": "number — whole number greater than 0 in the proposal currency (e.g. 50000 means 50,000 in that currency)"
      }
    ],
    "total": "number — whole number greater than 0, must equal the EXACT sum of all lineItem amounts",
    "note": "string — payment terms, specific to this project"
  },
  "about": {
    "headline": "string — section heading",
    "body": "string — 2-3 sentences, first person. Pattern: Sentence 1: Name a real past project and what it does + tech stack. Sentence 2: Name another project OR a technical skill directly relevant to THIS project. Sentence 3: One concrete working-style fact with evidence — NOT just an adjective. Do NOT mention portfolio links or URLs."
  },
  "faq": {
    "headline": "string — section heading",
    "items": [
      {
        "question": "string — a question THIS specific client would ask. Must reference a technology, risk, or concern from their JD. BANNED BY NAME: 'How do you communicate?', 'What if scope changes?', 'What is your development process?', 'How do you handle revisions?'",
        "answer": "string — direct, confident, 1-2 sentences. Address the specific concern, not a generic reassurance."
      }
    ]
  },
  "cta": {
    "headline": "string",
    "body": "string — 1-2 sentences. MUST reference something specific from THIS project: a technical risk to validate, a timeline milestone, the client's stated priority, or a concrete next action. BANNED: any variation of 'let us build something great', 'let us create something amazing', 'I look forward to working with you'.",
    "buttonLabel": "string — e.g. 'Accept Proposal' or 'Let us Get Started'"
  }
}

━━━ SECTION REQUIREMENTS ━━━
- approach.steps: 4-5 items. Each MUST name a specific technology or specific deliverable outcome. Generic names are rejected.
- deliverables.items: Cover EVERY feature and deliverable mentioned in the JD — full coverage required. Do NOT invent extras not in the JD.
- timeline.phases: 3-4 items. If client gave a timeline, total phases must match it. If no timeline given, choose a realistic one.
- pricing.lineItems: 3-6 items. Each tied to real JD work. Amounts MUST be proportional to effort — complex AI/backend work costs more than simple deployment tasks.
- pricing.total: must equal the EXACT sum of all lineItem amounts. Recompute before returning.
- faq.items: 3-4 items. Every question must be specific to this project's risks, stack, or client concerns. Generic questions are rejected.
- about.body: first person, sentence pattern enforced above, names at least one real past project.

━━━ POST-WRITING SELF-CHECK (do this before returning JSON) ━━━
Before finalizing output, verify every item:
[ ] cover.title: does NOT match any banned pattern. Names a specific technology or domain.
[ ] problem.body: does NOT start with 'Building X is challenging' or 'You need a developer who'.
[ ] Every JD feature appears in at least one deliverable.
[ ] Every JD technology appears in solution or approach.
[ ] approach.steps: none have banned generic titles.
[ ] faq.items: none have banned generic questions.
[ ] cta.body: does NOT contain any banned generic phrase.
[ ] about.body: names at least one real past project by name.
[ ] Forbidden phrases list: zero occurrences in the entire output.
[ ] pricing.total equals the exact sum of all lineItem amounts.
[ ] timeline total is consistent with what the client requested.
If any check fails, rewrite that section before returning.`;

// ── Pricing context builder ─────────────────────────────────────

function buildPricingContext(
  mode: PricingMode,
  currency: string,
  budget?: string,
  hourlyRate?: string
): string {
  const sym = getCurrencySymbol(currency);
  const code = currency.toUpperCase();

  switch (mode) {
    case 'fixed': {
      const amount = budget ? parseFloat(budget) : 0;
      const formatted = new Intl.NumberFormat('en-US').format(amount);
      return `PRICING MODE: Fixed Budget
The client's budget is exactly ${sym}${formatted} ${code}.
- All lineItem amounts must sum to exactly ${amount}.
- pricing.total must be exactly ${amount}.
- Scope the deliverables to fit this budget. If the scope seems too large, simplify deliverables — do not exceed the budget.
- Do NOT exceed the budget under any circumstances.
- Distribute amounts proportionally: more complex work (AI integration, backend) should cost more than simpler work (deployment, testing).
- If the job description mentions a different budget, IGNORE IT. Use ${sym}${formatted} ${code} only.`;
    }

    case 'hourly': {
      const rate = hourlyRate ? parseFloat(hourlyRate) : 0;
      return `PRICING MODE: Hourly Rate
The freelancer charges ${sym}${rate} ${code} per hour for this project.
- Estimate the number of hours required based on the scope and deliverables.
- In pricing.summary, show your working: "Estimated X hours at ${sym}${rate}/hr = ${sym}[total]"
- pricing.total = estimated_hours × ${rate}
- Break the work into logical line items by task/phase, each showing hours × rate.
- Be realistic: complex AI integrations take longer than CRUD. Do not underestimate to look cheap.
- Proportionality: AI/vector DB work should cost more per line than boilerplate auth setup.`;
    }

    case 'estimate':
    default:
      return `PRICING MODE: AI Estimate
No budget or hourly rate was specified by the freelancer.
- Research and estimate a fair market rate for this type of project in ${code}.
- Use ${code} market rates — do NOT assume USD rates for non-USD currencies.
- In pricing.summary, clearly state your rate assumption (e.g. "Estimated at ${sym}X/hr for this region and project type").
- Break work into logical line items with realistic amounts.
- Proportionality: complex work (RAG pipelines, payment integration, real-time features) should cost significantly more than simple work (static pages, basic auth).`;
  }
}

function getCurrencySymbol(code: string): string {
  const map: Record<string, string> = {
    USD: '$', EUR: '€', GBP: '£', INR: '₹', AUD: 'A$', CAD: 'C$',
  };
  return map[code.toUpperCase()] ?? `${code} `;
}

// ── User Prompt Builder v6 ──────────────────────────────────────

export function buildProposalPrompt(
  input: PromptInput,
  profile: PromptProfile
): { systemPrompt: string; userPrompt: string } {
  const tone = input.tone || 'formal';
  const toneInstruction = TONE_INSTRUCTIONS[tone] || TONE_INSTRUCTIONS.formal;
  const currency = (input.currency || 'USD').toUpperCase();
  const pricingMode: PricingMode = input.pricing_mode || 'estimate';

  const systemPrompt = `${PROPOSAL_SYSTEM_PROMPT_V6}

TONE: ${tone.toUpperCase()}
${toneInstruction}`;

  const services = profile.services?.length
    ? profile.services.map(s => s.trim()).filter(Boolean).join(', ')
    : 'Software development';

  const pastWorkContext = profile.past_projects?.length
    ? `PAST PROJECTS — these are your strongest proof of work. Reference them by name in the about section.
Use the differentiator check: if any past project overlaps with what the client is building, call this out explicitly.
${profile.past_projects.map((p, i) => `${i + 1}. ${p.name}: ${p.description}`).join('\n')}

about.body sentence pattern to follow:
"I built [Project 1 name], which [what it does + tech stack in one clause]. [Project 2 name or specific skill directly relevant to this project]. [One concrete working-style fact with evidence, not just an adjective.]"`
    : 'No past projects provided — write the about section based on services and bio only. Be as specific as possible with technologies and outcomes.';

  const portfolioContext = profile.portfolio_url
    ? `The freelancer has a portfolio at ${profile.portfolio_url}. DO NOT mention this URL or any link in the about section paragraph — it is already displayed as a clickable button in the proposal UI.`
    : 'No portfolio URL provided.';

  const pricingContext = buildPricingContext(
    pricingMode,
    currency,
    input.budget,
    input.hourly_rate
  );

  let userPrompt = `Generate a project proposal. Read everything below carefully before writing.
Every section must be specific to this client and project — not copy-pasteable to any other proposal.

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
Currency: ${currency}
${pricingContext}

━━━ DELIVERABLES REQUESTED ━━━
${input.deliverables?.length ? input.deliverables.join('\n') : 'See job description — extract all deliverables from it'}`;

  // Clean and detect JD format before injecting into prompt
  const rawJD = input.job_description?.trim() ?? '';
  const cleanedJD = rawJD ? cleanJobDescription(rawJD) : '';
  const jdFormat: JDFormat = cleanedJD ? detectJDFormat(cleanedJD) : 'structured';

  if (cleanedJD) {
    const formatNote =
      jdFormat === 'informal'
        ? `\nJD FORMAT: INFORMAL — this is a short/conversational job lead (tweet, DM, or brief post). Follow the INFORMAL JD HANDLING rules from the system prompt. Do not invent unmentioned features.`
        : `\nJD FORMAT: STRUCTURED — treat this as a full specification.`;

    userPrompt += `

━━━ JOB DESCRIPTION (primary source of truth for scope and language) ━━━${formatNote}
${cleanedJD}

IMPORTANT: The pricing instructions above override any budget or rate mentioned in this JD.

MANDATORY PRE-WRITE (complete these steps before generating JSON):

Step 1 — Extract from this JD:
  Features/deliverables: list every specific feature mentioned
  Technologies: list every technology mentioned by name
  Top priorities: what does the client care about MOST (check "What matters most", "Looking for", "Bonus skills")
  Exclusions: anything they explicitly don't want
  Differentiators: does any freelancer past project match what the client is building?

Step 2 — Verify coverage:
  Every extracted feature → must appear in deliverables
  Every extracted technology → must appear in solution or approach
  Any bonus/nice-to-have skill the freelancer has → mention it explicitly

Step 3 — Mirror their language:
  Use the client's exact technical terms (RAG, agentic, vector search, etc.)
  Do NOT substitute with generic synonyms`;
  }

  userPrompt += `

Today's date: ${new Date().toISOString().split('T')[0]}

MONETARY AMOUNT FORMAT: Return all amounts as plain whole numbers in ${currency}.
Examples: ₹5,00,000 → 500000 | $5,000 → 5000 | €3,500 → 3500
Do NOT use decimals. Do NOT multiply by 100. Return human-readable amounts only.

OUTPUT: ONLY the JSON object. No text before or after. No markdown fences.`;

  return { systemPrompt, userPrompt };
}