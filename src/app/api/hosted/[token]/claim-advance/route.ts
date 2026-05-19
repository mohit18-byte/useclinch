import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

// POST /api/hosted/[token]/claim-advance
// Called by the client when they click "I Have Paid" on the hosted proposal page.
// No auth — public route, token-gated.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = createServiceClient();

    // Fetch proposal by token
    const { data: proposal, error: fetchErr } = await supabase
      .from('proposals')
      .select('*')
      .eq('hosted_token', token)
      .single();

    if (fetchErr || !proposal) {
      return NextResponse.json(
        { error: 'Proposal not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Guards
    if (!proposal.advance_payment_enabled) {
      return NextResponse.json(
        { error: 'Advance payment is not enabled for this proposal', code: 'NOT_ENABLED' },
        { status: 400 }
      );
    }

    if (proposal.advance_payment_claimed) {
      // Already claimed — return ok so the UI can proceed
      return NextResponse.json({ ok: true, alreadyClaimed: true });
    }

    // Calculate advance amount in cents
    let advanceAmountCents: number;
    if (proposal.advance_payment_percent != null) {
      const totalCents = proposal.amount ?? 0;
      advanceAmountCents = Math.round(totalCents * proposal.advance_payment_percent / 100);
    } else if (proposal.advance_payment_amount != null) {
      advanceAmountCents = proposal.advance_payment_amount;
    } else {
      return NextResponse.json(
        { error: 'Advance payment amount is not configured', code: 'MISCONFIGURED' },
        { status: 400 }
      );
    }

    if (advanceAmountCents <= 0) {
      return NextResponse.json(
        { error: 'Advance payment amount must be greater than zero', code: 'INVALID_AMOUNT' },
        { status: 400 }
      );
    }

    // Generate invoice number via DB function
    const { data: invoiceNumber, error: numErr } = await supabase.rpc(
      'generate_invoice_number',
      { user_uuid: proposal.user_id }
    );

    if (numErr || !invoiceNumber) {
      console.error('Failed to generate invoice number:', numErr);
      return NextResponse.json(
        { error: 'Failed to generate invoice number', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }

    // Build payment instructions for invoice
    const paymentInstructions =
      proposal.advance_payment_type === 'instructions'
        ? (proposal.advance_payment_value ?? null)
        : null;
    const stripePaymentLink =
      proposal.advance_payment_type === 'link'
        ? (proposal.advance_payment_value ?? null)
        : null;

    // Create the invoice with payment_claimed status
    const { data: invoice, error: invoiceErr } = await supabase
      .from('invoices')
      .insert({
        user_id: proposal.user_id,
        proposal_id: proposal.id,
        invoice_number: invoiceNumber as string,
        client_name: proposal.client_name,
        client_email: proposal.client_email ?? '',
        line_items: [
          {
            label: `Advance Payment — ${proposal.project_title}`,
            amount_cents: advanceAmountCents,
          },
        ],
        total_cents: advanceAmountCents,
        currency: proposal.currency ?? 'USD',
        note: `Advance payment claimed by client on ${new Date().toLocaleDateString()}`,
        status: 'payment_claimed',
        payment_method: 'manual',
        payment_instructions: paymentInstructions,
        stripe_payment_link: stripePaymentLink,
        payment_claimed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (invoiceErr || !invoice) {
      console.error('Failed to create advance invoice:', invoiceErr);
      return NextResponse.json(
        { error: 'Failed to create invoice', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }

    // Mark proposal as advance payment claimed
    const { error: updateErr } = await supabase
      .from('proposals')
      .update({
        advance_payment_claimed: true,
        advance_payment_invoice_id: invoice.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', proposal.id);

    if (updateErr) {
      console.error('Failed to update proposal:', updateErr);
      // Invoice was created — don't fail silently, but return ok
      // The invoice exists which is the source of truth
    }

    return NextResponse.json({ ok: true, invoiceId: invoice.id });
  } catch (err) {
    console.error('Claim advance error:', err);
    return NextResponse.json(
      { error: 'Something went wrong', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
