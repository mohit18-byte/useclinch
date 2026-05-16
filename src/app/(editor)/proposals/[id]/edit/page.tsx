import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { SectionDataMap, SectionsConfig } from '@/templates/types';
import EditorShell from './editor-shell';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProposalEditPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/sign-in');
  }

  const { data: proposal, error } = await supabase
    .from('proposals')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !proposal) {
    redirect('/dashboard');
  }

  const editedContent = (proposal.edited_content_json ||
    proposal.content_json) as SectionDataMap;
  const sectionsConfig = proposal.sections_config as SectionsConfig;

  if (!editedContent) {
    redirect('/dashboard');
  }

  // Fetch profile from DB for template data
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, bio, services, logo_url, brand_color, professional_title, portfolio_url, past_projects')
    .eq('id', user.id)
    .single();

  return (
    <EditorShell
      proposalId={proposal.id}
      hostedToken={proposal.hosted_token}
      proposalStatus={proposal.status}
      editedContent={editedContent}
      sectionsConfig={sectionsConfig}
      templateId={proposal.template_id || 'dark-editorial'}
      themeId={proposal.theme_id || 'midnight'}
      proposalMeta={{
        projectTitle: proposal.project_title,
        clientName: proposal.client_name,
        clientEmail: proposal.client_email || '',
        amount: proposal.amount || 0,
        currency: proposal.currency || 'usd',
        createdAt: proposal.created_at,
        expiresAt: proposal.expires_at || null,
      }}
      profileMeta={{
        fullName: profile?.full_name || user.user_metadata?.full_name || 'Freelancer',
        professionalTitle: profile?.professional_title || 'Independent Developer',
        bio: profile?.bio || '',
        services: profile?.services || [],
        logoUrl: profile?.logo_url || null,
        brandColor: profile?.brand_color || '#5e6ad2',
        portfolioUrl: profile?.portfolio_url || null,
        pastProjects: Array.isArray(profile?.past_projects) ? profile.past_projects : [],
      }}
    />
  );
}
