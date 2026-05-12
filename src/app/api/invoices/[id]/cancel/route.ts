import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// PATCH /api/invoices/[id]/cancel — cancel an invoice
export async function PATCH(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
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

    // Fetch invoice — must be owned by user
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('id, user_id, status')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    if (invoice.status === 'cancelled') {
      return NextResponse.json({ ok: true, alreadyCancelled: true });
    }

    if (invoice.status === 'paid') {
      return NextResponse.json(
        { error: 'Cannot cancel a paid invoice', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const { data: updated, error: updateError } = await supabase
      .from('invoices')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to cancel invoice:', updateError);
      return NextResponse.json(
        { error: 'Failed to cancel invoice', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error('Cancel invoice error:', err);
    return NextResponse.json(
      { error: 'Something went wrong', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
