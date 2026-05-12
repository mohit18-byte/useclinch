import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/service';
import type { Invoice, InvoiceLineItem, Profile } from '@/lib/database.types';
import type { Metadata } from 'next';
import CopyButton from './copy-button';
import ClaimPaymentButton from './claim-payment-button';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('invoices')
    .select('invoice_number, client_name')
    .eq('hosted_token', token)
    .single();

  if (!data) return { title: 'Invoice Not Found' };
  return {
    title: `${data.invoice_number} — Invoice for ${data.client_name}`,
    robots: { index: false, follow: false },
  };
}

function fmt(cents: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
}

function fmtDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default async function HostedInvoicePage({ params }: PageProps) {
  const { token } = await params;
  const supabase = createServiceClient();

  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('hosted_token', token)
    .single();

  if (error || !invoice) notFound();

  const inv = invoice as Invoice;

  // Fetch the proposal linked to this invoice (if any)
  let projectTitle: string | null = null;
  if (inv.proposal_id) {
    const { data: proposal } = await supabase
      .from('proposals')
      .select('project_title')
      .eq('id', inv.proposal_id)
      .single();
    if (proposal) projectTitle = proposal.project_title;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, bio, professional_title, logo_url, brand_color')
    .eq('id', inv.user_id)
    .single();

  if (!profile) notFound();
  const p = profile as Pick<Profile, 'full_name' | 'bio' | 'logo_url' | 'brand_color'> & { email?: string; professional_title?: string };
  const accent = p.brand_color || '#6366f1';
  const freelancerName = p.full_name || 'Freelancer';
  const freelancerEmail = p.email || '';
  const lineItems = (inv.line_items || []) as InvoiceLineItem[];

  const isPaid = inv.status === 'paid';
  const isCancelled = inv.status === 'cancelled';
  const isPaymentClaimed = inv.status === 'payment_claimed';
  const overdue = inv.status === 'unpaid' && inv.due_date && new Date(inv.due_date) < new Date();

  const FONT_SANS = "'DM Sans', sans-serif";
  const FONT_DISPLAY = "'Playfair Display', serif";

  return (
    <div
      style={{ '--inv-accent': accent } as React.CSSProperties}
      className="min-h-screen bg-[#0a0a0b] text-[#f0f0f3]"
    >
      {/* Google Fonts */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />

      {/* ── Spacer top ──────────────────────────────────────── */}
      <div className="h-10 sm:h-16" />

      {/* ── Invoice Document ────────────────────────────────── */}
      <div className="mx-auto max-w-2xl px-4 sm:px-6" style={{ fontFamily: FONT_SANS }}>

        {/* ── Header Card ───────────────────────────────────── */}
        <div className="rounded-xl border border-white/[0.06] bg-[#111113] p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            {/* Left: avatar + freelancer info */}
            <div className="flex items-center gap-4">
              {p.logo_url ? (
                <img src={p.logo_url} alt="" className="h-11 w-11 rounded-lg object-contain" />
              ) : (
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-lg text-[15px] font-semibold text-white"
                  style={{ background: accent }}
                >
                  {freelancerName.charAt(0)}
                </div>
              )}
              <div>
                <p className="text-[15px] font-[600] text-white">{freelancerName}</p>
                {freelancerEmail && (
                  <p className="mt-0.5 text-[12px] text-white/35">{freelancerEmail}</p>
                )}
              </div>
            </div>

            {/* Right: invoice number + status */}
            <div className="flex flex-col items-start sm:items-end gap-2">
              <p className="text-[10px] font-[600] uppercase tracking-[0.15em] text-white/25">Invoice</p>
              <p className="text-[26px] sm:text-[30px] font-[600] tracking-[-0.03em] text-white font-mono leading-none">
                #{inv.invoice_number}
              </p>
              <StatusPill status={inv.status} />
            </div>
          </div>
        </div>

        {/* ── FROM / BILLED TO ──────────────────────────────── */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6 rounded-xl border border-white/[0.06] bg-[#111113] p-6 sm:p-8">
          <div>
            <p className="text-[10px] font-[600] uppercase tracking-[0.15em] text-white/25 mb-3">From</p>
            <p className="text-[15px] font-[500] text-white">{freelancerName}</p>
            {p.professional_title && (
              <p className="mt-1 text-[13px] text-white/40 leading-relaxed">{p.professional_title}</p>
            )}
          </div>
          <div>
            <p className="text-[10px] font-[600] uppercase tracking-[0.15em] text-white/25 mb-3">Billed To</p>
            <p className="text-[15px] font-[500] text-white">{inv.client_name}</p>
            <p className="mt-1 text-[13px] text-white/40">{inv.client_email}</p>
          </div>
        </div>

        {/* ── Meta Row: Issue Date / Due Date / Project ──── */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-px rounded-xl border border-white/[0.06] overflow-hidden bg-white/[0.06]">
          <div className="bg-[#111113] p-5">
            <p className="text-[10px] font-[600] uppercase tracking-[0.15em] text-white/25 mb-2">Issue Date</p>
            <p className="text-[14px] font-[500] text-white">{fmtDate(inv.created_at)}</p>
          </div>
          <div className="bg-[#111113] p-5">
            <p className="text-[10px] font-[600] uppercase tracking-[0.15em] text-white/25 mb-2">Due Date</p>
            {inv.due_date ? (
              overdue ? (
                <p className="text-[14px] font-[500] text-red-400">{fmtDate(inv.due_date)}</p>
              ) : (
                <p className="text-[14px] font-[500] text-white">{fmtDate(inv.due_date)}</p>
              )
            ) : (
              <p className="text-[14px] font-[500] text-white/40">On receipt</p>
            )}
          </div>
          <div className="bg-[#111113] p-5 col-span-2 sm:col-span-1">
            <p className="text-[10px] font-[600] uppercase tracking-[0.15em] text-white/25 mb-2">Project Ref</p>
            <p className="text-[14px] font-[500] text-white">
              {projectTitle || <span className="text-white/25">—</span>}
            </p>
          </div>
        </div>

        {/* ── Line Items ────────────────────────────────────── */}
        <div className="mt-6 rounded-xl border border-white/[0.06] overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_auto] bg-[#111113] border-b border-white/[0.06] px-6 py-3.5">
            <span className="text-[10px] font-[600] uppercase tracking-[0.15em] text-white/25">Description</span>
            <span className="text-[10px] font-[600] uppercase tracking-[0.15em] text-white/25 text-right">Amount</span>
          </div>
          {/* Items */}
          {lineItems.map((item, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_auto] border-b border-white/[0.04] bg-[#0e0e10] px-6 py-4">
              <span className="text-[14px] text-white">{item.label}</span>
              <span className="text-[14px] text-white/60 text-right font-mono">{fmt(item.amount_cents, inv.currency)}</span>
            </div>
          ))}
          {/* Total */}
          <div className="grid grid-cols-[1fr_auto] bg-[#111113] px-6 py-5 items-center">
            <span className="text-[14px] font-[600] text-white">Total</span>
            <span
              className="text-[24px] font-[600] tracking-[-0.02em] text-right text-white"
              style={{ fontFamily: FONT_DISPLAY }}
            >
              {fmt(inv.total_cents, inv.currency)}
            </span>
          </div>
        </div>

        {/* ── Note ──────────────────────────────────────────── */}
        {inv.note && (
          <div className="mt-6 rounded-xl border border-white/[0.06] bg-[#111113] p-6">
            <p className="text-[10px] font-[600] uppercase tracking-[0.15em] text-white/25 mb-2">Note</p>
            <p className="text-[14px] text-white/60 leading-relaxed whitespace-pre-wrap">{inv.note}</p>
          </div>
        )}

        {/* ── Payment Section ──────────────────────────────── */}
        <div className="mt-6 mb-16">
          {isPaid && (
            <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-6 text-center">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10 mb-3">
                <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
              <p className="text-[16px] font-medium text-green-400">This invoice has been paid</p>
              {inv.paid_at && (
                <p className="mt-1 text-[13px] text-green-400/60">
                  Paid on {fmtDate(inv.paid_at)}
                </p>
              )}
            </div>
          )}

          {isCancelled && (
            <div className="rounded-xl border border-white/[0.06] bg-[#111113] p-6 text-center">
              <p className="text-[16px] font-medium text-white/40">This invoice has been cancelled</p>
            </div>
          )}

          {isPaymentClaimed && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6 text-center">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 mb-3">
                <svg className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-[16px] font-medium text-amber-400">Payment reported — awaiting confirmation</p>
              <p className="mt-1 text-[13px] text-amber-400/60">
                Your freelancer has been notified and will confirm your payment shortly.
              </p>
            </div>
          )}

          {!isPaid && !isCancelled && !isPaymentClaimed && inv.payment_method === 'manual' && inv.payment_instructions && (
            <div className="rounded-xl border border-white/[0.06] bg-[#111113] p-6">
              <p className="text-[14px] font-medium text-white mb-3">How to pay</p>
              <div className="rounded-lg bg-[#0a0a0b] border border-white/[0.04] p-4 mb-3">
                <p className="text-[13px] text-white/60 leading-relaxed whitespace-pre-wrap font-mono">{inv.payment_instructions}</p>
              </div>
              <CopyButton text={inv.payment_instructions} />
              <p className="mt-3 text-[12px] text-white/25">Once paid, click below so your freelancer can confirm.</p>
              <ClaimPaymentButton
                invoiceId={inv.id}
                hostedToken={inv.hosted_token}
                accent={accent}
              />
            </div>
          )}

          {!isPaid && !isCancelled && inv.payment_method === 'stripe' && inv.stripe_payment_link && (
            <div className="text-center">
              <a href={inv.stripe_payment_link} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg px-8 py-3.5 text-[15px] font-medium text-white transition-opacity hover:opacity-90"
                style={{ background: accent }}>
                Pay {fmt(inv.total_cents, inv.currency)} now
              </a>
              <p className="mt-3 text-[12px] text-white/25">Secure payment via Stripe</p>
            </div>
          )}

          {!isPaid && !isCancelled && inv.payment_method === 'stripe' && !inv.stripe_payment_link && (
            <div className="rounded-xl border border-white/[0.06] bg-[#111113] p-6 text-center">
              <p className="text-[14px] text-white/40">Payment link coming soon.</p>
              <p className="mt-1 text-[12px] text-white/25">Your freelancer will update this invoice shortly.</p>
            </div>
          )}

          {!isPaid && !isCancelled && inv.payment_method === 'manual' && !inv.payment_instructions && (
            <div className="rounded-xl border border-white/[0.06] bg-[#111113] p-6 text-center">
              <p className="text-[14px] text-white/40">Payment details will be shared by your freelancer.</p>
            </div>
          )}
        </div>

      </div>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.04] py-8">
        <div className="mx-auto max-w-2xl px-6 flex items-center justify-between">
          <span className="text-[11px] text-white/20" style={{ fontFamily: FONT_SANS }}>
            Powered by <span className="font-medium text-white/30">Clinch</span>
          </span>
        </div>
      </footer>
    </div>
  );
}

/* ── Status Pill ─────────────────────────────────────────────── */
function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    unpaid: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    payment_claimed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    paid: 'bg-green-500/10 text-green-400 border-green-500/20',
    cancelled: 'bg-white/[0.04] text-white/30 border-white/[0.06]',
  };
  const labels: Record<string, string> = {
    unpaid: 'Awaiting payment',
    payment_claimed: 'Payment Claimed',
    paid: 'Paid',
    cancelled: 'Cancelled',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${styles[status] || styles.unpaid}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {labels[status] || status}
    </span>
  );
}
