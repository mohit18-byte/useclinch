import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/proposals/[id] — get single proposal
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const { data: proposal, error } = await supabase
      .from("proposals")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !proposal) {
      return NextResponse.json(
        { error: "Proposal not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json(proposal);
  } catch {
    return NextResponse.json(
      { error: "Something went wrong", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

// PATCH /api/proposals/[id] — update proposal
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // ── Check if proposal is accepted (locked) ──
    const { data: existing, error: fetchErr } = await supabase
      .from("proposals")
      .select("status")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchErr || !existing) {
      return NextResponse.json(
        { error: "Proposal not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // If accepted, only allow status changes (e.g. marking as 'won')
    const contentFields = [
      "edited_content",
      "edited_content_json",
      "sections_config",
      "template_id",
      "theme_id",
      "amount",
      "project_title",
      "client_name",
      "client_email",
      "expires_at",
      "current_version",
      "client_seen_version",
    ];

    if (existing.status === "accepted") {
      const hasContentEdits = contentFields.some((f) => f in body);
      if (hasContentEdits) {
        return NextResponse.json(
          { error: "This proposal has been accepted and can no longer be edited.", code: "PROPOSAL_LOCKED" },
          { status: 403 }
        );
      }
    }

    const allowedFields = [...contentFields, "status"];

    const updates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in body) {
        updates[key] = body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    updates.updated_at = new Date().toISOString();

    const { data: proposal, error } = await supabase
      .from("proposals")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Proposal not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json(proposal);
  } catch {
    return NextResponse.json(
      { error: "Something went wrong", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

// DELETE /api/proposals/[id] — delete proposal
// Pass ?check=true to only check for linked invoices without deleting
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // Check ownership first
    const { data: proposal, error: fetchErr } = await supabase
      .from("proposals")
      .select("id, status")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchErr || !proposal) {
      return NextResponse.json(
        { error: "Proposal not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Check for linked invoices
    const { count } = await supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("proposal_id", id)
      .eq("user_id", user.id);

    const linkedInvoices = count || 0;

    // If ?check=true, return info without deleting
    const url = new URL(request.url);
    if (url.searchParams.get("check") === "true") {
      return NextResponse.json({
        id: proposal.id,
        status: proposal.status,
        linkedInvoices,
      });
    }

    // Delete (cascades: proposal_views + proposal_events via ON DELETE CASCADE,
    // invoices.proposal_id set to NULL via ON DELETE SET NULL)
    const { error } = await supabase
      .from("proposals")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to delete proposal", code: "INTERNAL_ERROR" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
