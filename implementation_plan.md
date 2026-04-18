# Clinch — Master Implementation Plan

> **Purpose:** This document is the single source of truth for building Clinch. It is written to be handed directly to an AI coding agent for execution. Every section is ordered by dependency. Nothing is optional in Phase 1.

---

## Table of Contents

1. [Upfront Technical Decisions](#1-upfront-technical-decisions)
2. [Phase 1 — Week 1: Foundation](#2-phase-1--week-1-foundation)
3. [Phase 1 — Week 2: Core Product](#3-phase-1--week-2-core-product)
4. [Phase 1 — Week 3: Monetisation & Polish](#4-phase-1--week-3-monetisation--polish)
5. [Phase 2 — Feature Briefs](#5-phase-2--feature-briefs)

---

## 1. Upfront Technical Decisions

### 1.0 API Error Contract

> [!IMPORTANT]
> **All API routes must return a consistent error shape on failure.** This is mandatory and non-negotiable — inconsistent error formats create debugging nightmares and break the UI error-handling layer.

**Standard error response body:**
```json
{ "error": "Human-readable message", "code": "SCREAMING_SNAKE_CASE_CODE" }
```

**HTTP status codes:**
| Status | When to use |
|--------|------------|
| `400` | Validation errors (bad input, missing fields) |
| `401` | No valid session / unauthenticated |
| `403` | Authenticated but not allowed (paywall block, wrong tier) |
| `404` | Resource not found |
| `500` | Unexpected server errors |

**Common error codes:**
- `VALIDATION_ERROR` — Zod parse failure
- `UNAUTHORIZED` — no session
- `LIMIT_EXCEEDED` — free tier proposal cap reached
- `NOT_FOUND` — resource doesn't exist or doesn't belong to user
- `STRIPE_NOT_CONNECTED` — Stripe Connect not onboarded
- `INTERNAL_ERROR` — catch-all for unexpected failures

Every API route must wrap its handler in a try-catch. The catch block logs the error and returns `{ error: 'Something went wrong', code: 'INTERNAL_ERROR' }` with status 500. Never leak raw error messages or stack traces to the client.

---

These decisions **must** be locked before any code is written. They affect every layer of the application.

### 1.1 Project Initialisation & Folder Structure

**Styling approach:** All component styling uses **inline Tailwind CSS classes** on shadcn components. No separate CSS files for component-level styles. The only CSS files are `globals.css` (shadcn theme variables + font setup) and Tailwind's base styles. The visual source of truth is `DESIGN.md` in the project root.

Initialise with `npx -y create-next-app@latest ./` using the following flags:
- App Router (not Pages Router)
- TypeScript
- Tailwind CSS
- ESLint
- `src/` directory enabled
- Import alias `@/*`

After init, install core dependencies:
```
shadcn/ui (via npx shadcn@latest init)
@supabase/supabase-js
@supabase/ssr
openai
@react-pdf/renderer (component-based PDF generation, serverless-native)
stripe
resend
zod
zustand (lightweight client state for form wizards)
react-hook-form (proposal/invoice forms)
date-fns
lucide-react (icon set, ships with shadcn)
rate-limiter-flexible (API rate limiting)
```

Target folder structure:

```
src/
├── app/
│   ├── (marketing)/         # Public pages (no auth required)
│   │   ├── layout.tsx       # Marketing layout (navbar + footer)
│   │   └── page.tsx         # Homepage / landing page
│   ├── (auth)/              # Auth route group (no layout chrome)
│   │   ├── login/
│   │   ├── signup/
│   │   └── callback/        # Supabase OAuth callback
│   ├── (app)/               # Authenticated app route group
│   │   ├── layout.tsx       # Sidebar + topbar shell
│   │   ├── dashboard/
│   │   ├── proposals/
│   │   │   ├── page.tsx     # List view
│   │   │   ├── new/         # Create flow
│   │   │   └── [id]/        # View/edit single proposal
│   │   ├── invoices/
│   │   │   ├── page.tsx
│   │   │   ├── new/
│   │   │   └── [id]/
│   │   ├── clients/
│   │   ├── settings/
│   │   │   ├── profile/
│   │   │   ├── billing/
│   │   │   └── integrations/  # Stripe Connect
│   │   └── onboarding/       # Post-signup wizard
│   ├── api/
│   │   ├── auth/
│   │   │   └── callback/route.ts
│   │   ├── proposals/
│   │   │   ├── route.ts        # CRUD
│   │   │   ├── generate/route.ts  # AI generation
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       └── pdf/route.ts   # PDF generation
│   │   ├── invoices/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       └── pdf/route.ts
│   │   ├── clients/route.ts
│   │   ├── profile/route.ts
│   │   ├── stripe/
│   │   │   ├── connect/route.ts       # Stripe Connect OAuth
│   │   │   ├── payment-link/route.ts  # Create payment link
│   │   │   ├── checkout/route.ts      # PropAI subscription
│   │   │   └── webhook/route.ts       # Stripe webhooks
│   │   └── upload/route.ts            # Logo upload to Supabase Storage
│   └── layout.tsx          # Root layout (fonts, providers)
├── components/
│   ├── ui/                 # shadcn primitives (button, input, card, etc.)
│   ├── layout/             # Sidebar, Topbar, MobileNav
│   ├── proposals/          # ProposalForm, ProposalEditor, ProposalCard
│   ├── invoices/           # InvoiceForm, LineItemRow, InvoiceCard
│   ├── clients/            # ClientForm, ClientSelect
│   ├── dashboard/          # StatCard, RecentActivity
│   ├── onboarding/         # Step components
│   └── shared/             # LogoUploader, ColorPicker, StatusBadge, PDFButton
├── lib/
│   ├── supabase/
│   │   ├── client.ts       # Browser client
│   │   ├── server.ts       # Server client (cookies-based)
│   │   └── middleware.ts   # Auth middleware helper
│   ├── openai.ts           # OpenAI client + prompt builder
│   ├── pdf/
│   │   ├── proposal.tsx    # Proposal PDF React component + generator
│   │   ├── invoice.tsx     # Invoice PDF React component + generator
│   │   └── shared.tsx      # Shared PDF components (header, footer, styles)
│   ├── rate-limit.ts       # Rate limiter configuration + helpers
│   ├── email/
│   │   ├── templates.ts    # Email HTML templates
│   │   └── send.ts         # Resend email sending helpers
│   ├── stripe.ts           # Stripe client + helpers
│   ├── resend.ts           # Email client
│   ├── validators/         # Zod schemas for all entities
│   │   ├── proposal.ts
│   │   ├── invoice.ts
│   │   ├── client.ts
│   │   └── profile.ts
│   └── utils.ts            # Formatters, currency, date helpers
├── hooks/                  # Custom React hooks
│   ├── use-profile.ts
│   ├── use-subscription.ts
│   └── use-stripe-connect.ts
├── types/                  # TypeScript type definitions
│   └── index.ts            # All entity types
└── middleware.ts            # Next.js middleware (auth guard)
```

> [!IMPORTANT]
> **Why this structure matters:** Route groups `(auth)`, `(marketing)`, and `(app)` allow different layouts — auth pages have no sidebar, marketing pages have a navbar + footer, app pages have the sidebar shell. All API routes live under `app/api/` as serverless functions. The `lib/` directory isolates all third-party integrations so they can be unit-tested and swapped independently.

> [!IMPORTANT]
> **Design reference:** `DESIGN.md` in the project root is the visual source of truth for all UI work. It contains the full Linear-inspired colour palette, typography hierarchy, component styling rules, and do's/don'ts. Every page and component must follow it. See §1.10 for the Tailwind/shadcn configuration derived from it.

---

### 1.2 Authentication Strategy

**Provider:** Supabase Auth with `@supabase/ssr` for Next.js App Router integration.

**Flow:**
1. User hits `/login`. Presented with email/password form and "Sign in with Google" button.
2. Email sign-up sends a confirmation email (Supabase built-in). User clicks link → redirected to `/callback` → session created → redirect to `/onboarding` (if first login) or `/dashboard` (if returning).
3. Google OAuth: Supabase redirects to Google consent → callback to `/api/auth/callback` → exchange code for session → same redirect logic.
4. **Middleware (`middleware.ts`):** Runs on every `/(app)` route. Checks for valid Supabase session. If none, redirects to `/login`. Also checks if the user has completed onboarding (query the `profiles` table for `onboarding_completed = true`). If not, redirects to `/onboarding`. **Edge case:** If `onboarding_completed = true` and the user navigates directly to `/onboarding`, redirect immediately to `/dashboard`. This prevents re-triggering onboarding for existing users.
5. **Server-side auth:** Every API route creates a Supabase server client from cookies. Extracts `user.id` from the session. All database queries are scoped to this user ID — this is the authorisation model.

**Key decisions:**
- No custom JWT handling. Supabase manages tokens, refresh, and session cookies.
- Row Level Security (RLS) is enabled on every table. Policies enforce `auth.uid() = user_id` for all CRUD operations. This is the security boundary — even if an API bug leaks, RLS prevents cross-user data access.
- `profiles` table is created manually (not auto-generated by Supabase Auth). It references `auth.users(id)` as a foreign key.

---

### 1.3 Database Schema Direction

> [!NOTE]
> The agent should create a Supabase migration file for each table group. Use `supabase init` and `supabase migration new <name>` to generate timestamped migration files. All tables must have RLS enabled with appropriate policies.

**Tables (in creation order, respecting foreign keys):**

#### `profiles`
- `id` → UUID, PK, references `auth.users(id)` on delete cascade
- `full_name` → text, not null
- `bio` → text
- `services` → text array
- `hourly_rate` → integer (cents)
- `logo_url` → text (Supabase Storage public URL)
- `brand_color` → text (hex string, e.g. `#6366F1`)
- `onboarding_completed` → boolean, default false
- `stripe_customer_id` → text (for PropAI subscription billing)
- `stripe_connect_account_id` → text (for generating payment links)
- `stripe_connect_onboarded` → boolean, default false
- `subscription_tier` → text, default `'free'`, check constraint (`'free'`, `'pro'`, `'agency'`)
- `subscription_status` → text, default `'active'`
- `proposals_this_month` → integer, default 0
- `proposals_month_reset` → date (first day of current month, used to reset counter).
- `created_at`, `updated_at` → timestamptz

#### `clients`
- `id` → UUID, PK, default `gen_random_uuid()`
- `user_id` → UUID, references `profiles(id)` on delete cascade
- `name` → text, not null
- `email` → text
- `company` → text
- `created_at` → timestamptz

#### `proposals`
- `id` → UUID, PK
- `user_id` → UUID, references `profiles(id)`
- `client_id` → UUID, references `clients(id)`, nullable (for typed-in clients)
- `client_name` → text (denormalised for display, always populated)
- `client_email` → text
- `project_title` → text, not null
- `project_type` → text
- `tone` → text, check (`'formal'`, `'friendly'`, `'bold'`)
- `input_job_description` → text (raw pasted JD, nullable)
- `input_deliverables` → text array
- `input_budget` → integer (cents)
- `input_timeline` → text
- `generated_content` → jsonb (structured AI output: `{ hook, problemRestatement, solution, deliverables, timeline, pricing, callToAction }`)
- `edited_content` → jsonb (user's edited version, same shape — this is what gets exported to PDF)
- `status` → text, default `'draft'`, check (`'draft'`, `'sent'`, `'viewed'`, `'won'`, `'lost'`)
- `amount` → integer (cents, final quoted amount)
- `currency` → text, default `'usd'`
- `created_at`, `updated_at` → timestamptz

#### `invoices`
- `id` → UUID, PK
- `user_id` → UUID, references `profiles(id)`
- `client_id` → UUID, references `clients(id)`, nullable
- `proposal_id` → UUID, references `proposals(id)`, nullable (link to source proposal)
- `client_name` → text
- `client_email` → text
- `invoice_number` → text, not null (format: `INV-001`, auto-incremented per user)
- `line_items` → jsonb array (`[{ description, quantity, unitPrice }]`)
- `subtotal` → integer (cents)
- `tax_percent` → numeric(5,2), nullable
- `tax_amount` → integer (cents)
- `discount_type` → text, check (`'fixed'`, `'percent'`), nullable
- `discount_value` → numeric, nullable
- `discount_amount` → integer (cents)
- `total` → integer (cents)
- `currency` → text, default `'usd'`
- `stripe_payment_link_id` → text, nullable
- `stripe_payment_link_url` → text, nullable
- `payment_status` → text, default `'unpaid'`, check (`'unpaid'`, `'paid'`)
- `created_at`, `updated_at` → timestamptz

#### `invoice_sequences`
- `user_id` → UUID, PK, references `profiles(id)`
- `last_number` → integer, default 0

> Used to generate `INV-001`, `INV-002`, etc. per user. Incrementing this is done inside a Postgres function to avoid race conditions.

---

### 1.3a Proposal Counter — Postgres Function

> [!IMPORTANT]
> **The monthly proposal counter must be atomic.** Moving the reset-and-check logic into a Postgres function eliminates race conditions (e.g., two concurrent generation requests both reading `proposals_this_month = 4` and both passing the limit check, resulting in 6 proposals on a 5-proposal cap).

**Postgres function: `check_and_increment_proposal_count`**
```sql
CREATE OR REPLACE FUNCTION check_and_increment_proposal_count(
  p_user_id UUID,
  p_limit INTEGER
)
RETURNS TABLE(allowed BOOLEAN, current_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_month_reset DATE;
  v_count INTEGER;
  v_first_of_month DATE := date_trunc('month', CURRENT_DATE)::DATE;
BEGIN
  -- Lock the row to prevent concurrent reads
  SELECT proposals_month_reset, proposals_this_month
    INTO v_month_reset, v_count
    FROM profiles
    WHERE id = p_user_id
    FOR UPDATE;

  -- Reset counter if we've rolled into a new month
  IF v_month_reset IS NULL OR v_month_reset < v_first_of_month THEN
    v_count := 0;
    UPDATE profiles
      SET proposals_this_month = 0,
          proposals_month_reset = v_first_of_month
      WHERE id = p_user_id;
  END IF;

  -- Check limit
  IF v_count >= p_limit THEN
    RETURN QUERY SELECT FALSE, v_count;
    RETURN;
  END IF;

  -- Increment
  UPDATE profiles
    SET proposals_this_month = v_count + 1,
        updated_at = NOW()
    WHERE id = p_user_id;

  RETURN QUERY SELECT TRUE, v_count + 1;
END;
$$;
```

**Usage in `POST /api/proposals/generate`:**
```typescript
const { data } = await supabase.rpc('check_and_increment_proposal_count', {
  p_user_id: user.id,
  p_limit: tierLimits[profile.subscription_tier], // free=5, pro/agency=Infinity
});

if (!data[0].allowed) {
  return Response.json(
    { error: 'Proposal limit reached. Upgrade to Pro for unlimited proposals.', code: 'LIMIT_EXCEEDED' },
    { status: 403 }
  );
}
```

This replaces the naive application-level check. The `FOR UPDATE` row lock guarantees correctness under concurrency.

---

### 1.4 AI Prompt Architecture

This is the highest-leverage technical decision in the product. The prompt structure directly determines output quality.

**System prompt** (constant, stored in `lib/openai.ts`):
```
You are a senior proposal writer for freelance software developers.
You write compelling, specific, and professional project proposals
that help developers win client contracts.

You always output valid JSON with exactly these keys:
- hook: A strong opening paragraph (2-3 sentences) that demonstrates
  understanding of the client's needs and positions the developer as
  the ideal fit.
- problemRestatement: A concise restatement of the client's core
  challenge in the developer's own words (2-3 sentences).
- solution: A detailed description of the proposed technical approach
  (3-5 sentences). Be specific about technologies and methodology.
- deliverables: An array of strings, each a clear deliverable with
  a brief description.
- timeline: A structured timeline broken into milestones with
  estimated durations.
- pricing: A pricing summary including the total amount and what it
  includes. Reference the budget provided.
- callToAction: A confident closing paragraph (2-3 sentences) that
  creates urgency and makes it easy for the client to say yes.

Adapt your tone based on the tone parameter provided (formal,
friendly, or bold). Do not include any markdown formatting in the
values. Write in plain text only.
```

**User prompt** (dynamic, constructed per-request):
```
Generate a project proposal with the following context:

ABOUT THE DEVELOPER:
Name: {profile.full_name}
Bio: {profile.bio}
Services: {profile.services.join(', ')}
Hourly Rate: ${profile.hourly_rate}/hr

PROJECT DETAILS:
Client: {input.client_name} ({input.client_company})
Project Type: {input.project_type}
Deliverables: {input.deliverables.join(', ')}
Budget: ${input.budget}
Timeline: {input.timeline}
Tone: {input.tone}

{If job_description is provided:}
RAW JOB DESCRIPTION:
{input.job_description}

Use the job description as the primary source of truth for
understanding the project scope. Extract and infer any missing
details from it.
```

**Implementation notes:**
- Use `openai.chat.completions.create()` with `model: 'gpt-4o-mini'`, `response_format: { type: 'json_object' }` to guarantee valid JSON output.
- Set `temperature: 0.7` for creative variety while maintaining coherence.
- Set `max_tokens: 2000` — proposals should be thorough but not bloated.
- Wrap the API call in a try-catch. If JSON parsing fails, retry once. If it fails again, return a 500 with a user-friendly error.
- **Cost note:** GPT-4o mini is extremely cheap (~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens). At ~1500 tokens per proposal, the cost per generation is approximately $0.001. This is negligible and does not need usage-based billing.
- **Clinch branding in prompts:** Replace any mention of "PropAI" in system prompts or watermark text with "Clinch".

---

### 1.5 PDF Generation Strategy

**Decision: Server-side generation using `@react-pdf/renderer` inside API routes.**

**Why `@react-pdf/renderer`:**
- **Component-based:** PDFs are defined as React components with JSX — the same mental model as the rest of the app. Text wrapping, pagination, and Flexbox layout are handled automatically.
- **Serverless-native:** Zero external binaries. No headless browser. Works on Vercel's serverless functions out of the box with minimal cold starts.
- **Rich output:** Supports custom fonts (`.ttf`/`.otf`), embedded images (PNG/JPG), clickable `<Link>` annotations, styled tables, and dynamic multi-page layouts — all the things needed for premium proposals and invoices.
- **Premium quality:** The Yoga layout engine (same as React Native) produces clean, consistent layouts across all environments. No browser rendering inconsistencies.

**Why NOT pdf-lib:**
- `pdf-lib` has no auto-wrapping, no layout engine, no pagination. Every line of text must be manually positioned with x/y coordinates. Building rich multi-page proposals would take 3–5x longer and produce inferior results.

**Why NOT Puppeteer/Playwright:**
- Requires bundling a headless Chromium binary (~280MB). Exceeds Vercel's 50MB compressed bundle limit without special configuration (`@sparticuz/chromium-min`).
- Slow cold starts (3-8 seconds), high memory consumption, and brittle in serverless environments.
- Overkill for structured documents like proposals and invoices.

**Architecture:**
- Two API routes: `GET /api/proposals/[id]/pdf` and `GET /api/invoices/[id]/pdf`.
- Each route fetches the entity from Supabase, loads the user's profile (logo, brand color), renders the React PDF component with `renderToBuffer()`, and returns the binary response.
- **PDF component structure:**
  ```
  lib/pdf/
  ├── shared.tsx       # Shared components: Header, Footer, Watermark, Divider, styles
  ├── proposal.tsx     # <ProposalDocument /> — full proposal PDF component
  └── invoice.tsx      # <InvoiceDocument /> — full invoice PDF component
  ```

**Font strategy:**
- Register Inter (Regular, Medium, Bold, SemiBold) using `Font.register()` from `@react-pdf/renderer`.
- Store `.ttf` files in `public/fonts/`. Reference by absolute URL in production, relative path in dev.
- Use `fontFamily: 'Inter'` throughout all PDF styles.

**Brand colour integration:**
- Parse `profile.brand_color` hex string.
- Use it for: section heading text, horizontal rule strokes, the "Pay Now" button background, and accent borders.
- Passed as a prop to all PDF components.

**Logo embedding:**
- Fetch the logo URL from `profile.logo_url`.
- Use `@react-pdf/renderer`'s `<Image src={logoUrl} />` component. It natively supports PNG and JPG.
- Set fixed dimensions (e.g., `width: 80, height: 80`) with `objectFit: 'contain'`.

**Implementation example — Proposal PDF component:**
```tsx
import { Document, Page, View, Text, Image, Link, Font, StyleSheet } from '@react-pdf/renderer';

Font.register({
  family: 'Inter',
  fonts: [
    { src: '/fonts/Inter-Regular.ttf', fontWeight: 'normal' },
    { src: '/fonts/Inter-Bold.ttf', fontWeight: 'bold' },
    { src: '/fonts/Inter-SemiBold.ttf', fontWeight: 600 },
  ],
});

const ProposalDocument = ({ proposal, profile }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header with logo + developer info */}
      <View style={styles.header}>
        {profile.logo_url && <Image src={profile.logo_url} style={styles.logo} />}
        <View>
          <Text style={styles.name}>{profile.full_name}</Text>
        </View>
      </View>

      {/* Proposal content sections */}
      <View style={styles.section}>
        <Text style={[styles.heading, { color: profile.brand_color }]}>THE CHALLENGE</Text>
        <Text style={styles.body}>{proposal.edited_content.problemRestatement}</Text>
      </View>

      {/* ... remaining sections: solution, deliverables, timeline, pricing, CTA */}

      {/* Footer with watermark for free tier */}
      {profile.subscription_tier === 'free' && (
        <Text style={styles.watermark}>Made with Clinch</Text>
      )}
    </Page>
  </Document>
);
```

**API route example:**
```typescript
import { renderToBuffer } from '@react-pdf/renderer';

export async function GET(req, { params }) {
  const proposal = await fetchProposal(params.id);
  const profile = await fetchProfile(proposal.user_id);

  const pdfBuffer = await renderToBuffer(
    <ProposalDocument proposal={proposal} profile={profile} />
  );

  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="proposal-${proposal.client_name}.pdf"`,
    },
  });
}
```

**PDF Layout — Proposals:**
```
┌───────────────────────────────────┐
│  [Logo]           [Developer Name]│
│                   [Email / Phone] │
├───────────────────────────────────┤
│  PROPOSAL FOR: {Client Name}     │
│  Date: {created_at}              │
├───────────────────────────────────┤
│  {hook}                          │
│                                  │
│  THE CHALLENGE                   │
│  {problemRestatement}            │
│                                  │
│  OUR APPROACH                    │
│  {solution}                      │
│                                  │
│  DELIVERABLES                    │
│  • {deliverable 1}              │
│  • {deliverable 2}              │
│  ...                             │
│                                  │
│  TIMELINE                        │
│  {timeline}                      │
│                                  │
│  INVESTMENT                      │
│  {pricing}                       │
│                                  │
│  NEXT STEPS                      │
│  {callToAction}                  │
├───────────────────────────────────┤
│  [Footer: branding / watermark]  │
└───────────────────────────────────┘
```

**PDF Layout — Invoices:**
```
┌───────────────────────────────────┐
│  [Logo]              INVOICE     │
│  {Developer info}    #{INV-001}  │
│                      Date: ...   │
├───────────────────────────────────┤
│  BILL TO:                        │
│  {Client Name}                   │
│  {Client Email}                  │
├───────────────────────────────────┤
│  Description    Qty  Rate  Total │
│  ─────────────────────────────── │
│  {line items...}                 │
│  ─────────────────────────────── │
│  Subtotal:              $X,XXX  │
│  Tax (X%):              $XXX    │
│  Discount:             -$XXX    │
│  ─────────────────────────────── │
│  TOTAL:                 $X,XXX  │
├───────────────────────────────────┤
│  ┌─────────────────────────────┐ │
│  │    💳 PAY NOW — $X,XXX     │ │
│  │  (Stripe Payment Link URL) │ │
│  └─────────────────────────────┘ │
├───────────────────────────────────┤
│  [Footer: branding / watermark]  │
└───────────────────────────────────┘
```

> [!IMPORTANT]
> The "Pay Now" button in the invoice PDF is rendered using `@react-pdf/renderer`'s `<Link>` component wrapping a styled `<View>`. When the client opens the PDF and clicks it, their browser opens the Stripe-hosted checkout page. This is the critical UX moment for the freelancer.

### 1.5a Logo Upload Specification

**Accepted formats:** PNG and JPG only (`image/png`, `image/jpeg`). SVG and WebP are **not** accepted — `@react-pdf/renderer`'s `<Image>` component only reliably supports PNG and JPG.

**Size limit:** 2MB maximum. Validate on both client (before upload, for fast UX feedback) and server (in the API route, as a security guard).

**Storage path:** `logos/{user_id}/logo.{ext}` — this is a deterministic path that **overwrites on update**. Do not append timestamps or random suffixes. This ensures old logos do not accumulate in Storage.

**Upload API route (`POST /api/upload`) must:**
1. Check `Content-Type` header is `multipart/form-data`.
2. Extract the file from `FormData`.
3. Validate MIME type is `image/png` or `image/jpeg`. Return `400 { error: 'Invalid file type. PNG and JPG only.', code: 'VALIDATION_ERROR' }` if not.
4. Validate file size ≤ 2MB. Return `400 { error: 'File too large. Maximum size is 2MB.', code: 'VALIDATION_ERROR' }` if not.
5. Determine extension: `mime === 'image/png' ? 'png' : 'jpg'`.
6. Upload to Supabase Storage at `logos/{user_id}/logo.{ext}`. Use `upsert: true` to overwrite.
7. Return the public URL.

**PDF generator:** The `<Image src={profile.logo_url} />` component handles embedding automatically. No manual type detection needed.

---

### 1.6 Stripe Integration Model

Clinch uses Stripe in **two completely separate contexts**. This must be understood clearly:

**Context A — Clinch Subscription Billing (Clinch is the merchant):**
- Clinch charges its own users $19/mo or $39/mo.
- Standard Stripe integration: create a `Customer`, create a `Checkout Session` for subscription, handle `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted` webhooks.
- On successful subscription, update `profiles.subscription_tier` and `profiles.subscription_status`.
- Use Stripe's Customer Portal for self-service plan management (upgrade, downgrade, cancel, update payment method).

**Context B — Stripe Connect (Freelancer collects from their client):**
- The freelancer connects their own Stripe account to Clinch via **Stripe Connect Express**.
- OAuth flow: user clicks "Connect Stripe" → redirected to Stripe → authorises → callback saves `stripe_connect_account_id` to their profile.
- When creating an invoice, Clinch calls `stripe.paymentLinks.create()` on behalf of the connected account using `stripeAccount` header.
- The payment goes directly to the freelancer. Clinch takes zero commission (no `application_fee_amount`).
- **Clinch never touches the freelancer's money.** This is a key trust signal.

**Webhook setup:**
- Single webhook endpoint: `POST /api/stripe/webhook`.
- Verify the Stripe signature using `stripe.webhooks.constructEvent()`.
- Route events by type:
  - `checkout.session.completed` → check metadata to determine if it's a Clinch subscription or a client payment. Update the relevant record.
  - `customer.subscription.updated` / `deleted` → update `profiles.subscription_tier`.
  - `checkout.session.completed` (via Connect accounts) → read `session.metadata.invoice_id` to find and update the correct invoice's `payment_status` to `'paid'`. See §1.6a for the full matching spec.

---

### 1.6a Stripe Connect Webhook — Invoice Matching

> [!IMPORTANT]
> Without this spec, paid invoices will **never** auto-update — the webhook has no way to identify which invoice was paid.

**The problem:** When a client pays via a Stripe Payment Link, Stripe fires a `checkout.session.completed` webhook. But by default, the session has no reference to the invoice record in Clinch's database.

**The solution — metadata on the Payment Link:**

When calling `stripe.paymentLinks.create()` in `POST /api/stripe/payment-link`, always include `metadata`:
```typescript
const paymentLink = await stripe.paymentLinks.create({
  line_items: [{ price: price.id, quantity: 1 }],
  metadata: { invoice_id: invoice.id },  // ← critical
}, { stripeAccount: profile.stripe_connect_account_id });
```

**In the webhook handler (`POST /api/stripe/webhook`):**

When `checkout.session.completed` fires:
1. Check if the event has a `account` field (Connect webhooks do). If yes, this is a client payment event.
2. Read `session.metadata.invoice_id`.
3. Look up the invoice in Supabase by that ID. Verify it exists.
4. Update `invoices.payment_status = 'paid'`.
5. Log the update. Return `200`.

**Distinguish Clinch subscription events vs. Connect events:**
- Connect events have an `account` field on the event object (the connected account ID).
- Clinch's own subscription events do not have this field.
- Route them separately in the webhook handler.

---

### 1.7 Middleware & Paywall Enforcement

**Next.js Middleware (`middleware.ts`):**
- Matches all `/(app)` routes.
- Checks for valid Supabase session. If absent → redirect to `/login`.
- Does NOT check subscription tier (that's too expensive in edge middleware).

**API-level paywall (in each relevant API route):**
- Before performing the action, call the `check_and_increment_proposal_count` Postgres function (see §1.3a). This atomically resets the monthly counter if needed, checks the limit, and increments — all in one transaction.
- **Enforcement rules:**
  - Free tier + `proposals_this_month >= 5` → reject proposal generation with `403 { error: 'Proposal limit reached. Upgrade to Pro for unlimited proposals.', code: 'LIMIT_EXCEEDED' }`. The UI **must show an upgrade modal** (not a toast) when it receives a `LIMIT_EXCEEDED` code. The modal should show the plan comparison and a direct "Upgrade to Pro" CTA.
  - Free tier + attempting to create Stripe Payment Link → reject with `403 { error: 'Payment links require a Pro or Agency plan.', code: 'LIMIT_EXCEEDED' }`.
  - Free tier + PDF export → proceed but add a "Made with Clinch" watermark in the PDF footer.
  - Pro/Agency tier → no limits on proposals, payment links, or watermarks.

---

### 1.8 API Rate Limiting

> [!IMPORTANT]
> **Every public-facing and cost-incurring API route must be rate-limited.** Without this, a single bad actor (or a buggy client-side retry loop) can exhaust OpenAI credits, spam Stripe API calls, or overload the database.

**Library:** `rate-limiter-flexible` — lightweight, works with in-memory storage for single-instance Vercel functions. For production scale, switch to Redis-backed (`rate-limiter-flexible` supports Redis natively).

**Configuration (`lib/rate-limit.ts`):**
```typescript
import { RateLimiterMemory } from 'rate-limiter-flexible';

// AI generation — expensive, must be tight
export const aiGenerationLimiter = new RateLimiterMemory({
  points: 3,          // max 3 requests
  duration: 60,       // per 60 seconds
  keyPrefix: 'ai_gen',
});

// General API — prevent abuse
export const generalApiLimiter = new RateLimiterMemory({
  points: 30,         // max 30 requests
  duration: 60,       // per 60 seconds
  keyPrefix: 'api',
});

// Stripe operations — protect against duplicate charges
export const stripeOperationLimiter = new RateLimiterMemory({
  points: 5,          // max 5 requests
  duration: 60,       // per 60 seconds
  keyPrefix: 'stripe',
});
```

**Usage in API routes:**
```typescript
import { aiGenerationLimiter } from '@/lib/rate-limit';

export async function POST(req) {
  const user = await getAuthUser(req);

  try {
    await aiGenerationLimiter.consume(user.id);
  } catch {
    return Response.json(
      { error: 'Too many requests. Please wait a moment.', code: 'RATE_LIMITED' },
      { status: 429 }
    );
  }

  // ... proceed with generation
}
```

**Rate limit tiers:**
| Route | Limit | Window | Rationale |
|-------|-------|--------|-----------|
| `POST /api/proposals/generate` | 3 req | 60s | Each call costs ~$0.001 in OpenAI credits + DB writes |
| `POST /api/stripe/payment-link` | 5 req | 60s | Each call creates Stripe resources |
| `POST /api/stripe/checkout` | 5 req | 60s | Each call creates a Checkout Session |
| `POST /api/upload` | 10 req | 60s | File uploads are I/O heavy |
| All other API routes | 30 req | 60s | General abuse prevention |

**Client-side handling:** When the client receives a `429` response with `code: 'RATE_LIMITED'`, show a toast notification: "You're doing that too fast. Please wait a moment and try again." Disable the submit button for 5 seconds.

---

### 1.9 Email Sending — "Send to Client" Flow

> [!IMPORTANT]
> **Phase 1 must include email delivery.** Without it, the freelancer's workflow is broken — they generate a proposal or invoice, download a PDF, then have to switch to their email client to manually compose and attach the file. This kills the magic.

**Library:** Resend (already in the dependency list).

**Email templates (`lib/email/templates.ts`):**
Define HTML email templates as functions returning strings. Keep them inline (no separate `.mjml` or `.html` files for MVP). Use inline CSS for maximum email client compatibility.

**Template 1 — Send Proposal:**
- Subject: `"Proposal: {project_title} — from {freelancer_name}"`
- Body:
  - Clean, branded header with freelancer's logo (as an `<img>` linking to the Supabase Storage URL).
  - Brief intro: "Hi {client_name}, I've prepared a proposal for {project_title}. Please find it attached."
  - Attached: the proposal PDF (generated on-the-fly via `renderToBuffer()`).
  - Footer: "Sent via Clinch" (for free tier), or no branding (for Pro/Agency).

**Template 2 — Send Invoice:**
- Subject: `"Invoice {invoice_number} — {amount} from {freelancer_name}"`
- Body:
  - Same branded header.
  - "Hi {client_name}, here is your invoice for {amount}."
  - If payment link exists: prominent "Pay Now" CTA button linking to the Stripe Payment Link URL.
  - Attached: the invoice PDF.
  - Footer: same branding rules.

**API routes:**
- `POST /api/proposals/[id]/send` — generates PDF, sends email via Resend with PDF attachment, updates `proposals.status` to `'sent'`.
- `POST /api/invoices/[id]/send` — generates PDF, sends email via Resend with PDF attachment.

**Implementation:**
```typescript
import { Resend } from 'resend';
import { renderToBuffer } from '@react-pdf/renderer';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req, { params }) {
  const proposal = await fetchProposal(params.id);
  const profile = await fetchProfile(proposal.user_id);

  // Generate PDF in-memory
  const pdfBuffer = await renderToBuffer(
    <ProposalDocument proposal={proposal} profile={profile} />
  );

  // Send email with PDF attachment
  await resend.emails.send({
    from: 'Clinch <noreply@clinch.dev>',
    to: proposal.client_email,
    subject: `Proposal: ${proposal.project_title} — from ${profile.full_name}`,
    html: buildProposalEmailHtml(proposal, profile),
    attachments: [{
      filename: `proposal-${proposal.client_name}.pdf`,
      content: Buffer.from(pdfBuffer),
    }],
  });

  // Update status
  await supabase.from('proposals').update({ status: 'sent' }).eq('id', params.id);

  return Response.json({ success: true });
}
```

**UI integration:**
- On the proposal/invoice detail page, add a "Send to Client" button alongside the existing "Download PDF" button.
- The button opens a confirmation dialog showing: recipient email, subject line, and a preview of the email body.
- On success, show a toast: "Proposal sent to {client_email}".
- Auto-update the status badge to "Sent".

> [!NOTE]
> Resend's free tier allows 100 emails/day, which is more than enough for Phase 1. The `from` address requires a verified domain — during development, use Resend's sandbox domain (`onboarding@resend.dev`).

---

### 1.10 Design System — Linear-Inspired Theme

> [!IMPORTANT]
> **This section defines the visual identity of Clinch.** Every page, component, and interaction must follow these rules. All styling is done via inline Tailwind CSS classes on shadcn components. The full visual reference (with colour codes, typography table, component examples, do's/don'ts) lives in `DESIGN.md` at the project root.

**Design philosophy:** Clinch's UI is inspired by [Linear.app](https://linear.app) — a dark-mode-first, developer-centric aesthetic with extreme precision in typography and spacing. The interface feels purposeful and efficient, prioritising function over decoration while maintaining visual elegance through subtle layering.

**Key visual characteristics:**
- Dark-mode-native: near-black canvas (`#08090a`) where content emerges from darkness
- Inter Variable with OpenType features `"cv01", "ss03"` — transforms Inter into a distinctive, geometric typeface
- Signature font weight 510 (between regular and medium) — mapped to Tailwind's `font-medium`
- Brand indigo (`#5e6ad2`) as the **only** chromatic colour — used exclusively for primary CTAs and interactive accents
- Semi-transparent white borders (`rgba(255,255,255,0.05-0.08)`) instead of solid dark borders
- Depth via background luminance stepping, not shadows: `bg-white/[0.02]` → `bg-white/[0.04]` → `bg-white/[0.05]`
- Aggressive negative letter-spacing at display sizes
- Maximum font weight: 590 (no `font-bold` / weight 700)

#### Tailwind Theme Extension

Add these to `tailwind.config.ts` immediately after project init:

```typescript
const config = {
  theme: {
    extend: {
      colors: {
        // Surface hierarchy (dark mode)
        'surface-0': '#08090a',      // Marketing black, deepest
        'surface-1': '#0f1011',      // Panel/sidebar bg
        'surface-2': '#191a1b',      // Elevated surfaces, popovers
        'surface-3': '#28282c',      // Hover states, lightest dark surface
        // Brand
        'brand': '#5e6ad2',          // Primary CTA bg
        'brand-accent': '#7170ff',   // Interactive accent
        'brand-hover': '#828fff',    // Hover state
        // Text hierarchy
        'text-primary': '#f7f8f8',   // Primary text (not pure white)
        'text-secondary': '#d0d6e0', // Body text, descriptions
        'text-tertiary': '#8a8f98',  // Muted, metadata
        'text-quaternary': '#62666d',// Disabled, subtle
        // Status
        'status-success': '#27a644',
        'status-emerald': '#10b981',
        'status-warning': '#ffc47c',
        'status-error': '#eb5757',
      },
      fontFamily: {
        sans: ['Inter Variable', 'SF Pro Display', '-apple-system', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Berkeley Mono', 'ui-monospace', 'SF Mono', 'Menlo', 'monospace'],
      },
      borderRadius: {
        'micro': '2px',
        'standard': '4px',
        'comfortable': '6px',
        'card': '8px',
        'panel': '12px',
        'large': '22px',
        'pill': '9999px',
      },
      letterSpacing: {
        'display-xl': '-1.584px',
        'display-lg': '-1.408px',
        'display': '-1.056px',
        'heading-1': '-0.704px',
        'heading-2': '-0.288px',
        'heading-3': '-0.24px',
        'body-lg': '-0.165px',
        'caption': '-0.13px',
      },
      boxShadow: {
        'subtle': 'rgba(0,0,0,0.03) 0px 1.2px 0px 0px',
        'elevated': 'rgba(0,0,0,0.4) 0px 2px 4px 0px',
        'dialog': 'rgba(0,0,0,0) 0px 8px 2px, rgba(0,0,0,0.01) 0px 5px 2px, rgba(0,0,0,0.04) 0px 3px 2px, rgba(0,0,0,0.07) 0px 1px 1px, rgba(0,0,0,0.08) 0px 0px 1px',
      },
    },
  },
};
```

#### shadcn CSS Variables (globals.css)

After `shadcn init`, replace the dark mode variables in `globals.css`:

```css
@font-face {
  font-family: 'Inter Variable';
  src: url('/fonts/InterVariable.woff2') format('woff2');
  font-weight: 100 900;
  font-display: swap;
}

body {
  font-feature-settings: "cv01", "ss03";
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.dark {
  --background: 210 14% 3%;         /* #08090a */
  --foreground: 180 4% 97%;         /* #f7f8f8 */
  --card: 210 5% 6%;                /* #0f1011 */
  --card-foreground: 180 4% 97%;
  --popover: 210 4% 10%;            /* #191a1b */
  --popover-foreground: 180 4% 97%;
  --primary: 233 56% 60%;           /* #5e6ad2 */
  --primary-foreground: 0 0% 100%;
  --secondary: 240 4% 16%;          /* #28282c */
  --secondary-foreground: 216 20% 85%;
  --muted: 210 5% 6%;               /* #0f1011 */
  --muted-foreground: 214 6% 57%;   /* #8a8f98 */
  --accent: 240 4% 16%;
  --accent-foreground: 180 4% 97%;
  --destructive: 0 78% 63%;         /* #eb5757 */
  --destructive-foreground: 0 0% 100%;
  --border: 220 6% 20%;             /* Fallback solid */
  --input: 220 6% 20%;
  --ring: 240 100% 72%;             /* #7170ff */
  --radius: 0.5rem;
}
```

> [!NOTE]
> For borders on dark backgrounds, always use `border-white/[0.08]` or `border-white/[0.05]` inline instead of the `--border` variable. This gives the authentic Linear semi-transparent border effect that solid HSL values cannot achieve.

#### Component Styling Rules (Quick Reference)

All styling is done via **inline Tailwind classes** on shadcn components:

| Component | Key Tailwind Classes |
|-----------|---------------------|
| **Primary Button** | `bg-brand hover:bg-brand-hover text-white rounded-comfortable` |
| **Ghost Button** | `bg-white/[0.02] border border-white/[0.08] text-text-secondary hover:bg-white/[0.05] hover:text-text-primary rounded-comfortable` |
| **Card** | `bg-white/[0.02] border border-white/[0.08] rounded-card` |
| **Card Title** | `text-text-primary font-medium tracking-heading-3` |
| **Sidebar** | `w-64 bg-surface-1 border-r border-white/[0.05]` |
| **Sidebar Nav Item** | `text-text-secondary hover:text-text-primary hover:bg-white/[0.04] rounded-comfortable px-3 py-2 text-[13px] font-medium` |
| **Sidebar Active Item** | `text-text-primary bg-white/[0.05] rounded-comfortable` |
| **Table Header** | `text-text-tertiary text-xs font-medium` |
| **Table Row** | `border-b border-white/[0.05] hover:bg-white/[0.02]` |
| **Input** | `bg-white/[0.02] border border-white/[0.08] text-text-primary placeholder:text-text-quaternary rounded-comfortable` |
| **Dialog** | `bg-surface-2 border border-white/[0.08] rounded-panel shadow-dialog` |
| **Badge (Draft)** | `bg-white/[0.05] text-text-tertiary rounded-pill text-[10px] font-medium` |
| **Badge (Sent)** | `bg-brand/20 text-brand-accent rounded-pill text-[10px] font-medium` |
| **Badge (Won)** | `bg-status-success/20 text-status-success rounded-pill text-[10px] font-medium` |
| **Badge (Lost)** | `bg-status-error/20 text-status-error rounded-pill text-[10px] font-medium` |
| **Badge (Paid)** | `bg-status-success/20 text-status-success rounded-pill text-[10px] font-medium` |
| **Badge (Unpaid)** | `bg-status-warning/20 text-status-warning rounded-pill text-[10px] font-medium` |
| **Display Heading** | `text-5xl md:text-6xl font-medium tracking-display-lg text-text-primary leading-none` |
| **Section Heading** | `text-2xl font-medium tracking-heading-2 text-text-primary` |
| **Body Text** | `text-text-secondary leading-relaxed` |
| **Muted Text** | `text-text-tertiary text-sm` |
| **Toast** | `bg-surface-2 border border-white/[0.08] text-text-primary rounded-card` |

#### Typography Quick Reference

| Context | Tailwind Classes |
|---------|------------------|
| Hero headline (72px) | `text-7xl font-medium tracking-display-xl leading-none` |
| Section headline (48px) | `text-5xl font-medium tracking-display leading-none` |
| Page title (32px) | `text-3xl tracking-heading-1 text-text-primary` |
| Card title (20px) | `text-xl font-semibold tracking-heading-3 text-text-primary` |
| Body large (18px) | `text-lg tracking-body-lg text-text-secondary leading-relaxed` |
| Body (16px) | `text-base text-text-secondary leading-normal` |
| Navigation (13px) | `text-[13px] font-medium text-text-secondary` |
| Label (12px) | `text-xs font-medium text-text-tertiary` |
| Caption (13px) | `text-[13px] tracking-caption text-text-tertiary` |
| Micro (10px) | `text-[10px] font-medium text-text-quaternary` |

#### Don'ts (Critical Rules)

- **Never use `font-bold`** (weight 700). Maximum is `font-semibold` (600, closest to Linear's 590).
- **Never use solid colored backgrounds** for cards on dark surfaces. Always `bg-white/[0.0x]`.
- **Never use the brand indigo decoratively.** It's reserved for primary CTAs and interactive accents only.
- **Never create separate CSS files** for component styling. All styles are inline Tailwind on shadcn.
- **Never use pure `#ffffff`** for text. Use `text-text-primary` (`#f7f8f8`) to prevent eye strain.
- **Never use opaque borders** on dark backgrounds. Use `border-white/[0.05]` to `border-white/[0.08]`.
- **Never skip the font-feature-settings** — `"cv01", "ss03"` is set once on `body` and is non-negotiable.

---

## 2. Phase 1 — Week 1: Foundation

**Goal:** By end of Week 1, a user can visit the public homepage, sign up, complete onboarding, manage their profile, and save clients. The authenticated app shell is fully functional.

### Day 1: Project Setup, Design System & Homepage

**Build order and rationale:** The homepage is the first thing any visitor sees. It establishes trust, explains the product, and drives sign-ups. It must exist before auth because the auth pages (login/signup) are linked from the homepage CTAs. Building the homepage first also forces the design system to be established early — every subsequent page inherits the visual language.

1. **Initialise the Next.js project** using the flags specified in §1.1.
2. **Set up shadcn/ui** — init with "New York" style, neutral base colour, and CSS variables enabled. Install these components immediately: `button`, `input`, `label`, `card`, `dialog`, `dropdown-menu`, `avatar`, `badge`, `table`, `tabs`, `toast`, `form`, `select`, `textarea`, `separator`, `sheet`, `skeleton`, `tooltip`, `popover`, `command`, `accordion`, `navigation-menu`.
   Also install an **upgrade modal component** at `components/shared/UpgradeModal.tsx` early — it will be triggered by `LIMIT_EXCEEDED` API responses throughout the app. It accepts a `reason` string prop and always links to `/settings/billing`.
3. **Apply the Linear-inspired design system** (see §1.10):
   - Replace `globals.css` dark mode variables with the Linear colour palette.
   - Extend `tailwind.config.ts` with the custom colour tokens, border-radius scale, letter-spacing scale, and shadow definitions from §1.10.
   - Download Inter Variable `.woff2` from [rsms.me/inter](https://rsms.me/inter/) and place in `public/fonts/`. Register via `@font-face` in `globals.css`.
   - Set `font-feature-settings: "cv01", "ss03"` on `body`.
   - Set dark mode as the default theme.
4. **Set up the root layout** (`app/layout.tsx`):
   - Use the self-hosted Inter Variable font.
   - Set global metadata: title ("Clinch — AI-Powered Proposals & Invoices for Freelancers"), description, Open Graph tags.
   - Add `favicon.ico` and `apple-touch-icon.png`.
   - Wrap in a `ThemeProvider` with `defaultTheme="dark"`.
5. **Build the marketing layout** (`app/(marketing)/layout.tsx`):
   - **Navbar:** Clinch logo (left), navigation links — "How It Works", "Pricing" (anchor links to homepage sections), and auth buttons — "Log In" (ghost style) + "Get Started Free" (primary solid).
   - If the user is authenticated (check Supabase session), replace auth buttons with a single "Dashboard →" button linking to `/(app)/dashboard`.
   - **Mobile:** Hamburger menu using shadcn `Sheet` component.
   - **Footer:** Clinch logo, copyright, links to legal pages (placeholder hrefs for MVP).
   - Navbar should be sticky with `bg-surface-0/80 backdrop-blur-xl border-b border-white/[0.05]`.

6. **Build the Homepage** (`app/(marketing)/page.tsx`):

   The homepage is a single-page marketing site with these sections, in order:

   **Section 1 — Hero:**
   - Headline: Clear value proposition (e.g., "Win More Clients. Get Paid Faster."). Use `text-5xl md:text-7xl font-medium tracking-display-xl text-text-primary leading-none`.
   - Subheadline: 1-2 sentences explaining what Clinch does. Use `text-lg tracking-body-lg text-text-tertiary leading-relaxed`.
   - **Primary CTA button:** "Get Started Free" → links to `/signup`. Use `bg-brand hover:bg-brand-hover text-white rounded-comfortable px-6 py-3`.
   - **Secondary CTA:** "See How It Works" → smooth scrolls to the How It Works section. Use ghost button: `bg-white/[0.02] border border-white/[0.08] text-text-secondary hover:bg-white/[0.05] rounded-comfortable`.
   - **Hero visual:** A screenshot/mockup of the Clinch dashboard. Frame with `rounded-panel border border-white/[0.08] shadow-elevated`. For MVP, use a polished placeholder image — replace with a real screenshot once the dashboard is built in Day 5.
   - **Social proof line** (below the CTAs): "Free forever. No credit card required." in `text-text-quaternary text-sm`.

   **Section 2 — Trusted By / Social Proof (compact):**
   - For MVP: a single line — "Built for freelance developers, designers, and consultants." in `text-text-tertiary text-sm font-medium`.
   - Post-launch: replace with logos or user count ("Trusted by X+ freelancers").

   **Section 3 — How It Works (3-step):**
   - Three columns (stack on mobile), each with an icon (Lucide), a bold step title, and a 1-line description:
     1. **Describe Your Project** — "Paste a job description or fill in the details. Clinch handles the rest."
     2. **AI Generates Your Proposal** — "Get a professionally written, ready-to-send proposal in seconds."
     3. **Send & Get Paid** — "Export branded PDFs, send with one click, and collect payments via Stripe."
   - Use shadcn `Card` with `bg-white/[0.02] border border-white/[0.08] rounded-card hover:bg-white/[0.04] transition-colors`.
   - Step number/icon in `text-brand-accent`. Title in `text-text-primary font-medium`. Description in `text-text-tertiary`.
   - Section heading: `text-3xl font-medium tracking-heading-1 text-text-primary` with a muted subheading.

   **Section 4 — Features Grid:**
   - 2×3 grid (stacks to 1 column on mobile) of feature cards. Each card:
     - Lucide icon in `text-brand-accent`.
     - Title in `text-text-primary font-medium text-lg`.
     - Description in `text-text-tertiary text-sm leading-relaxed`.
   - Features to highlight:
     1. **AI Proposal Generation** — "Turn project briefs into polished proposals with one click."
     2. **Branded PDFs** — "Your logo, your colours, your brand — on every document."
     3. **Stripe Payment Links** — "Embed a Pay Now button directly in your invoice PDF."
     4. **Client Management** — "Save clients and reuse their details across proposals and invoices."
     5. **Invoice Builder** — "Line items, tax, discounts — professional invoices in minutes."
     6. **One-Click Send** — "Email proposals and invoices to clients directly from Clinch."
   - Cards: `bg-white/[0.02] border border-white/[0.08] rounded-card p-6 hover:border-white/[0.12] transition-colors`.

   **Section 5 — Pricing:**
   - Three pricing cards side-by-side (stack on mobile). Visually highlight the "Pro" plan as recommended.
   - **Free:** $0/mo — 5 AI proposals/month, branded PDFs (with watermark), client management, invoice builder. CTA: "Get Started Free" → `/signup`.
   - **Pro:** $19/mo — Unlimited AI proposals, no watermark, Stripe payment links, email sending. CTA: "Start Pro" → `/signup`. Add a "Most Popular" badge using `<Badge className="bg-brand/20 text-brand-accent rounded-pill text-[10px] font-medium">Most Popular</Badge>`. Pro card gets `border-brand/40` to visually distinguish it.
   - **Agency:** $39/mo — Everything in Pro + priority support, team features (coming soon). CTA: "Go Agency" → `/signup`.
   - Each card uses shadcn `Card` with `bg-white/[0.02] border border-white/[0.08] rounded-card`. Feature checklist uses `Check` icon in `text-status-success`.
   - Price amount in `text-4xl font-medium tracking-heading-1 text-text-primary`. Period in `text-text-quaternary`.
   - Below the cards: "All plans include a 14-day free trial. No credit card required." in `text-text-quaternary text-sm`.

   **Section 6 — Final CTA:**
   - Full-width section with `bg-surface-1 border-y border-white/[0.05]`. Alternatively, a subtle brand gradient: `bg-gradient-to-b from-brand/5 to-transparent`.
   - Headline: "Ready to win your next client?" in `text-4xl font-medium tracking-heading-1 text-text-primary`.
   - Subheadline in `text-text-tertiary text-lg`.
   - CTA button: `bg-brand hover:bg-brand-hover text-white rounded-comfortable`.

   **Layout requirements:**
   - Page background: `bg-surface-0` (`#08090a`).
   - All sections use `py-20 md:py-32` for generous vertical spacing.
   - Max content width: `max-w-6xl mx-auto px-6`.
   - Smooth scroll behaviour: `scroll-behavior: smooth` on `<html>`.
   - Responsive: mobile (375px+), tablet (768px+), desktop (1024px+).

> [!IMPORTANT]
> **The homepage must feel like Linear's marketing site.** Near-black canvas, content emerging from darkness, compressed headlines with negative letter-spacing, generous whitespace, and the brand indigo used sparingly for CTAs only. Follow §1.10 and `DESIGN.md` rigorously. No warm colours, no solid backgrounds on cards, no `font-bold`.

7. **SEO for the homepage:**
   - `<h1>` contains the primary value proposition (only one `<h1>` on the page).
   - Each section heading uses `<h2>`.
   - Add `id` attributes to sections for anchor links: `#how-it-works`, `#features`, `#pricing`.
   - Add structured data (JSON-LD) for the SaaS product.
   - `robots.txt` and `sitemap.xml` pointing to the homepage.

### Day 1-2: Auth Setup

**Build order and rationale:** Auth is the foundation of everything. Every database query requires a user ID. Every page requires a session check. Nothing else can be built until this works end-to-end.

1. **Set up Supabase project** — create a new Supabase project, get the URL and anon key, store in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   ```
2. **Create Supabase client utilities** (`lib/supabase/client.ts` and `lib/supabase/server.ts`) using `@supabase/ssr`'s `createBrowserClient` and `createServerClient` respectively. The server client must read/write cookies properly for the App Router.
3. **Create the `profiles` table** via Supabase migration. Enable RLS. Add policy: `auth.uid() = id` for all operations. Add an `on_auth_user_created` trigger function that auto-inserts a row into `profiles` when a new user signs up (with only `id` populated, everything else null/default).
4. **Build the auth pages:**
   - `/login` — email/password form + Google OAuth button. Clean, centred card layout. Clinch logo above.
   - `/signup` — same layout, sign-up variant.
   - `/api/auth/callback/route.ts` — exchanges the OAuth code for a session using `supabase.auth.exchangeCodeForSession()`.
5. **Create `middleware.ts`** — protect all `/(app)` routes. Check session, redirect to `/login` if absent.
6. **Test the complete flow:** signup → email confirmation → login → redirected to empty dashboard. Google OAuth → callback → redirected. Ensure session persists across page refreshes.

### Day 2-3: Onboarding Flow

**Rationale:** The profile data is required by the AI prompt builder. No proposal can be generated without it. Onboarding must come before any feature work.

1. **Build the onboarding page** (`/(app)/onboarding/page.tsx`) as a multi-step wizard:
   - **Step 1:** Full name + professional bio (textarea, 2-3 sentences).
   - **Step 2:** Services offered (multi-select or tag input — use a free-text tag approach where the user types and presses Enter to add). Hourly rate (number input, stored in cents).
   - **Step 3:** Logo upload + brand colour picker.
   - Final step: review screen showing all entered data with an "Looks good, let's go" CTA.

2. **Logo upload implementation:**
   - Create a Supabase Storage bucket called `logos` with public access.
   - API route `POST /api/upload` — see §1.5a for the full spec (accepted formats, size limit, storage path, overwrite behaviour).
   - Client-side: preview the logo immediately using `URL.createObjectURL()` before upload completes.
   - Accept only `.png` and `.jpg` (no SVG). Max size: 2MB. Validate on client before sending.

3. **Brand colour picker:**
   - Use a simple hex input field with a colour preview swatch. A native `<input type="color">` element works perfectly here — style it to match the design system.

4. **On completion:**
   - `PATCH /api/profile` saves all fields to the `profiles` table.
   - Set `onboarding_completed = true`.
   - Redirect to `/dashboard`.

5. **Middleware update:** After auth check, also check `profiles.onboarding_completed`. If false and the route is not `/onboarding`, redirect to `/onboarding`.

### Day 3-4: App Shell & Settings

**Rationale:** The app shell (sidebar, topbar) is the navigation frame that every page lives inside. Building it now means every subsequent page automatically has navigation.

1. **Build the app layout** (`/(app)/layout.tsx`):
   - **Sidebar (desktop):** Fixed left sidebar, ~256px wide. Sections:
     - Logo/brand mark at top
     - Navigation: Dashboard, Proposals, Invoices, Clients
     - Bottom section: Settings, user avatar/name, logout button
   - **Topbar (mobile):** Hamburger menu that opens the sidebar as a slide-over sheet.
   - Use `shadcn/ui` `Sheet` component for mobile nav.
   - Active route should be visually highlighted in the sidebar.

2. **Build the Settings page** (`/(app)/settings/profile/page.tsx`):
   - Same fields as onboarding, but pre-filled from the database.
   - All fields are individually editable and saved via `PATCH /api/profile`.
   - Logo can be replaced (uploads new file, updates URL in database).
   - Brand colour can be changed.
   - Include a "Danger Zone" section at the bottom for future account deletion (just the UI placeholder for now, no functionality).

3. **Build the API route for profile:**
   - `GET /api/profile` — returns the authenticated user's profile.
   - `PATCH /api/profile` — validates input with Zod, updates the profile. Returns the updated profile.

### Day 4-5: Client Address Book

**Rationale:** Clients are referenced by proposals and invoices. The `clients` table and CRUD must exist before building those features.

1. **Create the `clients` table** via migration. Enable RLS: `auth.uid() = user_id`.

2. **Build the Clients page** (`/(app)/clients/page.tsx`):
   - List view showing all saved clients in a table: Name, Email, Company, Date Added.
   - "Add Client" button opens a dialog/modal with the client form.
   - Each row has an edit button (opens the same dialog pre-filled) and a delete button (with confirmation).
   - Search/filter by name.

3. **Build the API routes:**
   - `GET /api/clients` — list all clients for the authenticated user.
   - `POST /api/clients` — create a new client. Validate with Zod.
   - `PATCH /api/clients/[id]` — update a client.
   - `DELETE /api/clients/[id]` — delete a client (cascade will handle proposal/invoice references gracefully since `client_id` is nullable).

4. **Build the `ClientSelect` component** — a reusable combobox (using shadcn's `Command` + `Popover`) that:
   - Fetches and displays saved clients.
   - Allows searching by name.
   - Has a "Add new client" option at the bottom that opens the client creation dialog inline.
   - Returns the selected client's `id`, `name`, `email`, and `company`.
   - This component will be used in both the proposal form and invoice form.

### Day 5: Dashboard (Skeleton) + Homepage Screenshot

**Rationale:** Deploy something visible on the dashboard so the app doesn't feel empty during development.

1. **Build the Dashboard page** (`/(app)/dashboard/page.tsx`) with placeholder stat cards:
   - "Proposals Sent" — count from database (will wire up later).
   - "Win Rate" — percentage (0% for now).
   - "Revenue This Month" — invoice totals (will wire up later).
2. **Add empty state components** — "No proposals yet" and "No invoices yet" cards with CTAs pointing to `/proposals/new` and `/invoices/new`.
3. **Use `Skeleton` components** from shadcn for loading states.
4. **Update the homepage hero visual:** Now that the dashboard exists, capture a real screenshot of the dashboard (or proposal editor once built in Week 2) and replace the placeholder hero image on the homepage. This is a quick win that makes the homepage immediately more credible.

---

## 3. Phase 1 — Week 2: Core Product

**Goal:** By end of Week 2, a user can generate AI proposals, edit them, export branded PDFs, create invoices, and connect their Stripe account for payment links. This is the core product loop.

### Day 1-2: AI Proposal Generator

**This is the most important feature in the entire product. It must feel fast and magical.**

1. **Create the `proposals` table** via migration. Enable RLS.

2. **Build the proposal creation form** (`/(app)/proposals/new/page.tsx`):
   - **Client selection:** Use the `ClientSelect` component. If user types a name that doesn't exist, capture it as `client_name` without creating a client record.
   - **Input mode toggle:** Two tabs at the top — "Quick Fill" and "Paste Job Description".
     - **Quick Fill:** Fields for project type (dropdown: Website, Web App, Mobile App, Landing Page, E-commerce, API, Other), deliverables (tag input), budget (currency input), timeline (text input, e.g. "6 weeks").
     - **Paste JD:** Single large textarea where user pastes a job description. AI will extract the details.
   - **Tone selector:** Three radio-style buttons — Formal, Friendly, Bold. Each with a 1-line description of the tone.
   - **Generate button:** Large, prominent CTA. Disabled until required fields are filled.

3. **Build the AI generation API route** (`POST /api/proposals/generate`):
   - Accept: `client_name`, `client_email`, `client_company`, `project_type`, `deliverables`, `budget`, `timeline`, `tone`, `job_description`.
   - Fetch the user's profile from Supabase.
   - Construct the system prompt + user prompt as specified in §1.4.
   - Call OpenAI API with `response_format: { type: 'json_object' }`.
   - Parse the JSON response. Validate it has all required keys.
   - **Rate limit check:** Call `aiGenerationLimiter.consume(user.id)` (see §1.8). Return `429 { error: 'Too many requests. Please wait a moment.', code: 'RATE_LIMITED' }` if exceeded.
   - **Paywall check:** Call the `check_and_increment_proposal_count` Postgres function (see §1.3a). The function atomically resets the monthly counter if we've rolled into a new month, checks the limit, and increments — all in one locked transaction. If it returns `allowed: false`, return `403 { error: 'Proposal limit reached. Upgrade to Pro for unlimited proposals.', code: 'LIMIT_EXCEEDED' }`. The client detects this code and shows the `<UpgradeModal />` component — not a toast.
   - Save the proposal to the database with `status: 'draft'`, `generated_content` set to the AI output, and `edited_content` initially copied from `generated_content`.
   - Return the created proposal.

4. **Build the proposal editor** — After generation, redirect to `/(app)/proposals/[id]/page.tsx`:
   - Display the generated proposal in a structured, editable layout.
   - Each section (`hook`, `problemRestatement`, `solution`, etc.) is rendered as an editable block — either a `textarea` or a rich-text-like editable div.
   - Changes are saved to `edited_content` (not `generated_content`, which is preserved as the original AI output).
   - Auto-save on blur or after a debounced timeout (2 seconds of inactivity).
   - **Status selector:** Dropdown to manually set status (Draft, Sent, Viewed, Won, Lost). Displayed as a coloured badge.
   - **Action bar** at the top: "Download PDF" button, status selector, "Delete" button.

5. **Build the proposals list page** (`/(app)/proposals/page.tsx`):
   - Table view: Client Name, Project Title, Amount, Date, Status (colour-coded badge).
   - Status badges: Draft (grey), Sent (blue), Viewed (yellow), Won (green), Lost (red).
   - Click a row → navigate to the editor for that proposal.
   - "New Proposal" button in the top right.
   - Sort by date (newest first, default). Filter by status.

6. **API routes for proposals:**
   - `GET /api/proposals` — list all user's proposals, ordered by `created_at DESC`.
   - `GET /api/proposals/[id]` — get single proposal.
   - `PATCH /api/proposals/[id]` — update `edited_content`, `status`, `amount`, etc.
   - `DELETE /api/proposals/[id]` — soft delete or hard delete (hard delete is fine for MVP).

### Day 3: Branded PDF Export (Proposals) + Send to Client

1. **Build shared PDF components** (`lib/pdf/shared.tsx`):
   - `<PDFHeader />` — logo + developer name/contact, reused by both proposal and invoice PDFs.
   - `<PDFFooter />` — watermark for free tier ("Made with Clinch"), clean footer for Pro/Agency.
   - `<SectionHeading />` — styled heading using brand colour.
   - `<Divider />` — horizontal rule in brand colour.
   - Shared `StyleSheet` with consistent typography, spacing, and colour tokens.

2. **Build the proposal PDF component** (`lib/pdf/proposal.tsx`):
   - React component: `<ProposalDocument proposal={...} profile={...} />`.
   - Uses `@react-pdf/renderer`'s `<Document>`, `<Page>`, `<View>`, `<Text>`, `<Image>`, `<Link>`.
   - Register Inter font (Regular, Bold, SemiBold) via `Font.register()`. Store `.ttf` files in `public/fonts/`.
   - Layout as specified in §1.5 — text wrapping and pagination handled automatically by the Yoga layout engine.
   - Brand colour: passed as a prop, used for heading text colour and accent elements.
   - Logo: `<Image src={profile.logo_url} />` — PNG/JPG embedding handled natively.
   - Watermark: conditional rendering based on `profile.subscription_tier`.

3. **Build the PDF API route** (`GET /api/proposals/[id]/pdf`):
   - Fetch the proposal (`edited_content`) and the user's profile.
   - Call `renderToBuffer(<ProposalDocument ... />)` from `@react-pdf/renderer`.
   - Return the PDF as a response with:
     ```
     Content-Type: application/pdf
     Content-Disposition: attachment; filename="proposal-{client_name}.pdf"
     ```

4. **Build the Send to Client API** (`POST /api/proposals/[id]/send`):
   - Generate the PDF in-memory using `renderToBuffer()`.
   - Send via Resend with PDF attachment (see §1.9 for full spec).
   - Update `proposals.status` to `'sent'`.
   - Rate limit: use `generalApiLimiter` (see §1.8).

5. **Wire up the UI:**
   - "Download PDF" button — calls the GET route, triggers browser download.
   - "Send to Client" button — opens a confirmation dialog (shows recipient, subject preview), then calls the POST route. On success: toast + status badge auto-updates to "Sent".

### Day 4: Invoice Builder

1. **Create the `invoices` and `invoice_sequences` tables** via migration. Enable RLS. Create a Postgres function `get_next_invoice_number(p_user_id UUID)` that atomically increments and returns the next invoice number for that user.

2. **Build the invoice creation form** (`/(app)/invoices/new/page.tsx`):
   - **Client selection:** Same `ClientSelect` component.
   - **Link to proposal:** Optional dropdown showing the user's proposals. If selected, pre-fills the client and amount.
   - **Line items:** Dynamic list of rows. Each row: Description (text), Quantity (number), Unit Price (currency input). Subtotal auto-calculated per row.
   - "Add Line Item" button adds a new empty row.
   - Delete button on each row (with confirmation if it's the last row).
   - **Tax:** Optional toggle. If enabled, show a percentage input. Tax amount auto-calculated.
   - **Discount:** Optional toggle. If enabled, show type selector (Fixed / Percentage) and value input. Discount amount auto-calculated.
   - **Currency:** Dropdown selector (USD default). For MVP, support USD only — multi-currency is Phase 2.
   - **Totals section:** Subtotal, Tax, Discount, Total — all auto-calculated and displayed live.
   - **Create button:** Saves the invoice, assigns the next invoice number.

3. **Build the invoice detail/edit page** (`/(app)/invoices/[id]/page.tsx`):
   - Same layout as the creation form but pre-filled.
   - Show the invoice number (non-editable).
   - "Download PDF" button and payment status badge.

4. **Build the invoices list page** (`/(app)/invoices/page.tsx`):
   - Table: Invoice Number, Client, Amount, Date, Payment Status.
   - Payment status badges: Unpaid (orange), Paid (green).

5. **API routes for invoices:**
   - `GET /api/invoices`, `POST /api/invoices`, `GET /api/invoices/[id]`, `PATCH /api/invoices/[id]`, `DELETE /api/invoices/[id]`.
   - `POST` route calls the `get_next_invoice_number()` Postgres function.
   - All routes validate with Zod and enforce RLS via user ID.

### Day 5: Invoice PDF + Stripe Payment Link

1. **Build the invoice PDF component** (`lib/pdf/invoice.tsx`):
   - React component: `<InvoiceDocument invoice={...} profile={...} />`.
   - Same shared components as proposal PDF (header, footer, divider).
   - Line items rendered using `@react-pdf/renderer`'s `<View>` with Flexbox — columns for Description, Qty, Rate, Total.
   - Totals section with subtotals, tax, discount, and bold total.
   - If `stripe_payment_link_url` exists on the invoice, render a clickable "Pay Now" button:
     - `<Link src={stripe_payment_link_url}>` wrapping a styled `<View>` with rounded corners, brand colour background, and white `<Text>`: "Pay Now — ${total}".
     - This is natively clickable in PDF viewers — no manual annotation needed.
   - Same watermark logic as proposals.

2. **Build Stripe Connect OAuth flow:**
   - `GET /api/stripe/connect` — creates a Stripe Connect account link (`stripe.accountLinks.create()`) and redirects the user to Stripe's onboarding.
   - Callback URL points back to `/settings/integrations?stripe=success`.
   - On successful onboarding, save the `stripe_connect_account_id` to the profile and set `stripe_connect_onboarded = true`.
   - **Settings > Integrations page:** Shows Stripe connection status. "Connect Stripe Account" button if not connected. "Connected ✓" badge if connected, with a "Disconnect" option.
   - Ensure the Stripe Connect redirect URIs are registered under the "Clinch" application name in the Stripe Dashboard.

3. **Build the Payment Link creation** (`POST /api/stripe/payment-link`):
   - Accepts: `invoice_id`.
   - Fetch the invoice. Verify the user owns it.
   - **Paywall check:** Only Pro and Agency tiers can create payment links. Return `403 { error: 'Payment links require a Pro or Agency plan.', code: 'LIMIT_EXCEEDED' }` for free tier.
   - Verify `stripe_connect_onboarded` is true. If not, return `400 { error: 'Connect your Stripe account first.', code: 'STRIPE_NOT_CONNECTED' }`.
   - Create a Stripe Product + Price on the fly (using the connected account), and **include `invoice_id` in metadata** (see §1.6a):
     ```typescript
     const product = await stripe.products.create({
       name: `Invoice ${invoice.invoice_number}`,
     }, { stripeAccount: profile.stripe_connect_account_id });

     const price = await stripe.prices.create({
       product: product.id,
       unit_amount: invoice.total,
       currency: invoice.currency,
     }, { stripeAccount: profile.stripe_connect_account_id });

     const paymentLink = await stripe.paymentLinks.create({
       line_items: [{ price: price.id, quantity: 1 }],
       metadata: { invoice_id: invoice.id },  // ← required for webhook matching (§1.6a)
     }, { stripeAccount: profile.stripe_connect_account_id });
     ```
   - Save `paymentLink.id` and `paymentLink.url` to the invoice record.
   - Return the payment link URL.

4. **Wire up in the invoice UI:**
   - If Stripe is connected and the user is on Pro/Agency tier: show a "Generate Payment Link" button on the invoice.
   - After generating, show the link URL and a "Copy Link" button.
   - The link is automatically included in the invoice PDF.

---

## 4. Phase 1 — Week 3: Monetisation & Polish

**Goal:** By end of Week 3, Clinch has working subscription billing, a fully wired dashboard, polished UI, and is deployed to production.

### Day 1-2: Subscription Billing

1. **Set up Stripe Products and Prices** in the Stripe Dashboard (not via API — these are static):
   - Product: "Clinch Pro" — Price: $19/month, recurring.
   - Product: "Clinch Agency" — Price: $39/month, recurring.
   - Save the Price IDs in environment variables: `STRIPE_PRO_PRICE_ID`, `STRIPE_AGENCY_PRICE_ID`.

2. **Build the billing settings page** (`/(app)/settings/billing/page.tsx`):
   - Show current plan (Free / Pro / Agency) with a plan comparison card.
   - "Upgrade to Pro" and "Upgrade to Agency" buttons.
   - For Pro/Agency users: "Manage Subscription" button that opens Stripe Customer Portal.

3. **Build the checkout API route** (`POST /api/stripe/checkout`):
   - Accepts: `price_id`.
   - Creates or retrieves the Stripe Customer for this user (using `stripe_customer_id` from profile).
   - Creates a Checkout Session with `mode: 'subscription'`.
   - Set `success_url` to `/settings/billing?success=true` and `cancel_url` to `/settings/billing`.
   - Set `metadata: { user_id: profile.id }` so the webhook can link back.
   - Save the `stripe_customer_id` to the profile if newly created.
   - Return the Checkout Session URL.

4. **Build the webhook handler** (`POST /api/stripe/webhook`):
   - Verify the Stripe signature.
   - **Route events by source** — check for the `account` field on the event to distinguish Clinch platform events from Connect events:
     - **Platform events** (no `account` field):
       - `checkout.session.completed` with `mode === 'subscription'`: read `metadata.user_id`, determine the tier from `session.line_items[0].price.id`, update `profiles.subscription_tier` and `subscription_status`.
       - `customer.subscription.updated`: check `status`. If `active` → update tier. If `past_due` / `unpaid` → update `subscription_status`.
       - `customer.subscription.deleted`: set `subscription_tier = 'free'`, `subscription_status = 'cancelled'`.
     - **Connect events** (has `account` field — a connected account ID):
       - `checkout.session.completed`: read `session.metadata.invoice_id` → update `invoices.payment_status = 'paid'`. See §1.6a for full matching spec.

5. **Create a Customer Portal configuration** in Stripe Dashboard under the "Clinch" application. Build API route `POST /api/stripe/portal` that creates a portal session and returns the URL.

### Day 2-3: Dashboard Wiring

1. **Build the dashboard data API** (`GET /api/dashboard`):
   - Query proposals: count by status, calculate win rate (`won / (won + lost) * 100`).
   - Query invoices: sum of totals for the current month, count by payment status.
   - Return structured stats.

2. **Wire the Dashboard page:**
   - **Stat cards:** Proposals Sent (this month), Win Rate (%), Revenue This Month ($).
   - **Recent Proposals:** Last 5 proposals with status badges. Click to navigate.
   - **Recent Invoices:** Last 5 invoices with payment status. Click to navigate.
   - **Quick actions:** "New Proposal" and "New Invoice" buttons.

3. **Polish the empty states** — design attractive empty state illustrations with clear CTAs.

### Day 3-4: UI Polish & UX Refinements

1. **Global design system check:**
   - Consistent spacing, typography, and colour usage across all pages.
   - Dark mode support — use shadcn's built-in dark mode toggle (CSS variables). Store preference in `localStorage`.
   - Loading states: use Skeleton components everywhere data is being fetched.
   - Error states: toast notifications for API errors using shadcn's `toast` component.
   - Success states: toast notifications for successful actions.

2. **Responsive design pass:**
   - All pages must work on mobile (down to 375px width).
   - Sidebar collapses to a hamburger menu.
   - Forms stack vertically on mobile.
   - Tables switch to card layouts on mobile.

3. **Toast notifications for key actions:**
   - "Proposal generated successfully"
   - "Invoice created — INV-001"
   - "Payment link generated"
   - "Profile updated"
   - Error toasts with actionable messages.

4. **Page transitions:**
   - Add subtle page transition animations using CSS transitions on route change.
   - Smooth scroll behaviour.

5. **Form validation UX:**
   - Inline validation errors (using `react-hook-form` + Zod).
   - Disable submit buttons while forms are invalid or submitting.
   - Show loading spinners on submit buttons during API calls.

### Day 4-5: Deployment & Launch Prep

1. **Environment variables:** Set all required env vars in Vercel:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   OPENAI_API_KEY
   STRIPE_SECRET_KEY
   STRIPE_WEBHOOK_SECRET
   STRIPE_PRO_PRICE_ID
   STRIPE_AGENCY_PRICE_ID
   STRIPE_CONNECT_CLIENT_ID
   RESEND_API_KEY
   NEXT_PUBLIC_APP_URL
   ```

2. **Supabase production setup:**
   - Run all migrations against the production Supabase project.
   - Verify RLS policies are active.
   - Set up Supabase Storage bucket (`logos`) with correct permissions.

3. **Stripe production setup:**
   - Switch from Stripe test mode to live mode.
   - Create live Products and Prices.
   - Set up the webhook endpoint pointing to the production URL.
   - Register the Connect redirect URIs.

4. **Deploy to Vercel:**
   - Connect the Git repository.
   - Deploy. Verify the build succeeds.
   - Test the complete flow end-to-end on the production URL:
     - Sign up → onboarding → create client → generate proposal → edit → download PDF → create invoice → generate payment link → download invoice PDF.
     - Subscribe to Pro → verify limits are lifted.

5. **SEO and metadata:**
   - `app/layout.tsx`: set `metadata` with title, description, Open Graph tags.
   - Add a `favicon.ico` and `apple-touch-icon.png`.
   - Add `robots.txt` and `sitemap.xml` for the marketing pages (if any).

---

## 5. Phase 2 — Feature Briefs

> [!NOTE]
> Phase 2 features are built **only after Phase 1 is live and has at least 10 paying users.** Each feature below is independent and can be built in any order unless a dependency is noted. All branding in Phase 2 must use "Clinch" — never "PropAI".

---

### 5.1 Proposal Open Tracking

**What it requires:**
- A new column on `proposals`: `hosted_link_token` (UUID, unique, nullable). Generated when the user clicks "Share as Link".
- A new public route: `/view/proposal/[token]` — no auth required. This renders a read-only view of the proposal.
- A new table `proposal_views`: `id`, `proposal_id`, `viewed_at` (timestamptz), `ip_address`, `user_agent`.
- On page load of the public view, an API call logs the view. First view auto-updates `proposals.status` to `'viewed'`.
- Dashboard integration: show view count and last viewed timestamp on the proposal detail page.

**Depends on (Phase 1):** Proposals CRUD, proposal detail page.

**Implementation notes:**
- Use a server component for the public view to log the view server-side (no client-side fetch needed).
- Rate-limit view logging to prevent spam (max 1 view per IP per hour).
- Do not use tracking pixels or external services — all self-hosted.

---

### 5.2 E-Signature

**What it requires:**
- Extend the hosted proposal view (`/view/proposal/[token]`) with a signature section at the bottom.
- New table `signatures`: `id`, `proposal_id`, `signer_name`, `signer_email`, `signature_data` (text — base64 encoded PNG of the drawn signature, or the typed name), `signature_type` (check: `'draw'`, `'type'`), `ip_address`, `signed_at` (timestamptz).
- Canvas-based signature pad (use a library like `react-signature-canvas` or build a simple one with HTML Canvas).
- Type-to-sign alternative: user types their name, rendered in a script font as the "signature".
- On submit: save to `signatures` table, update `proposals.status` to `'signed'` (add to status enum), send confirmation emails via Resend to both the freelancer and the client.
- The signed proposal can no longer be edited by the freelancer (lock `edited_content`).

**Depends on (Phase 1):** Proposals CRUD, Resend integration.
**Depends on (Phase 2):** Proposal open tracking (the hosted link infrastructure).

**Implementation notes:**
- Signature data should be stored as a base64 PNG (for drawn) or plain text (for typed).
- Include the signature image in the PDF export when downloading a signed proposal.
- Legal disclaimer text above the signature: "By signing, you agree to the terms outlined in this proposal."

---

### 5.3 Proposal Templates

**What it requires:**
- New table `templates`: `id`, `user_id`, `name`, `project_type`, `tone`, `default_deliverables` (text array), `default_timeline`, `default_budget` (integer), `content_structure` (jsonb — same shape as `edited_content` but with placeholder markers), `created_at`.
- "Save as Template" button on any completed proposal — opens a dialog to name the template. Saves a sanitised version (strips client-specific content but keeps structure and generic text).
- Template selector in the proposal creation form — dropdown at the top. On select, pre-fills all fields except client.
- Templates list page accessible from Settings or a sub-nav under Proposals.
- CRUD for templates (rename, delete, preview).

**Depends on (Phase 1):** Proposals CRUD, AI generation.

**Implementation notes:**
- When saving as a template, strip `client_name`, `client_email`, and `client_company` from the content. Replace with placeholders like `[Client Name]`.
- Templates should be usable without re-running AI — they pre-fill the editor directly.

---

### 5.4 Follow-Up Reminders

**What it requires:**
- A Supabase Edge Function running on a cron schedule (daily at 9am UTC).
- The function queries: `SELECT * FROM proposals WHERE status = 'sent' AND updated_at < NOW() - INTERVAL '3 days'`.
- For each matching proposal, send an email to the freelancer via Resend:
  - Subject: "Follow up on your proposal to {client_name}?"
  - Body: Brief nudge with the proposal title, client name, and a CTA button linking to the proposal in Clinch.
- Add a boolean column to proposals: `reminder_sent` (default false). Set to true after the first reminder. Only send one reminder per proposal.
- The email includes a "Draft a Follow-Up" button that links to a pre-filled compose view (Phase 2 stretch — for MVP of this feature, just link to the proposal).

**Depends on (Phase 1):** Proposals CRUD, status management, Resend integration.

**Implementation notes:**
- Use Supabase's `pg_cron` extension or Edge Function cron for scheduling.
- Resend rate limits: batch the emails if there are many (unlikely for early users, but good practice).
- Make the reminder opt-out-able via a toggle in Settings.

---

### 5.5 Recurring Invoices

**What it requires:**
- New table `recurring_invoices`: `id`, `user_id`, `client_id`, `line_items` (jsonb), `tax_percent`, `discount_type`, `discount_value`, `currency`, `frequency` (check: `'weekly'`, `'monthly'`), `start_date`, `next_run_date`, `is_active` (boolean), `created_at`.
- UI to create a recurring invoice: same form as a regular invoice but with frequency selector and start date.
- A Supabase Edge Function on a daily cron that checks `WHERE next_run_date <= NOW() AND is_active = true`. For each match:
  1. Creates a new invoice record (copies fields from the recurring template).
  2. Assigns the next invoice number.
  3. If the user has Stripe Connect, generates a Payment Link.
  4. Generates the invoice PDF.
  5. Sends the PDF + payment link to the client via Resend.
  6. Updates `next_run_date` to the next occurrence.
  7. Sends a notification email to the freelancer.
- Recurring invoices management page: list, activate/deactivate, edit, delete.

**Depends on (Phase 1):** Invoice builder, invoice PDF generator, Stripe Connect, Resend.

**Implementation notes:**
- Edge Functions have a 60-second timeout. PDF generation + Stripe API + email should fit within this, but monitor.
- If a recurring invoice fails (e.g., Stripe error), log the failure and retry on the next cron run. Send a notification to the freelancer about the failure.
- Store the last generated invoice ID on the recurring record for auditing.

---

### 5.6 Multi-Currency Support

**What it requires:**
- The `currency` column already exists on `invoices` (defaulting to `'usd'`). Extend the UI to expose it.
- Supported currencies: `USD`, `EUR`, `GBP`, `INR`, `AUD`, `CAD`.
- Currency selector dropdown on the invoice form.
- Currency formatting utility (`lib/utils.ts`): format amounts with the correct symbol (`$`, `€`, `£`, `₹`, `A$`, `C$`) and decimal conventions.
- Stripe Payment Links: pass the selected `currency` to `stripe.prices.create()`. Stripe handles the rest natively.
- PDF generator: use the correct currency symbol in all amount displays.
- Dashboard: display all amounts in the user's "default currency" (add a `default_currency` field to `profiles`). For MVP of this feature, just display raw amounts with their individual currency symbols — no conversion.

**Depends on (Phase 1):** Invoice builder, invoice PDF generator, Stripe Connect.

**Implementation notes:**
- Do NOT implement currency conversion. Each invoice is in one currency. The dashboard just shows the symbol.
- Stripe supports all listed currencies natively for Payment Links.
- Validate that the Stripe connected account supports the selected currency (some accounts are restricted by country). Handle gracefully with a user-facing error message.

---

## Dependency Graph Summary

```
Week 1 (Foundation):
  Homepage → Auth → Onboarding → Profile/Settings → Clients → Dashboard skeleton

Week 2 (Core Product):
  Proposals CRUD → AI Generation → Proposal Editor → Proposal PDF → Send to Client
  Invoices CRUD → Invoice Builder → Invoice PDF → Send to Client
  Stripe Connect → Payment Link → Invoice PDF (with Pay button)

Week 3 (Monetisation & Polish):
  Stripe Subscription → Paywall enforcement → Billing page
  Dashboard wiring (depends on proposals + invoices existing)
  UI polish → Deployment

Phase 2 (Post-launch):
  Open Tracking → E-Signature (depends on tracking's hosted link)
  Templates (independent)
  Follow-up Reminders (independent, needs Resend)
  Recurring Invoices (independent, needs invoices + Stripe + Resend)
  Multi-Currency (independent, needs invoices)
```

---

> [!CAUTION]
> **Do not build Phase 2 features during Phase 1 development.** Do not add fields, tables, or UI hooks "just in case" for Phase 2. The Phase 1 schema and codebase should be clean and minimal. Phase 2 work begins only after the product is live and validated with paying users.

---

## 6. Testing Strategy

> [!IMPORTANT]
> **Testing is not optional.** Clinch handles Stripe payments, user authentication, and AI-generated content. A bug in any of these areas means lost revenue, broken trust, or security exposure. The testing strategy below is ordered by priority.

### 6.1 Unit Tests

**Framework:** Vitest (ships with Vite, works natively with Next.js and TypeScript).

**Install:**
```
vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

**What to unit test (priority order):**

| Priority | Module | What to test |
|----------|--------|--------------|
| P0 | `lib/validators/*.ts` | Every Zod schema — valid input passes, invalid input fails with correct error messages |
| P0 | `lib/utils.ts` | Currency formatting, date helpers, text truncation |
| P0 | `lib/pdf/proposal.tsx` | Component renders without errors for various input shapes (missing logo, long text, empty deliverables) |
| P0 | `lib/pdf/invoice.tsx` | Component renders line items, tax, discount, and total correctly |
| P1 | `lib/email/templates.ts` | Templates produce valid HTML, include required fields, handle missing optional fields |
| P1 | `lib/rate-limit.ts` | Rate limiter blocks after N requests, resets after window |
| P2 | `components/proposals/*` | ProposalForm validation, ClientSelect interaction |
| P2 | `components/invoices/*` | LineItemRow calculations, dynamic add/remove |

**Test file convention:** Co-locate test files as `*.test.ts` / `*.test.tsx` next to the source file.

### 6.2 Integration Tests (API Routes)

**What to test:**

| Priority | API Route | Test scenarios |
|----------|-----------|----------------|
| P0 | `POST /api/stripe/webhook` | Platform subscription events (created, updated, deleted), Connect payment events, invalid signatures rejected, malformed events return 400 |
| P0 | `POST /api/proposals/generate` | Free tier limit enforcement, monthly counter reset, rate limiting, successful generation, OpenAI failure handling |
| P0 | `POST /api/stripe/payment-link` | Free tier rejection, missing Stripe Connect, successful creation with correct `metadata.invoice_id` |
| P1 | `POST /api/proposals/[id]/send` | Email sent with PDF attachment, status updated to 'sent', missing client_email returns 400 |
| P1 | `PATCH /api/profile` | Zod validation, partial updates, onboarding_completed flag |
| P1 | `POST /api/upload` | File type validation, size validation, successful upload |
| P2 | All CRUD routes | Auth enforcement (401 without session), RLS enforcement (403 for wrong user's data) |

**Mocking strategy:**
- Mock `@supabase/ssr` server client with a test helper that returns controlled data.
- Mock `openai` with a fixture response (valid JSON matching the expected schema).
- Mock `stripe` using Stripe's official test helpers or a simple mock returning known objects.
- Mock `resend` to capture sent emails in-memory for assertion.

### 6.3 End-to-End Tests

**Framework:** Playwright.

**Critical user flows to test (run against a staging environment with test Stripe keys):**

1. **Sign-up → Onboarding → Dashboard:** Full flow from email signup through onboarding wizard to landing on dashboard.
2. **Proposal lifecycle:** Create proposal → AI generation → edit content → download PDF → send to client → update status.
3. **Invoice lifecycle:** Create invoice → add line items → generate payment link → download PDF → send to client.
4. **Paywall enforcement:** Free user hits 5-proposal limit → upgrade modal appears → clicking upgrade navigates to billing.
5. **Auth guards:** Unauthenticated access to `/(app)` routes redirects to `/login`.

**E2E test guidelines:**
- Run E2E tests only in CI against a dedicated staging Supabase project (not production).
- Seed the test database with known fixtures before each test run.
- Use Stripe test mode keys and Stripe's test card numbers.
- Keep E2E tests focused on critical paths — do not test UI styling.

### 6.4 Manual Testing Checklist (Pre-Launch)

- [ ] Complete signup→onboarding→proposal→invoice→PDF→payment link flow end-to-end on production
- [ ] Verify Stripe subscription upgrade from Free to Pro works, and limits are lifted immediately
- [ ] Verify Stripe Connect OAuth flow completes and payment links are generated on the connected account
- [ ] Verify webhook receives events and updates invoice payment status to 'paid'
- [ ] Test on mobile (375px viewport) — all pages render correctly
- [ ] Test dark mode toggle across all pages
- [ ] Verify PDF output: logo renders, brand colour applied, text wraps correctly, Pay Now link is clickable
- [ ] Verify email arrives with PDF attachment and correct formatting
- [ ] Test rate limiting: rapidly submit 4+ proposal generations, verify 429 response
- [ ] Verify RLS: attempt API calls with a different user's resource ID, confirm 404/403

---

## Appendix: Gap Patches Applied

The following clarifications were added after the initial draft to prevent agent implementation errors:

| # | Gap | Where fixed |
|---|-----|------------|
| 1 | API error contract — standard `{ error, code }` shape + status codes | §1.0 |
| 2 | Onboarding redirect edge case — completed users hitting `/onboarding` → `/dashboard` | §1.2 |
| 3 | Free tier paywall exact behaviour — `LIMIT_EXCEEDED` → upgrade modal, not toast | §1.7, §3 Week 2 Day 1 |
| 4 | Logo upload spec — PNG/JPG only, 2MB, deterministic overwrite path | §1.5a |
| 5 | Stripe Connect webhook invoice matching — `metadata.invoice_id` on Payment Link | §1.6a, §3 Week 2 Day 5 |
| 6 | Replaced `pdf-lib` with `@react-pdf/renderer` for premium, serverless-native PDF generation | §1.5 |
| 7 | Added atomic Postgres function for proposal counter reset + increment | §1.3a |
| 8 | Added API rate limiting spec with per-route limits | §1.8 |
| 9 | Added "Send to Client" email flow with PDF attachment via Resend | §1.9 |
| 10 | Added comprehensive testing strategy (unit, integration, E2E, manual) | §6 |
| 11 | Replaced all "PropAI" references with "Clinch" | Throughout |
