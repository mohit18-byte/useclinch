import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!["image/png", "image/jpeg"].includes(file.type)) {
      return NextResponse.json(
        {
          error: "Invalid file type. PNG and JPG only.",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        {
          error: "File too large. Maximum size is 2MB.",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    const ext = file.type === "image/png" ? "png" : "jpg";
    const filePath = `${user.id}/logo.${ext}`;

    // Convert file to Uint8Array (works in all runtimes)
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from("logos")
      .upload(filePath, uint8Array, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase storage upload error:", uploadError);
      return NextResponse.json(
        {
          error: `Upload failed: ${uploadError.message}`,
          code: "INTERNAL_ERROR",
        },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("logos").getPublicUrl(filePath);

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error("Upload route error:", err);
    return NextResponse.json(
      { error: "Something went wrong", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
