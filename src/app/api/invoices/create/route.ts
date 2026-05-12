import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

// POST /api/invoices/create — Create a standalone invoice
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

    // Validation
    const { client_name, client_email, line_items, total_cents, currency, note, due_date, payment_method, payment_instructions, proposal_id } = body;

    if (!client_name || typeof client_name !== 'string' || client_name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Client name is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (!client_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client_email)) {
      return NextResponse.json(
        { error: 'Valid client email is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (!Array.isArray(line_items) || line_items.length === 0) {
      return NextResponse.json(
        { error: 'At least one line item is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    for (const item of line_items) {
      if (!item.label || typeof item.amount_cents !== 'number' || item.amount_cents < 0) {
        return NextResponse.json(
          { error: 'Each line item must have a label and valid amount', code: 'VALIDATION_ERROR' },
          { status: 400 }
        );
      }
    }

    if (typeof total_cents !== 'number' || total_cents <= 0) {
      return NextResponse.json(
        { error: 'Total must be greater than 0', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

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

    // Insert invoice
    const { data: invoice, error: insertError } = await supabase
      .from('invoices')
      .insert({
        user_id: user.id,
        invoice_number: invoiceNumber as string,
        client_name: client_name.trim(),
        client_email: client_email.trim(),
        line_items,
        total_cents,
        currency: currency || 'USD',
        note: note || null,
        due_date: due_date || null,
        status: 'unpaid',
        payment_method: payment_method || 'manual',
        payment_instructions: payment_instructions || null,
        stripe_payment_link: null,
        proposal_id: proposal_id || null,
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
    console.error('Create invoice error:', err);
    return NextResponse.json(
      { error: 'Something went wrong', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// GET /api/invoices/create — not supported
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' },
    { status: 405 }
  );
}
