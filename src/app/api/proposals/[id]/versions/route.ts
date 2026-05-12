import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ── GET — list all versions ──

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
      .select('id, user_id, current_version')
      .eq('id', id)
      .single();

    if (!proposal || proposal.user_id !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const { data: versions } = await admin
      .from('proposal_versions')
      .select('id, version_number, change_summary, changed_sections, created_at')
      .eq('proposal_id', id)
      .order('version_number', { ascending: false });

    return NextResponse.json({
      currentVersion: proposal.current_version,
      versions: versions || [],
    });
  } catch (err) {
    console.error('List versions error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// ── POST — restore a specific version ──

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { version_id } = body;

    if (!version_id) {
      return NextResponse.json({ error: 'version_id is required' }, { status: 400 });
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

    // Fetch version
    const { data: version } = await admin
      .from('proposal_versions')
      .select('content_snapshot, sections_config_snapshot, version_number')
      .eq('id', version_id)
      .eq('proposal_id', id)
      .single();

    if (!version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    // Restore content
    await admin
      .from('proposals')
      .update({
        edited_content_json: version.content_snapshot,
        sections_config: version.sections_config_snapshot,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    return NextResponse.json({
      ok: true,
      restoredVersion: version.version_number,
      content: version.content_snapshot,
      sectionsConfig: version.sections_config_snapshot,
    });
  } catch (err) {
    console.error('Restore version error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
