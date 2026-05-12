import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

interface RouteContext {
  params: Promise<{ token: string }>;
}

// POST — mark client_seen_version = current_version
export async function POST(_request: Request, context: RouteContext) {
  try {
    const { token } = await context.params;
    const admin = createServiceClient();

    const { data: proposal } = await admin
      .from('proposals')
      .select('id, current_version')
      .eq('hosted_token', token)
      .single();

    if (!proposal) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await admin
      .from('proposals')
      .update({ client_seen_version: proposal.current_version })
      .eq('id', proposal.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Mark seen error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
