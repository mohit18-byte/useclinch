import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// PATCH /api/invoices/[id]/claim-payment
// Public endpoint — authenticated only by the hosted_token (in request body).
// Called when the client clicks "I've Made Payment" on the hosted invoice page.
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const { hosted_token } = body as { hosted_token?: string };

    if (!hosted_token) {
      return NextResponse.json(
        { error: 'Missing hosted_token', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const supabase = createServiceClient();

    // Validate: invoice must exist, match both the id and hosted_token
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('id, hosted_token, status, invoice_number, client_name, user_id')
      .eq('id', id)
      .eq('hosted_token', hosted_token)
      .single();

    if (fetchError || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Only allow claiming on unpaid invoices
    if (invoice.status === 'paid') {
      return NextResponse.json({ ok: true, alreadyPaid: true });
    }

    if (invoice.status === 'cancelled') {
      return NextResponse.json(
        { error: 'This invoice has been cancelled', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (invoice.status === 'payment_claimed') {
      // Idempotent — already claimed, just return ok
      return NextResponse.json({ ok: true, alreadyClaimed: true });
    }

    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        status: 'payment_claimed',
        payment_claimed_at: now,
        updated_at: now,
      })
      .eq('id', id);

    if (updateError) {
      console.error('Failed to claim payment:', updateError);
      return NextResponse.json(
        { error: 'Failed to update invoice', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Claim payment error:', err);
    return NextResponse.json(
      { error: 'Something went wrong', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
