import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/service';
import { resolveTemplate, resolveTheme } from '@/templates/registry';
import type { SectionDataMap, SectionsConfig } from '@/templates/types';
import type { Metadata } from 'next';
import ViewLogger from './view-logger';
import AcceptButton from './accept-button';

import CommentsPanel from './comments-panel';
import VersionBanner from './version-banner';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ token: string }>;
}

// ── Metadata ────────────────────────────────────────────────────

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const supabase = createServiceClient();

  const { data: proposal } = await supabase
    .from('proposals')
    .select('project_title, client_name')
    .eq('hosted_token', token)
    .single();

  if (!proposal) {
    return { title: 'Proposal Not Found' };
  }

  return {
    title: proposal.project_title,
    description: `Proposal for ${proposal.client_name}`,
    robots: { index: false, follow: false }, // private proposals
  };
}

// ── Page ────────────────────────────────────────────────────────

export default async function HostedProposalPage({ params }: PageProps) {
  const { token } = await params;
  const supabase = createServiceClient();

  // Fetch proposal by hosted_token
  const { data: proposal, error } = await supabase
    .from('proposals')
    .select('*')
    .eq('hosted_token', token)
    .single();

  if (error || !proposal) {
    notFound();
  }

  // Fetch freelancer profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, bio, services, logo_url, brand_color, professional_title, stripe_connect_onboarded, portfolio_url, past_projects')
    .eq('id', proposal.user_id)
    .single();

  if (!profile) {
    notFound();
  }

  // Resolve template and theme
  const entry = resolveTemplate(proposal.template_id);
  const theme = resolveTheme(proposal.template_id, proposal.theme_id);
  const TemplateComponent = entry.component;

  // Prepare template props
  const content = (proposal.edited_content_json || proposal.content_json) as SectionDataMap;
  const sections = proposal.sections_config as SectionsConfig;

  if (!content) {
    notFound();
  }

  const templateProposal = {
    projectTitle: proposal.project_title,
    clientName: proposal.client_name,
    clientEmail: proposal.client_email || '',
    amount: proposal.amount || 0,
    currency: proposal.currency || 'usd',
    createdAt: proposal.created_at,
  };

  const templateProfile = {
    fullName: profile.full_name || 'Freelancer',
    professionalTitle: profile.professional_title || 'Independent Developer',
    bio: profile.bio || '',
    services: profile.services || [],
    logoUrl: profile.logo_url,
    brandColor: profile.brand_color || '#5e6ad2',
    portfolioUrl: profile.portfolio_url || null,
    pastProjects: Array.isArray(profile.past_projects) ? profile.past_projects : [],
  };

  const isAccepted = proposal.status === 'accepted';

  // Compute advance payment amount in cents for display
  let advanceAmountCents: number | null = null;
  if (proposal.advance_payment_enabled) {
    if (proposal.advance_payment_percent != null) {
      advanceAmountCents = Math.round((proposal.amount ?? 0) * proposal.advance_payment_percent / 100);
    } else if (proposal.advance_payment_amount != null) {
      advanceAmountCents = proposal.advance_payment_amount;
    }
  }

  // Fetch latest version info for change highlighting
  let changedSections: string[] = [];
  if ((proposal.current_version || 1) > 1) {
    const { data: latestVersion } = await supabase
      .from('proposal_versions')
      .select('changed_sections')
      .eq('proposal_id', proposal.id)
      .order('version_number', { ascending: false })
      .limit(1)
      .single();
    changedSections = latestVersion?.changed_sections || [];
  }

  return (
    <div style={{ isolation: 'isolate', contain: 'content' }}>
      {/* Version banner — version pill + change notification */}
      <VersionBanner
        currentVersion={proposal.current_version || 1}
        clientSeenVersion={proposal.client_seen_version ?? null}
        changedSections={changedSections}
        updatedAt={proposal.updated_at}
        token={token}
      />

      {/* Analytics — fire and forget */}
      <ViewLogger token={token} />

      {/* Template */}
      <TemplateComponent
        proposal={templateProposal}
        content={content}
        sections={sections}
        profile={templateProfile}
        theme={theme}
        isPdf={false}
      />

      {/* Accept bar — sticky footer */}
      <AcceptButton
        token={token}
        clientName={proposal.client_name}
        projectTitle={proposal.project_title}
        isAccepted={isAccepted}
        expiresAt={proposal.expires_at || null}
        signerName={proposal.signer_name || null}
        signedAt={proposal.signed_at || null}
        advancePaymentEnabled={proposal.advance_payment_enabled ?? false}
        advancePaymentClaimed={proposal.advance_payment_claimed ?? false}
        advancePaymentType={(proposal.advance_payment_type as 'instructions' | 'link' | null) ?? null}
        advancePaymentValue={proposal.advance_payment_value ?? null}
        advanceAmountCents={advanceAmountCents}
        currency={proposal.currency ?? 'USD'}
      />

      {/* Comments panel — floating chat bubble */}
      <CommentsPanel
        token={token}
        clientName={proposal.client_name}
        sectionKeys={sections.order.filter((k) => sections.visibility[k as keyof typeof sections.visibility])}
      />
    </div>
  );
}
