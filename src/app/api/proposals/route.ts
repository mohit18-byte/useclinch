import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/proposals — list all proposals
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

    const { data: proposals, error } = await supabase
      .from("proposals")
      .select("id, client_name, client_email, project_title, amount, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch proposals", code: "INTERNAL_ERROR" },
        { status: 500 }
      );
    }

    return NextResponse.json(proposals);
  } catch {
    return NextResponse.json(
      { error: "Something went wrong", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
