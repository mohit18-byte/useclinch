import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/clients — list all clients for authenticated user
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

    const { data: clients, error } = await supabase
      .from("clients")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch clients", code: "INTERNAL_ERROR" },
        { status: 500 }
      );
    }

    return NextResponse.json(clients);
  } catch {
    return NextResponse.json(
      { error: "Something went wrong", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

// POST /api/clients — create a new client
export async function POST(request: Request) {
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

    if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json(
        { error: "Client name is required", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const { data: client, error } = await supabase
      .from("clients")
      .insert({
        user_id: user.id,
        name: body.name.trim(),
        email: body.email?.trim() || null,
        company: body.company?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to create client", code: "INTERNAL_ERROR" },
        { status: 500 }
      );
    }

    return NextResponse.json(client, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
