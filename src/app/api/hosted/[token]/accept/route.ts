import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { Resend } from 'resend';

interface RouteContext {
  params: Promise<{ token: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { token } = await context.params;
    const admin = createServiceClient();

    // Parse request body for signature data
    let signatureData: string | null = null;
    let signerName: string | null = null;
    try {
      const body = await request.json();
      signatureData = body.signature_data || null;
      signerName = body.signer_name || null;
    } catch {
      // Body may be empty for legacy calls — that's fine
    }

    // Fetch proposal
    const { data: proposal, error } = await admin
      .from('proposals')
      .select('id, user_id, project_title, client_name, client_email, status')
      .eq('hosted_token', token)
      .single();

    if (error || !proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      );
    }

    // Idempotent: if already accepted, return success
    if (proposal.status === 'accepted') {
      return NextResponse.json({ ok: true, alreadyAccepted: true });
    }

    // Update status to accepted + store signature
    const updatePayload: Record<string, unknown> = {
      status: 'accepted',
      updated_at: new Date().toISOString(),
    };

    if (signatureData) {
      updatePayload.signature_data = signatureData;
      updatePayload.signer_name = signerName || proposal.client_name;
      updatePayload.signed_at = new Date().toISOString();
    }

    const { error: updateError } = await admin
      .from('proposals')
      .update(updatePayload)
      .eq('id', proposal.id);

    if (updateError) {
      console.error('Failed to update proposal status:', updateError);
      return NextResponse.json(
        { error: 'Failed to accept proposal' },
        { status: 500 }
      );
    }

    // Log accept event
    await admin.from('proposal_events').insert({
      proposal_id: proposal.id,
      event_type: 'accept_click',
      section_key: null,
      metadata: {
        client_name: proposal.client_name,
        signer_name: signerName || proposal.client_name,
        has_signature: !!signatureData,
      },
    });

    // Send notification email to freelancer
    try {
      await sendAcceptanceEmail(admin, proposal, signerName);
    } catch (emailErr) {
      // Don't fail the accept if email fails
      console.error('Failed to send acceptance email:', emailErr);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Accept proposal error:', err);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

async function sendAcceptanceEmail(
  admin: ReturnType<typeof createServiceClient>,
  proposal: {
    user_id: string;
    project_title: string;
    client_name: string;
    client_email: string | null;
  },
  signerName: string | null,
) {
  // Get freelancer's email from auth
  const { data: userData } = await admin.auth.admin.getUserById(proposal.user_id);
  const freelancerEmail = userData?.user?.email;

  if (!freelancerEmail) {
    console.error('No freelancer email found for user:', proposal.user_id);
    return;
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.warn('RESEND_API_KEY not set — skipping email');
    return;
  }

  const resend = new Resend(resendKey);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const signer = signerName || proposal.client_name;

  await resend.emails.send({
    from: 'Clinch <notifications@clinch.dev>',
    to: freelancerEmail,
    subject: `🎉 Your proposal for "${proposal.project_title}" was accepted!`,
    html: `
      <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 500px; margin: 0 auto; padding: 2rem;">
        <h2 style="color: #111; font-size: 1.3rem; margin-bottom: 0.5rem;">
          Great news! 🎉
        </h2>
        <p style="color: #444; font-size: 0.95rem; line-height: 1.6;">
          <strong>${signer}</strong> has accepted and signed your proposal
          <strong>"${proposal.project_title}"</strong>.
        </p>
        ${proposal.client_email ? `
          <p style="color: #444; font-size: 0.95rem; line-height: 1.6;">
            You can reach them at
            <a href="mailto:${proposal.client_email}" style="color: #6366f1;">${proposal.client_email}</a>.
          </p>
        ` : ''}
        <a href="${appUrl}/proposals"
           style="display: inline-block; margin-top: 1rem; padding: 0.6rem 1.5rem;
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

