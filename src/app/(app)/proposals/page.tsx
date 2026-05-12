"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2, Plus, FileText, BarChart3, Trash2, Receipt,
  AlertTriangle, X, Pencil, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Status = "draft" | "sent" | "viewed" | "accepted" | "won" | "lost";

const STATUS_BADGE: Record<
  Status,
  { label: string; className: string }
> = {
  draft: { label: "Draft", className: "bg-[#23252a] text-[#8a8f98]" },
  sent: { label: "Sent", className: "bg-blue-500/10 text-blue-400" },
  viewed: { label: "Viewed", className: "bg-yellow-500/10 text-yellow-400" },
  accepted: { label: "Accepted", className: "bg-green-500/10 text-green-400" },
  won: { label: "Won", className: "bg-green-500/10 text-green-400" },
  lost: { label: "Lost", className: "bg-red-500/10 text-red-400" },
};

interface ProposalRow {
  id: string;
  client_name: string;
  project_title: string;
  amount: number | null;
  status: string;
  created_at: string;
}

export default function ProposalsPage() {
  const router = useRouter();
  const [proposals, setProposals] = useState<ProposalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Delete confirmation modal state
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    client_name: string;
    linkedInvoices: number;
    status: string;
  } | null>(null);

  // Invoice deliverable picker modal state
  const [invoicePicker, setInvoicePicker] = useState<{
    proposalId: string;
    clientName: string;
    clientEmail: string;
    projectTitle: string;
    lineItems: Array<{ label: string; amount: number }>;
  } | null>(null);

  // Pre-fetched profile data for the invoice modal
  const [profileData, setProfileData] = useState<{ email: string; default_payment_instructions: string } | null>(null);

  const fetchProposals = useCallback(async () => {
    const res = await fetch("/api/proposals");
    if (res.ok) {
      setProposals(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProposals();
    // Prefetch profile for invoice modal defaults
    fetch("/api/profile").then(async (res) => {
      if (res.ok) {
        const p = await res.json();
        setProfileData({
          email: p.email || '',
          default_payment_instructions: p.default_payment_instructions || '',
        });
      }
    });
  }, [fetchProposals]);

  const filtered =
    filter === "all"
      ? proposals
      : proposals.filter((p) => p.status === filter);

  /* ── Delete flow ────────────────────────────────────────── */
  async function handleDeleteClick(p: ProposalRow) {
    setActionLoading(p.id);
    try {
      // Pre-check for linked invoices
      const res = await fetch(`/api/proposals/${p.id}?check=true`, {
        method: "DELETE",
      });
      if (res.ok) {
        const info = await res.json();
        setDeleteTarget({
          id: p.id,
          client_name: p.client_name,
          linkedInvoices: info.linkedInvoices || 0,
          status: info.status || p.status,
        });
      }
    } catch {
      // Fallback — show simple confirm
      setDeleteTarget({
        id: p.id,
        client_name: p.client_name,
        linkedInvoices: 0,
        status: p.status,
      });
    } finally {
      setActionLoading(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setActionLoading(deleteTarget.id);
    try {
      const res = await fetch(`/api/proposals/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setProposals((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      }
    } catch {
      // silent
    } finally {
      setActionLoading(null);
      setDeleteTarget(null);
    }
  }

  /* ── Create invoice from proposal ───────────────────────── */
  async function handleCreateInvoice(proposalId: string) {
    setActionLoading(proposalId);
    try {
      // Fetch proposal content to get line items
      const res = await fetch(`/api/proposals/${proposalId}`);
      if (!res.ok) { alert("Failed to fetch proposal"); return; }
      const proposal = await res.json();

      const content = proposal.edited_content_json || proposal.content_json;
      const pricing = content?.pricing as { lineItems?: Array<{ label: string; amount: number }>; total?: number } | undefined;

      let items: Array<{ label: string; amount: number }> = [];
      if (pricing?.lineItems && Array.isArray(pricing.lineItems)) {
        items = pricing.lineItems;
      } else if (proposal.amount) {
        items = [{ label: proposal.project_title || 'Project', amount: proposal.amount }];
      }

      setInvoicePicker({
        proposalId,
        clientName: proposal.client_name,
        clientEmail: proposal.client_email || '',
        projectTitle: proposal.project_title,
        lineItems: items,
      });
    } catch {
      alert("Something went wrong");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[22px] font-[550] tracking-[-0.02em] text-white">
            Proposals
          </h1>
          <p className="mt-1 text-[13px] text-[#62666d]">
            AI-generated proposals for your clients.
          </p>
        </div>
        <Link
          href="/proposals/new"
          className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-[13px] font-[500] text-black transition-colors hover:bg-neutral-200"
        >
          <Plus className="h-4 w-4" />
          New proposal
        </Link>
      </div>

      {/* Filter */}
      {/* {proposals.length > 0 && (
        <div className="mb-4 flex gap-1 rounded-md border border-[#1a1c20] bg-[#08090a] p-0.5 w-fit">
          {["all", "draft", "sent", "viewed", "accepted", "won", "lost"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-[5px] px-3 py-1.5 text-[12px] font-[500] capitalize transition-all ${filter === s
                ? "bg-[#1a1c20] text-white"
                : "text-[#62666d] hover:text-[#8a8f98]"
                }`}
            >
              {s}
            </button>
          ))}
        </div>
      )} */}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-[#62666d]" />
        </div>
      )}

      {/* Empty */}
      {!loading && proposals.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#1a1c20] bg-[#0c0d0e]/50 p-16 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#14161a]">
            <FileText className="h-5 w-5 text-[#62666d]" />
          </div>
          <p className="text-[14px] font-[520] text-[#8a8f98]">
            No proposals yet
          </p>
          <p className="mt-1 text-[13px] text-[#62666d]">
            Generate your first AI-powered proposal.
          </p>
          <Link
            href="/proposals/new"
            className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-white px-4 py-2 text-[13px] font-[500] text-black hover:bg-neutral-200"
          >
            <Plus className="h-3.5 w-3.5" />
            New proposal
          </Link>
        </div>
      )}

      {/* Table */}
      {!loading && filtered.length > 0 && (
        <div className="rounded-lg border border-[#1a1c20] bg-[#0c0d0e] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1a1c20]">
                <th className="px-4 py-3 text-left text-[11px] font-[500] uppercase tracking-wider text-[#3a3f45]">
                  Client
                </th>
                <th className="hidden px-4 py-3 text-left text-[11px] font-[500] uppercase tracking-wider text-[#3a3f45] sm:table-cell">
                  Project
                </th>
                <th className="hidden px-4 py-3 text-right text-[11px] font-[500] uppercase tracking-wider text-[#3a3f45] md:table-cell">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-[500] uppercase tracking-wider text-[#3a3f45]">
                  Status
                </th>
                <th className="hidden px-4 py-3 text-right text-[11px] font-[500] uppercase tracking-wider text-[#3a3f45] md:table-cell">
                  Date
                </th>
                <th className="px-4 py-3 w-28">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const badge =
                  STATUS_BADGE[p.status as Status] || STATUS_BADGE.draft;
                const isAccepted = p.status === "accepted" || p.status === "won";
                return (
                  <tr key={p.id} className="border-b border-[#1a1c20] last:border-b-0">
                    <td className="px-4 py-3">
                      <div
                        className="text-[14px] text-white"
                      >
                        {p.client_name}
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <Link
                        href={`/proposals/${p.id}`}
                        className="text-[13px] text-[#8a8f98] hover:text-white"
                      >
                        {p.project_title}
                      </Link>
                    </td>
                    <td className="hidden px-4 py-3 text-right text-[13px] text-[#8a8f98] md:table-cell">
                      {p.amount
                        ? `$${(p.amount / 100).toLocaleString()}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-[500] ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-right text-[12px] text-[#3a3f45] md:table-cell">
                      {new Date(p.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {/* Edit */}
                        <Link
                          href={`/proposals/${p.id}/edit`}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#3a3f45] transition-colors hover:bg-[#14161a] hover:text-[#8a8f98]"
                          title="Edit proposal"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>

                        {/* Create invoice — only for accepted/won */}
                        {isAccepted && (
                          <button
                            onClick={() => handleCreateInvoice(p.id)}
                            disabled={actionLoading === p.id}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-green-500/50 transition-colors hover:bg-green-500/10 hover:text-green-400 disabled:opacity-50"
                            title="Create invoice"
                          >
                            {actionLoading === p.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Receipt className="h-3.5 w-3.5" />
                            )}
                          </button>
                        )}

                        {/* Analytics */}
                        <Link
                          href={`/proposals/${p.id}/analytics`}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#3a3f45] transition-colors hover:bg-[#14161a] hover:text-[#8a8f98]"
                          title="View analytics"
                        >
                          <BarChart3 className="h-3.5 w-3.5" />
                        </Link>

                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteClick(p)}
                          disabled={actionLoading === p.id}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#3a3f45] transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                          title="Delete proposal"
                        >
                          {actionLoading === p.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* No results in filter */}
      {!loading && proposals.length > 0 && filtered.length === 0 && (
        <p className="py-12 text-center text-[13px] text-[#62666d]">
          No proposals with status &ldquo;{filter}&rdquo;
        </p>
      )}

      {/* ── Delete Confirmation Modal ──────────────────────── */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="relative w-full max-w-sm rounded-xl border border-[#23252a] bg-[#0f1011] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setDeleteTarget(null)}
              className="absolute right-4 top-4 text-[#62666d] hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 mb-4">
              <Trash2 className="h-5 w-5 text-red-400" />
            </div>

            <h3 className="text-[16px] font-[550] text-white mb-1">
              Delete proposal
            </h3>
            <p className="text-[13px] text-[#8a8f98] leading-relaxed">
              Are you sure you want to delete the proposal for{" "}
              <span className="text-white font-medium">{deleteTarget.client_name}</span>?
              This action cannot be undone.
            </p>

            {/* Warning for linked invoices */}
            {deleteTarget.linkedInvoices > 0 && (
              <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3.5 py-3">
                <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                <p className="text-[12px] text-amber-400/90 leading-relaxed">
                  This proposal has{" "}
                  <span className="font-semibold">
                    {deleteTarget.linkedInvoices} linked invoice{deleteTarget.linkedInvoices !== 1 ? "s" : ""}
                  </span>
                  . Deleting will unlink {deleteTarget.linkedInvoices === 1 ? "it" : "them"} but
                  the invoice{deleteTarget.linkedInvoices !== 1 ? "s" : ""} will remain.
                </p>
              </div>
            )}

            <div className="mt-5 flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setDeleteTarget(null)}
                className="rounded-md px-3 py-2 text-[13px] font-[500] text-[#8a8f98] hover:text-white hover:bg-white/[0.04]"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                disabled={actionLoading === deleteTarget.id}
                className="rounded-md bg-red-500 px-4 py-2 text-[13px] font-[500] text-white hover:bg-red-600 disabled:opacity-50"
              >
                {actionLoading === deleteTarget.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Delete"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Invoice Deliverable Picker Modal ─────────────── */}
      {invoicePicker && (
        <InvoicePickerModal
          proposalId={invoicePicker.proposalId}
          clientName={invoicePicker.clientName}
          clientEmail={invoicePicker.clientEmail}
          projectTitle={invoicePicker.projectTitle}
          lineItems={invoicePicker.lineItems}
          profileData={profileData}
          onClose={() => setInvoicePicker(null)}
          onCreated={() => {
            setInvoicePicker(null);
            router.push("/invoices");
          }}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Invoice Deliverable Picker Modal — full form
   ═══════════════════════════════════════════════════════════════ */
function InvoicePickerModal({
  proposalId,
  clientName: initClientName,
  clientEmail: initClientEmail,
  projectTitle,
  lineItems: proposalLineItems,
  profileData,
  onClose,
  onCreated,
}: {
  proposalId: string;
  clientName: string;
  clientEmail: string;
  projectTitle: string;
  lineItems: Array<{ label: string; amount: number }>;
  profileData: { email: string; default_payment_instructions: string } | null;
  onClose: () => void;
  onCreated: () => void;
}) {
  const defaultNote = profileData
    ? `Payment is due within the specified due date. Late payments may be subject to additional fees. For questions, contact ${profileData.email || 'us'} or reply to the invoice notification email.`
    : '';

  const [clientName, setClientName] = useState(initClientName);
  const [clientEmail, setClientEmail] = useState(initClientEmail);
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(proposalLineItems.map((_, i) => i))
  );
  const [note, setNote] = useState(defaultNote);
  const [dueDate, setDueDate] = useState("");
  const [paymentInstructions, setPaymentInstructions] = useState(
    profileData?.default_payment_instructions || ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function toggle(idx: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === proposalLineItems.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(proposalLineItems.map((_, i) => i)));
    }
  }

  const selectedTotal = proposalLineItems
    .filter((_, i) => selected.has(i))
    .reduce((sum, item) => sum + (item.amount || 0), 0);

  function fmt(cents: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (selected.size === 0) { setError("Select at least one deliverable"); return; }
    if (!clientName.trim()) { setError("Client name is required"); return; }
    if (!clientEmail.trim()) { setError("Client email is required"); return; }
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/invoices/create-from-proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposal_id: proposalId,
          selected_items: Array.from(selected).sort((a, b) => a - b),
          client_name: clientName.trim(),
          client_email: clientEmail.trim(),
          note: note.trim() || null,
          due_date: dueDate || null,
          payment_instructions: paymentInstructions.trim() || null,
        }),
      });
      if (res.ok) {
        onCreated();
      } else {
        const err = await res.json();
        setError(err.error || "Failed to create invoice");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
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
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-[#62666d] hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-[18px] font-[550] text-white mb-0.5">Create Invoice</h2>
        <p className="text-[13px] text-[#62666d] mb-5">
          {projectTitle} · Select deliverables and customize your invoice.
        </p>

        <form onSubmit={handleCreate} className="space-y-4">
          {/* Client info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[12px] text-[#8a8f98]">Client name *</Label>
              <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Acme Inc"
                className="h-9 rounded-md border border-[#23252a] bg-[#08090a] text-[13px] text-white placeholder:text-[#62666d] focus:border-[#3a3f45] focus:ring-0" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] text-[#8a8f98]">Client email *</Label>
              <Input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="client@example.com" type="email"
                className="h-9 rounded-md border border-[#23252a] bg-[#08090a] text-[13px] text-white placeholder:text-[#62666d] focus:border-[#3a3f45] focus:ring-0" />
            </div>
          </div>

          {/* Deliverables selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[12px] text-[#8a8f98]">Deliverables</Label>
              <button
                type="button"
                onClick={toggleAll}
                className="text-[11px] text-[#62666d] hover:text-white transition-colors"
              >
                {selected.size === proposalLineItems.length ? "Deselect all" : "Select all"}
              </button>
            </div>
            <div className="space-y-1.5">
              {proposalLineItems.map((item, idx) => {
                const isSelected = selected.has(idx);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggle(idx)}
                    className={`w-full flex items-center gap-3 rounded-lg border px-3.5 py-2.5 text-left transition-all ${isSelected
                      ? "border-green-500/30 bg-green-500/5"
                      : "border-[#1a1c20] bg-[#08090a] hover:border-[#23252a]"
                      }`}
                  >
                    <div
                      className={`flex h-4.5 w-4.5 items-center justify-center rounded border flex-shrink-0 transition-all ${isSelected
                        ? "border-green-500 bg-green-500"
                        : "border-[#3a3f45] bg-transparent"
                        }`}
                    >
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <span className="flex-1 text-[13px] text-[#8a8f98] truncate">
                      {item.label}
                    </span>
                    <span className="text-[13px] font-[500] text-white tabular-nums">
                      {fmt(item.amount)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between rounded-md border border-[#23252a] bg-[#08090a] px-4 py-3">
            <span className="text-[13px] font-[500] text-[#8a8f98]">
              Total ({selected.size} item{selected.size !== 1 ? "s" : ""})
            </span>
            <span className="text-[16px] font-[600] text-white tabular-nums">
              {fmt(selectedTotal)}
            </span>
          </div>

          {/* Due date */}
          <div className="space-y-1.5">
            <Label className="text-[12px] text-[#8a8f98]">Due date</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
              className="h-9 rounded-md border border-[#23252a] bg-[#08090a] text-[13px] text-white focus:border-[#3a3f45] focus:ring-0" />
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <Label className="text-[12px] text-[#8a8f98]">Note</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Payment terms, thank-you message, or additional context…"
              className="rounded-md border border-[#23252a] bg-[#08090a] text-[13px] text-white placeholder:text-[#62666d] focus:border-[#3a3f45] focus:ring-0 resize-none"
            />
          </div>

          {/* Payment instructions */}
          <div className="space-y-1.5">
            <Label className="text-[12px] text-[#8a8f98]">Payment instructions</Label>
            <Textarea
              value={paymentInstructions}
              onChange={(e) => setPaymentInstructions(e.target.value)}
              rows={3}
              placeholder="e.g. UPI: yourname@upi | PayPal: you@email.com | Bank: HDFC 1234567890 IFSC: HDFC0001"
              className="rounded-md border border-[#23252a] bg-[#08090a] text-[13px] text-white placeholder:text-[#62666d] focus:border-[#3a3f45] focus:ring-0 resize-none"
            />
          </div>

          {error && <p className="text-[13px] text-red-400">{error}</p>}

          <Button
            type="submit"
            disabled={saving || selected.size === 0}
            className="w-full rounded-md bg-white py-2.5 text-[13px] font-[500] text-black hover:bg-neutral-200 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mx-auto" />
            ) : (
              `Create Invoice · ${fmt(selectedTotal)}`
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
