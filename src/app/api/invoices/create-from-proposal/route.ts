import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

// POST /api/invoices/create-from-proposal — create an invoice from an accepted proposal
// Supports milestone invoicing: pass `selected_items` (indices) to invoice specific deliverables
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { proposal_id, selected_items, client_name, client_email, note, due_date, payment_instructions } = body;

    if (!proposal_id) {
      return NextResponse.json(
        { error: 'proposal_id is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Fetch proposal — must be owned by user
    const { data: proposal, error: propError } = await supabase
      .from('proposals')
      .select('id, user_id, client_name, client_email, project_title, amount, currency, status, edited_content_json, content_json')
      .eq('id', proposal_id)
      .eq('user_id', user.id)
      .single();

    if (propError || !proposal) {
      return NextResponse.json(
        { error: 'Proposal not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Status must be accepted
    if (proposal.status !== 'accepted') {
      return NextResponse.json(
        { error: 'Only accepted proposals can generate invoices', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Extract pricing from proposal content
    const content = (proposal.edited_content_json || proposal.content_json) as Record<string, unknown> | null;
    const pricing = content?.pricing as { lineItems?: Array<{ label: string; amount: number }>; total?: number } | undefined;

    let allLineItems: Array<{ label: string; amount_cents: number }> = [];

    if (pricing?.lineItems && Array.isArray(pricing.lineItems)) {
      allLineItems = pricing.lineItems.map((item: { label: string; amount: number }) => ({
        label: item.label || 'Service',
        amount_cents: typeof item.amount === 'number' ? item.amount : 0,
      }));
    }

    // Fallback: if no line items, create one from the total
    if (allLineItems.length === 0 && (proposal.amount || 0) > 0) {
      allLineItems = [{ label: proposal.project_title || 'Project', amount_cents: proposal.amount || 0 }];
    }

    // Filter to selected items if specified (milestone invoicing)
    let invoiceLineItems = allLineItems;
    if (Array.isArray(selected_items) && selected_items.length > 0) {
      invoiceLineItems = selected_items
        .filter((idx: number) => idx >= 0 && idx < allLineItems.length)
        .map((idx: number) => allLineItems[idx]);
    }

    if (invoiceLineItems.length === 0) {
      return NextResponse.json(
        { error: 'No line items selected', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const totalCents = invoiceLineItems.reduce((sum, item) => sum + item.amount_cents, 0);

    // Get user's default payment instructions (fallback)
    const { data: profile } = await supabase
      .from('profiles')
      .select('default_payment_instructions')
      .eq('id', user.id)
      .single();

    // Generate invoice number
    const admin = createServiceClient();
    const { data: invoiceNumber, error: fnError } = await admin.rpc(
      'generate_invoice_number',
      { user_uuid: user.id }
    );

    if (fnError) {
      console.error('Failed to generate invoice number:', fnError);
      return NextResponse.json(
        { error: 'Failed to generate invoice number', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }

    // Insert invoice — use form values when provided, fall back to proposal/profile defaults
    const { data: invoice, error: insertError } = await supabase
      .from('invoices')
      .insert({
        user_id: user.id,
        proposal_id: proposal.id,
        invoice_number: invoiceNumber as string,
        client_name: (client_name || proposal.client_name) as string,
        client_email: (client_email || proposal.client_email || '') as string,
        line_items: invoiceLineItems,
        total_cents: totalCents,
        currency: proposal.currency || 'USD',
        note: note !== undefined ? note : `Invoice for: ${proposal.project_title}`,
        due_date: due_date || null,
        status: 'unpaid',
        payment_method: 'manual',
        payment_instructions: payment_instructions !== undefined ? payment_instructions : (profile?.default_payment_instructions || null),
        stripe_payment_link: null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create invoice:', insertError);
      return NextResponse.json(
        { error: 'Failed to create invoice', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json(invoice, { status: 201 });
  } catch (err) {
    console.error('Create invoice from proposal error:', err);
    return NextResponse.json(
      { error: 'Something went wrong', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
