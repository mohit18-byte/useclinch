import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

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
      .select('id, user_id')
      .eq('hosted_token', token)
      .single();

    if (!proposal) {
      return NextResponse.json({ ok: true }); // silent 200, no info leak
    }

    // Check if viewer is the proposal owner
    let isOwnerView = false;
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.id === proposal.user_id) {
        isOwnerView = true;
      }
    } catch {
      // No auth cookie — that's fine, it's a client viewing
    }

    // Hash IP + user-agent for deduplication
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);
    const uaHash = crypto.createHash('sha256').update(userAgent).digest('hex').slice(0, 16);

    // Deduplicate: check if same visitor viewed within the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: existing } = await admin
      .from('proposal_views')
      .select('id')
      .eq('proposal_id', proposal.id)
      .eq('ip_hash', ipHash)
      .gte('viewed_at', oneHourAgo)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({ ok: true }); // already logged recently
    }

    // Insert view
    await admin.from('proposal_views').insert({
      proposal_id: proposal.id,
      ip_hash: ipHash,
      user_agent_hash: uaHash,
      is_owner_view: isOwnerView,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('View logging error:', err);
    return NextResponse.json({ ok: true }); // never fail the client
  }
}
