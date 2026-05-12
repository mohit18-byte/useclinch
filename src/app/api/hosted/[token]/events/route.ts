import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

interface RouteContext {
  params: Promise<{ token: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { token } = await context.params;
    const admin = createServiceClient();

    // Find proposal by token
    const { data: proposal } = await admin
      .from('proposals')
      .select('id')
      .eq('hosted_token', token)
      .single();

    if (!proposal) {
      return NextResponse.json({ ok: true }); // silent 200
    }

    // Parse event payload
    let body: { type?: string; sectionKey?: string; metadata?: Record<string, unknown> };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ ok: true }); // malformed body, ignore
    }

    const eventType = body.type;
    if (!eventType) {
      return NextResponse.json({ ok: true });
    }

    // Insert event
    await admin.from('proposal_events').insert({
      proposal_id: proposal.id,
      event_type: eventType,
      section_key: body.sectionKey || null,
      metadata: body.metadata || {},
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Event logging error:', err);
    return NextResponse.json({ ok: true }); // never fail
  }
}
