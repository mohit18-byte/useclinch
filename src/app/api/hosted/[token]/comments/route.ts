import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { Resend } from 'resend';

interface RouteContext {
  params: Promise<{ token: string }>;
}

// Section display names for notifications
const SECTION_LABELS: Record<string, string> = {
  cover: 'Cover', problem: 'Problem', solution: 'Solution',
  approach: 'Approach', deliverables: 'Deliverables', timeline: 'Timeline',
  pricing: 'Pricing', about: 'About', faq: 'FAQ', cta: 'Call to Action',
};

// ── GET — list all comments for a proposal ──────────────────────

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { token } = await context.params;
    const admin = createServiceClient();

    // Look up proposal by token
    const { data: proposal, error } = await admin
      .from('proposals')
      .select('id')
      .eq('hosted_token', token)
      .single();

    if (error || !proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    const { data: comments } = await admin
      .from('proposal_comments')
      .select('id, section_key, author_name, message, created_at')
      .eq('proposal_id', proposal.id)
      .order('created_at', { ascending: true });

    return NextResponse.json({ comments: comments || [] });
  } catch (err) {
    console.error('Get comments error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// ── POST — client creates a new comment ─────────────────────────

export async function POST(request: Request, context: RouteContext) {
  try {
    const { token } = await context.params;
    const admin = createServiceClient();

    // Parse body
    const body = await request.json();
    const { section_key, author_name, author_email, message } = body;

    if (!author_name?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: 'Name and message are required' },
        { status: 400 }
      );
    }

    // Look up proposal
    const { data: proposal, error } = await admin
      .from('proposals')
      .select('id, user_id, project_title, client_name')
      .eq('hosted_token', token)
      .single();

    if (error || !proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    // Insert comment
    const { data: comment, error: insertErr } = await admin
      .from('proposal_comments')
      .insert({
        proposal_id: proposal.id,
        section_key: section_key || null,
        author_name: author_name.trim(),
        author_email: author_email?.trim() || null,
        message: message.trim(),
      })
      .select('id, section_key, author_name, message, created_at')
      .single();

    if (insertErr || !comment) {
      console.error('Failed to insert comment:', insertErr);
      return NextResponse.json({ error: 'Failed to save comment' }, { status: 500 });
    }

    // Send email notification to freelancer (fire and forget)
    sendCommentEmail(admin, proposal, comment, section_key).catch((err) => {
      console.error('Failed to send comment email:', err);
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (err) {
    console.error('Create comment error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// ── Email notification ──────────────────────────────────────────

async function sendCommentEmail(
  admin: ReturnType<typeof createServiceClient>,
  proposal: { user_id: string; project_title: string; client_name: string },
  comment: { author_name: string; message: string },
  sectionKey: string | null,
) {
  const { data: userData } = await admin.auth.admin.getUserById(proposal.user_id);
  const freelancerEmail = userData?.user?.email;
  if (!freelancerEmail) return;

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.warn('RESEND_API_KEY not set — skipping comment email');
    return;
  }

  const resend = new Resend(resendKey);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const sectionLabel = sectionKey ? SECTION_LABELS[sectionKey] || sectionKey : 'General';

  await resend.emails.send({
    from: 'Clinch <notifications@clinch.dev>',
    to: freelancerEmail,
    subject: `💬 New comment on "${proposal.project_title}" — ${sectionLabel}`,
    html: `
      <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 500px; margin: 0 auto; padding: 2rem;">
        <h2 style="color: #111; font-size: 1.3rem; margin-bottom: 0.5rem;">
          New comment on your proposal
        </h2>
        <p style="color: #444; font-size: 0.95rem; line-height: 1.6;">
          <strong>${comment.author_name}</strong> left a comment on
          <strong>"${proposal.project_title}"</strong>
          ${sectionKey ? `in the <strong>${sectionLabel}</strong> section` : ''}.
        </p>
        <div style="margin: 1rem 0; padding: 1rem; background: #f8f9fa; border-radius: 8px; border-left: 3px solid #6366f1;">
          <p style="color: #333; font-size: 0.95rem; line-height: 1.6; margin: 0;">
            "${comment.message}"
          </p>
        </div>
        <a href="${appUrl}/proposals"
           style="display: inline-block; margin-top: 0.5rem; padding: 0.6rem 1.5rem;
                  background: #6366f1; color: #fff; text-decoration: none;
                  border-radius: 8px; font-weight: 600; font-size: 0.9rem;">
          View in Dashboard
        </a>
        <p style="color: #999; font-size: 0.8rem; margin-top: 2rem;">
          Sent by Clinch — AI-powered proposals for freelancers.
        </p>
      </div>
    `,
  });
}
