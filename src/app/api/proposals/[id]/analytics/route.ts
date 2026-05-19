import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    // ── Auth check: user must own this proposal ──
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service client for cross-table reads (views/events have separate RLS)
    const admin = createServiceClient();

    // Verify ownership
    const { data: proposal, error: pError } = await admin
      .from('proposals')
      .select('id, user_id, status, project_title, client_name, created_at, hosted_token, sections_config, signature_data, signer_name, signed_at, advance_payment_enabled, advance_payment_claimed, advance_payment_invoice_id, advance_payment_percent, advance_payment_amount, advance_payment_type, advance_payment_value, amount, currency')
      .eq('id', id)
      .single();

    if (pError || !proposal || proposal.user_id !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // ── Fetch all views ──
    const { data: views } = await admin
      .from('proposal_views')
      .select('id, viewed_at, ip_hash, is_owner_view')
      .eq('proposal_id', id)
      .order('viewed_at', { ascending: false });

    const allViews = views || [];
    const clientViews = allViews.filter((v) => !v.is_owner_view);
    const uniqueIPs = new Set(clientViews.map((v) => v.ip_hash));

    // ── Fetch all events ──
    const { data: events } = await admin
      .from('proposal_events')
      .select('id, event_type, section_key, metadata, created_at')
      .eq('proposal_id', id)
      .order('created_at', { ascending: false });

    const allEvents = events || [];

    // ── Time on page ──
    const timeEvents = allEvents.filter((e) => e.event_type === 'time_on_page');
    const totalSeconds = timeEvents.reduce((sum, e) => {
      const sec = (e.metadata as { seconds?: number })?.seconds;
      return sum + (typeof sec === 'number' ? sec : 0);
    }, 0);
    const avgTimeSeconds = timeEvents.length > 0
      ? Math.round(totalSeconds / timeEvents.length)
      : 0;

    // ── Section read rates ──
    const sectionEvents = allEvents.filter((e) => e.event_type === 'section_view');
    const sectionCounts: Record<string, number> = {};
    for (const e of sectionEvents) {
      if (e.section_key) {
        sectionCounts[e.section_key] = (sectionCounts[e.section_key] || 0) + 1;
      }
    }

    // Calculate read % relative to total client views (each view = 1 session)
    const totalSessions = Math.max(clientViews.length, 1);
    const sectionOrder: string[] = (proposal.sections_config as { order?: string[] })?.order || [];
    const sectionReadRates = sectionOrder.map((key) => ({
      key,
      views: sectionCounts[key] || 0,
      rate: Math.min(Math.round(((sectionCounts[key] || 0) / totalSessions) * 100), 100),
    }));

    // ── Accept events ──
    const acceptEvent = allEvents.find((e) => e.event_type === 'accept_click');

    // ── Recent activity (last 20 events/views combined) ──
    const activity: Array<{
      type: string;
      timestamp: string;
      detail?: string;
    }> = [];

    for (const v of clientViews.slice(0, 10)) {
      activity.push({
        type: 'view',
        timestamp: v.viewed_at,
      });
    }

    if (acceptEvent) {
      activity.push({
        type: 'accepted',
        timestamp: acceptEvent.created_at,
        detail: (acceptEvent.metadata as { client_name?: string })?.client_name || undefined,
      });
    }

    // Sort by timestamp descending
    activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // ── Linked invoices ──
    const { data: linkedInvoices } = await admin
      .from('invoices')
      .select('id, invoice_number, client_name, total_cents, currency, status, hosted_token, created_at, line_items, note, due_date, payment_instructions')
      .eq('proposal_id', id)
      .order('created_at', { ascending: false });

    // Compute advance amount for display
    let advanceAmountCents: number | null = null;
    if (proposal.advance_payment_enabled) {
      if (proposal.advance_payment_percent != null) {
        advanceAmountCents = Math.round((proposal.amount ?? 0) * proposal.advance_payment_percent / 100);
      } else if (proposal.advance_payment_amount != null) {
        advanceAmountCents = proposal.advance_payment_amount;
      }
    }

    return NextResponse.json({
      proposal: {
        id: proposal.id,
        status: proposal.status,
        projectTitle: proposal.project_title,
        clientName: proposal.client_name,
        createdAt: proposal.created_at,
        hostedToken: proposal.hosted_token,
        advancePaymentEnabled: proposal.advance_payment_enabled ?? false,
        advancePaymentClaimed: proposal.advance_payment_claimed ?? false,
        advancePaymentInvoiceId: proposal.advance_payment_invoice_id ?? null,
        advanceAmountCents,
        currency: proposal.currency ?? 'USD',
      },
      stats: {
        totalViews: clientViews.length,
        uniqueViews: uniqueIPs.size,
        ownerViews: allViews.length - clientViews.length,
        avgTimeSeconds,
      },
      sectionReadRates,
      activity: activity.slice(0, 20),
      acceptedAt: acceptEvent?.created_at || null,
      signature: proposal.signature_data ? {
        data: proposal.signature_data,
        signerName: proposal.signer_name || proposal.client_name,
        signedAt: proposal.signed_at,
      } : null,
      linkedInvoices: (linkedInvoices || []).map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoice_number,
        clientName: inv.client_name,
        total: inv.total_cents,
        currency: inv.currency,
        paymentStatus: inv.status,
        hostedToken: inv.hosted_token,
        createdAt: inv.created_at,
        line_items: inv.line_items,
        note: inv.note,
        due_date: inv.due_date,
        payment_instructions: inv.payment_instructions,
      })),

      // ── Client comments ──
      comments: await (async () => {
        const { data: comments } = await admin
          .from('proposal_comments')
          .select('id, section_key, author_name, author_email, message, is_read, created_at')
          .eq('proposal_id', id)
          .order('created_at', { ascending: false });

        // Mark all as read (fire-and-forget)
        admin
          .from('proposal_comments')
          .update({ is_read: true })
          .eq('proposal_id', id)
          .eq('is_read', false)
          .then(() => {});

        return (comments || []).map((c) => ({
          id: c.id,
          sectionKey: c.section_key,
          authorName: c.author_name,
          authorEmail: c.author_email,
          message: c.message,
          isRead: c.is_read,
          createdAt: c.created_at,
        }));
      })(),
    });
  } catch (err) {
    console.error('Analytics API error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
