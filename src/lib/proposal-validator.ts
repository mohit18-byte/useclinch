// ═══════════════════════════════════════════════════════════════
// Clinch — Proposal Content Validator (Zod)
// Validates AI output against the 10-section schema.
// ═══════════════════════════════════════════════════════════════

import { z, safeParse } from 'zod';

// ── Section Schemas ─────────────────────────────────────────────

const coverSchema = z.object({
  title: z.string().min(5),
  subtitle: z.string().min(10),
  date: z.string().min(1),
});

const problemSchema = z.object({
  headline: z.string().min(1),
  body: z.string().min(40, "Problem body too short — likely truncated or generic"),
});

const solutionSchema = z.object({
  headline: z.string().min(1),
  body: z.string().min(40, "Solution body too short — likely truncated or generic"),
});

const approachStepSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
});

const approachSchema = z.object({
  headline: z.string().min(1),
  steps: z.array(approachStepSchema).min(2),
});

const deliverableItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
});

const deliverablesSchema = z.object({
  headline: z.string().min(1),
  items: z.array(deliverableItemSchema).min(2),
});

const timelinePhaseSchema = z.object({
  phase: z.string().min(1),
  duration: z.string().min(1),
  description: z.string().min(1),
});

const timelineSchema = z.object({
  headline: z.string().min(1),
  phases: z.array(timelinePhaseSchema).min(2),
});

const lineItemSchema = z.object({
  label: z.string().min(1),
  amount: z.number().positive("Line item amount must be greater than 0"),
});

const pricingSchema = z.object({
  headline: z.string().min(1),
  summary: z.string().min(10),
  lineItems: z.array(lineItemSchema).min(1),
  total: z.number().positive("Pricing total must be greater than 0"),
  note: z.string(),
});

const aboutSchema = z.object({
  headline: z.string().min(1),
  body: z.string().min(40, "About body too short — likely missing past project references"),
});

const faqItemSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});

const faqSchema = z.object({
  headline: z.string().min(1),
  items: z.array(faqItemSchema).min(2),
});

const ctaSchema = z.object({
  headline: z.string().min(1),
  body: z.string().min(1),
  buttonLabel: z.string().min(1),
});

// ── Full Proposal Content Schema ────────────────────────────────

export const proposalContentSchema = z.object({
  cover: coverSchema,
  problem: problemSchema,
  solution: solutionSchema,
  approach: approachSchema,
  deliverables: deliverablesSchema,
  timeline: timelineSchema,
  pricing: pricingSchema,
  about: aboutSchema,
  faq: faqSchema,
  cta: ctaSchema,
});

export type ProposalContent = z.infer<typeof proposalContentSchema>;

// ── Validation Function ─────────────────────────────────────────

export function validateProposalContent(raw: unknown): {
  success: boolean;
  data?: ProposalContent;
  error?: string;
} {
  const result = safeParse(proposalContentSchema, raw);

  if (!result.success) {
    // Build a human-readable error message
    const issues = result.error.issues
      .slice(0, 5)
      .map((issue) => {
        const path = issue.path.join('.');
        return `${path}: ${issue.message}`;
      })
      .join('; ');

    return {
      success: false,
      error: `Validation failed: ${issues}`,
    };
  }

  // Cross-validate: pricing total must approximately equal sum of line items
  // (after transformPricingAmounts multiplies by 100, we check pre-transform)
  const data = result.data;
  if (data.pricing.lineItems.length > 0) {
    const computedSum = data.pricing.lineItems.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    // Allow up to 1% rounding tolerance
    const tolerance = computedSum * 0.01;
    if (Math.abs(data.pricing.total - computedSum) > Math.max(tolerance, 1)) {
      return {
        success: false,
        error: `Validation failed: pricing.total (${data.pricing.total}) does not match sum of lineItems (${computedSum})`,
      };
    }
  }

  return { success: true, data };
}
