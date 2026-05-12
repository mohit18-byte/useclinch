# Clinch — Hosted Proposal System: Implementation Plan

## Part 1 — Upfront Decisions

### 1.1 Template Registry Pattern
Static registry object at `src/templates/registry.ts`. Maps `template_id` string → `{ component, themes }`. With only 2 templates at launch, use direct imports (no dynamic `import()`). Each template folder (`src/templates/dark-editorial/`, `src/templates/apple-minimal/`) exports its component and themes file. Adding a template = add folder + one line in registry. Zero routing changes.

### 1.2 Runtime Theme Application — Zero Flash
Themes are **CSS custom properties** injected as an inline `style` attribute on the template wrapper `<div>`. Since the hosted page is a server component, the variables are in the HTML before it reaches the browser. No hydration flash. Theme object shape:
```
{ accent, accentForeground, background, surface, surfaceAlt, text, textMuted, border }
```
Each value is a raw CSS color string. The template component uses `var(--proposal-accent)` etc. The wrapper sets `style={{ '--proposal-accent': theme.accent, ... }}`.

### 1.3 Editor Preview Sync
Single `zustand` store holds the entire proposal editing state: `edited_content_json`, `sections_config`, `template_id`, `theme_id`. Both the sidebar controls and the preview panel read from this store. Edits update the store immediately (optimistic). A debounced function (2s idle) PATCHes the API. The preview re-renders only the changed section via React's diffing — no full re-render needed because each section is a memoized component keyed by section id.

### 1.4 Malformed Data on Hosted Page
Every section renderer receives its data through a normalizer function that provides defaults for missing/malformed fields. If `content_json.problem` is null or missing, that section simply doesn't render (skip it in the loop). The page never crashes — worst case it shows a minimal proposal with just cover + CTA. Zod validation happens on write (API routes). Reads are permissive.

### 1.5 PDF Export
API route `GET /api/proposals/[id]/pdf`. Launches headless Chromium via `@sparticuz/chromium-min` + `puppeteer-core`. Navigates to the actual hosted URL `/p/[token]?pdf=true`. The `pdf=true` query param triggers: hide Accept button, hide Stripe button, collapse FAQ accordion to show all answers, remove any hover effects. `page.pdf()` with A4 format returns the binary. The PDF is pixel-identical to the webpage.

---

## Part 2 — Build Order

### Stage 1: Template System Foundation
**What:** Template TypeScript interface (`ProposalTemplateProps`), theme type, registry file, both template components (dark-editorial, apple-minimal) with hardcoded mock data, themes.ts for each.
**Why first:** Everything downstream renders through templates. The editor preview, hosted page, and PDF all consume the same template component. This must be rock-solid before anything else.
**Test:** Import a template from registry, render it with mock data in a throwaway page, switch themes via a button. All 10 sections render. Theme colors change instantly with no flash.

### Stage 2: Database Schema Update
**What:** New migration replacing the proposals content structure. New columns: `content_json` (jsonb, 10-section shape), `edited_content_json` (jsonb, copy), `sections_config` (jsonb — `{ order: string[], visibility: Record<string, boolean> }`), `template_id` (text, default `'dark-editorial'`), `theme_id` (text, default `'midnight'`), `hosted_token` (uuid, unique, auto-generated). Drop old `generated_content`, `edited_content` columns. Add `proposal_views` table and `proposal_events` table for analytics.
**Why second:** The AI generation and editor both need to write to this schema. Must exist before either.
**Test:** Insert a proposal row manually via Supabase SQL editor with all new columns populated. Query it back. Confirm `hosted_token` uniqueness constraint works.

### Stage 3: AI Generation (New 10-Section Format)
**What:** Update the system prompt to output the new 10-key JSON (`cover`, `problem`, `solution`, `approach`, `deliverables`, `timeline`, `pricing`, `about`, `faq`, `cta`). Update `POST /api/proposals/generate` to save `content_json`, copy to `edited_content_json`, set default `sections_config` (cover first/locked, cta last/locked, faq off, rest on in default order), generate `hosted_token`, set `template_id` and `theme_id` defaults.
**Why third:** Depends on schema (Stage 2). The editor (Stage 4) needs real AI-generated data to work with.
**Test:** Call the generate endpoint with test input. Verify the saved proposal has all 10 sections in `content_json`, `sections_config` has correct defaults, `hosted_token` is a valid UUID.

### Stage 4: Hosted Proposal Page
**What:** `/p/[token]` route. Server component that fetches proposal by `hosted_token`, looks up template + theme from registry, renders the template component filtering sections by `sections_config`, logs a view. Three client islands: AcceptButton, DepositButton, FAQAccordion.
**Why fourth:** Depends on templates (Stage 1) and real data (Stage 3). The editor preview (Stage 5) will reuse the same template components, so proving they work on the hosted page first catches issues early. Also, PDF export (Stage 7) renders this page.
**Test:** Generate a proposal, visit `/p/[token]`. Full proposal renders with correct template and theme. Sections respect visibility config. Accept button works (flips status, sends email). Page loads in under 2 seconds.

### Stage 5: The Editor
**What:** `/proposals/[id]/edit` page. Left-right split. Left = live preview (template component rendered directly from zustand store). Right = editor sidebar with: section toggles, drag-and-drop reorder (@dnd-kit), inline content editing (textareas/inputs per field), template picker, theme picker, Share button (copy hosted link), Download PDF button. Zustand store. Debounced auto-save.
**Why fifth:** Depends on templates (Stage 1), schema (Stage 2), and real data (Stage 3). The hosted page (Stage 4) proves the templates work before we build the complex editor.
**Test:** Generate a proposal → land on editor. Toggle a section off → preview updates instantly. Drag a section → preview reorders. Edit text → preview reflects change. Wait 2s → verify PATCH was sent. Reload page → all changes persisted. Switch template → preview re-renders with new layout. Switch theme → colors change with no flash.

### Stage 6: Proposal Analytics
**What:** View logging (already started in Stage 4). Add: section scroll depth tracking via IntersectionObserver on the hosted page (beacon API to `POST /api/proposals/[id]/events`), time-on-page via `visibilitychange` event, accept/deposit click event logging. Analytics dashboard on the proposal detail page showing: total views, unique views, avg time on page, section-level read rates, accept/payment status.
**Why sixth:** The hosted page must work first (Stage 4). Analytics is additive — it doesn't block core functionality.
**Test:** Visit a hosted proposal. Check `proposal_views` table — row exists. Scroll through sections. Check `proposal_events` — scroll events logged. View the analytics on the proposal detail page — data displays correctly.

### Stage 7: PDF Export
**What:** `GET /api/proposals/[id]/pdf` route. Chromium helper (`lib/pdf/browser.ts`). Fetches the hosted URL with `?pdf=true`, renders to PDF, returns binary.
**Why last:** Depends on the hosted page being fully built (Stage 4). PDF is a secondary feature — the hosted page is the primary deliverable.
**Test:** Call the PDF endpoint. PDF downloads. Open it — it looks identical to the hosted page minus interactive elements. Clickable links work in the PDF.

---

## Part 3 — The Editor Deep Dive

### Split Layout
CSS Grid: `grid-template-columns: 1fr 420px`. Left panel scrolls independently (the preview). Right panel scrolls independently (the sidebar). No resize handle for MVP — fixed split. On screens < 1024px, show tabs (Preview / Edit) instead of split. The preview panel has a zoom control (50%, 75%, 100%) implemented via CSS `transform: scale()` on the preview container with `transform-origin: top center`.

### Real-Time Preview Sync
Zustand store shape:
```
{ editedContent, sectionsConfig, templateId, themeId, isSaving, lastSaved }
```
The preview panel renders: `<TemplateComponent data={editedContent} sections={sectionsConfig} theme={resolvedTheme} />`. Since the preview reads directly from the store (via `useStore` selector), any mutation triggers a re-render of only the affected section. Each section component is wrapped in `React.memo` with a comparison function that checks only its own slice of `editedContent`.

### Inline Editing (No Rich Text Library)
Every text field in the sidebar is a plain `<textarea>` or `<input>`. No contentEditable, no rich text. Proposal content is plain text only — no bold, italic, links. This is intentional: proposals should be clean and consistent. The AI generates plain text, the freelancer edits plain text, the template handles all visual formatting.

For the `deliverables` section (array of items): each deliverable is an input row with a delete button. "Add deliverable" button appends a row. Same pattern for FAQ items (pairs of Q + A inputs).

### Drag-and-Drop Reordering
`@dnd-kit/core` + `@dnd-kit/sortable`. The sortable list contains only the 8 middle sections (not cover/cta). Each item shows: drag handle, section name, visibility toggle. On drag end: update `sectionsConfig.order` in the zustand store. The preview re-renders with the new order instantly. Auto-save persists the new order.

Implementation: `SortableContext` with `verticalListSortingStrategy`. Each item uses `useSortable()`. The `onDragEnd` handler reads `active.id` and `over.id`, computes the new array via `arrayMove()`, and calls `store.setSectionsConfig()`.

### Debounced Auto-Save
```
useEffect that watches store changes → clears previous timeout → sets new 2s timeout → on fire: PATCH /api/proposals/[id] with { edited_content_json, sections_config, template_id, theme_id }
```
Use an `AbortController` to cancel in-flight requests when a new save triggers. Show save status: "Saving..." → "Saved" → fades after 1.5s. On unmount, flush any pending save immediately (no debounce).

---

## Part 4 — The Hosted Page Deep Dive

### Rendering Strategy: Dynamic SSR
**Decision: Dynamic server rendering (no cache).** Not SSG (proposals change after creation — editor edits). Not ISR (stale content is unacceptable — freelancer edits and shares the link immediately, client must see latest). Use `export const dynamic = 'force-dynamic'` on the route.

The server component fetches the proposal, resolves template + theme, renders to HTML, streams to client. The three interactive elements (Accept, Deposit, FAQ) are client components embedded as islands.

### View Logging Without Slowing Page Load
Do NOT log the view in the server component's render path — that would block SSR. Instead: render a tiny client component `<ViewLogger proposalId={id} />` that fires a `POST /api/proposals/[id]/view` on mount via `useEffect`. This is fire-and-forget — no await, no error handling needed. The view logging is completely async and invisible to the user.

For scroll depth: each section wrapper gets an `IntersectionObserver` (threshold: 0.5). When a section enters view, log it via `navigator.sendBeacon()` to `POST /api/proposals/[id]/events` with `{ type: 'section_view', section: 'pricing' }`. Beacon API is non-blocking and survives page close.

Time on page: record `Date.now()` on mount. On `visibilitychange` (hidden) or `beforeunload`, send beacon with elapsed time.

### Interactive Elements Without Auth
The client viewing the proposal has no Clinch account. All three interactions use the proposal's `hosted_token` as the authentication equivalent:

- **Accept:** `POST /api/proposals/[token]/accept` — flips status to `accepted`, sends email to freelancer via Resend. No request body needed. Idempotent — clicking twice doesn't double-send.
- **Deposit:** `POST /api/proposals/[token]/deposit` — creates a Stripe Checkout Session via the freelancer's connected account, returns the checkout URL. Client is redirected to Stripe. On success, webhook updates proposal status.
- **FAQ:** Pure client-side accordion. No API calls.

### Protection Against Token Enumeration and Spam
- Tokens are v4 UUIDs (122 bits of entropy). Brute-forcing is computationally infeasible.
- Rate limit `/p/[token]` to 30 requests per minute per IP using `rate-limiter-flexible`.
- Rate limit the accept endpoint to 3 calls per hour per IP.
- View logging deduplicates by IP + user-agent hash — same visitor reloading doesn't inflate view count.
- No sequential IDs anywhere. No information leakage in 404 responses (return the same generic 404 page whether the token is close to a real one or not).

---

## Part 5 — The Template System Deep Dive

### The Interface Contract
Every template component must satisfy this TypeScript interface:
```typescript
interface ProposalTemplateProps {
  proposal: {
    projectTitle: string;
    clientName: string;
    clientEmail: string;
    amount: number; // cents
    currency: string;
    createdAt: string;
  };
  content: Record<SectionKey, SectionData>; // the 10 sections
  sections: {
    order: SectionKey[];
    visibility: Record<SectionKey, boolean>;
  };
  profile: {
    fullName: string;
    bio: string;
    services: string[];
    logoUrl: string | null;
    brandColor: string;
  };
  theme: ThemeVariables;
  isPdf?: boolean; // true when rendering for PDF export
}
```
The template loops through `sections.order`, checks `sections.visibility[key]`, and renders the corresponding section component. Cover is always first, CTA always last — the template enforces this regardless of what `order` says.

### Registry and Loading
```typescript
// src/templates/registry.ts
export const TEMPLATE_REGISTRY = {
  'dark-editorial': {
    name: 'Dark Editorial',
    component: DarkEditorialTemplate,
    themes: darkEditorialThemes, // Record<string, ThemeVariables>
    defaultTheme: 'midnight',
  },
  'apple-minimal': {
    name: 'Apple Minimal',
    component: AppleMinimalTemplate,
    themes: appleMinimalThemes,
    defaultTheme: 'snow',
  },
} as const;
```
Lookup: `TEMPLATE_REGISTRY[proposal.template_id]`. If `template_id` is invalid, fall back to `dark-editorial`. If `theme_id` is invalid within the resolved template, fall back to that template's `defaultTheme`.

### Runtime Theme — Zero Flash
The theme is resolved server-side. The server component calls `resolveTheme(templateId, themeId)` which returns the CSS variable object. This is passed as a `style` prop to the template wrapper div:
```html
<div style={{ '--proposal-accent': '#6366f1', '--proposal-bg': '#0a0a0b', ... }}>
  <TemplateComponent ... />
</div>
```
Since these are inline styles in the server-rendered HTML, they're present before any JavaScript executes. Zero flash. The template's CSS only references `var(--proposal-*)` — never hardcoded colors.

### Adding a New Template
1. Create `src/templates/new-template/index.tsx` (component satisfying `ProposalTemplateProps`)
2. Create `src/templates/new-template/themes.ts` (5 theme objects)
3. Add one entry to `TEMPLATE_REGISTRY`
4. Done. No routing changes. No database changes. The editor's template picker reads from the registry dynamically.

---

## Part 6 — Gotchas and Risks

### 1. AI Returns Malformed JSON
**What goes wrong:** OpenAI returns JSON missing keys, wrong types, or truncated output (hits token limit mid-JSON). Proposal saves with broken content. Editor and hosted page crash.
**Mitigation:** Zod-validate the AI output immediately after `JSON.parse()`. Define a strict schema for all 10 sections. If validation fails, retry once with the same prompt. If second attempt fails, return a 500 to the user with "Generation failed, please try again." Never save unvalidated content to the database.

### 2. Auto-Save Race Conditions
**What goes wrong:** User makes edit A, auto-save fires. Before A's PATCH completes, user makes edit B, second auto-save fires. If B's request arrives at the server before A's, then A overwrites B's changes when it completes.
**Mitigation:** Use an AbortController. When a new save triggers, abort the previous in-flight request. Only the latest save ever completes. The server always receives the most recent state. Add an `updated_at` timestamp check — the PATCH only succeeds if the row's `updated_at` matches what the client last read (optimistic concurrency).

### 3. Editor Preview Performance
**What goes wrong:** Every keystroke in a textarea triggers a zustand store update, which re-renders the entire preview panel. With large proposals and complex templates, this causes visible lag.
**Mitigation:** `React.memo` on every section component with shallow comparison of its own data slice. The preview only re-renders the section being edited. Additionally, the textarea updates local component state on every keystroke but only pushes to the zustand store on blur or after a 300ms debounce — the preview updates slightly delayed but the typing experience is smooth.

### 4. Hosted Page — Token in URL is Shared Publicly
**What goes wrong:** The hosted URL `/p/[token]` is intentionally public, but a freelancer might accidentally share it somewhere they didn't intend. Anyone with the link can see the proposal, click Accept, or initiate a deposit.
**Mitigation:** This is by design (like Google Docs "anyone with the link"). But: the Accept button should show a confirmation dialog with the client's name ("Accept this proposal as [Client Name]?"). The deposit button redirects to Stripe which has its own security. Add a "Revoke link" button in the editor that regenerates the token, invalidating the old URL.

### 5. PDF Rendering Differences
**What goes wrong:** Chromium's headless PDF renderer handles CSS slightly differently than the browser. Gradients, backdrop-blur, animations, and viewport-dependent layouts can look wrong in the PDF.
**Mitigation:** Templates must detect the `isPdf` prop and disable: animations, backdrop-blur, sticky positioning, hover effects. Use `@media print` CSS as a secondary safety net. Test PDF output for both templates during development — don't assume it matches.

### 6. Template CSS Leaking into Editor
**What goes wrong:** The editor renders the template component directly (not in an iframe). If a template uses global CSS or Tailwind utilities that conflict with the editor's UI, styles bleed between panels.
**Mitigation:** Templates must use only CSS variables scoped to their container (`var(--proposal-*)`). No global styles. No `@apply`. The preview panel wrapper has `isolation: isolate` and `contain: content` CSS properties. Template root element uses a unique class prefix (e.g., `.tpl-dark-editorial`).

### 7. Stripe Connect Not Onboarded
**What goes wrong:** Freelancer enables a deposit on their proposal but hasn't connected their Stripe account. Client clicks "Pay Deposit" and gets an error.
**Mitigation:** If the freelancer's `stripe_connect_onboarded` is false, hide the deposit button on the hosted page entirely. In the editor, show the deposit amount field but with a warning: "Connect your Stripe account in Settings to enable deposits." The deposit button only appears on the hosted page when Stripe Connect is fully set up.

### 8. Section Data Shape Inconsistency
**What goes wrong:** Different sections have different data shapes (deliverables is an array of items, FAQ is an array of Q/A pairs, cover has title + subtitle, etc.). A generic editor that treats all sections as "text" breaks for structured sections.
**Mitigation:** Define a discriminated union type for section data. Each section key maps to a specific data interface. The editor sidebar renders a different editing UI per section type: plain textarea for text sections, item list editor for deliverables, Q/A pair editor for FAQ, structured fields for cover (title, subtitle, date). This is more work upfront but prevents a whole class of bugs.

### 9. View Count Inflation from Bots and Previews
**What goes wrong:** The freelancer previewing their own proposal in the editor inflates view counts. Search engine crawlers or link preview bots (Slack, Twitter) hit the page and log views.
**Mitigation:** Filter views by: (1) if the request has a valid Clinch auth cookie, don't count it as a client view — it's the freelancer previewing; (2) check User-Agent against a known bot list and exclude; (3) deduplicate by IP hash within a 1-hour window. Store `is_owner_view: boolean` on view records for analytics accuracy.
