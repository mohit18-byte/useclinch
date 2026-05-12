'use client';

import React from 'react';
import type {
  ProposalTemplateProps,
  SectionKey,
  CoverData,
  ProblemData,
  SolutionData,
  ApproachData,
  DeliverablesData,
  TimelineData,
  PricingData,
  AboutData,
  FAQData,
  CTAData,
} from '../types';

/* ── Helpers ─────────────────────────────────────────────────── */

function formatCurrency(cents: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/* ── useInView hook ──────────────────────────────────────────── */
function useInView(options?: IntersectionObserverInit) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [inView, setInView] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        observer.disconnect(); // fire once only
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -48px 0px', ...options });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, inView };
}

/* ── Animated wrapper ────────────────────────────────────────── */
function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, inView } = useInView();
  return (
    <div
      ref={ref}
      className={`tpl-am__reveal${inView ? ' tpl-am__reveal--in' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ── ScaleIn wrapper (for cards) ──────────────────────────────── */
function ScaleIn({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, inView } = useInView();
  return (
    <div
      ref={ref}
      className={`tpl-am__scale-in${inView ? ' tpl-am__scale-in--in' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ── Section Label ───────────────────────────────────────────── */
const SectionLabel = ({ text, index }: { text: string; index?: string }) => (
  <div className="tpl-am__section-label">
    {index && <span className="tpl-am__section-index">{index}</span>}
    <span className="tpl-am__section-tag">{text}</span>
  </div>
);

/* ── Section Components ──────────────────────────────────────── */

const CoverSection = React.memo(function CoverSection({
  data, proposal, profile, isPdf,
}: { data: CoverData; proposal: ProposalTemplateProps['proposal']; profile: ProposalTemplateProps['profile']; isPdf?: boolean }) {
  return (
    <section className="tpl-am__cover">
      <div className="tpl-am__cover-noise" />
      <div className="tpl-am__cover-inner">
        <div className={`tpl-am__cover-top${isPdf ? '' : ' tpl-am__cover-top--anim'}`}>
          <div className="tpl-am__cover-from">
            {profile.logoUrl && (
              <img src={profile.logoUrl} alt={profile.fullName} className="tpl-am__cover-logo" />
            )}
            <div className="tpl-am__cover-from-text">
              <span className="tpl-am__cover-name">{profile.fullName}</span>
              <span className="tpl-am__cover-role">Proposal for {proposal.clientName}</span>
            </div>
          </div>
          <div className="tpl-am__cover-date">{formatDate(data.date || proposal.createdAt)}</div>
        </div>

        <div className="tpl-am__cover-hero">
          <h1 className={`tpl-am__cover-title${isPdf ? '' : ' tpl-am__cover-title--anim'}`}>
            {data.title}
          </h1>
          <p className={`tpl-am__cover-subtitle${isPdf ? '' : ' tpl-am__cover-subtitle--anim'}`}>
            {data.subtitle}
          </p>
        </div>

        <div className={`tpl-am__cover-footer${isPdf ? '' : ' tpl-am__cover-footer--anim'}`}>
          <div className="tpl-am__cover-stats">
            <div className="tpl-am__cover-stat">
              <span className="tpl-am__cover-stat-val">{formatCurrency(proposal.amount, proposal.currency)}</span>
              <span className="tpl-am__cover-stat-label">Investment</span>
            </div>
            <div className="tpl-am__cover-stat-divider" />
            <div className="tpl-am__cover-stat">
              <span className="tpl-am__cover-stat-val">{proposal.clientName}</span>
              <span className="tpl-am__cover-stat-label">Prepared for</span>
            </div>
          </div>
          <div className="tpl-am__cover-scroll">
            <div className="tpl-am__cover-scroll-line" />
            <span>Scroll to explore</span>
          </div>
        </div>
      </div>
    </section>
  );
});

const ProblemSection = React.memo(function ProblemSection({ data, isPdf }: { data: ProblemData; isPdf?: boolean }) {
  return (
    <section className="tpl-am__section tpl-am__section--dark" data-section="problem">
      <div className="tpl-am__section-inner">
        {isPdf ? (
          <>
            <SectionLabel text="The Challenge" index="01" />
            <h2 className="tpl-am__title tpl-am__title--light">{data.headline}</h2>
            <p className="tpl-am__body tpl-am__body--muted-light">{data.body}</p>
            {data.painPoints && data.painPoints.length > 0 && (
              <div className="tpl-am__pain-grid">
                {data.painPoints.map((point, i) => (
                  <div key={i} className="tpl-am__pain-card">
                    <div className="tpl-am__pain-num">0{i + 1}</div>
                    <p className="tpl-am__pain-text">{point}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <Reveal><SectionLabel text="The Challenge" index="01" /></Reveal>
            <Reveal delay={80}><h2 className="tpl-am__title tpl-am__title--light">{data.headline}</h2></Reveal>
            <Reveal delay={160}><p className="tpl-am__body tpl-am__body--muted-light">{data.body}</p></Reveal>
            {data.painPoints && data.painPoints.length > 0 && (
              <div className="tpl-am__pain-grid">
                {data.painPoints.map((point, i) => (
                  <ScaleIn key={i} delay={i * 80}>
                    <div className="tpl-am__pain-card">
                      <div className="tpl-am__pain-num">0{i + 1}</div>
                      <p className="tpl-am__pain-text">{point}</p>
                    </div>
                  </ScaleIn>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
});

const SolutionSection = React.memo(function SolutionSection({ data, isPdf }: { data: SolutionData; isPdf?: boolean }) {
  return (
    <section className="tpl-am__section tpl-am__section--light" data-section="solution">
      <div className="tpl-am__section-inner">
        {isPdf ? (
          <>
            <SectionLabel text="The Solution" index="02" />
            <h2 className="tpl-am__title">{data.headline}</h2>
            <p className="tpl-am__body tpl-am__body--large">{data.body}</p>
          </>
        ) : (
          <>
            <Reveal><SectionLabel text="The Solution" index="02" /></Reveal>
            <Reveal delay={80}><h2 className="tpl-am__title">{data.headline}</h2></Reveal>
            <Reveal delay={160}><p className="tpl-am__body tpl-am__body--large">{data.body}</p></Reveal>
          </>
        )}
      </div>
    </section>
  );
});

const ApproachSection = React.memo(function ApproachSection({ data, isPdf }: { data: ApproachData; isPdf?: boolean }) {
  return (
    <section className="tpl-am__section tpl-am__section--alt" data-section="approach">
      <div className="tpl-am__section-inner">
        {isPdf ? <SectionLabel text="How We'll Get There" index="03" /> : (
          <Reveal><SectionLabel text="How We'll Get There" index="03" /></Reveal>
        )}
        {isPdf ? <h2 className="tpl-am__title">{data.headline}</h2> : (
          <Reveal delay={80}><h2 className="tpl-am__title">{data.headline}</h2></Reveal>
        )}
        <div className="tpl-am__steps">
          {data.steps.map((step, i) => (
            isPdf ? (
              <div key={i} className="tpl-am__step">
                <div className="tpl-am__step-left">
                  <div className="tpl-am__step-num">{String(i + 1).padStart(2, '0')}</div>
                  {i < data.steps.length - 1 && <div className="tpl-am__step-line" />}
                </div>
                <div className="tpl-am__step-body">
                  <div className="tpl-am__step-header">
                    <h3 className="tpl-am__step-title">{step.title}</h3>
                    {step.duration && <span className="tpl-am__step-dur">{step.duration}</span>}
                  </div>
                  <p className="tpl-am__step-desc">{step.description}</p>
                </div>
              </div>
            ) : (
              <Reveal key={i} delay={i * 120}>
                <div className="tpl-am__step">
                  <div className="tpl-am__step-left">
                    <div className="tpl-am__step-num">{String(i + 1).padStart(2, '0')}</div>
                    {i < data.steps.length - 1 && <div className="tpl-am__step-line" />}
                  </div>
                  <div className="tpl-am__step-body">
                    <div className="tpl-am__step-header">
                      <h3 className="tpl-am__step-title">{step.title}</h3>
                      {step.duration && <span className="tpl-am__step-dur">{step.duration}</span>}
                    </div>
                    <p className="tpl-am__step-desc">{step.description}</p>
                  </div>
                </div>
              </Reveal>
            )
          ))}
        </div>
      </div>
    </section>
  );
});

const DeliverablesSection = React.memo(function DeliverablesSection({ data, isPdf }: { data: DeliverablesData; isPdf?: boolean }) {
  return (
    <section className="tpl-am__section tpl-am__section--light" data-section="deliverables">
      <div className="tpl-am__section-inner">
        {isPdf ? <SectionLabel text="Deliverables" index="04" /> : (
          <Reveal><SectionLabel text="Deliverables" index="04" /></Reveal>
        )}
        {isPdf ? <h2 className="tpl-am__title">{data.headline}</h2> : (
          <Reveal delay={80}><h2 className="tpl-am__title">{data.headline}</h2></Reveal>
        )}
        <div className="tpl-am__deliv-grid">
          {data.items.map((item, i) => (
            isPdf ? (
              <div key={i} className="tpl-am__deliv-card">
                <div className="tpl-am__deliv-card-top">
                  <span className="tpl-am__deliv-num">{String(i + 1).padStart(2, '0')}</span>
                  <div className="tpl-am__deliv-dot" />
                </div>
                <h3 className="tpl-am__deliv-title">{item.name}</h3>
                <p className="tpl-am__deliv-desc">{item.description}</p>
              </div>
            ) : (
              <ScaleIn key={i} delay={i * 60}>
                <div className="tpl-am__deliv-card">
                  <div className="tpl-am__deliv-card-top">
                    <span className="tpl-am__deliv-num">{String(i + 1).padStart(2, '0')}</span>
                    <div className="tpl-am__deliv-dot" />
                  </div>
                  <h3 className="tpl-am__deliv-title">{item.name}</h3>
                  <p className="tpl-am__deliv-desc">{item.description}</p>
                </div>
              </ScaleIn>
            )
          ))}
        </div>
      </div>
    </section>
  );
});

const TimelineSection = React.memo(function TimelineSection({ data, isPdf }: { data: TimelineData; isPdf?: boolean }) {
  return (
    <section className="tpl-am__section tpl-am__section--dark" data-section="timeline">
      <div className="tpl-am__section-inner">
        {isPdf ? <SectionLabel text="Timeline" index="05" /> : (
          <Reveal><SectionLabel text="Timeline" index="05" /></Reveal>
        )}
        {isPdf ? <h2 className="tpl-am__title tpl-am__title--light">{data.headline}</h2> : (
          <Reveal delay={80}><h2 className="tpl-am__title tpl-am__title--light">{data.headline}</h2></Reveal>
        )}
        <div className="tpl-am__tl">
          {data.phases.map((phase, i) => (
            isPdf ? (
              <div key={i} className="tpl-am__tl-item">
                <div className="tpl-am__tl-left">
                  <div className="tpl-am__tl-dot" />
                  <div className="tpl-am__tl-dur">{phase.duration}</div>
                </div>
                <div className="tpl-am__tl-right">
                  <h3 className="tpl-am__tl-phase">{phase.phase}</h3>
                  <p className="tpl-am__tl-desc">{phase.description}</p>
                </div>
              </div>
            ) : (
              <Reveal key={i} delay={i * 100}>
                <div className="tpl-am__tl-item">
                  <div className="tpl-am__tl-left">
                    <div className="tpl-am__tl-dot" />
                    <div className="tpl-am__tl-dur">{phase.duration}</div>
                  </div>
                  <div className="tpl-am__tl-right">
                    <h3 className="tpl-am__tl-phase">{phase.phase}</h3>
                    <p className="tpl-am__tl-desc">{phase.description}</p>
                  </div>
                </div>
              </Reveal>
            )
          ))}
        </div>
      </div>
    </section>
  );
});

const PricingSection = React.memo(function PricingSection({
  data, proposal, isPdf,
}: { data: PricingData; proposal: ProposalTemplateProps['proposal']; isPdf?: boolean }) {
  return (
    <section className="tpl-am__section tpl-am__section--light" data-section="pricing">
      <div className="tpl-am__section-inner">
        {isPdf ? <SectionLabel text="Investment" index="06" /> : (
          <Reveal><SectionLabel text="Investment" index="06" /></Reveal>
        )}
        {isPdf ? <h2 className="tpl-am__title">{data.headline}</h2> : (
          <Reveal delay={80}><h2 className="tpl-am__title">{data.headline}</h2></Reveal>
        )}
        {data.summary && (
          isPdf ? <p className="tpl-am__body" style={{ marginBottom: '2.5rem' }}>{data.summary}</p> : (
            <Reveal delay={120}><p className="tpl-am__body" style={{ marginBottom: '2.5rem' }}>{data.summary}</p></Reveal>
          )
        )}
        {isPdf ? (
          <div className="tpl-am__pricing-card">
            <div className="tpl-am__pricing-header">
              <div>
                <div className="tpl-am__pricing-label">Total Investment</div>
                <div className="tpl-am__pricing-total">{formatCurrency(data.total, proposal.currency)}</div>
              </div>
              <div className="tpl-am__pricing-badge">Fixed Price</div>
            </div>
            <div className="tpl-am__pricing-rows">
              {data.lineItems.map((item, i) => (
                <div key={i} className="tpl-am__pricing-row">
                  <span className="tpl-am__pricing-row-label">{item.label}</span>
                  <span className="tpl-am__pricing-row-amount">{formatCurrency(item.amount, proposal.currency)}</span>
                </div>
              ))}
            </div>
            {data.note && <div className="tpl-am__pricing-note">{data.note}</div>}
          </div>
        ) : (
          <ScaleIn delay={160}>
            <div className="tpl-am__pricing-card">
              <div className="tpl-am__pricing-header">
                <div>
                  <div className="tpl-am__pricing-label">Total Investment</div>
                  <div className="tpl-am__pricing-total">{formatCurrency(data.total, proposal.currency)}</div>
                </div>
                <div className="tpl-am__pricing-badge">Fixed Price</div>
              </div>
              <div className="tpl-am__pricing-rows">
                {data.lineItems.map((item, i) => (
                  <div key={i} className="tpl-am__pricing-row">
                    <span className="tpl-am__pricing-row-label">{item.label}</span>
                    <span className="tpl-am__pricing-row-amount">{formatCurrency(item.amount, proposal.currency)}</span>
                  </div>
                ))}
              </div>
              {data.note && <div className="tpl-am__pricing-note">{data.note}</div>}
            </div>
          </ScaleIn>
        )}
      </div>
    </section>
  );
});

const AboutSection = React.memo(function AboutSection({ data, profile, isPdf }: { data: AboutData; profile: ProposalTemplateProps['profile']; isPdf?: boolean }) {
  const initial = profile.fullName?.charAt(0) || data.headline.charAt(0);
  return (
    <section className="tpl-am__section tpl-am__section--alt" data-section="about">
      <div className="tpl-am__section-inner">
        {isPdf ? <SectionLabel text="About" index="07" /> : (
          <Reveal><SectionLabel text="About" index="07" /></Reveal>
        )}
        {isPdf ? <h2 className="tpl-am__title">{data.headline}</h2> : (
          <Reveal delay={80}><h2 className="tpl-am__title">{data.headline}</h2></Reveal>
        )}
        {isPdf ? (
          <div className="tpl-am__about-card">
            <div className="tpl-am__about-header">
              {profile.logoUrl ? (
                <img src={profile.logoUrl} alt={profile.fullName} className="tpl-am__about-avatar-img" />
              ) : (
                <div className="tpl-am__about-avatar">{initial}</div>
              )}
              <div className="tpl-am__about-identity">
                <h3 className="tpl-am__about-name">{profile.fullName}</h3>
                {profile.professionalTitle && (
                  <p className="tpl-am__about-title">{profile.professionalTitle}</p>
                )}
              </div>
            </div>
            <p className="tpl-am__body" style={{ marginTop: '1.5rem' }}>{data.body}</p>
            {profile.services && profile.services.length > 0 && (
              <div className="tpl-am__about-services">
                {profile.services.map((s, i) => (
                  <span key={i} className="tpl-am__about-service-pill">{s}</span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <Reveal delay={160}>
            <div className="tpl-am__about-card">
              <div className="tpl-am__about-header">
                {profile.logoUrl ? (
                  <img src={profile.logoUrl} alt={profile.fullName} className="tpl-am__about-avatar-img" />
                ) : (
                  <div className="tpl-am__about-avatar">{initial}</div>
                )}
                <div className="tpl-am__about-identity">
                  <h3 className="tpl-am__about-name">{profile.fullName}</h3>
                  {profile.professionalTitle && (
                    <p className="tpl-am__about-title">{profile.professionalTitle}</p>
                  )}
                </div>
              </div>
              <p className="tpl-am__body" style={{ marginTop: '1.5rem' }}>{data.body}</p>
              {profile.services && profile.services.length > 0 && (
                <div className="tpl-am__about-services">
                  {profile.services.map((s, i) => (
                    <span key={i} className="tpl-am__about-service-pill">{s}</span>
                  ))}
                </div>
              )}
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
});

const FAQSection = React.memo(function FAQSection({ data, isPdf }: { data: FAQData; isPdf?: boolean }) {
  const [openIndex, setOpenIndex] = React.useState<number | null>(isPdf ? -1 : null);

  return (
    <section className="tpl-am__section tpl-am__section--light" data-section="faq">
      <div className="tpl-am__section-inner">
        {isPdf ? <SectionLabel text="Questions" index="08" /> : (
          <Reveal><SectionLabel text="Questions" index="08" /></Reveal>
        )}
        {isPdf ? <h2 className="tpl-am__title">{data.headline}</h2> : (
          <Reveal delay={80}><h2 className="tpl-am__title">{data.headline}</h2></Reveal>
        )}
        <div className="tpl-am__faq">
          {data.items.map((item, i) => {
            const isOpen = isPdf || openIndex === i;
            const faqItem = (
              <div className={`tpl-am__faq-item${isOpen ? ' tpl-am__faq-item--open' : ''}`}>
                <button
                  className="tpl-am__faq-q"
                  onClick={() => !isPdf && setOpenIndex(isOpen ? null : i)}
                  type="button"
                >
                  <span>{item.question}</span>
                  <div className="tpl-am__faq-icon">
                    <span className="tpl-am__faq-bar tpl-am__faq-bar--h" />
                    <span className={`tpl-am__faq-bar tpl-am__faq-bar--v${isOpen ? ' tpl-am__faq-bar--hidden' : ''}`} />
                  </div>
                </button>
                <div className={`tpl-am__faq-a-wrap${isOpen ? ' tpl-am__faq-a-wrap--open' : ''}`}>
                  <p className="tpl-am__faq-a">{item.answer}</p>
                </div>
              </div>
            );
            return isPdf ? (
              <React.Fragment key={i}>{faqItem}</React.Fragment>
            ) : (
              <Reveal key={i} delay={i * 60}>{faqItem}</Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
});

const CTASection = React.memo(function CTASection({ data, isPdf }: { data: CTAData; isPdf?: boolean }) {
  return (
    <section className="tpl-am__cta" data-section="cta">
      <div className="tpl-am__cta-glow" />
      <div className="tpl-am__cta-inner">
        {isPdf ? (
          <>
            <div className="tpl-am__cta-eyebrow">Ready to move forward?</div>
            <h2 className="tpl-am__cta-heading">{data.headline}</h2>
            <p className="tpl-am__cta-body">{data.body}</p>
          </>
        ) : (
          <>
            <Reveal><div className="tpl-am__cta-eyebrow">Ready to move forward?</div></Reveal>
            <Reveal delay={80}><h2 className="tpl-am__cta-heading">{data.headline}</h2></Reveal>
            <Reveal delay={160}><p className="tpl-am__cta-body">{data.body}</p></Reveal>
          </>
        )}
      </div>
    </section>
  );
});

/* ── Section Renderer Map ────────────────────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SECTION_RENDERERS: Record<SectionKey, React.ComponentType<any>> = {
  cover: CoverSection as never,
  problem: ProblemSection as never,
  solution: SolutionSection as never,
  approach: ApproachSection as never,
  deliverables: DeliverablesSection as never,
  timeline: TimelineSection as never,
  pricing: PricingSection as never,
  about: AboutSection as never,
  faq: FAQSection as never,
  cta: CTASection as never,
};

/* ── Main Template Component ─────────────────────────────────── */

export default function AppleMinimalTemplate({
  proposal, content, sections, profile, theme, isPdf,
}: ProposalTemplateProps) {
  const cssVars = {
    '--proposal-accent': theme.accent,
    '--proposal-accent-fg': theme.accentForeground,
    '--proposal-bg': theme.background,
    '--proposal-surface': theme.surface,
    '--proposal-surface-alt': theme.surfaceAlt,
    '--proposal-text': theme.text,
    '--proposal-text-muted': theme.textMuted,
    '--proposal-border': theme.border,
  } as React.CSSProperties;

  const middleKeys = sections.order.filter((k) => k !== 'cover' && k !== 'cta');
  const orderedKeys: SectionKey[] = ['cover', ...middleKeys, 'cta'];

  return (
    <div className="tpl-apple-minimal" style={cssVars}>
      <style>{APPLE_MINIMAL_CSS}</style>
      {orderedKeys.map((key) => {
        if (!sections.visibility[key]) return null;
        const data = content[key];
        if (!data) return null;

        const props: Record<string, unknown> = { data, isPdf };
        if (key === 'cover') { props.proposal = proposal; props.profile = profile; }
        if (key === 'pricing') { props.proposal = proposal; }
        if (key === 'about') { props.profile = profile; }

        const Renderer = SECTION_RENDERERS[key];
        return (
          <div key={key} data-section={key}>
            <Renderer {...(props as Record<string, unknown>)} />
          </div>
        );
      })}
    </div>
  );
}

/* ── Scoped CSS ──────────────────────────────────────────────── */

const APPLE_MINIMAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

  /* ── ANIMATION BASE ─────────────────────────────────────────── */

  .tpl-am__reveal {
    opacity: 0;
    transform: translateY(28px);
    transition: opacity 0.75s cubic-bezier(0.16, 1, 0.3, 1),
                transform 0.75s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .tpl-am__reveal--in {
    opacity: 1;
    transform: translateY(0);
  }

  .tpl-am__scale-in {
    opacity: 0;
    transform: scale(0.94) translateY(16px);
    transition: opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1),
                transform 0.65s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .tpl-am__scale-in--in {
    opacity: 1;
    transform: scale(1) translateY(0);
  }

  /* ── COVER ENTRY ANIMATIONS ────────────────────────────────── */
  .tpl-am__cover-top--anim {
    animation: tpl-fade-down 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  .tpl-am__cover-title--anim {
    animation: tpl-fade-up 0.9s 0.15s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  .tpl-am__cover-subtitle--anim {
    animation: tpl-fade-up 0.9s 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  .tpl-am__cover-footer--anim {
    animation: tpl-fade-up 0.9s 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  @keyframes tpl-fade-up {
    from { opacity: 0; transform: translateY(32px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes tpl-fade-down {
    from { opacity: 0; transform: translateY(-16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── SCROLL INDICATOR ANIMATION ────────────────────────────── */
  @keyframes tpl-scroll-pulse {
    0%, 100% { opacity: 0.25; transform: scaleX(1); }
    50%       { opacity: 0.55; transform: scaleX(1.3); }
  }
  .tpl-am__cover-scroll-line {
    animation: tpl-scroll-pulse 2s ease-in-out infinite;
    transform-origin: left center;
  }

  /* ── TIMELINE DOT PULSE ────────────────────────────────────── */
  @keyframes tpl-dot-pulse {
    0%, 100% { box-shadow: 0 0 0 0 var(--proposal-accent); }
    50%       { box-shadow: 0 0 0 5px transparent; }
  }
  .tpl-am__tl-dot {
    animation: tpl-dot-pulse 2.5s ease-in-out infinite;
  }

  /* ── PRICING CARD SHIMMER ON ENTER ─────────────────────────── */
  @keyframes tpl-shimmer {
    from { background-position: -200% center; }
    to   { background-position: 200% center; }
  }
  .tpl-am__scale-in--in .tpl-am__pricing-header {
    animation: none;
  }

  /* ── STEP NUMBER BOUNCE ─────────────────────────────────────── */
  .tpl-am__reveal--in .tpl-am__step-num {
    animation: tpl-step-pop 0.4s 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }
  @keyframes tpl-step-pop {
    from { transform: scale(0.6); opacity: 0; }
    to   { transform: scale(1); opacity: 1; }
  }

  /* ── CTA BUTTON PULSE ──────────────────────────────────────── */
  .tpl-am__cta-btn-primary {
    animation: tpl-btn-glow 3s ease-in-out infinite;
  }
  @keyframes tpl-btn-glow {
    0%, 100% { box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
    50%       { box-shadow: 0 8px 32px rgba(0,0,0,0.45), 0 0 0 4px rgba(255,255,255,0.05); }
  }

  /* ── MAIN STYLES ────────────────────────────────────────────── */

  .tpl-apple-minimal {
    background: var(--proposal-bg);
    color: var(--proposal-text);
    font-family: 'DM Sans', -apple-system, system-ui, sans-serif;
    font-feature-settings: 'ss01', 'cv01';
    line-height: 1.6;
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* ── COVER ──────────────────────────────────────────────────── */
  .tpl-am__cover {
    min-height: 100vh;
    background: var(--proposal-text);
    position: relative;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .tpl-am__cover-noise {
    position: absolute; inset: 0; opacity: 0.028;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    pointer-events: none;
  }
  .tpl-am__cover-inner {
    position: relative; z-index: 1;
    display: flex; flex-direction: column;
    min-height: 100vh;
    padding: 2.5rem 4rem;
  }
  .tpl-am__cover-top {
    display: flex; align-items: center; justify-content: space-between;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid rgba(255,255,255,0.1);
  }
  .tpl-am__cover-from {
    display: flex; align-items: center; gap: 0.875rem;
  }
  .tpl-am__cover-logo {
    width: 32px; height: 32px; border-radius: 8px; object-fit: cover;
  }
  .tpl-am__cover-from-text {
    display: flex; flex-direction: column; gap: 0.1rem;
  }
  .tpl-am__cover-name {
    font-size: 0.875rem; font-weight: 500;
    color: rgba(255,255,255,0.9); letter-spacing: -0.01em;
  }
  .tpl-am__cover-role {
    font-size: 0.75rem; color: rgba(255,255,255,0.38); letter-spacing: 0.01em;
  }
  .tpl-am__cover-date {
    font-size: 0.78rem; color: rgba(255,255,255,0.35); letter-spacing: 0.02em;
  }
  .tpl-am__cover-hero {
    flex: 1; display: flex; flex-direction: column; justify-content: center;
    padding: 6rem 0 4rem; max-width: 820px;
  }
  .tpl-am__cover-title {
    font-family: 'DM Serif Display', Georgia, serif;
    font-size: clamp(3rem, 7vw, 6.5rem);
    font-weight: 400; line-height: 1.02;
    letter-spacing: -0.025em; color: #ffffff;
    margin: 0 0 1.5rem;
  }
  .tpl-am__cover-subtitle {
    font-size: clamp(1rem, 2vw, 1.2rem); font-weight: 300;
    color: rgba(255,255,255,0.5); line-height: 1.65;
    max-width: 540px; margin: 0; letter-spacing: -0.01em;
  }
  .tpl-am__cover-footer {
    display: flex; align-items: flex-end; justify-content: space-between;
    padding-top: 2rem;
    border-top: 1px solid rgba(255,255,255,0.08);
  }
  .tpl-am__cover-stats {
    display: flex; align-items: center; gap: 2.5rem;
  }
  .tpl-am__cover-stat {
    display: flex; flex-direction: column; gap: 0.3rem;
  }
  .tpl-am__cover-stat-val {
    font-size: 1.25rem; font-weight: 500;
    color: rgba(255,255,255,0.9); letter-spacing: -0.02em;
  }
  .tpl-am__cover-stat-label {
    font-size: 0.7rem; font-weight: 500;
    color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.08em;
  }
  .tpl-am__cover-stat-divider {
    width: 1px; height: 2.5rem; background: rgba(255,255,255,0.12);
  }
  .tpl-am__cover-scroll {
    display: flex; align-items: center; gap: 0.75rem;
    font-size: 0.7rem; color: rgba(255,255,255,0.25);
    letter-spacing: 0.08em; text-transform: uppercase;
  }
  .tpl-am__cover-scroll-line {
    width: 2rem; height: 1px; background: rgba(255,255,255,0.2);
  }

  /* ── SECTIONS ───────────────────────────────────────────────── */
  .tpl-am__section { padding: 7rem 4rem; }
  .tpl-am__section--light { background: var(--proposal-bg); }
  .tpl-am__section--dark  { background: var(--proposal-text); }
  .tpl-am__section--alt   { background: var(--proposal-surface); }
  .tpl-am__section-inner  { max-width: 860px; margin: 0 auto; }

  .tpl-am__section-label {
    display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.75rem;
  }
  .tpl-am__section-index {
    font-size: 0.7rem; font-weight: 600; color: var(--proposal-accent);
    letter-spacing: 0.1em; font-variant-numeric: tabular-nums;
  }
  .tpl-am__section--dark .tpl-am__section-index { color: var(--proposal-accent); }
  .tpl-am__section-tag {
    font-size: 0.72rem; font-weight: 500; color: var(--proposal-text-muted);
    text-transform: uppercase; letter-spacing: 0.1em;
    padding: 0.2rem 0.65rem; border-radius: 999px;
    border: 1px solid var(--proposal-border); background: transparent;
  }
  .tpl-am__section--dark .tpl-am__section-tag {
    color: rgba(255,255,255,0.35); border-color: rgba(255,255,255,0.1);
  }

  /* ── TYPOGRAPHY ─────────────────────────────────────────────── */
  .tpl-am__title {
    font-family: 'DM Serif Display', Georgia, serif;
    font-size: clamp(2rem, 4vw, 3.25rem); font-weight: 400;
    line-height: 1.1; letter-spacing: -0.025em;
    color: var(--proposal-text); margin: 0 0 1.5rem; max-width: 700px;
  }
  .tpl-am__title--light { color: #ffffff; }
  .tpl-am__body {
    font-size: 1.05rem; font-weight: 300; line-height: 1.8;
    color: var(--proposal-text-muted); max-width: 640px; margin: 0;
  }
  .tpl-am__body--large { font-size: 1.15rem; line-height: 1.75; }
  .tpl-am__body--muted-light { color: rgba(255,255,255,0.5); }

  /* ── PAIN CARDS ──────────────────────────────────────────────── */
  .tpl-am__pain-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 1px; margin-top: 3rem;
    background: rgba(255,255,255,0.06);
    border-radius: 16px; overflow: hidden;
  }
  .tpl-am__pain-card {
    background: rgba(255,255,255,0.03); padding: 2rem;
    transition: background 0.2s ease;
  }
  .tpl-am__pain-card:hover { background: rgba(255,255,255,0.06); }
  .tpl-am__pain-num {
    font-family: 'DM Serif Display', Georgia, serif;
    font-size: 2.5rem; color: rgba(255,255,255,0.08);
    line-height: 1; margin-bottom: 1rem; letter-spacing: -0.03em;
  }
  .tpl-am__pain-text {
    font-size: 0.9rem; font-weight: 400;
    color: rgba(255,255,255,0.55); line-height: 1.65; margin: 0;
  }

  /* ── APPROACH ────────────────────────────────────────────────── */
  .tpl-am__steps { display: flex; flex-direction: column; margin-top: 3rem; }
  .tpl-am__step  { display: flex; gap: 0; }
  .tpl-am__step-left {
    display: flex; flex-direction: column; align-items: center;
    width: 72px; flex-shrink: 0;
  }
  .tpl-am__step-num {
    width: 40px; height: 40px; border-radius: 50%;
    background: var(--proposal-accent); color: var(--proposal-accent-fg);
    font-size: 0.72rem; font-weight: 700; letter-spacing: 0.04em;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .tpl-am__step-line {
    width: 1px; flex: 1; min-height: 2.5rem;
    background: var(--proposal-border); margin: 0.5rem 0;
  }
  .tpl-am__step-body { padding: 0.5rem 0 3rem 1.75rem; flex: 1; }
  .tpl-am__step:last-child .tpl-am__step-body { padding-bottom: 0; }
  .tpl-am__step-header {
    display: flex; align-items: center; justify-content: space-between;
    gap: 1rem; margin-bottom: 0.5rem;
  }
  .tpl-am__step-title {
    font-size: 1.05rem; font-weight: 600; letter-spacing: -0.015em;
    color: var(--proposal-text); margin: 0;
  }
  .tpl-am__step-dur {
    font-size: 0.72rem; font-weight: 500; color: var(--proposal-accent);
    padding: 0.2rem 0.7rem; border-radius: 999px;
    border: 1px solid var(--proposal-accent); opacity: 0.7; white-space: nowrap; flex-shrink: 0;
  }
  .tpl-am__step-desc {
    font-size: 0.92rem; font-weight: 300; color: var(--proposal-text-muted);
    line-height: 1.7; margin: 0;
  }

  /* ── DELIVERABLES ────────────────────────────────────────────── */
  .tpl-am__deliv-grid {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 1.5px; margin-top: 3rem;
    background: var(--proposal-border); border-radius: 16px; overflow: hidden;
  }
  .tpl-am__deliv-card {
    background: var(--proposal-bg); padding: 2rem 1.75rem;
    transition: background 0.2s ease; position: relative;
  }
  .tpl-am__deliv-card:hover { background: var(--proposal-surface); }
  .tpl-am__deliv-card-top {
    display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem;
  }
  .tpl-am__deliv-num {
    font-size: 0.68rem; font-weight: 700; color: var(--proposal-accent); letter-spacing: 0.08em;
  }
  .tpl-am__deliv-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--proposal-accent); opacity: 0.4;
  }
  .tpl-am__deliv-title {
    font-size: 0.97rem; font-weight: 600; letter-spacing: -0.01em;
    color: var(--proposal-text); margin: 0 0 0.5rem; line-height: 1.3;
  }
  .tpl-am__deliv-desc {
    font-size: 0.85rem; font-weight: 300; color: var(--proposal-text-muted);
    line-height: 1.6; margin: 0;
  }

  /* ── TIMELINE ────────────────────────────────────────────────── */
  .tpl-am__tl { margin-top: 3rem; display: flex; flex-direction: column; }
  .tpl-am__tl-item {
    display: flex; gap: 2.5rem; padding: 2rem 0;
    border-bottom: 1px solid rgba(255,255,255,0.07); align-items: flex-start;
  }
  .tpl-am__tl-item:last-child { border-bottom: none; }
  .tpl-am__tl-left {
    display: flex; flex-direction: column; align-items: center;
    gap: 0.5rem; flex-shrink: 0; min-width: 80px;
  }
  .tpl-am__tl-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--proposal-accent); margin-top: 0.4rem;
  }
  .tpl-am__tl-dur {
    font-size: 0.7rem; font-weight: 600; color: var(--proposal-accent);
    letter-spacing: 0.06em; text-align: center; line-height: 1.4;
  }
  .tpl-am__tl-right { flex: 1; }
  .tpl-am__tl-phase {
    font-size: 1rem; font-weight: 600; color: rgba(255,255,255,0.9);
    margin: 0 0 0.4rem; letter-spacing: -0.01em;
  }
  .tpl-am__tl-desc {
    font-size: 0.88rem; font-weight: 300; color: rgba(255,255,255,0.45);
    line-height: 1.6; margin: 0;
  }

  /* ── PRICING ──────────────────────────────────────────────────── */
  .tpl-am__pricing-card {
    border-radius: 20px; overflow: hidden;
    border: 1px solid var(--proposal-border); margin-top: 2rem;
  }
  .tpl-am__pricing-header {
    background: var(--proposal-text); padding: 2.5rem 2.5rem 2rem;
    display: flex; align-items: flex-start; justify-content: space-between;
  }
  .tpl-am__pricing-label {
    font-size: 0.7rem; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.1em; color: rgba(255,255,255,0.35); margin-bottom: 0.5rem;
  }
  .tpl-am__pricing-total {
    font-family: 'DM Serif Display', Georgia, serif;
    font-size: 3.5rem; font-weight: 400; color: #ffffff;
    letter-spacing: -0.03em; line-height: 1;
  }
  .tpl-am__pricing-badge {
    font-size: 0.7rem; font-weight: 600; color: var(--proposal-accent);
    padding: 0.3rem 0.8rem; border-radius: 999px;
    border: 1px solid var(--proposal-accent);
    letter-spacing: 0.06em; text-transform: uppercase; opacity: 0.8; margin-top: 0.25rem;
  }
  .tpl-am__pricing-rows { background: var(--proposal-bg); }
  .tpl-am__pricing-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 1.1rem 2.5rem; border-bottom: 1px solid var(--proposal-border); font-size: 0.93rem;
  }
  .tpl-am__pricing-row:last-child { border-bottom: none; }
  .tpl-am__pricing-row-label { font-weight: 400; color: var(--proposal-text); }
  .tpl-am__pricing-row-amount {
    font-weight: 600; color: var(--proposal-text);
    font-variant-numeric: tabular-nums; letter-spacing: -0.01em;
  }
  .tpl-am__pricing-note {
    padding: 1rem 2.5rem 1.25rem; font-size: 0.8rem;
    color: var(--proposal-text-muted); border-top: 1px solid var(--proposal-border);
    background: var(--proposal-surface); line-height: 1.6;
  }

  /* ── ABOUT ───────────────────────────────────────────────────── */
  .tpl-am__about-card {
    margin-top: 2rem; padding: 2rem 2.25rem;
    border-radius: 16px; border: 1px solid var(--proposal-border);
    background: var(--proposal-surface-alt, var(--proposal-bg));
  }
  .tpl-am__about-header {
    display: flex; align-items: center; gap: 1.25rem;
  }
  .tpl-am__about-avatar {
    width: 56px; height: 56px; border-radius: 50%;
    background: var(--proposal-accent); color: var(--proposal-accent-fg);
    font-family: 'DM Serif Display', Georgia, serif; font-size: 1.35rem;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .tpl-am__about-avatar-img {
    width: 56px; height: 56px; border-radius: 50%; object-fit: cover; flex-shrink: 0;
  }
  .tpl-am__about-identity {
    display: flex; flex-direction: column; gap: 0.15rem;
  }
  .tpl-am__about-name {
    font-size: 1.1rem; font-weight: 600; letter-spacing: -0.015em;
    color: var(--proposal-text); margin: 0;
  }
  .tpl-am__about-title {
    font-size: 0.82rem; font-weight: 500; color: var(--proposal-accent);
    margin: 0; letter-spacing: -0.005em;
  }
  .tpl-am__about-services {
    display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1.5rem;
  }
  .tpl-am__about-service-pill {
    font-size: 0.78rem; font-weight: 500; color: var(--proposal-text-muted);
    padding: 0.3rem 0.85rem; border-radius: 999px;
    border: 1px solid var(--proposal-border);
    background: transparent; letter-spacing: -0.005em;
  }

  /* ── FAQ ──────────────────────────────────────────────────────── */
  .tpl-am__faq { margin-top: 2.5rem; }
  .tpl-am__faq-item { border-bottom: 1px solid var(--proposal-border); }
  .tpl-am__faq-item:first-child { border-top: 1px solid var(--proposal-border); }
  .tpl-am__faq-q {
    width: 100%; display: flex; justify-content: space-between; align-items: center;
    gap: 1.5rem; padding: 1.25rem 0; background: none; border: none;
    color: var(--proposal-text); font-size: 0.97rem; font-weight: 500; cursor: pointer;
    text-align: left; font-family: inherit; letter-spacing: -0.01em; line-height: 1.4;
    transition: color 0.2s;
  }
  .tpl-am__faq-q:hover { color: var(--proposal-accent); }
  .tpl-am__faq-icon {
    width: 20px; height: 20px; border-radius: 50%;
    border: 1.5px solid var(--proposal-border);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; position: relative;
    transition: border-color 0.2s;
  }
  .tpl-am__faq-q:hover .tpl-am__faq-icon { border-color: var(--proposal-accent); }
  .tpl-am__faq-bar {
    position: absolute; background: var(--proposal-accent); border-radius: 1px;
    transition: opacity 0.2s ease, transform 0.2s ease;
  }
  .tpl-am__faq-bar--h { width: 8px; height: 1.5px; }
  .tpl-am__faq-bar--v { width: 1.5px; height: 8px; }
  .tpl-am__faq-bar--hidden { opacity: 0; transform: rotate(90deg); }
  .tpl-am__faq-a-wrap { max-height: 0; overflow: hidden; transition: max-height 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
  .tpl-am__faq-a-wrap--open { max-height: 400px; }
  .tpl-am__faq-a {
    padding: 0 0 1.25rem; font-size: 0.92rem; font-weight: 300;
    color: var(--proposal-text-muted); line-height: 1.75; margin: 0;
  }

  /* ── CTA ──────────────────────────────────────────────────────── */
  .tpl-am__cta {
    background: var(--proposal-text); padding: 8rem 4rem;
    text-align: center; position: relative; overflow: hidden;
  }
  .tpl-am__cta-glow {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 500px; height: 300px;
    background: radial-gradient(ellipse, rgba(0,113,227,0.1) 0%, transparent 70%);
    pointer-events: none;
  }
  .tpl-am__cta-inner { position: relative; max-width: 600px; margin: 0 auto; }
  .tpl-am__cta-eyebrow {
    font-size: 0.72rem; font-weight: 500; text-transform: uppercase;
    letter-spacing: 0.12em; color: var(--proposal-accent); margin-bottom: 1.25rem;
    display: flex; align-items: center; justify-content: center; gap: 0.75rem;
  }
  .tpl-am__cta-eyebrow::before, .tpl-am__cta-eyebrow::after {
    content: ''; width: 2rem; height: 1px;
    background: var(--proposal-accent); opacity: 0.4;
  }
  .tpl-am__cta-heading {
    font-family: 'DM Serif Display', Georgia, serif;
    font-size: clamp(2rem, 5vw, 4rem); font-weight: 400; line-height: 1.08;
    letter-spacing: -0.025em; color: #ffffff; margin: 0 0 1.25rem;
  }
  .tpl-am__cta-body {
    font-size: 1rem; font-weight: 300; color: rgba(255,255,255,0.45);
    line-height: 1.7; margin: 0 auto 2.5rem;
    max-width: 420px; letter-spacing: -0.01em;
  }
  .tpl-am__cta-actions {
    display: flex; align-items: center; justify-content: center;
    gap: 0.75rem; flex-wrap: wrap; margin-bottom: 1.5rem;
  }
  .tpl-am__cta-btn-primary {
    background: var(--proposal-accent); color: var(--proposal-accent-fg);
    border: none; padding: 0.875rem 2.25rem;
    font-size: 0.95rem; font-weight: 500; border-radius: 999px;
    cursor: pointer; font-family: inherit; letter-spacing: -0.01em;
    transition: opacity 0.2s ease, transform 0.15s ease;
  }
  .tpl-am__cta-btn-primary:hover { opacity: 0.88; transform: translateY(-1px); }
  .tpl-am__cta-btn-secondary {
    background: transparent; color: rgba(255,255,255,0.5);
    border: 1px solid rgba(255,255,255,0.15);
    padding: 0.875rem 2rem; font-size: 0.92rem; font-weight: 400;
    border-radius: 999px; cursor: pointer; font-family: inherit; letter-spacing: -0.01em;
    transition: border-color 0.2s ease, color 0.2s ease;
  }
  .tpl-am__cta-btn-secondary:hover { border-color: rgba(255,255,255,0.3); color: rgba(255,255,255,0.75); }
  .tpl-am__cta-fine {
    font-size: 0.75rem; color: rgba(255,255,255,0.2); letter-spacing: 0.02em; margin: 0;
  }

  /* ── RESPONSIVE ───────────────────────────────────────────────── */
  @media (max-width: 768px) {
    .tpl-am__cover-inner { padding: 2rem 1.5rem; }
    .tpl-am__cover-hero  { padding: 4rem 0 3rem; }
    .tpl-am__section     { padding: 4rem 1.5rem; }
    .tpl-am__cta         { padding: 5rem 1.5rem; }
    .tpl-am__deliv-grid  { grid-template-columns: 1fr 1fr; }
    .tpl-am__pricing-header  { flex-direction: column; gap: 1rem; }
    .tpl-am__pricing-total   { font-size: 2.75rem; }
    .tpl-am__pricing-header,
    .tpl-am__pricing-row,
    .tpl-am__pricing-note    { padding-left: 1.5rem; padding-right: 1.5rem; }
    .tpl-am__about-layout    { flex-direction: column; gap: 1.5rem; }
  }
  @media (max-width: 480px) {
    .tpl-am__deliv-grid  { grid-template-columns: 1fr; }
    .tpl-am__cover-footer { flex-direction: column; gap: 1.5rem; align-items: flex-start; }
    .tpl-am__step-body   { padding-left: 1.25rem; }
    .tpl-am__step-left   { width: 52px; }
  }
`;