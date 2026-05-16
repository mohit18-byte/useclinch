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

/** Strips protocol + www so the link label is clean, e.g. github.com/rohit */
function formatLinkLabel(url: string): string {
  try {
    const u = new URL(url);
    return (u.hostname + u.pathname).replace(/^www\./, '').replace(/\/$/, '');
  } catch {
    return url;
  }
}

/* ── useInView ───────────────────────────────────────────────── */
function useInView(opts?: IntersectionObserverInit) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [inView, setInView] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); io.disconnect(); }
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px', ...opts });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, inView };
}

/* ── Animated wrappers ───────────────────────────────────────── */
function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, inView } = useInView();
  return (
    <div ref={ref} className={`tpl-de-reveal${inView ? ' tpl-de-reveal--in' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function SlideIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, inView } = useInView();
  return (
    <div ref={ref} className={`tpl-de-slide${inView ? ' tpl-de-slide--in' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ── Eyebrow label ───────────────────────────────────────────── */
const Eyebrow = ({ num, label }: { num: string; label: string }) => (
  <div className="tpl-de__eyebrow">
    <span className="tpl-de__eyebrow-num">{num}</span>
    <span className="tpl-de__eyebrow-line" />
    <span className="tpl-de__eyebrow-label">{label}</span>
  </div>
);

/* ── Section Components ──────────────────────────────────────── */

const CoverSection = React.memo(function CoverSection({
  data, proposal, profile, isPdf,
}: { data: CoverData; proposal: ProposalTemplateProps['proposal']; profile: ProposalTemplateProps['profile']; isPdf?: boolean }) {
  return (
    <section className="tpl-de__cover">
      {/* Big editorial number */}
      <div className="tpl-de__cover-bg-num" aria-hidden>01</div>

      <div className="tpl-de__cover-inner">
        {/* Top bar */}
        <div className={`tpl-de__cover-topbar${isPdf ? '' : ' tpl-de__cover-topbar--anim'}`}>
          <div className="tpl-de__cover-topbar-left">
            {profile.logoUrl
              ? <img src={profile.logoUrl} alt={profile.fullName} className="tpl-de__cover-logo" />
              : <div className="tpl-de__cover-logo-fallback">{profile.fullName.charAt(0)}</div>
            }
            <div>
              <div className="tpl-de__cover-author">{profile.fullName}</div>
              <div className="tpl-de__cover-author-sub">{profile.professionalTitle}</div>
            </div>
          </div>
          <div className="tpl-de__cover-badge">PROPOSAL</div>
        </div>

        {/* Hero headline */}
        <div className="tpl-de__cover-hero">
          <h1 className={`tpl-de__cover-title${isPdf ? '' : ' tpl-de__cover-title--anim'}`}>
            {data.title}
          </h1>
          <p className={`tpl-de__cover-subtitle${isPdf ? '' : ' tpl-de__cover-subtitle--anim'}`}>
            {data.subtitle}
          </p>
        </div>

        {/* Footer meta strip */}
        <div className={`tpl-de__cover-strip${isPdf ? '' : ' tpl-de__cover-strip--anim'}`}>
          <div className="tpl-de__cover-strip-item">
            <span className="tpl-de__cover-strip-label">Prepared for</span>
            <span className="tpl-de__cover-strip-val">{proposal.clientName}</span>
          </div>
          <div className="tpl-de__cover-strip-divider" />
          <div className="tpl-de__cover-strip-item">
            <span className="tpl-de__cover-strip-label">Date</span>
            <span className="tpl-de__cover-strip-val">{formatDate(data.date || proposal.createdAt)}</span>
          </div>
          <div className="tpl-de__cover-strip-divider" />
          <div className="tpl-de__cover-strip-item">
            <span className="tpl-de__cover-strip-label">Investment</span>
            <span className="tpl-de__cover-strip-val tpl-de__cover-strip-val--accent">{formatCurrency(proposal.amount, proposal.currency)}</span>
          </div>
        </div>
      </div>
    </section>
  );
});

const ProblemSection = React.memo(function ProblemSection({ data, isPdf }: { data: ProblemData; isPdf?: boolean }) {
  return (
    <section className="tpl-de__section">
      <div className="tpl-de__section-inner">
        {isPdf ? <Eyebrow num="01" label="The Problem" /> : <Reveal><Eyebrow num="01" label="The Problem" /></Reveal>}

        <div className="tpl-de__two-col">
          <div className="tpl-de__two-col-left">
            {isPdf
              ? <h2 className="tpl-de__title">{data.headline}</h2>
              : <Reveal delay={80}><h2 className="tpl-de__title">{data.headline}</h2></Reveal>}
          </div>
          <div className="tpl-de__two-col-right">
            {isPdf
              ? <p className="tpl-de__body">{data.body}</p>
              : <Reveal delay={160}><p className="tpl-de__body">{data.body}</p></Reveal>}

            {data.painPoints && data.painPoints.length > 0 && (
              <div className="tpl-de__pain-list">
                {data.painPoints.map((pt, i) =>
                  isPdf ? (
                    <div key={i} className="tpl-de__pain-item">
                      <div className="tpl-de__pain-dash" />
                      <p className="tpl-de__pain-text">{pt}</p>
                    </div>
                  ) : (
                    <Reveal key={i} delay={200 + i * 80}>
                      <div className="tpl-de__pain-item">
                        <div className="tpl-de__pain-dash" />
                        <p className="tpl-de__pain-text">{pt}</p>
                      </div>
                    </Reveal>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
});

const SolutionSection = React.memo(function SolutionSection({ data, isPdf }: { data: SolutionData; isPdf?: boolean }) {
  return (
    <section className="tpl-de__section tpl-de__section--accent-border">
      <div className="tpl-de__section-inner">
        {isPdf ? <Eyebrow num="02" label="The Solution" /> : <Reveal><Eyebrow num="02" label="The Solution" /></Reveal>}
        <div className="tpl-de__solution-layout">
          {isPdf
            ? <h2 className="tpl-de__title tpl-de__title--xl">{data.headline}</h2>
            : <Reveal delay={80}><h2 className="tpl-de__title tpl-de__title--xl">{data.headline}</h2></Reveal>}
          {isPdf
            ? <p className="tpl-de__body tpl-de__body--lead">{data.body}</p>
            : <Reveal delay={160}><p className="tpl-de__body tpl-de__body--lead">{data.body}</p></Reveal>}
        </div>
      </div>
    </section>
  );
});

const ApproachSection = React.memo(function ApproachSection({ data, isPdf }: { data: ApproachData; isPdf?: boolean }) {
  return (
    <section className="tpl-de__section">
      <div className="tpl-de__section-inner">
        {isPdf ? <Eyebrow num="03" label="Approach" /> : <Reveal><Eyebrow num="03" label="Approach" /></Reveal>}
        {isPdf
          ? <h2 className="tpl-de__title">{data.headline}</h2>
          : <Reveal delay={80}><h2 className="tpl-de__title">{data.headline}</h2></Reveal>}

        <div className="tpl-de__steps">
          {data.steps.map((step, i) =>
            isPdf ? (
              <div key={i} className="tpl-de__step">
                <div className="tpl-de__step-num-wrap">
                  <span className="tpl-de__step-big-num">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <div className="tpl-de__step-body">
                  <div className="tpl-de__step-header">
                    <h3 className="tpl-de__step-title">{step.title}</h3>
                    {step.duration && <span className="tpl-de__step-tag">{step.duration}</span>}
                  </div>
                  <p className="tpl-de__step-desc">{step.description}</p>
                </div>
              </div>
            ) : (
              <SlideIn key={i} delay={i * 120}>
                <div className="tpl-de__step">
                  <div className="tpl-de__step-num-wrap">
                    <span className="tpl-de__step-big-num">{String(i + 1).padStart(2, '0')}</span>
                  </div>
                  <div className="tpl-de__step-body">
                    <div className="tpl-de__step-header">
                      <h3 className="tpl-de__step-title">{step.title}</h3>
                      {step.duration && <span className="tpl-de__step-tag">{step.duration}</span>}
                    </div>
                    <p className="tpl-de__step-desc">{step.description}</p>
                  </div>
                </div>
              </SlideIn>
            )
          )}
        </div>
      </div>
    </section>
  );
});

const DeliverablesSection = React.memo(function DeliverablesSection({ data, isPdf }: { data: DeliverablesData; isPdf?: boolean }) {
  return (
    <section className="tpl-de__section">
      <div className="tpl-de__section-inner">
        {isPdf ? <Eyebrow num="04" label="Deliverables" /> : <Reveal><Eyebrow num="04" label="Deliverables" /></Reveal>}
        {isPdf
          ? <h2 className="tpl-de__title">{data.headline}</h2>
          : <Reveal delay={80}><h2 className="tpl-de__title">{data.headline}</h2></Reveal>}

        <div className="tpl-de__deliv-list">
          {data.items.map((item, i) =>
            isPdf ? (
              <div key={i} className="tpl-de__deliv-row">
                <span className="tpl-de__deliv-idx">{String(i + 1).padStart(2, '0')}</span>
                <div className="tpl-de__deliv-content">
                  <h3 className="tpl-de__deliv-name">{item.name}</h3>
                  <p className="tpl-de__deliv-desc">{item.description}</p>
                </div>
                <div className="tpl-de__deliv-check">✓</div>
              </div>
            ) : (
              <Reveal key={i} delay={i * 70}>
                <div className="tpl-de__deliv-row">
                  <span className="tpl-de__deliv-idx">{String(i + 1).padStart(2, '0')}</span>
                  <div className="tpl-de__deliv-content">
                    <h3 className="tpl-de__deliv-name">{item.name}</h3>
                    <p className="tpl-de__deliv-desc">{item.description}</p>
                  </div>
                  <div className="tpl-de__deliv-check">✓</div>
                </div>
              </Reveal>
            )
          )}
        </div>
      </div>
    </section>
  );
});

const TimelineSection = React.memo(function TimelineSection({ data, isPdf }: { data: TimelineData; isPdf?: boolean }) {
  return (
    <section className="tpl-de__section">
      <div className="tpl-de__section-inner">
        {isPdf ? <Eyebrow num="05" label="Timeline" /> : <Reveal><Eyebrow num="05" label="Timeline" /></Reveal>}
        {isPdf
          ? <h2 className="tpl-de__title">{data.headline}</h2>
          : <Reveal delay={80}><h2 className="tpl-de__title">{data.headline}</h2></Reveal>}

        <div className="tpl-de__tl">
          {data.phases.map((phase, i) =>
            isPdf ? (
              <div key={i} className="tpl-de__tl-row">
                <div className="tpl-de__tl-left">
                  <div className="tpl-de__tl-top">
                    <div className="tpl-de__tl-dot" />
                    <div className="tpl-de__tl-dur">{phase.duration}</div>
                  </div>
                  {i < data.phases.length - 1 && <div className="tpl-de__tl-connector" />}
                </div>
                <div className="tpl-de__tl-right">
                  <h3 className="tpl-de__tl-name">{phase.phase}</h3>
                  <p className="tpl-de__tl-desc">{phase.description}</p>
                </div>
              </div>
            ) : (
              <Reveal key={i} delay={i * 100}>
                <div className="tpl-de__tl-row">
                  <div className="tpl-de__tl-left">
                    <div className="tpl-de__tl-top">
                      <div className="tpl-de__tl-dot" />
                      <div className="tpl-de__tl-dur">{phase.duration}</div>
                    </div>
                    {i < data.phases.length - 1 && <div className="tpl-de__tl-connector" />}
                  </div>
                  <div className="tpl-de__tl-right">
                    <h3 className="tpl-de__tl-name">{phase.phase}</h3>
                    <p className="tpl-de__tl-desc">{phase.description}</p>
                  </div>
                </div>
              </Reveal>
            )
          )}
        </div>
      </div>
    </section>
  );
});

const PricingSection = React.memo(function PricingSection({
  data, proposal, isPdf,
}: { data: PricingData; proposal: ProposalTemplateProps['proposal']; isPdf?: boolean }) {
  return (
    <section className="tpl-de__section">
      <div className="tpl-de__section-inner">
        {isPdf ? <Eyebrow num="06" label="Investment" /> : <Reveal><Eyebrow num="06" label="Investment" /></Reveal>}
        {isPdf
          ? <h2 className="tpl-de__title">{data.headline}</h2>
          : <Reveal delay={80}><h2 className="tpl-de__title">{data.headline}</h2></Reveal>}
        {data.summary && (
          isPdf
            ? <p className="tpl-de__body" style={{ marginBottom: '2.5rem' }}>{data.summary}</p>
            : <Reveal delay={120}><p className="tpl-de__body" style={{ marginBottom: '2.5rem' }}>{data.summary}</p></Reveal>
        )}

        {isPdf ? (
          <PricingTable data={data} proposal={proposal} />
        ) : (
          <Reveal delay={180}><PricingTable data={data} proposal={proposal} /></Reveal>
        )}
      </div>
    </section>
  );
});

function PricingTable({ data, proposal }: { data: PricingData; proposal: ProposalTemplateProps['proposal'] }) {
  return (
    <div className="tpl-de__pricing">
      {/* Hero total */}
      <div className="tpl-de__pricing-hero">
        <div>
          <div className="tpl-de__pricing-hero-label">Total Investment</div>
          <div className="tpl-de__pricing-hero-total">{formatCurrency(data.total, proposal.currency)}</div>
        </div>
        <div className="tpl-de__pricing-hero-right">
          <div className="tpl-de__pricing-tag">Fixed Price</div>
        </div>
      </div>
      {/* Line items */}
      <div className="tpl-de__pricing-rows">
        {data.lineItems.map((item, i) => (
          <div key={i} className="tpl-de__pricing-row">
            <span className="tpl-de__pricing-row-label">{item.label}</span>
            <span className="tpl-de__pricing-row-amount">{formatCurrency(item.amount, proposal.currency)}</span>
          </div>
        ))}
      </div>
      {data.note && <div className="tpl-de__pricing-note">{data.note}</div>}
    </div>
  );
}

const AboutSection = React.memo(function AboutSection({ data, profile, isPdf }: { data: AboutData; profile: ProposalTemplateProps['profile']; isPdf?: boolean }) {
  const initial = profile.fullName?.charAt(0) || data.headline.charAt(0);

  const renderCard = () => (
    <div className="tpl-de__about-card">
      <div className="tpl-de__about-header">
        {profile.logoUrl ? (
          <img src={profile.logoUrl} alt={profile.fullName} className="tpl-de__about-avatar-img" />
        ) : (
          <div className="tpl-de__about-avatar">{initial}</div>
        )}
        <div className="tpl-de__about-identity">
          <h3 className="tpl-de__about-name">{profile.fullName}</h3>
          {profile.professionalTitle && (
            <p className="tpl-de__about-title">{profile.professionalTitle}</p>
          )}
        </div>
      </div>
      <p className="tpl-de__body" style={{ marginTop: '1.5rem' }}>{data.body}</p>
      {profile.services && profile.services.length > 0 && (
        <div className="tpl-de__about-services">
          {profile.services.map((s, i) => (
            <span key={i} className="tpl-de__about-pill">{s}</span>
          ))}
        </div>
      )}

      {/* ── Selected Work ───────────────────────────────────────── */}
      {profile.pastProjects && profile.pastProjects.length > 0 && (
        <div className="tpl-de__about-work">
          <span className="tpl-de__about-work-label">Recent Work</span>
          <div className="tpl-de__about-work-list">
            {profile.pastProjects.map((proj, i) => {
              const Tag = proj.link ? 'a' : 'div';
              const linkProps = proj.link
                ? { href: proj.link, target: '_blank', rel: 'noopener noreferrer' }
                : {};
              return (
                <Tag
                  key={i}
                  className={`tpl-de__about-work-row${proj.link ? ' tpl-de__about-work-row--linked' : ''}`}
                  {...linkProps}
                >
                  <span className="tpl-de__about-work-name">
                    {proj.name}
                    {proj.link && (
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true" className="tpl-de__about-work-icon">
                        <path d="M2 10L10 2M10 2H4.5M10 2V7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </span>
                  <span className="tpl-de__about-work-desc">{proj.description}</span>
                </Tag>
              );
            })}
          </div>
        </div>
      )}

      {profile.portfolioUrl && (
        <div className="tpl-de__about-links">
          <span className="tpl-de__about-links-label">Portfolio</span>
          <div className="tpl-de__about-links-row">
            <a
              href={profile.portfolioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="tpl-de__about-link"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
                <path d="M2 10L10 2M10 2H4.5M10 2V7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {formatLinkLabel(profile.portfolioUrl)}
            </a>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <section className="tpl-de__section">
      <div className="tpl-de__section-inner">
        {isPdf ? <Eyebrow num="07" label="About" /> : <Reveal><Eyebrow num="07" label="About" /></Reveal>}
        {isPdf
          ? <h2 className="tpl-de__title">{data.headline}</h2>
          : <Reveal delay={80}><h2 className="tpl-de__title">{data.headline}</h2></Reveal>}
        {isPdf ? renderCard() : <Reveal delay={160}>{renderCard()}</Reveal>}
      </div>
    </section>
  );
});

const FAQSection = React.memo(function FAQSection({ data, isPdf }: { data: FAQData; isPdf?: boolean }) {
  const [openIndex, setOpenIndex] = React.useState<number | null>(isPdf ? -1 : null);
  return (
    <section className="tpl-de__section">
      <div className="tpl-de__section-inner">
        {isPdf ? <Eyebrow num="08" label="Questions" /> : <Reveal><Eyebrow num="08" label="Questions" /></Reveal>}
        {isPdf
          ? <h2 className="tpl-de__title">{data.headline}</h2>
          : <Reveal delay={80}><h2 className="tpl-de__title">{data.headline}</h2></Reveal>}

        <div className="tpl-de__faq">
          {data.items.map((item, i) => {
            const isOpen = isPdf || openIndex === i;
            const el = (
              <div className={`tpl-de__faq-item${isOpen ? ' tpl-de__faq-item--open' : ''}`}>
                <button
                  className="tpl-de__faq-q"
                  onClick={() => !isPdf && setOpenIndex(isOpen ? null : i)}
                  type="button"
                >
                  <span className="tpl-de__faq-q-num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="tpl-de__faq-q-text">{item.question}</span>
                  <div className="tpl-de__faq-icon">
                    <span className="tpl-de__faq-bar tpl-de__faq-bar--h" />
                    <span className={`tpl-de__faq-bar tpl-de__faq-bar--v${isOpen ? ' tpl-de__faq-bar--gone' : ''}`} />
                  </div>
                </button>
                <div className={`tpl-de__faq-body${isOpen ? ' tpl-de__faq-body--open' : ''}`}>
                  <p className="tpl-de__faq-a">{item.answer}</p>
                </div>
              </div>
            );
            return isPdf ? <React.Fragment key={i}>{el}</React.Fragment> : <Reveal key={i} delay={i * 60}>{el}</Reveal>;
          })}
        </div>
      </div>
    </section>
  );
});

const CTASection = React.memo(function CTASection({ data, isPdf }: { data: CTAData; isPdf?: boolean }) {
  return (
    <section className="tpl-de__cta">
      <div className="tpl-de__cta-inner">
        {isPdf ? (
          <>
            <div className="tpl-de__cta-eyebrow">Let&apos;s build something great.</div>
            <h2 className="tpl-de__cta-title">{data.headline}</h2>
            <p className="tpl-de__cta-sub">{data.body}</p>

          </>
        ) : (
          <>
            <Reveal><div className="tpl-de__cta-eyebrow">Let&apos;s build something great.</div></Reveal>
            <Reveal delay={80}><h2 className="tpl-de__cta-title">{data.headline}</h2></Reveal>
            <Reveal delay={160}><p className="tpl-de__cta-sub">{data.body}</p></Reveal>

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

/* ── Main Template ───────────────────────────────────────────── */

export default function DarkEditorialTemplate({
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
    <div className="tpl-dark-editorial" style={cssVars}>
      <style>{CSS}</style>
      {orderedKeys.map((key) => {
        if (!sections.visibility[key]) return null;
        const data = content[key];
        if (!data) return null;
        const props: Record<string, unknown> = { data, isPdf };
        if (key === 'cover') { props.proposal = proposal; props.profile = profile; }
        if (key === 'pricing') { props.proposal = proposal; }
        if (key === 'about') { props.profile = profile; }
        const Renderer = SECTION_RENDERERS[key];
        return <div key={key} data-section={key}><Renderer {...props} /></div>;
      })}
    </div>
  );
}

/* ── CSS ─────────────────────────────────────────────────────── */

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

  /* ── ANIMATION ──────────────────────────────────────────────── */
  .tpl-de-reveal {
    opacity: 0;
    transform: translateY(24px);
    transition: opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1);
  }
  .tpl-de-reveal--in { opacity: 1; transform: translateY(0); }

  .tpl-de-slide {
    opacity: 0;
    transform: translateX(-20px);
    transition: opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1);
  }
  .tpl-de-slide--in { opacity: 1; transform: translateX(0); }

  /* cover entry keyframes */
  @keyframes de-topbar { from { opacity:0; transform:translateY(-14px); } to { opacity:1; transform:translateY(0); } }
  @keyframes de-title  { from { opacity:0; transform:translateY(36px) skewY(1deg); } to { opacity:1; transform:translateY(0) skewY(0); } }
  @keyframes de-sub    { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
  @keyframes de-strip  { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }

  .tpl-de__cover-topbar--anim  { animation: de-topbar 0.7s 0.1s cubic-bezier(0.16,1,0.3,1) both; }
  .tpl-de__cover-title--anim   { animation: de-title  1s   0.25s cubic-bezier(0.16,1,0.3,1) both; }
  .tpl-de__cover-subtitle--anim{ animation: de-sub    0.9s 0.45s cubic-bezier(0.16,1,0.3,1) both; }
  .tpl-de__cover-strip--anim   { animation: de-strip  0.8s 0.6s  cubic-bezier(0.16,1,0.3,1) both; }

  /* timeline dot pulse */
  @keyframes de-dot-pulse {
    0%,100% { box-shadow: 0 0 0 0 var(--proposal-accent); }
    60%     { box-shadow: 0 0 0 6px transparent; }
  }
  .tpl-de__tl-dot { animation: de-dot-pulse 2.8s ease-in-out infinite; }

  /* cta button breathe */
  @keyframes de-breathe {
    0%,100% { box-shadow: 0 0 0 0 transparent; }
    50%     { box-shadow: 0 0 28px 4px var(--proposal-accent); }
  }
  .tpl-de__cta-primary { animation: de-breathe 3s ease-in-out infinite; }

  /* step number count-up feel on appear */
  .tpl-de-slide--in .tpl-de__step-big-num {
    animation: de-num-in 0.5s 0.2s cubic-bezier(0.34,1.56,0.64,1) both;
  }
  @keyframes de-num-in {
    from { opacity:0; transform: scale(0.5) translateY(8px); }
    to   { opacity:1; transform: scale(1) translateY(0); }
  }

  /* ── ROOT ───────────────────────────────────────────────────── */
  .tpl-dark-editorial {
    background: var(--proposal-bg);
    color: var(--proposal-text);
    font-family: 'DM Sans', system-ui, sans-serif;
    font-feature-settings: 'ss01','cv01';
    line-height: 1.65;
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* ── COVER ──────────────────────────────────────────────────── */
  .tpl-de__cover {
    min-height: 100vh;
    position: relative;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-bottom: 1px solid var(--proposal-border);
  }

  /* giant editorial BG number */
  .tpl-de__cover-bg-num {
    position: absolute;
    right: -0.1em;
    bottom: -0.15em;
    font-family: 'Playfair Display', Georgia, serif;
    font-size: clamp(18rem, 35vw, 32rem);
    font-weight: 900;
    line-height: 1;
    color: transparent;
    -webkit-text-stroke: 1px var(--proposal-border);
    pointer-events: none;
    user-select: none;
    letter-spacing: -0.05em;
    opacity: 0.6;
  }

  .tpl-de__cover-inner {
    position: relative; z-index: 1;
    display: flex; flex-direction: column;
    min-height: 100vh;
    padding: 2.5rem 3.5rem;
  }

  .tpl-de__cover-topbar {
    display: flex; align-items: center; justify-content: space-between;
    padding-bottom: 2rem;
    border-bottom: 1px solid var(--proposal-border);
  }

  .tpl-de__cover-topbar-left {
    display: flex; align-items: center; gap: 0.875rem;
  }

  .tpl-de__cover-logo {
    width: 36px; height: 36px; border-radius: 8px; object-fit: cover;
  }

  .tpl-de__cover-logo-fallback {
    width: 36px; height: 36px; border-radius: 8px;
    background: var(--proposal-accent); color: var(--proposal-accent-fg);
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 1rem; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
  }

  .tpl-de__cover-author {
    font-size: 0.875rem; font-weight: 500; color: var(--proposal-text);
  }

  .tpl-de__cover-author-sub {
    font-size: 0.72rem; color: var(--proposal-text-muted);
  }

  .tpl-de__cover-badge {
    font-size: 0.65rem; font-weight: 700; letter-spacing: 0.18em;
    color: var(--proposal-accent);
    border: 1px solid var(--proposal-accent);
    padding: 0.3rem 0.9rem; border-radius: 999px;
    text-transform: uppercase; opacity: 0.8;
  }

  .tpl-de__cover-hero {
    flex: 1; display: flex; flex-direction: column; justify-content: center;
    padding: 5rem 0 4rem;
    max-width: 900px;
  }

  .tpl-de__cover-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: clamp(3.5rem, 8vw, 7.5rem);
    font-weight: 700;
    line-height: 0.97;
    letter-spacing: -0.03em;
    color: var(--proposal-text);
    margin: 0 0 2rem;
  }

  .tpl-de__cover-subtitle {
    font-size: clamp(1rem, 2vw, 1.2rem);
    font-weight: 300;
    color: var(--proposal-text-muted);
    line-height: 1.7;
    max-width: 560px;
    margin: 0;
    letter-spacing: -0.01em;
  }

  .tpl-de__cover-strip {
    display: flex; align-items: center; gap: 0;
    border-top: 1px solid var(--proposal-border);
    padding-top: 2rem;
    flex-wrap: wrap; gap: 0;
  }

  .tpl-de__cover-strip-item {
    display: flex; flex-direction: column; gap: 0.3rem;
    padding-right: 3rem;
  }

  .tpl-de__cover-strip-divider {
    width: 1px; height: 2.5rem;
    background: var(--proposal-border);
    margin-right: 3rem; flex-shrink: 0;
  }

  .tpl-de__cover-strip-label {
    font-size: 0.65rem; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.1em; color: var(--proposal-text-muted);
  }

  .tpl-de__cover-strip-val {
    font-size: 1rem; font-weight: 500; color: var(--proposal-text);
    letter-spacing: -0.01em;
  }

  .tpl-de__cover-strip-val--accent { color: var(--proposal-accent); }

  /* ── EYEBROW ────────────────────────────────────────────────── */
  .tpl-de__eyebrow {
    display: flex; align-items: center; gap: 1rem;
    margin-bottom: 2rem;
  }

  .tpl-de__eyebrow-num {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 0.78rem; font-weight: 700;
    color: var(--proposal-accent); letter-spacing: 0.08em;
  }

  .tpl-de__eyebrow-line {
    flex: 0 0 48px; height: 1px;
    background: var(--proposal-accent); opacity: 0.35;
  }

  .tpl-de__eyebrow-label {
    font-size: 0.7rem; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.12em; color: var(--proposal-text-muted);
  }

  /* ── SECTIONS ───────────────────────────────────────────────── */
  .tpl-de__section {
    border-bottom: 1px solid var(--proposal-border);
    padding: 6rem 0;
  }

  .tpl-de__section--accent-border {
    border-left: 2px solid var(--proposal-accent);
    padding-left: 3.5rem;
    margin-left: 3.5rem;
    margin-right: 3.5rem;
  }

  .tpl-de__section-inner {
    max-width: 900px; margin: 0 auto;
    padding: 0 3.5rem;
  }

  .tpl-de__section--accent-border .tpl-de__section-inner {
    padding: 0;
  }

  /* ── TYPOGRAPHY ─────────────────────────────────────────────── */
  .tpl-de__title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: clamp(2rem, 4.5vw, 3.5rem);
    font-weight: 700; line-height: 1.07;
    letter-spacing: -0.025em;
    color: var(--proposal-text);
    margin: 0 0 1.5rem;
  }

  .tpl-de__title--xl {
    font-size: clamp(2.5rem, 5.5vw, 4.5rem);
    font-weight: 700;
  }

  .tpl-de__body {
    font-size: 1.05rem; font-weight: 300; line-height: 1.85;
    color: var(--proposal-text-muted);
    max-width: 640px; margin: 0;
  }

  .tpl-de__body--lead {
    font-size: 1.2rem; line-height: 1.75;
  }

  /* ── TWO-COL LAYOUT (problem/solution) ──────────────────────── */
  .tpl-de__two-col {
    display: grid;
    grid-template-columns: 1fr 1.2fr;
    gap: 5rem;
    align-items: start;
  }

  .tpl-de__solution-layout {
    max-width: 760px;
  }

  /* ── PAIN POINTS ────────────────────────────────────────────── */
  .tpl-de__pain-list {
    margin-top: 2rem;
    display: flex; flex-direction: column; gap: 0;
  }

  .tpl-de__pain-item {
    display: flex; gap: 1rem; align-items: flex-start;
    padding: 1rem 0;
    border-bottom: 1px solid var(--proposal-border);
  }

  .tpl-de__pain-item:last-child { border-bottom: none; }

  .tpl-de__pain-dash {
    width: 20px; height: 1px; background: var(--proposal-accent);
    flex-shrink: 0; margin-top: 0.7rem; opacity: 0.6;
  }

  .tpl-de__pain-text {
    font-size: 0.92rem; font-weight: 300;
    color: var(--proposal-text-muted); line-height: 1.65; margin: 0;
  }

  /* ── APPROACH STEPS ─────────────────────────────────────────── */
  .tpl-de__steps {
    display: flex; flex-direction: column; gap: 0;
    margin-top: 2.5rem;
  }

  .tpl-de__step {
    display: grid;
    grid-template-columns: 72px 1fr;
    gap: 0;
    padding: 2rem 0;
    border-bottom: 1px solid var(--proposal-border);
    align-items: start;
  }

  .tpl-de__step:last-child { border-bottom: none; }

  .tpl-de__step-num-wrap {
    display: flex; align-items: flex-start; padding-top: 0.25rem;
  }

  .tpl-de__step-big-num {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 2.5rem; font-weight: 900;
    color: var(--proposal-accent); opacity: 0.25;
    line-height: 1; letter-spacing: -0.05em;
  }

  .tpl-de__step-body { padding-left: 0; }

  .tpl-de__step-header {
    display: flex; align-items: flex-start; justify-content: space-between;
    gap: 1rem; margin-bottom: 0.6rem; flex-wrap: wrap;
  }

  .tpl-de__step-title {
    font-size: 1.1rem; font-weight: 600; letter-spacing: -0.015em;
    color: var(--proposal-text); margin: 0;
  }

  .tpl-de__step-tag {
    font-size: 0.68rem; font-weight: 600; color: var(--proposal-accent);
    padding: 0.2rem 0.65rem; border-radius: 999px;
    border: 1px solid var(--proposal-accent); opacity: 0.7;
    white-space: nowrap; flex-shrink: 0; letter-spacing: 0.04em;
  }

  .tpl-de__step-desc {
    font-size: 0.92rem; font-weight: 300;
    color: var(--proposal-text-muted); line-height: 1.7; margin: 0;
  }

  /* ── DELIVERABLES ───────────────────────────────────────────── */
  .tpl-de__deliv-list {
    display: flex; flex-direction: column; gap: 0;
    margin-top: 2.5rem;
  }

  .tpl-de__deliv-row {
    display: grid;
    grid-template-columns: 48px 1fr 32px;
    gap: 1.25rem;
    align-items: center;
    padding: 1.25rem 0;
    border-bottom: 1px solid var(--proposal-border);
    transition: background 0.15s;
    cursor: default;
  }

  .tpl-de__deliv-row:hover {
    padding-left: 0.75rem; padding-right: 0.75rem;
    margin-left: -0.75rem; margin-right: -0.75rem;
    background: var(--proposal-surface);
    border-radius: 8px;
  }

  .tpl-de__deliv-row:last-child { border-bottom: none; }

  .tpl-de__deliv-idx {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 0.78rem; font-weight: 700;
    color: var(--proposal-accent); opacity: 0.5; letter-spacing: 0.06em;
  }

  .tpl-de__deliv-content { flex: 1; }

  .tpl-de__deliv-name {
    font-size: 0.97rem; font-weight: 600; letter-spacing: -0.01em;
    color: var(--proposal-text); margin: 0 0 0.25rem; line-height: 1.3;
  }

  .tpl-de__deliv-desc {
    font-size: 0.84rem; font-weight: 300;
    color: var(--proposal-text-muted); line-height: 1.6; margin: 0;
  }

  .tpl-de__deliv-check {
    font-size: 0.8rem; font-weight: 700;
    color: var(--proposal-accent); opacity: 0.6; text-align: right;
  }

  /* ── TIMELINE ───────────────────────────────────────────────── */
  .tpl-de__tl {
    margin-top: 2.5rem;
    display: flex; flex-direction: column;
  }

  .tpl-de__tl-row {
    display: grid;
    grid-template-columns: 120px 1fr;
    gap: 0;
    align-items: start;
  }

  .tpl-de__tl-left {
    display: flex; flex-direction: column; align-items: center;
    padding-top: 0.25rem;
  }

  .tpl-de__tl-top {
    display: flex; flex-direction: column; align-items: center;
    gap: 0.35rem;
  }

  .tpl-de__tl-dot {
    width: 10px; height: 10px; border-radius: 50%;
    background: var(--proposal-accent); flex-shrink: 0;
  }

  .tpl-de__tl-connector {
    width: 1px; flex: 1; min-height: 3rem;
    background: var(--proposal-border);
    margin-top: 0.5rem;
  }

  .tpl-de__tl-dur {
    font-size: 0.72rem; font-weight: 600;
    color: var(--proposal-accent); letter-spacing: 0.06em;
    text-align: center; line-height: 1.4;
  }

  .tpl-de__tl-right {
    padding: 0 0 3rem 2rem;
    border-left: 1px solid var(--proposal-border);
  }

  .tpl-de__tl-row:last-child .tpl-de__tl-right { padding-bottom: 0; }

  .tpl-de__tl-name {
    font-size: 1.05rem; font-weight: 600; letter-spacing: -0.015em;
    color: var(--proposal-text); margin: 0 0 0.4rem;
  }

  .tpl-de__tl-desc {
    font-size: 0.88rem; font-weight: 300;
    color: var(--proposal-text-muted); line-height: 1.65; margin: 0;
  }

  /* ── PRICING ──────────────────────────────────────────────────── */
  /* ── ABOUT ───────────────────────────────────────────────────── */
  .tpl-de__about-card {
    margin-top: 2rem; padding: 2.25rem;
    border-radius: 4px; border: 1px solid var(--proposal-border);
    background: var(--proposal-surface, var(--proposal-bg));
  }
  .tpl-de__about-header {
    display: flex; align-items: center; gap: 1.25rem;
  }
  .tpl-de__about-avatar {
    width: 60px; height: 60px; border-radius: 50%;
    background: var(--proposal-accent); color: var(--proposal-accent-fg);
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 1.5rem; font-weight: 700;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .tpl-de__about-avatar-img {
    width: 60px; height: 60px; border-radius: 50%; object-fit: cover; flex-shrink: 0;
  }
  .tpl-de__about-identity {
    display: flex; flex-direction: column; gap: 0.15rem;
  }
  .tpl-de__about-name {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 1.2rem; font-weight: 700; letter-spacing: -0.02em;
    color: var(--proposal-text); margin: 0;
  }
  .tpl-de__about-title {
    font-size: 0.82rem; font-weight: 500; color: var(--proposal-accent);
    margin: 0;
  }
  .tpl-de__about-services {
    display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1.5rem;
  }
  .tpl-de__about-pill {
    font-size: 0.78rem; font-weight: 500; color: var(--proposal-text-muted);
    padding: 0.3rem 0.85rem; border-radius: 999px;
    border: 1px solid var(--proposal-border);
    background: transparent;
  }

  /* ── ABOUT — selected work table ───────────────────────────── */
  .tpl-de__about-work {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--proposal-border);
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }
  .tpl-de__about-work-label {
    font-size: 0.65rem; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.1em; color: var(--proposal-text-muted);
  }
  .tpl-de__about-work-list {
    display: flex;
    flex-direction: column;
    margin-top: 0.1rem;
  }
  .tpl-de__about-work-row {
    display: grid;
    grid-template-columns: minmax(0, 10rem) 1fr;
    gap: 1.25rem;
    padding: 0.7rem 0;
    border-top: 1px solid var(--proposal-border);
    align-items: center;
    text-decoration: none;
    transition: background 0.15s;
  }
  .tpl-de__about-work-row:first-child { border-top: none; }
  .tpl-de__about-work-row--linked { cursor: pointer; }
  .tpl-de__about-work-name {
    font-size: 0.82rem; font-weight: 520;
    color: var(--proposal-text);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    display: flex; align-items: center; gap: 0.35rem;
    transition: color 0.15s;
  }
  .tpl-de__about-work-icon {
    flex-shrink: 0;
    opacity: 0;
    transition: opacity 0.15s;
    color: var(--proposal-accent);
  }
  .tpl-de__about-work-row--linked:hover .tpl-de__about-work-name {
    color: var(--proposal-accent);
  }
  .tpl-de__about-work-row--linked:hover .tpl-de__about-work-icon {
    opacity: 1;
  }
  .tpl-de__about-work-desc {
    font-size: 0.8rem;
    color: var(--proposal-text-muted);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    line-height: 1.4;
  }

  /* ── ABOUT — portfolio links ─────────────────────────────────── */
  .tpl-de__about-links {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--proposal-border);
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }
  .tpl-de__about-links-label {
    font-size: 0.65rem; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.1em; color: var(--proposal-text-muted);
  }
  .tpl-de__about-links-row {
    display: flex; flex-wrap: wrap; gap: 0.5rem;
  }
  .tpl-de__about-link {
    display: inline-flex; align-items: center; gap: 0.4rem;
    font-size: 0.8rem; font-weight: 500;
    color: var(--proposal-accent);
    padding: 0.3rem 0.85rem; border-radius: 999px;
    border: 1px solid var(--proposal-accent);
    background: transparent;
    text-decoration: none;
    transition: background 0.18s, color 0.18s;
    opacity: 0.85;
  }
  .tpl-de__about-link:hover {
    background: var(--proposal-accent);
    color: var(--proposal-accent-fg);
    opacity: 1;
  }

  .tpl-de__pricing {
    border: 1px solid var(--proposal-border);
    border-radius: 16px; overflow: hidden;
    margin-top: 2rem;
  }

  .tpl-de__pricing-hero {
    background: var(--proposal-surface);
    padding: 2.5rem 2.5rem 2rem;
    display: flex; align-items: flex-start; justify-content: space-between;
    border-bottom: 1px solid var(--proposal-border);
  }

  .tpl-de__pricing-hero-label {
    font-size: 0.68rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.12em; color: var(--proposal-text-muted); margin-bottom: 0.5rem;
  }

  .tpl-de__pricing-hero-total {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 3.75rem; font-weight: 700;
    color: var(--proposal-text);
    letter-spacing: -0.03em; line-height: 1;
  }

  .tpl-de__pricing-hero-right { display: flex; align-items: flex-start; padding-top: 0.25rem; }

  .tpl-de__pricing-tag {
    font-size: 0.68rem; font-weight: 700; color: var(--proposal-accent);
    padding: 0.3rem 0.8rem; border-radius: 999px;
    border: 1px solid var(--proposal-accent); text-transform: uppercase;
    letter-spacing: 0.08em; opacity: 0.8;
  }

  .tpl-de__pricing-rows {}

  .tpl-de__pricing-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 1.1rem 2.5rem;
    border-bottom: 1px solid var(--proposal-border); font-size: 0.92rem;
  }

  .tpl-de__pricing-row:last-child { border-bottom: none; }

  .tpl-de__pricing-row-label { font-weight: 400; color: var(--proposal-text); }

  .tpl-de__pricing-row-amount {
    font-weight: 600; color: var(--proposal-text);
    font-variant-numeric: tabular-nums; letter-spacing: -0.01em;
  }

  .tpl-de__pricing-note {
    padding: 1rem 2.5rem 1.25rem; font-size: 0.8rem;
    color: var(--proposal-text-muted);
    border-top: 1px solid var(--proposal-border);
    background: var(--proposal-surface-alt); line-height: 1.6;
    font-style: italic;
  }

  /* ── ABOUT ──────────────────────────────────────────────────── */
  .tpl-de__about {
    display: grid;
    grid-template-columns: 80px 1fr;
    gap: 2.5rem; align-items: start;
    margin-top: 2rem;
  }

  .tpl-de__about-avatar {
    width: 80px; height: 80px; border-radius: 4px;
    background: var(--proposal-accent); color: var(--proposal-accent-fg);
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 2rem; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
  }

  .tpl-de__about-content { padding-top: 0.25rem; }

  .tpl-de__about-name {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 1.5rem; font-weight: 700; letter-spacing: -0.02em;
    color: var(--proposal-text); margin: 0 0 0.75rem;
  }

  /* ── FAQ ────────────────────────────────────────────────────── */
  .tpl-de__faq {
    margin-top: 2.5rem;
    display: flex; flex-direction: column; gap: 0;
  }

  .tpl-de__faq-item {
    border-bottom: 1px solid var(--proposal-border);
  }

  .tpl-de__faq-item:first-child { border-top: 1px solid var(--proposal-border); }

  .tpl-de__faq-q {
    width: 100%; display: flex; align-items: center; gap: 1.25rem;
    padding: 1.25rem 0; background: none; border: none;
    color: var(--proposal-text); cursor: pointer; text-align: left;
    font-family: inherit; transition: color 0.15s;
  }

  .tpl-de__faq-q:hover { color: var(--proposal-accent); }

  .tpl-de__faq-q-num {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 0.75rem; font-weight: 700;
    color: var(--proposal-accent); opacity: 0.5;
    flex-shrink: 0; letter-spacing: 0.06em;
  }

  .tpl-de__faq-q-text {
    flex: 1; font-size: 0.97rem; font-weight: 500;
    letter-spacing: -0.01em; line-height: 1.4;
  }

  .tpl-de__faq-icon {
    width: 20px; height: 20px; border-radius: 50%;
    border: 1.5px solid var(--proposal-border);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; position: relative;
    transition: border-color 0.2s;
  }

  .tpl-de__faq-q:hover .tpl-de__faq-icon { border-color: var(--proposal-accent); }

  .tpl-de__faq-bar {
    position: absolute; background: var(--proposal-accent); border-radius: 1px;
    transition: opacity 0.2s, transform 0.2s;
  }
  .tpl-de__faq-bar--h { width: 8px; height: 1.5px; }
  .tpl-de__faq-bar--v { width: 1.5px; height: 8px; }
  .tpl-de__faq-bar--gone { opacity: 0; transform: rotate(90deg); }

  .tpl-de__faq-body {
    max-height: 0; overflow: hidden;
    transition: max-height 0.4s cubic-bezier(0.16,1,0.3,1);
  }
  .tpl-de__faq-body--open { max-height: 400px; }

  .tpl-de__faq-a {
    padding: 0 0 1.25rem 2.5rem;
    font-size: 0.92rem; font-weight: 300;
    color: var(--proposal-text-muted); line-height: 1.75; margin: 0;
  }

  /* ── CTA ────────────────────────────────────────────────────── */
  .tpl-de__cta {
    padding: 8rem 3.5rem 6rem;
    position: relative; overflow: hidden;
    text-align: center;
  }

  .tpl-de__cta::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse 60% 50% at 50% 50%, var(--proposal-surface) 0%, transparent 80%);
    pointer-events: none;
  }

  .tpl-de__cta-inner {
    position: relative;
    max-width: 640px; margin: 0 auto;
  }

  .tpl-de__cta-eyebrow {
    font-size: 0.68rem; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.18em; color: var(--proposal-text-muted);
    margin-bottom: 1.5rem;
    display: flex; align-items: center; justify-content: center; gap: 0.75rem;
  }

  .tpl-de__cta-eyebrow::before, .tpl-de__cta-eyebrow::after {
    content: ''; width: 2.5rem; height: 1px;
    background: var(--proposal-border);
  }

  .tpl-de__cta-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: clamp(2.5rem, 6vw, 5rem);
    font-weight: 700; line-height: 1.05;
    letter-spacing: -0.03em;
    color: var(--proposal-text);
    margin: 0 0 1.25rem;
  }

  .tpl-de__cta-sub {
    font-size: 1rem; font-weight: 300;
    color: var(--proposal-text-muted); line-height: 1.75;
    max-width: 440px; margin: 0 auto 2.5rem;
    letter-spacing: -0.01em;
  }

  .tpl-de__cta-btns {
    display: flex; align-items: center; justify-content: center;
    gap: 0.875rem; flex-wrap: wrap; margin-bottom: 1.5rem;
  }

  .tpl-de__cta-primary {
    background: var(--proposal-accent); color: var(--proposal-accent-fg);
    border: none; padding: 0.9rem 2.5rem;
    font-size: 0.95rem; font-weight: 600; border-radius: 6px;
    cursor: pointer; font-family: inherit; letter-spacing: -0.01em;
    transition: opacity 0.2s, transform 0.15s;
    opacity: 0.95;
  }

  .tpl-de__cta-primary:hover { opacity: 1; transform: translateY(-1px); }

  .tpl-de__cta-secondary {
    background: transparent; color: var(--proposal-text-muted);
    border: 1px solid var(--proposal-border); padding: 0.9rem 2rem;
    font-size: 0.92rem; font-weight: 400; border-radius: 6px;
    cursor: pointer; font-family: inherit; letter-spacing: -0.01em;
    transition: border-color 0.2s, color 0.2s;
  }

  .tpl-de__cta-secondary:hover {
    border-color: var(--proposal-text-muted);
    color: var(--proposal-text);
  }

  .tpl-de__cta-fine {
    font-size: 0.72rem; color: var(--proposal-text-muted);
    opacity: 0.5; letter-spacing: 0.04em; margin: 0;
  }

  /* ── RESPONSIVE ─────────────────────────────────────────────── */
  @media (max-width: 900px) {
    .tpl-de__two-col { grid-template-columns: 1fr; gap: 2rem; }
    .tpl-de__section--accent-border { margin-left: 1.5rem; margin-right: 1.5rem; padding-left: 2rem; }
  }

  @media (max-width: 768px) {
    .tpl-de__cover-inner  { padding: 2rem 1.5rem; }
    .tpl-de__section      { padding: 4rem 0; }
    .tpl-de__section-inner { padding: 0 1.5rem; }
    .tpl-de__section--accent-border { margin-left: 0; padding-left: 1.5rem; }
    .tpl-de__cta          { padding: 5rem 1.5rem 4rem; }
    .tpl-de__cover-bg-num { font-size: 14rem; }
    .tpl-de__pricing-hero { flex-direction: column; gap: 1rem; }
    .tpl-de__pricing-hero-total { font-size: 2.75rem; }
    .tpl-de__pricing-hero,
    .tpl-de__pricing-row,
    .tpl-de__pricing-note { padding-left: 1.5rem; padding-right: 1.5rem; }
    .tpl-de__about        { grid-template-columns: 1fr; gap: 1.5rem; }
    .tpl-de__tl-row       { grid-template-columns: 90px 1fr; }
  }

  @media (max-width: 480px) {
    .tpl-de__cover-strip  { flex-direction: column; gap: 1.25rem; align-items: flex-start; }
    .tpl-de__cover-strip-divider { display: none; }
    .tpl-de__step         { grid-template-columns: 48px 1fr; }
  }
`;