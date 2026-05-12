import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// PATCH /api/invoices/[id]/edit — edit an unpaid invoice
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the invoice — must be owned by user
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('id, user_id, status')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Only unpaid invoices can be edited
    if (invoice.status !== 'unpaid') {
      return NextResponse.json(
        { error: `Cannot edit a ${invoice.status} invoice` },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { line_items, total_cents, note, due_date, client_name, client_email, payment_instructions } = body;

    // Build update object — only include fields that were provided
    const update: Record<string, unknown> = {};

    if (line_items !== undefined) {
      if (!Array.isArray(line_items) || line_items.length === 0) {
        return NextResponse.json(
          { error: 'line_items must be a non-empty array' },
          { status: 400 }
        );
      }
      update.line_items = line_items;
    }

    if (total_cents !== undefined) {
      if (typeof total_cents !== 'number' || total_cents <= 0) {
        return NextResponse.json(
          { error: 'total_cents must be a positive number' },
          { status: 400 }
        );
      }
      update.total_cents = total_cents;
    }

    if (note !== undefined) update.note = note;
    if (due_date !== undefined) update.due_date = due_date;
    if (client_name !== undefined) update.client_name = client_name;
    if (client_email !== undefined) update.client_email = client_email;
    if (payment_instructions !== undefined) update.payment_instructions = payment_instructions;

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const { data: updated, error: updateError } = await supabase
      .from('invoices')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update invoice:', updateError);
      return NextResponse.json(
        { error: 'Failed to update invoice' },
        { status: 500 }
      );
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error('Edit invoice error:', err);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
