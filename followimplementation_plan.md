# Smart Invoice Follow-Ups

Automate payment reminders for unpaid invoices so freelancers never have to manually chase payments again. Reminders escalate in tone (gentle → firm → final) and auto-stop when the invoice is paid, cancelled, or the follow-up limit is reached.

## User Review Required

> [!IMPORTANT]
> **Resend "from" address:** Follow-up emails will be sent from `Clinch <notifications@clinch.dev>`, matching the existing email pattern in `mark-paid` and `publish` routes. If you want a different sender address (or per-freelancer custom domains), that's a Resend configuration step separate from this feature.

> [!IMPORTANT]
> **Vercel Cron requires the Pro plan.** Vercel's cron jobs are only available on the Pro plan ($20/mo). If you're on Hobby, the cron route won't execute. An alternative would be an external cron service (e.g., cron-job.org, free tier) that hits the API endpoint — same code, different trigger.

## Open Questions

> [!IMPORTANT]
> **Reminder schedule:** The plan uses **3 → 7 → 14 days** after invoice creation (or due date if set) as the default follow-up cadence. Do you want different intervals?

> [!IMPORTANT]
> **Per-invoice toggle:** Should freelancers be able to disable follow-ups on individual invoices (e.g., via a toggle in the invoice table), or should it be a global on/off in settings? The plan implements **per-invoice control** — a toggle in the invoice row actions + a default setting in the profile.

---

## Proposed Changes

### Database Schema

#### [NEW] `supabase/migrations/013_invoice_followups.sql`

Adds follow-up tracking columns to the existing `invoices` table (no new tables needed):

```sql
-- Follow-up tracking columns on invoices table
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS followups_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS followup_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_followup_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_followup_at timestamptz;

-- Global default on profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS auto_followups_enabled boolean NOT NULL DEFAULT true;

-- Index for the cron query (find invoices needing a reminder RIGHT NOW)
CREATE INDEX IF NOT EXISTS idx_invoices_next_followup
  ON invoices (next_followup_at)
  WHERE status IN ('unpaid', 'payment_claimed')
    AND followups_enabled = true
    AND followup_count < 3;
```

**Column explanations:**
| Column | Purpose |
|--------|---------|
| `followups_enabled` | Per-invoice toggle. Defaults to `true`. Freelancer can turn off for specific invoices. |
| `followup_count` | How many reminders have been sent (0, 1, 2, or 3). Caps at 3. |
| `last_followup_at` | Timestamp of the last reminder sent. Used to calculate the next one. |
| `next_followup_at` | Pre-computed timestamp of when the next reminder should fire. The cron query simply does `WHERE next_followup_at <= NOW()`. This is far more efficient than recalculating schedules on every cron tick. |
| `auto_followups_enabled` | Profile-level default. When creating a new invoice, `followups_enabled` inherits this value. |

**Schedule calculation logic (set on invoice creation and after each followup):**

| `followup_count` | Next followup scheduled at |
|-------------------|---------------------------|
| 0 (just created) | `due_date` or `created_at + 3 days` |
| 1 (after gentle) | `last_followup_at + 4 days` (= day 7) |
| 2 (after firm) | `last_followup_at + 7 days` (= day 14) |
| 3 (after final) | `null` — no more reminders |

---

### Cron API Route

#### [NEW] `src/app/api/cron/invoice-followups/route.ts`

A `GET` endpoint triggered by Vercel Cron every hour. Secured by checking `Authorization: Bearer <CRON_SECRET>`.

**Logic:**
1. Query all invoices where:
   - `status` IN (`'unpaid'`, `'payment_claimed'`)
   - `followups_enabled = true`
   - `followup_count < 3`
   - `next_followup_at <= NOW()`
2. For each invoice:
   - Fetch the freelancer's profile (name, logo, email)
   - Determine reminder tier based on `followup_count` (0→gentle, 1→firm, 2→final)
   - Send the appropriate email via Resend
   - Update the invoice: increment `followup_count`, set `last_followup_at = NOW()`, compute and set `next_followup_at`
3. Return a JSON summary: `{ processed: N, sent: N, errors: N }`

**Rate safety:** Process max 50 invoices per cron tick to stay within Vercel function timeout (60s) and Resend rate limits.

```typescript
// Pseudocode
export async function GET(req: Request) {
  // Verify CRON_SECRET
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  
  const { data: overdueInvoices } = await supabase
    .from('invoices')
    .select('*, profiles!inner(full_name, email, logo_url)')
    .in('status', ['unpaid', 'payment_claimed'])
    .eq('followups_enabled', true)
    .lt('followup_count', 3)
    .lte('next_followup_at', new Date().toISOString())
    .limit(50);

  for (const invoice of overdueInvoices) {
    // Send reminder, update followup_count, compute next_followup_at
  }
}
```

---

### Vercel Cron Configuration

#### [NEW] `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/invoice-followups",
      "schedule": "0 */1 * * *"
    }
  ]
}
```

Runs every hour on the hour. The `CRON_SECRET` env var must be set in Vercel dashboard.

---

### Email Templates

#### [NEW] `src/lib/email/invoice-followups.ts`

Three HTML email templates as functions, consistent with the existing Clinch email style (inline CSS, `-apple-system` font stack, clean layout):

| Tier | Subject Line | Tone | CTA |
|------|-------------|------|-----|
| **Gentle** (day 3) | `Friendly reminder: Invoice {INV-001} for {$amount}` | Casual, warm. "Just a quick reminder that invoice {number} is still outstanding." | "View Invoice" button → hosted invoice page |
| **Firm** (day 7) | `Payment reminder: Invoice {INV-001} — {$amount} due` | Professional, direct. "This is a follow-up regarding the outstanding invoice..." | "View Invoice & Pay" button |
| **Final** (day 14) | `Final notice: Invoice {INV-001} — {$amount} overdue` | Urgent but professional. "This is the final reminder for invoice {number}..." Mentions that this is the last automated reminder. | "Pay Now" button |

All emails include:
- Freelancer's name and logo (if set)
- Invoice number, amount, and due date
- Direct link to the hosted invoice page (`/i/{hosted_token}`)
- "Sent by Clinch" footer
- Unsubscribe-style note: "This is an automated reminder. If you've already paid, please disregard."

---

### Invoice Creation — Set Initial `next_followup_at`

#### [MODIFY] `src/app/api/invoices/create/route.ts`

When inserting a new invoice, compute the initial `next_followup_at`:

```typescript
// After the existing insert fields...
followups_enabled: profileData?.auto_followups_enabled ?? true,
next_followup_at: computeNextFollowup(0, due_date || null),
```

Where `computeNextFollowup(count, dueDate)` returns:
- If `dueDate` is set and in the future → `dueDate` (remind on due date)
- If `dueDate` is set and in the past → `NOW() + 1 day` (already overdue, nudge soon)
- If no `dueDate` → `NOW() + 3 days`

#### [MODIFY] `src/app/api/invoices/create-from-proposal/route.ts`

Same change — set `followups_enabled` and `next_followup_at` on creation.

---

### Stop Follow-Ups on Status Change

#### [MODIFY] `src/app/api/invoices/[id]/mark-paid/route.ts`

Add to the update payload:
```typescript
next_followup_at: null, // Stop future reminders
```

#### [MODIFY] `src/app/api/invoices/[id]/cancel/route.ts`

Add to the update payload:
```typescript
next_followup_at: null, // Stop future reminders
```

These are single-line additions to existing update objects — minimal changes.

---

### UI — Per-Invoice Follow-Up Toggle

#### [MODIFY] `src/app/api/invoices/[id]/edit/route.ts`

Allow updating `followups_enabled` via the existing edit endpoint:
```typescript
if (followups_enabled !== undefined) update.followups_enabled = followups_enabled;
```

#### [MODIFY] `src/app/invoices/page.tsx`

Add a small toggle/icon in the invoice table's Actions column for unpaid invoices:
- Bell icon (🔔) when follow-ups are enabled → click to disable
- Bell-off icon (🔕) when disabled → click to enable
- Tooltip: "Follow-ups enabled" / "Follow-ups disabled"
- Calls `PATCH /api/invoices/{id}/edit` with `{ followups_enabled: true/false }`

Also show a subtle indicator in the Status column:
- If `followup_count > 0`, show small text like "2 reminders sent" below the status badge

---

### Environment Variables

#### [MODIFY] `.env.example`

```
# Cron
CRON_SECRET=your-cron-secret-here
```

The `CRON_SECRET` should be a random string set in Vercel's environment variables. Vercel automatically sends it as `Authorization: Bearer <CRON_SECRET>` when triggering cron jobs.

---

## File Summary

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/013_invoice_followups.sql` | NEW | Add follow-up columns to invoices + profile default |
| `src/app/api/cron/invoice-followups/route.ts` | NEW | Cron handler — query overdue invoices, send reminders |
| `src/lib/email/invoice-followups.ts` | NEW | 3 escalating email templates (gentle/firm/final) |
| `vercel.json` | NEW | Cron schedule config |
| `src/app/api/invoices/create/route.ts` | MODIFY | Set initial `next_followup_at` on creation |
| `src/app/api/invoices/create-from-proposal/route.ts` | MODIFY | Same — set initial `next_followup_at` |
| `src/app/api/invoices/[id]/mark-paid/route.ts` | MODIFY | Clear `next_followup_at` on payment |
| `src/app/api/invoices/[id]/cancel/route.ts` | MODIFY | Clear `next_followup_at` on cancellation |
| `src/app/api/invoices/[id]/edit/route.ts` | MODIFY | Allow toggling `followups_enabled` |
| `src/app/(app)/invoices/page.tsx` | MODIFY | Toggle icon + reminder count indicator |
| `.env.example` | MODIFY | Add `CRON_SECRET` |

---

## Verification Plan

### Automated Tests
1. **Run `pnpm build`** — ensure no TypeScript errors
2. **Run the migration** in Supabase SQL editor against the dev database
3. **Test cron endpoint locally** — call `GET /api/cron/invoice-followups` with the correct auth header and verify it processes test invoices

### Manual Verification
1. Create an invoice with a due date set to today → verify `next_followup_at` is set correctly
2. Wait for (or manually trigger) cron → verify email is sent via Resend dashboard
3. Mark the invoice as paid → verify `next_followup_at` becomes `null`
4. Toggle follow-ups off on an invoice → verify cron skips it
5. Deploy to Vercel → verify cron runs on schedule in the Vercel dashboard logs
