import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// PATCH /api/invoices/[id]/mark-paid — mark invoice as paid
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
      .select('id, user_id, invoice_number, client_name, client_email, total_cents, currency, status')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    if (invoice.status === 'paid') {
      return NextResponse.json({ ok: true, alreadyPaid: true });
    }

    if (invoice.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Cannot mark a cancelled invoice as paid', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Update status
    const paidAt = new Date().toISOString();
    const { data: updated, error: updateError } = await supabase
      .from('invoices')
      .update({
        status: 'paid',
        paid_at: paidAt,
        updated_at: paidAt,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to mark invoice as paid:', updateError);
      return NextResponse.json(
        { error: 'Failed to update invoice', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }

    // Send notification email to client (fire and forget)
    try {
      const resendKey = process.env.RESEND_API_KEY;
      if (resendKey && invoice.client_email) {
        const resend = new Resend(resendKey);
        const formattedTotal = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: invoice.currency || 'USD',
        }).format(invoice.total_cents / 100);

        await resend.emails.send({
          from: 'Clinch <notifications@useclinch.space>',
          to: invoice.client_email,
          subject: `Your invoice ${invoice.invoice_number} has been marked as paid`,
          html: `
            <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 500px; margin: 0 auto; padding: 2rem;">
              <h2 style="color: #111; font-size: 1.3rem; margin-bottom: 0.5rem;">
                Payment Confirmed ✓
              </h2>
              <p style="color: #444; font-size: 0.95rem; line-height: 1.6;">
                Invoice <strong>${invoice.invoice_number}</strong> for <strong>${formattedTotal}</strong>
                has been marked as paid.
              </p>
              <p style="color: #444; font-size: 0.95rem; line-height: 1.6;">
                Thank you for your payment, ${invoice.client_name}.
              </p>
              <p style="color: #999; font-size: 0.8rem; margin-top: 2rem;">
                Sent by Clinch — AI-powered proposals for freelancers.
              </p>
            </div>
          `,
        });
      }
    } catch (emailErr) {
      console.error('Failed to send payment confirmation email:', emailErr);
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error('Mark paid error:', err);
    return NextResponse.json(
      { error: 'Something went wrong', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
