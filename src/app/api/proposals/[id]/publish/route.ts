import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { Resend } from 'resend';
import type { SectionDataMap } from '@/templates/types';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const SECTION_LABELS: Record<string, string> = {
  cover: 'Cover', problem: 'Problem', solution: 'Solution',
  approach: 'Approach', deliverables: 'Deliverables', timeline: 'Timeline',
  pricing: 'Pricing', about: 'About', faq: 'FAQ', cta: 'Call to Action',
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { change_summary } = body;

    if (!change_summary?.trim()) {
      return NextResponse.json({ error: 'Change summary is required' }, { status: 400 });
    }

    const admin = createServiceClient();

    // Fetch proposal
    const { data: proposal, error } = await admin
      .from('proposals')
      .select('id, user_id, project_title, client_name, client_email, edited_content_json, content_json, sections_config, current_version, hosted_token')
      .eq('id', id)
      .single();

    if (error || !proposal || proposal.user_id !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const currentContent = proposal.edited_content_json || proposal.content_json;
    const currentSections = proposal.sections_config;
    const newVersionNumber = (proposal.current_version || 1) + 1;

    // Auto-detect changed sections by comparing with previous version
    let changedSections: string[] = [];
    const { data: prevVersion } = await admin
      .from('proposal_versions')
      .select('content_snapshot')
      .eq('proposal_id', id)
      .order('version_number', { ascending: false })
      .limit(1)
      .single();

    if (prevVersion) {
      const prevContent = prevVersion.content_snapshot as Record<string, unknown>;
      const curr = currentContent as Record<string, unknown>;
      for (const key of Object.keys(curr)) {
        if (JSON.stringify(curr[key]) !== JSON.stringify(prevContent[key])) {
          changedSections.push(key);
        }
      }
    } else {
      // First publish — all sections are "new"
      changedSections = Object.keys(currentContent as Record<string, unknown>);
    }

    // Create version snapshot
    const { error: versionErr } = await admin
      .from('proposal_versions')
      .insert({
        proposal_id: id,
        version_number: newVersionNumber,
        content_snapshot: currentContent,
        sections_config_snapshot: currentSections,
        change_summary: change_summary.trim(),
        changed_sections: changedSections,
      });

    if (versionErr) {
      console.error('Failed to create version:', versionErr);
      return NextResponse.json({ error: 'Failed to create version' }, { status: 500 });
    }

    // Update proposal version counters
    await admin
      .from('proposals')
      .update({
        current_version: newVersionNumber,
        client_seen_version: null, // Reset so client sees "Updated" badge
        status: 'sent', // Mark as sent if it was draft
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    // Send email notification to client
    if (proposal.client_email) {
      sendVersionEmail(
        admin,
        proposal,
        change_summary.trim(),
        changedSections,
        newVersionNumber,
      ).catch((err) => {
        console.error('Failed to send version email:', err);
      });
    }

    return NextResponse.json({
      ok: true,
      version: newVersionNumber,
      changedSections,
    });
  } catch (err) {
    console.error('Publish error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

async function sendVersionEmail(
  admin: ReturnType<typeof createServiceClient>,
  proposal: { project_title: string; client_name: string; client_email: string | null; hosted_token: string },
  changeSummary: string,
  changedSections: string[],
  versionNumber: number,
) {
  if (!proposal.client_email) return;

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return;

  // Get freelancer name
  const resend = new Resend(resendKey);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const proposalUrl = `${appUrl}/p/${proposal.hosted_token}`;
  const sectionLabels = changedSections.map((k) => SECTION_LABELS[k] || k).join(', ');

  await resend.emails.send({
    from: 'Clinch <notifications@useclinch.space>',
    to: proposal.client_email,
    subject: `📝 Updated proposal: "${proposal.project_title}" (v${versionNumber})`,
    html: `
      <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 500px; margin: 0 auto; padding: 2rem;">
        <h2 style="color: #111; font-size: 1.3rem; margin-bottom: 0.5rem;">
          Your proposal has been updated
        </h2>
        <p style="color: #444; font-size: 0.95rem; line-height: 1.6;">
          The proposal for <strong>"${proposal.project_title}"</strong>
          has been revised based on your feedback.
        </p>
        <div style="margin: 1rem 0; padding: 1rem; background: #f8f9fa; border-radius: 8px; border-left: 3px solid #6366f1;">
          <p style="color: #666; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 0.5rem;">
            What changed
          </p>
          <p style="color: #333; font-size: 0.95rem; line-height: 1.6; margin: 0;">
            ${changeSummary}
          </p>
          ${changedSections.length > 0 ? `
            <p style="color: #666; font-size: 0.8rem; margin: 0.75rem 0 0;">
              Sections updated: ${sectionLabels}
            </p>
          ` : ''}
        </div>
        <a href="${proposalUrl}"
           style="display: inline-block; margin-top: 0.5rem; padding: 0.6rem 1.5rem;
                  background: #6366f1; color: #fff; text-decoration: none;
                  border-radius: 8px; font-weight: 600; font-size: 0.9rem;">
          Review Updated Proposal
        </a>
        <p style="color: #999; font-size: 0.8rem; margin-top: 2rem;">
          Sent by Clinch — AI-powered proposals for freelancers.
        </p>
      </div>
    `,
  });
}
