"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  Users,
  Clock,
  CheckCircle2,
  Loader2,
  ExternalLink,
  BarChart3,
  Activity,
  Pencil,
  Receipt,
  CheckCircle2 as CheckCircleIcon,
  XCircle,
  X,
  PenTool,
  MessageSquare,
  Share2,
  Banknote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Invoice, InvoiceLineItem } from "@/lib/database.types";

/* ── Types ─────────────────────────────────────────────────── */

interface AnalyticsData {
  proposal: {
    id: string;
    status: string;
    projectTitle: string;
    clientName: string;
    createdAt: string;
    hostedToken: string;
    advancePaymentEnabled: boolean;
    advancePaymentClaimed: boolean;
    advancePaymentInvoiceId: string | null;
    advanceAmountCents: number | null;
    currency: string;
  };
  stats: {
    totalViews: number;
    uniqueViews: number;
    ownerViews: number;
    avgTimeSeconds: number;
  };
  sectionReadRates: Array<{
    key: string;
    views: number;
    rate: number;
  }>;
  activity: Array<{
    type: string;
    timestamp: string;
    detail?: string;
  }>;
  acceptedAt: string | null;
  signature: {
    data: string;
    signerName: string;
    signedAt: string | null;
  } | null;
  comments: Array<{
    id: string;
    sectionKey: string | null;
    authorName: string;
    authorEmail: string | null;
    message: string;
    isRead: boolean;
    createdAt: string;
  }>;
  linkedInvoices: Array<{
    id: string;
    invoiceNumber: string;
    clientName: string;
    total: number;
    currency: string;
    paymentStatus: string;
    hostedToken: string | null;
    createdAt: string;
    due_date?: string | null;
    note?: string | null;
    payment_instructions?: string | null;
    line_items?: InvoiceLineItem[];
    status?: string;
  }>;
}

/* ── Invoice status badge helper ───────────────────────────── */

const INVOICE_STATUS: Record<string, { label: string; cls: string }> = {
  unpaid: { label: "Unpaid", cls: "bg-amber-500/10 text-amber-400" },
  payment_claimed: { label: "Payment Claimed", cls: "bg-blue-500/10 text-blue-400" },
  paid: { label: "Paid", cls: "bg-green-500/10 text-green-400" },
  cancelled: { label: "Cancelled", cls: "bg-[#23252a] text-[#62666d]" },
};

function isActionableInvoice(status: string) {
  return status === 'unpaid' || status === 'payment_claimed';
}

function fmtCents(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    cents / 100
  );
}

/* ── Section display names ─────────────────────────────────── */

const SECTION_LABELS: Record<string, string> = {
  cover: "Cover",
  problem: "Problem",
  solution: "Solution",
  approach: "Approach",
  deliverables: "Deliverables",
  timeline: "Timeline",
  pricing: "Pricing",
  about: "About",
  faq: "FAQ",
  cta: "Call to Action",
};

/* ── Status badge ──────────────────────────────────────────── */

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-[#23252a] text-[#8a8f98]" },
  sent: { label: "Sent", className: "bg-blue-500/10 text-blue-400" },
  viewed: { label: "Viewed", className: "bg-yellow-500/10 text-yellow-400" },
  accepted: { label: "Accepted", className: "bg-green-500/10 text-green-400" },
  won: { label: "Won", className: "bg-green-500/10 text-green-400" },
  lost: { label: "Lost", className: "bg-red-500/10 text-red-400" },
};

/* ── Helpers ───────────────────────────────────────────────── */

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/* ── Main Page ─────────────────────────────────────────────── */

export default function ProposalAnalyticsPage() {
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Invoice | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch(`/api/proposals/${id}/analytics`);
      if (!res.ok) throw new Error("Failed to fetch analytics");
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  async function markPaid(invoiceId: string) {
    setActionLoading(invoiceId);
    const res = await fetch(`/api/invoices/${invoiceId}/mark-paid`, { method: "PATCH" });
    if (res.ok) await fetchAnalytics();
    setActionLoading(null);
  }

  async function cancelInvoice(invoiceId: string) {
    toast.warning("Cancel this invoice?", {
      description: "This action cannot be undone.",
      action: {
        label: "Confirm",
        onClick: async () => {
          setActionLoading(invoiceId);
          const res = await fetch(`/api/invoices/${invoiceId}/cancel`, { method: "PATCH" });
          if (res.ok) {
            await fetchAnalytics();
            toast.success("Invoice cancelled");
          }
          setActionLoading(null);
        },
      },
    });
  }

  /* Loading */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-5 w-5 animate-spin text-[#62666d]" />
      </div>
    );
  }

  /* Error */
  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <p className="text-[14px] text-[#8a8f98]">
          {error || "Could not load analytics"}
        </p>
        <Link
          href="/proposals"
          className="mt-4 text-[13px] text-[#62666d] hover:text-white"
        >
          ← Back to proposals
        </Link>
      </div>
    );
  }

  const { proposal, stats, sectionReadRates, activity, acceptedAt, signature, comments, linkedInvoices } = data;
  const statusBadge = STATUS_CONFIG[proposal.status] || STATUS_CONFIG.draft;

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="mb-8">
        <Link
          href="/proposals"
          className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-[#62666d] hover:text-[#8a8f98] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Proposals
        </Link>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[22px] font-[550] tracking-[-0.02em] text-white">
                {proposal.projectTitle}
              </h1>
              <span
                className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-[500] ${statusBadge.className}`}
              >
                {statusBadge.label}
              </span>
            </div>
            <p className="mt-1 text-[13px] text-[#62666d]">
              {proposal.clientName} ·{" "}
              {new Date(proposal.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const url = `${window.location.origin}/p/${proposal.hostedToken}`;
                navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#1a1c20] bg-[#0c0d0e] px-3 py-1.5 text-[12px] font-[500] text-[#8a8f98] transition-colors hover:bg-[#14161a] hover:text-white"
            >
              <Share2 className="h-3 w-3" />
              {copied ? 'Copied!' : 'Share'}
            </button>
            <Link
              href={`/proposals/${id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#1a1c20] bg-[#0c0d0e] px-3 py-1.5 text-[12px] font-[500] text-[#8a8f98] transition-colors hover:bg-[#14161a] hover:text-white"
            >
              <Pencil className="h-3 w-3" />
              Edit
            </Link>
          </div>
        </div>
      </div>

      {/* ── Advance Payment Confirmation Banner ────────── */}
      {proposal.advancePaymentEnabled && proposal.advancePaymentClaimed && proposal.advancePaymentInvoiceId && (() => {
        const advInvoice = linkedInvoices.find((inv) => inv.id === proposal.advancePaymentInvoiceId);
        const isPaid = advInvoice?.paymentStatus === 'paid' || advInvoice?.status === 'paid';
        const isClaimed = advInvoice?.paymentStatus === 'payment_claimed' || advInvoice?.status === 'payment_claimed';
        const fmtAmount = (cents: number) =>
          new Intl.NumberFormat('en-US', { style: 'currency', currency: proposal.currency || 'USD' }).format(cents / 100);

        if (!advInvoice) return null;

        return (
          <div className={`mb-6 rounded-lg border overflow-hidden ${
            isPaid
              ? 'border-green-500/20 bg-green-500/5'
              : 'border-amber-500/20 bg-amber-500/5'
          }`}>
            <div className="flex items-start gap-3 px-4 py-3.5">
              <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md ${
                isPaid ? 'bg-green-500/10' : 'bg-amber-500/10'
              }`}>
                <Banknote className={`h-4 w-4 ${isPaid ? 'text-green-400' : 'text-amber-400'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[13px] font-[550] ${
                  isPaid ? 'text-green-400' : 'text-amber-400'
                }`}>
                  {isPaid
                    ? 'Advance payment confirmed'
                    : 'Advance payment claimed by client'}
                </p>
                <p className={`mt-0.5 text-[12px] ${
                  isPaid ? 'text-green-400/60' : 'text-amber-400/60'
                }`}>
                  {isPaid
                    ? `${proposal.clientName} paid${proposal.advanceAmountCents ? ` ${fmtAmount(proposal.advanceAmountCents)}` : ''} — ready to start work`
                    : `${proposal.clientName} declared payment${proposal.advanceAmountCents ? ` of ${fmtAmount(proposal.advanceAmountCents)}` : ''}. Verify in your account and confirm.`
                  }
                </p>
              </div>
              {isClaimed && !isPaid && (
                <div className="flex flex-shrink-0 items-center gap-2">
                  <button
                    onClick={() => markPaid(advInvoice.id)}
                    disabled={actionLoading === advInvoice.id}
                    className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/15 px-3 py-1.5 text-[12px] font-[550] text-amber-300 transition-colors hover:bg-amber-500/25 disabled:opacity-50"
                  >
                    {actionLoading === advInvoice.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <CheckCircle2 className="h-3.5 w-3.5" />}
                    Confirm Payment Received
                  </button>
                </div>
              )}
              {isPaid && (
                <div className="flex h-6 items-center rounded-md bg-green-500/10 px-2 flex-shrink-0">
                  <span className="text-[10px] font-[500] uppercase tracking-wider text-green-400">Confirmed</span>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── Stats Grid ─────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={Eye}
          label="Total Views"
          value={stats.totalViews.toString()}
          sublabel={
            stats.ownerViews > 0
              ? `+${stats.ownerViews} by you`
              : undefined
          }
        />
        <StatCard
          icon={Users}
          label="Unique Visitors"
          value={stats.uniqueViews.toString()}
        />
        <StatCard
          icon={Clock}
          label="Avg. Time on Page"
          value={stats.avgTimeSeconds > 0 ? formatDuration(stats.avgTimeSeconds) : "—"}
        />
        <StatCard
          icon={CheckCircle2}
          label="Accepted"
          value={acceptedAt ? "Yes" : "No"}
          sublabel={
            acceptedAt
              ? new Date(acceptedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              : undefined
          }
          accent={!!acceptedAt}
        />
      </div>

      {/* ── Two-Column: Heatmap + Activity ─────────────────── */}
      <div className="grid gap-3 lg:grid-cols-5">
        {/* Section Heatmap — 3 cols */}
        <div className="lg:col-span-3 rounded-lg border border-[#1a1c20] bg-[#0c0d0e] overflow-hidden">
          <div className="flex items-center gap-2 border-b border-[#1a1c20] px-4 py-3">
            <BarChart3 className="h-3.5 w-3.5 text-[#3a3f45]" />
            <h3 className="text-[12px] font-[500] uppercase tracking-wider text-[#3a3f45]">
              Section Read Rates
            </h3>
          </div>
          <div className="px-4 py-3">
            {sectionReadRates.length === 0 ? (
              <p className="py-6 text-center text-[13px] text-[#3a3f45]">
                No section data yet
              </p>
            ) : (
              <div className="space-y-2.5">
                {sectionReadRates.map((section) => (
                  <SectionBar
                    key={section.key}
                    label={SECTION_LABELS[section.key] || section.key}
                    rate={section.rate}
                    views={section.views}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Activity Timeline — 2 cols */}
        <div className="lg:col-span-2 rounded-lg border border-[#1a1c20] bg-[#0c0d0e] overflow-hidden">
          <div className="flex items-center gap-2 border-b border-[#1a1c20] px-4 py-3">
            <Activity className="h-3.5 w-3.5 text-[#3a3f45]" />
            <h3 className="text-[12px] font-[500] uppercase tracking-wider text-[#3a3f45]">
              Recent Activity
            </h3>
          </div>
          <div className="px-4 py-2">
            {activity.length === 0 ? (
              <p className="py-6 text-center text-[13px] text-[#3a3f45]">
                No activity yet
              </p>
            ) : (
              <div className="divide-y divide-[#1a1c20]">
                {activity.map((event, i) => (
                  <ActivityItem key={i} event={event} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Accepted + Signature ────────────────────────────── */}
      {acceptedAt && (
        <div className="mt-6 rounded-lg border border-green-500/15 bg-green-500/5 overflow-hidden">
          {/* Accepted header */}
          <div className="flex items-center gap-3 px-4 py-3">
            <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
            <div>
              <p className="text-[13px] font-[520] text-green-400">
                Proposal accepted
              </p>
              <p className="text-[12px] text-green-400/50">
                {proposal.clientName} accepted on{" "}
                {new Date(acceptedAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          {/* Signature card */}
          {signature && (
            <div className="border-t border-green-500/10 px-4 py-4">
              <div className="flex items-center gap-2 mb-3">
                <PenTool className="h-3.5 w-3.5 text-green-400/40" />
                <span className="text-[11px] font-[500] uppercase tracking-wider text-green-400/40">
                  Client Signature
                </span>
              </div>
              <div className="rounded-lg border border-[#1a1c20] bg-[#08090a] p-4">
                {/* Signature image */}
                <div className="flex items-center justify-center mb-3">
                  <img
                    src={signature.data}
                    alt={`Signature of ${signature.signerName}`}
                    className="max-h-[80px] w-auto opacity-90"
                    style={{ filter: 'brightness(1.1)' }}
                  />
                </div>
                {/* Signature line */}
                <div className="border-t border-[#23252a] pt-2.5 flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-[520] text-white tracking-[-0.01em]">
                      {signature.signerName}
                    </p>
                    {signature.signedAt && (
                      <p className="text-[11px] text-[#3a3f45] mt-0.5">
                        Signed on{" "}
                        {new Date(signature.signedAt).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>
                  <div className="flex h-6 items-center rounded-md bg-green-500/10 px-2">
                    <span className="text-[10px] font-[500] uppercase tracking-wider text-green-400">
                      Verified
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Client Comments ────────────────────────────────── */}
      <div className="mt-6 rounded-lg border border-[#1a1c20] bg-[#0c0d0e] overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#1a1c20] px-4 py-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-3.5 w-3.5 text-[#3a3f45]" />
            <h3 className="text-[12px] font-[500] uppercase tracking-wider text-[#3a3f45]">
              Client Comments
            </h3>
          </div>
          {comments.length > 0 && (
            <span className="text-[11px] text-[#3a3f45] tabular-nums">
              {comments.length} comment{comments.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {comments.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-md bg-[#14161a]">
              <MessageSquare className="h-4 w-4 text-[#3a3f45]" />
            </div>
            <p className="text-[13px] text-[#3a3f45]">
              No comments from the client yet
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#1a1c20]">
            {comments.map((comment) => (
              <div key={comment.id} className="px-4 py-3">
                <div className="mb-1.5 flex items-center gap-2">
                  <span
                    className={`inline-block rounded-md px-1.5 py-0.5 text-[10px] font-[500] uppercase tracking-wider ${
                      comment.sectionKey
                        ? 'bg-indigo-500/10 text-indigo-400'
                        : 'bg-[#23252a] text-[#62666d]'
                    }`}
                  >
                    {comment.sectionKey
                      ? (SECTION_LABELS[comment.sectionKey] || comment.sectionKey)
                      : 'General'}
                  </span>
                  {!comment.isRead && (
                    <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-400" />
                  )}
                </div>
                <p className="text-[13px] leading-[1.6] text-[#c9cdd3]">
                  {comment.message}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-[11px] font-[500] text-[#62666d]">
                    {comment.authorName}
                  </span>
                  {comment.authorEmail && (
                    <>
                      <span className="text-[10px] text-[#3a3f45]">·</span>
                      <a
                        href={`mailto:${comment.authorEmail}`}
                        className="text-[11px] text-indigo-400/60 hover:text-indigo-400 transition-colors"
                      >
                        {comment.authorEmail}
                      </a>
                    </>
                  )}
                  <span className="text-[10px] text-[#3a3f45]">·</span>
                  <span className="text-[11px] text-[#3a3f45]">
                    {timeAgo(comment.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Attached Invoices ───────────────────────────── */}
      <div className="mt-6 rounded-lg border border-[#1a1c20] bg-[#0c0d0e] overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#1a1c20] px-4 py-3">
          <div className="flex items-center gap-2">
            <Receipt className="h-3.5 w-3.5 text-[#3a3f45]" />
            <h3 className="text-[12px] font-[500] uppercase tracking-wider text-[#3a3f45]">
              Attached Invoices
            </h3>
          </div>
          {linkedInvoices.length > 0 && (
            <span className="text-[11px] text-[#3a3f45] tabular-nums">
              {linkedInvoices.length} invoice{linkedInvoices.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {linkedInvoices.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-md bg-[#14161a]">
              <Receipt className="h-4 w-4 text-[#3a3f45]" />
            </div>
            <p className="text-[13px] text-[#3a3f45]">
              No invoices created for this proposal yet
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1a1c20]">
                <th className="px-4 py-2.5 text-left text-[11px] font-[500] uppercase tracking-wider text-[#3a3f45]">
                  Invoice
                </th>
                <th className="hidden px-4 py-2.5 text-right text-[11px] font-[500] uppercase tracking-wider text-[#3a3f45] sm:table-cell">
                  Amount
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] font-[500] uppercase tracking-wider text-[#3a3f45]">
                  Status
                </th>
                <th className="hidden px-4 py-2.5 text-right text-[11px] font-[500] uppercase tracking-wider text-[#3a3f45] md:table-cell">
                  Date
                </th>
                <th className="px-4 py-2.5 text-right text-[11px] font-[500] uppercase tracking-wider text-[#3a3f45]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {linkedInvoices.map((inv) => {
                const status = inv.paymentStatus || inv.status || 'unpaid';
                const badge = INVOICE_STATUS[status] || INVOICE_STATUS.unpaid;
                const isUnpaid = isActionableInvoice(status);
                return (
                  <tr key={inv.id} className="border-b border-[#1a1c20] last:border-b-0">
                    <td className="px-4 py-3">
                      <div className="text-[13px] text-white font-[500]">{inv.invoiceNumber}</div>
                      {status === 'payment_claimed' && (
                        <div className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-green-500/10 px-2 py-0.5 text-[11px] font-[500] text-green-400">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-400" />
                          </span>
                          Client reported payment
                        </div>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 text-right text-[13px] text-[#8a8f98] sm:table-cell tabular-nums">
                      {fmtCents(inv.total, inv.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-[500] ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-right text-[12px] text-[#3a3f45] md:table-cell">
                      {new Date(inv.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {inv.hostedToken ? (
                          <Link
                            href={`/i/${inv.hostedToken}`}
                            target="_blank"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#3a3f45] transition-colors hover:bg-[#14161a] hover:text-[#8a8f98]"
                            title="View hosted invoice"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        ) : (
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#23252a] cursor-not-allowed" title="No hosted link">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </span>
                        )}
                        {isUnpaid && (
                          <>
                            <button
                              onClick={() => setEditTarget({
                                id: inv.id,
                                invoice_number: inv.invoiceNumber,
                                client_name: inv.clientName,
                                client_email: "",
                                total_cents: inv.total,
                                currency: inv.currency,
                                status: "unpaid",
                                line_items: inv.line_items || [],
                                note: inv.note || null,
                                due_date: inv.due_date || null,
                                payment_instructions: inv.payment_instructions || null,
                                payment_method: "manual",
                                hosted_token: inv.hostedToken || null,
                                proposal_id: id,
                                created_at: inv.createdAt,
                                updated_at: inv.createdAt,
                              } as Invoice)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#3a3f45] hover:bg-[#14161a] hover:text-[#8a8f98] transition-colors"
                              title="Edit invoice"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => markPaid(inv.id)}
                              disabled={actionLoading === inv.id}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-green-500/50 hover:bg-green-500/10 hover:text-green-400 transition-colors disabled:opacity-50"
                              title="Mark paid"
                            >
                              {actionLoading === inv.id
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <CheckCircleIcon className="h-3.5 w-3.5" />}
                            </button>
                            <button
                              onClick={() => cancelInvoice(inv.id)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#3a3f45] hover:bg-red-500/10 hover:text-red-400 transition-colors"
                              title="Cancel"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Invoice Modal */}
      {editTarget && (
        <EditInvoiceModal
          invoice={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => { setEditTarget(null); fetchAnalytics(); }}
        />
      )}
    </div>
  );
}

/* ── Stat Card ─────────────────────────────────────────────── */

function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
  accent,
}: {
  icon: typeof Eye;
  label: string;
  value: string;
  sublabel?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg border border-[#1a1c20] bg-[#0c0d0e] px-4 py-4">
      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-md bg-[#14161a]">
        <Icon
          className={`h-4 w-4 ${accent ? "text-green-400" : "text-[#3a3f45]"}`}
        />
      </div>
      <p className="text-[11px] font-[500] uppercase tracking-wider text-[#3a3f45]">
        {label}
      </p>
      <p
        className={`mt-1 text-[24px] font-[600] tracking-[-0.02em] leading-none ${
          accent ? "text-green-400" : "text-white"
        }`}
      >
        {value}
      </p>
      {sublabel && (
        <p className="mt-1 text-[11px] text-[#3a3f45]">{sublabel}</p>
      )}
    </div>
  );
}

/* ── Section Bar ───────────────────────────────────────────── */

function SectionBar({
  label,
  rate,
  views,
}: {
  label: string;
  rate: number;
  views: number;
}) {
  // Color intensity based on rate
  const barColor =
    rate >= 75
      ? "bg-green-500/70"
      : rate >= 50
      ? "bg-yellow-500/50"
      : rate >= 25
      ? "bg-orange-500/40"
      : "bg-[#23252a]";

  return (
    <div className="group">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[13px] text-[#8a8f98] group-hover:text-white transition-colors">
          {label}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#3a3f45]">
            {views} view{views !== 1 ? "s" : ""}
          </span>
          <span className="text-[12px] font-[520] text-[#62666d] tabular-nums w-8 text-right">
            {rate}%
          </span>
        </div>
      </div>
      <div className="h-1.5 w-full rounded-full bg-[#14161a] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
          style={{ width: `${Math.max(rate, 2)}%` }}
        />
      </div>
    </div>
  );
}

/* ── Activity Item ─────────────────────────────────────────── */

function ActivityItem({
  event,
}: {
  event: { type: string; timestamp: string; detail?: string };
}) {
  const config: Record<
    string,
    { icon: typeof Eye; label: string; color: string }
  > = {
    view: {
      icon: Eye,
      label: "Proposal viewed",
      color: "text-[#62666d]",
    },
    accepted: {
      icon: CheckCircle2,
      label: "Proposal accepted",
      color: "text-green-400",
    },
  };

  const c = config[event.type] || config.view;
  const Icon = c.icon;

  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#14161a] shrink-0">
        <Icon className={`h-3 w-3 ${c.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-[#8a8f98] truncate">
          {c.label}
          {event.detail && (
            <span className="text-[#3a3f45]"> by {event.detail}</span>
          )}
        </p>
      </div>
      <span className="text-[11px] text-[#3a3f45] shrink-0 tabular-nums">
        {timeAgo(event.timestamp)}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Edit Invoice Modal
   ═══════════════════════════════════════════════════════════════ */
function EditInvoiceModal({
  invoice,
  onClose,
  onSaved,
}: {
  invoice: Invoice;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>(
    invoice.line_items.map((i) => ({ ...i }))
  );
  const [note, setNote] = useState(invoice.note || "");
  const [dueDate, setDueDate] = useState(invoice.due_date || "");
  const [paymentInstructions, setPaymentInstructions] = useState(
    invoice.payment_instructions || ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const total = lineItems.reduce((s, i) => s + (i.amount_cents || 0), 0);

  function updateItem(idx: number, field: keyof InvoiceLineItem, value: string | number) {
    setLineItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  }

  function removeItem(idx: number) {
    if (lineItems.length <= 1) return;
    setLineItems((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (lineItems.some((i) => !i.label.trim())) { setError("All line items need a description"); return; }
    if (total <= 0) { setError("Total must be greater than 0"); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/edit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          line_items: lineItems,
          total_cents: total,
          note: note.trim() || null,
          due_date: dueDate || null,
          payment_instructions: paymentInstructions.trim() || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Failed to update invoice");
        return;
      }
      onSaved();
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  function fmt(cents: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-[#23252a] bg-[#0f1011] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute right-4 top-4 text-[#62666d] hover:text-white transition-colors">
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-[18px] font-[550] text-white mb-1">Edit Invoice</h2>
        <p className="text-[13px] text-[#62666d] mb-5">
          {invoice.invoice_number} · {invoice.client_name}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[12px] text-[#8a8f98]">Line items</Label>
            <div className="space-y-2">
              {lineItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    value={item.label}
                    onChange={(e) => updateItem(idx, "label", e.target.value)}
                    placeholder="Description"
                    className="h-9 flex-1 rounded-md border border-[#23252a] bg-[#08090a] text-[13px] text-white placeholder:text-[#62666d] focus:border-[#3a3f45] focus:ring-0"
                  />
                  <div className="relative w-28">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-[#62666d]">$</span>
                    <Input
                      type="number" min="0" step="0.01"
                      value={item.amount_cents ? (item.amount_cents / 100).toFixed(2) : ""}
                      onChange={(e) => updateItem(idx, "amount_cents", Math.round(parseFloat(e.target.value || "0") * 100))}
                      placeholder="0.00"
                      className="h-9 rounded-md border border-[#23252a] bg-[#08090a] pl-6 text-[13px] text-white placeholder:text-[#62666d] focus:border-[#3a3f45] focus:ring-0"
                    />
                  </div>
                  {lineItems.length > 1 && (
                    <button type="button" onClick={() => removeItem(idx)} className="text-[#3a3f45] hover:text-red-400 transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setLineItems((prev) => [...prev, { label: "", amount_cents: 0 }])}
              className="mt-1 text-[12px] text-[#62666d] hover:text-white transition-colors"
            >
              + Add line item
            </button>
          </div>

          <div className="flex items-center justify-between rounded-md border border-[#23252a] bg-[#08090a] px-4 py-3">
            <span className="text-[13px] font-[500] text-[#8a8f98]">Total</span>
            <span className="text-[16px] font-[600] text-white">{fmt(total)}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[12px] text-[#8a8f98]">Due date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className="h-9 rounded-md border border-[#23252a] bg-[#08090a] text-[13px] text-white focus:border-[#3a3f45] focus:ring-0" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] text-[#8a8f98]">Note</Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Thank you!"
                className="h-9 rounded-md border border-[#23252a] bg-[#08090a] text-[13px] text-white placeholder:text-[#62666d] focus:border-[#3a3f45] focus:ring-0" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[12px] text-[#8a8f98]">Payment instructions</Label>
            <Textarea
              value={paymentInstructions}
              onChange={(e) => setPaymentInstructions(e.target.value)}
              rows={3}
              placeholder="e.g. UPI: yourname@upi | PayPal: you@email.com"
              className="rounded-md border border-[#23252a] bg-[#08090a] text-[13px] text-white placeholder:text-[#62666d] focus:border-[#3a3f45] focus:ring-0 resize-none"
            />
          </div>

          {error && <p className="text-[13px] text-red-400">{error}</p>}

          <Button
            type="submit"
            disabled={saving}
            className="w-full rounded-md bg-white py-2.5 text-[13px] font-[500] text-black hover:bg-neutral-200 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Save changes"}
          </Button>
        </form>
      </div>
    </div>
  );
}
