import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOpenAI } from "@/lib/openai";
import { buildProposalPrompt } from "@/lib/proposal-prompt";
import { validateProposalContent } from "@/lib/proposal-validator";
import type { SectionsConfig } from "@/templates/types";

const TIER_LIMITS: Record<string, number> = {
  free: 5,
  pro: 999999,
};

// ── Default sections config ─────────────────────────────────────
// Cover first (locked), CTA last (locked), FAQ off, rest on.

const DEFAULT_SECTIONS_CONFIG: SectionsConfig = {
  order: [
    "cover",
    "problem",
    "solution",
    "approach",
    "deliverables",
    "timeline",
    "pricing",
    "about",
    "faq",
    "cta",
  ],
  visibility: {
    cover: true,
    problem: true,
    solution: true,
    approach: true,
    deliverables: true,
    timeline: true,
    pricing: true,
    about: true,
    faq: false, // off by default per plan
    cta: true,
  },
};

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

    // Fetch user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Paywall check — atomic counter
    const limit = TIER_LIMITS[profile.subscription_tier] ?? 5;
    const { data: counterResult } = await supabase.rpc(
      "check_and_increment_proposal_count",
      { p_user_id: user.id, p_limit: limit }
    );

    if (counterResult && !counterResult[0]?.allowed) {
      return NextResponse.json(
        {
          error:
            "Proposal limit reached. Upgrade to Pro for unlimited proposals.",
          code: "LIMIT_EXCEEDED",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Build prompts using the new 10-section format
    const { systemPrompt, userPrompt } = buildProposalPrompt(
      {
        client_name: body.client_name,
        client_company: body.client_company,
        client_email: body.client_email,
        project_type: body.project_type,
        job_description: body.job_description,
        deliverables: body.deliverables,
        budget: body.budget,
        timeline: body.timeline,
        tone: body.tone,
      },
      {
        full_name: profile.full_name,
        bio: profile.bio,
        services: profile.services || [],
        hourly_rate: profile.hourly_rate,
        portfolio_url: profile.portfolio_url || null,
        past_projects: profile.past_projects || [],
      }
    );

    // Generate + validate with retry
    const contentResult = await generateWithRetry(systemPrompt, userPrompt);

    if (!contentResult.success) {
      console.error("AI generation failed:", contentResult.error);
      return NextResponse.json(
        {
          error: "AI generation failed. Please try again.",
          code: "AI_ERROR",
        },
        { status: 500 }
      );
    }

    const contentJson = contentResult.data!;

    // Build project title
    const projectTitle =
      contentJson.cover.title ||
      (body.project_type && body.client_name
        ? `${body.project_type} for ${body.client_name}`
        : body.client_name
          ? `Proposal for ${body.client_name}`
          : "New Proposal");

    // Generate hosted token
    const hostedToken = crypto.randomUUID();

    // Save to database with new column structure
    const { data: proposal, error } = await supabase
      .from("proposals")
      .insert({
        user_id: user.id,
        client_id: body.client_id || null,
        client_name: body.client_name || "Unknown Client",
        client_email: body.client_email || null,
        project_title: projectTitle,
        project_type: body.project_type || null,
        tone: body.tone || "formal",
        input_job_description: body.job_description || null,
        input_deliverables: body.deliverables || [],
        input_budget: body.budget
          ? Math.round(parseFloat(body.budget) * 100)
          : null,
        input_timeline: body.timeline || null,
        // ── NEW: 10-section content ──
        content_json: contentJson,
        edited_content_json: structuredClone(contentJson),
        sections_config: DEFAULT_SECTIONS_CONFIG,
        template_id: "dark-editorial",
        theme_id: "midnight",
        hosted_token: hostedToken,
        // ──────────────────────────────
        status: "draft",
        amount: contentJson.pricing.total || (body.budget
          ? Math.round(parseFloat(body.budget) * 100)
          : null),
        currency: "usd",
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to save proposal:", error);
      return NextResponse.json(
        { error: "Failed to save proposal", code: "INTERNAL_ERROR" },
        { status: 500 }
      );
    }

    return NextResponse.json(proposal, { status: 201 });
  } catch (err) {
    console.error("Generate proposal error:", err);
    return NextResponse.json(
      { error: "Something went wrong", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

// ── Generate with retry ─────────────────────────────────────────
// Calls OpenAI, validates with Zod. Retries once on failure.

async function generateWithRetry(
  systemPrompt: string,
  userPrompt: string
): Promise<{
  success: boolean;
  data?: ReturnType<typeof validateProposalContent>["data"];
  error?: string;
}> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const completion = await getOpenAI().chat.completions.create({
        model: "gpt-4o",
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 4000,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });

      const raw = completion.choices[0]?.message?.content;
      if (!raw) {
        console.error(`Attempt ${attempt + 1}: Empty AI response`);
        continue;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        console.error(`Attempt ${attempt + 1}: Invalid JSON from AI`);
        continue;
      }

      const validation = validateProposalContent(parsed);
      if (validation.success) {
        return { success: true, data: validation.data };
      }

      console.error(
        `Attempt ${attempt + 1}: Validation failed — ${validation.error}`
      );
    } catch (err) {
      console.error(`Attempt ${attempt + 1}: OpenAI call failed —`, err);
    }
  }

  return { success: false, error: "Generation failed after 2 attempts" };
}
