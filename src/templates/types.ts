// ═══════════════════════════════════════════════════════════════
// Clinch — Proposal Template Type System
// All templates must satisfy the ProposalTemplateProps interface.
// ═══════════════════════════════════════════════════════════════

/** The 10 canonical section keys */
export type SectionKey =
  | 'cover'
  | 'problem'
  | 'solution'
  | 'approach'
  | 'deliverables'
  | 'timeline'
  | 'pricing'
  | 'about'
  | 'faq'
  | 'cta';

export const ALL_SECTION_KEYS: SectionKey[] = [
  'cover',
  'problem',
  'solution',
  'approach',
  'deliverables',
  'timeline',
  'pricing',
  'about',
  'faq',
  'cta',
];

// ── Individual Section Data Shapes ──────────────────────────────

export interface CoverData {
  title: string;
  subtitle: string;
  date: string;
}

export interface ProblemData {
  headline: string;
  body: string;
  painPoints?: string[];
}

export interface SolutionData {
  headline: string;
  body: string;
}

export interface ApproachData {
  headline: string;
  steps: { title: string; description: string; duration?: string }[];
}

export interface DeliverableItem {
  name: string;
  description: string;
}

export interface DeliverablesData {
  headline: string;
  items: DeliverableItem[];
}

export interface TimelinePhase {
  phase: string;
  duration: string;
  description: string;
}

export interface TimelineData {
  headline: string;
  phases: TimelinePhase[];
}

export interface PricingData {
  headline: string;
  summary: string;
  lineItems: { label: string; amount: number }[];
  total: number;
  note: string;
}

export interface AboutData {
  headline: string;
  body: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQData {
  headline: string;
  items: FAQItem[];
}

export interface CTAData {
  headline: string;
  body: string;
  buttonLabel: string;
}

// ── Content map: section key → data shape ───────────────────────

export interface SectionDataMap {
  cover: CoverData;
  problem: ProblemData;
  solution: SolutionData;
  approach: ApproachData;
  deliverables: DeliverablesData;
  timeline: TimelineData;
  pricing: PricingData;
  about: AboutData;
  faq: FAQData;
  cta: CTAData;
}

// ── Theme Variables (CSS custom properties) ─────────────────────

export interface ThemeVariables {
  accent: string;
  accentForeground: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  border: string;
}

// ── Sections Config ─────────────────────────────────────────────

export interface SectionsConfig {
  order: SectionKey[];
  visibility: Record<SectionKey, boolean>;
}

// ── The Master Interface — every template must satisfy this ─────

export interface ProposalTemplateProps {
  proposal: {
    projectTitle: string;
    clientName: string;
    clientEmail: string;
    amount: number; // cents
    currency: string;
    createdAt: string;
  };
  content: SectionDataMap;
  sections: SectionsConfig;
  profile: {
    fullName: string;
    professionalTitle: string;
    bio: string;
    services: string[];
    logoUrl: string | null;
    brandColor: string;
  };
  theme: ThemeVariables;
  isPdf?: boolean;
}

// ── Template Registry Entry Type ────────────────────────────────

export interface TemplateRegistryEntry {
  name: string;
  component: React.ComponentType<ProposalTemplateProps>;
  themes: Record<string, ThemeVariables>;
  defaultTheme: string;
}
