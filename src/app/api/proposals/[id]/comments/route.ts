import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ── GET — list all comments for a proposal (authenticated freelancer) ──

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createServiceClient();

    // Verify ownership
    const { data: proposal } = await admin
      .from('proposals')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (!proposal || proposal.user_id !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const { data: comments } = await admin
      .from('proposal_comments')
      .select('*')
      .eq('proposal_id', id)
      .order('created_at', { ascending: true });

    return NextResponse.json({ comments: comments || [] });
  } catch (err) {
    console.error('Get comments error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// ── PATCH — mark all comments as read ──

export async function PATCH(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createServiceClient();

    // Verify ownership
    const { data: proposal } = await admin
      .from('proposals')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (!proposal || proposal.user_id !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await admin
      .from('proposal_comments')
      .update({ is_read: true })
      .eq('proposal_id', id)
      .eq('is_read', false);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Mark comments read error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
