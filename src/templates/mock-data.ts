import type { SectionDataMap, SectionsConfig, ProposalTemplateProps } from './types';

// ── Mock Content (all 10 sections) ──────────────────────────────

export const MOCK_CONTENT: SectionDataMap = {
  cover: {
    title: 'Website Redesign & Development',
    subtitle: 'A modern, high-performance website that converts visitors into customers.',
    date: '2026-04-24',
  },
  problem: {
    headline: 'The Challenge',
    body: 'Your current website was built 4 years ago and no longer reflects the quality of your brand. Page load times exceed 6 seconds, mobile experience is broken, and your conversion rate sits at 0.8% — well below the 2.5% industry average. Potential customers are leaving before they ever see what you offer.',
  },
  solution: {
    headline: 'The Solution',
    body: 'I will design and build a completely new website from the ground up using Next.js and a modern design system. The result will be a lightning-fast, mobile-first experience that tells your brand story and guides visitors toward taking action — whether that\'s booking a call, requesting a quote, or making a purchase.',
  },
  approach: {
    headline: 'My Approach',
    steps: [
      {
        title: 'Discovery & Strategy',
        description: 'Deep-dive into your brand, audience, and goals. Audit competitors and define the information architecture.',
      },
      {
        title: 'Design',
        description: 'Create high-fidelity mockups for every page. Iterate based on your feedback until the design is pixel-perfect.',
      },
      {
        title: 'Development',
        description: 'Build the site with clean, performant code. Implement animations, forms, and integrations.',
      },
      {
        title: 'Launch & Support',
        description: 'Deploy to production, set up analytics, and provide 30 days of post-launch support.',
      },
    ],
  },
  deliverables: {
    headline: 'What You Get',
    items: [
      { name: 'Custom Website Design', description: '5 unique pages designed in Figma with responsive breakpoints' },
      { name: 'Front-End Development', description: 'Pixel-perfect implementation in Next.js with Tailwind CSS' },
      { name: 'CMS Integration', description: 'Headless CMS setup so you can update content without a developer' },
      { name: 'SEO Optimization', description: 'Technical SEO audit and implementation — meta tags, schema markup, sitemap' },
      { name: 'Performance Tuning', description: 'Core Web Vitals optimization targeting 90+ Lighthouse scores' },
      { name: 'Analytics Setup', description: 'Google Analytics 4 + conversion tracking configured and tested' },
    ],
  },
  timeline: {
    headline: 'Timeline',
    phases: [
      { phase: 'Discovery & Strategy', duration: '1 week', description: 'Kickoff call, brand audit, sitemap, wireframes' },
      { phase: 'Design', duration: '2 weeks', description: 'Mockups for all pages, 2 rounds of revisions' },
      { phase: 'Development', duration: '3 weeks', description: 'Front-end build, CMS integration, testing' },
      { phase: 'Launch', duration: '1 week', description: 'QA, deployment, analytics setup, handoff' },
    ],
  },
  pricing: {
    headline: 'Investment',
    summary: 'Fixed-price project with clear milestones and no surprises.',
    lineItems: [
      { label: 'Discovery & Strategy', amount: 150000 },
      { label: 'UI/UX Design (5 pages)', amount: 350000 },
      { label: 'Front-End Development', amount: 450000 },
      { label: 'CMS Integration', amount: 100000 },
      { label: 'SEO & Performance', amount: 100000 },
      { label: 'Launch & 30-Day Support', amount: 100000 },
    ],
    total: 1250000,
    note: '50% deposit to begin. Remaining 50% due on launch.',
  },
  about: {
    headline: 'About Me',
    body: 'I\'m a full-stack designer and developer with 8 years of experience building high-converting websites for startups and scale-ups. My work has been featured in Awwwards, Product Hunt, and CSS Design Awards. I obsess over the details so your customers don\'t have to think twice.',
  },
  faq: {
    headline: 'Frequently Asked Questions',
    items: [
      {
        question: 'What if I need more pages?',
        answer: 'Additional pages can be added at $800 per page. We\'ll scope this during the discovery phase.',
      },
      {
        question: 'Do you offer ongoing maintenance?',
        answer: 'Yes — I offer monthly retainer plans starting at $500/mo for updates, monitoring, and priority support.',
      },
      {
        question: 'What happens if I\'m not happy with the design?',
        answer: 'The design phase includes 2 full revision rounds. If we\'re still not aligned, you can walk away with a full refund of the deposit.',
      },
      {
        question: 'Can you work with my existing brand guidelines?',
        answer: 'Absolutely. I\'ll adapt the design to match your existing brand identity, fonts, and color palette.',
      },
    ],
  },
  cta: {
    headline: 'Ready to Get Started?',
    body: 'Accept this proposal to lock in your spot. I\'ll send over the deposit invoice and we can kick off discovery next week.',
    buttonLabel: 'Accept Proposal',
  },
};

// ── Default Sections Config ─────────────────────────────────────

export const MOCK_SECTIONS: SectionsConfig = {
  order: ['cover', 'problem', 'solution', 'approach', 'deliverables', 'timeline', 'pricing', 'about', 'faq', 'cta'],
  visibility: {
    cover: true,
    problem: true,
    solution: true,
    approach: true,
    deliverables: true,
    timeline: true,
    pricing: true,
    about: true,
    faq: false, // off by default per the plan
    cta: true,
  },
};

// ── Mock Proposal Metadata ──────────────────────────────────────

export const MOCK_PROPOSAL: ProposalTemplateProps['proposal'] = {
  projectTitle: 'Website Redesign & Development',
  clientName: 'Sarah Chen',
  clientEmail: 'sarah@acmecorp.com',
  amount: 1250000,
  currency: 'USD',
  createdAt: '2026-04-24T09:00:00Z',
};

// ── Mock Profile ────────────────────────────────────────────────

export const MOCK_PROFILE: ProposalTemplateProps['profile'] = {
  fullName: 'Alex Rivera',
  professionalTitle: 'Full-Stack Designer & Developer',
  bio: 'Full-stack designer & developer — 8 years building high-converting websites.',
  services: ['Web Design', 'Front-End Development', 'SEO', 'CMS Integration'],
  logoUrl: null,
  brandColor: '#5e6ad2',
  portfolioUrl: null,
  pastProjects: [],
};
