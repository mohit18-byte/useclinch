import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
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

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Profile not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json(profile);
  } catch {
    return NextResponse.json(
      { error: "Something went wrong", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
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

    // Only allow updating known fields
    const allowedFields = [
      "full_name",
      "bio",
      "professional_title",
      "services",
      "hourly_rate",
      "logo_url",
      "brand_color",
      "onboarding_completed",
      "default_payment_instructions",
      "default_currency",
      "portfolio_url",
      "past_projects",
    ];

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

    const { data: profile, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      console.error('[PATCH /api/profile] Supabase error:', JSON.stringify(error, null, 2));
      return NextResponse.json(
        { error: `Failed to update profile: ${error.message}`, code: "INTERNAL_ERROR" },
        { status: 500 }
      );
    }

    return NextResponse.json(profile);
  } catch {
    return NextResponse.json(
      { error: "Something went wrong", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
